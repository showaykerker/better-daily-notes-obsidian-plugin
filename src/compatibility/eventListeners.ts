import { App, Notice, TFile } from 'obsidian';
import BetterDailyNotePlugin from '../main';
import dayjs from 'dayjs';
import { checkValidDailyNote, getDailyNotePath } from '../utils';
import { createDirsIfNotExists } from 'src/dailyNotes/fileSystem';
import { getSettingsFromExternalPlugin } from './utils';

async function checkExternalPlugins(plugin: BetterDailyNotePlugin): Promise<string[]> {
    if (plugin.settings.compatibleDateFormats.length === 0) return [];
    if (plugin.settings.compatibleDateFormats.includes("AUTO")) {
        const externalFormats = await getSettingsFromExternalPlugin(plugin.app, plugin.settings);
        plugin.settings.compatibleDateFormats = Array.from(externalFormats);
        plugin.saveSettings();
        return plugin.settings.compatibleDateFormats;
    };
    return plugin.settings.compatibleDateFormats;
}

export async function createCompatibilityEventListener(plugin: BetterDailyNotePlugin) {
    await checkExternalPlugins(plugin);
    plugin.app.workspace.onLayoutReady(() => {
        plugin.registerEvent(
            plugin.app.vault.on(
                "create",
                async (file: TFile) => {
                    if (plugin.settings.debugMode) new Notice("Create event: " + file.path, 0);
                    if (!(file.extension === "md")) return;
                    const createdByThisPlugin = checkValidDailyNote(file, plugin.settings);

                    // Check if filename is valid date format
                    let fileBasenameDate = null;
                    for (const format of plugin.settings.compatibleDateFormats) {
                        fileBasenameDate = dayjs(file.basename, format, true);
                        if (fileBasenameDate.isValid()) break;
                    }

                    if (plugin.settings.debugMode)
                        new Notice(`oncreate | debug | createByThisPlugin: ${createdByThisPlugin}, ` +
                            `${fileBasenameDate} valid: ${fileBasenameDate?.isValid()}`, 10000);

                    if (createdByThisPlugin) return;
                    if (fileBasenameDate?.isValid()) {
                        const dailyNotePath = getDailyNotePath(plugin.settings, fileBasenameDate.toDate(), false);
                        if (plugin.app.vault.getAbstractFileByPath(dailyNotePath) == null) {
                            new Notice(`Daily note ${file.name} created by external plugin, will be renamed to `+
                                dailyNotePath + " in 1 second.", plugin.settings.debugMode ? 0 : 2500);
                            const dailyNoteDir = dailyNotePath.substring(0, dailyNotePath.lastIndexOf("/"));
                            createDirsIfNotExists(plugin.app, dailyNoteDir);
                            await new Promise((resolve) => setTimeout(resolve, 1000));
                            await plugin.app.vault.rename(file, dailyNotePath);
                            new Notice("Daily note renamed to " + dailyNotePath, plugin.settings.debugMode ? 0 : 2500);
                        }
                        else {
                            new Notice("Daily note created by external plugin, " +
                                `but a daily note with the same name ${dailyNotePath} already exists.` +
                                "No action will be taken.", plugin.settings.debugMode ? 0 : 2500);
                        }
                    }
                }
            )
        );
    });
}