import { Notice, TFile } from 'obsidian';
import BetterDailyNotePlugin from '../main';
import dayjs from 'dayjs';
import { checkValidDailyNote, getDailyNotePath } from '../utils';
import { createDirsIfNotExists } from 'src/dailyNotes/fileSystem';
import { getSettingsFromExternalPlugin } from './utils';

async function checkExternalPlugins(plugin: BetterDailyNotePlugin): Promise<string[]> {
    if (plugin.settings.compatibleDateFormats.length === 0) return [];
    console.log(plugin.settings.compatibleDateFormats);
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
                    if (!(file.extension === "md")) return;
                    const createdByThisPlugin = checkValidDailyNote(file, plugin.settings);

                    // Check if filename is valid date format
                    let fileBasenameDate = null;
                    for (const format of plugin.settings.compatibleDateFormats) {
                        fileBasenameDate = dayjs(file.basename, format, true);
                        if (fileBasenameDate.isValid()) break;
                    }

                    if (createdByThisPlugin) return;
                    if (fileBasenameDate?.isValid()) {
                        const dailyNotePath = getDailyNotePath(plugin.settings, fileBasenameDate.toDate(), false);
                        if (plugin.app.vault.getAbstractFileByPath(dailyNotePath) == null) {
                            new Notice(`Daily note ${file.name} created by external plugin, will be renamed to `+
                                dailyNotePath + " in 1 second.", 2500);
                            const dailyNoteDir = dailyNotePath.substring(0, dailyNotePath.lastIndexOf("/"));
                            createDirsIfNotExists(plugin.app, dailyNoteDir);
                            // add template
                            const templateFile = plugin.app.vault.getAbstractFileByPath(plugin.settings.templateFile);
                            if (templateFile instanceof TFile) {
                                let template = await plugin.app.vault.read(templateFile);
                                await plugin.app.vault.modify(file, template);
                                new Notice(`Template "${plugin.settings.templateFile}" applied to ${dailyNotePath}`);
                            }
                            await new Promise((resolve) => setTimeout(resolve, 1000));
                            await plugin.app.vault.rename(file, dailyNotePath);
                            new Notice("Daily note renamed to " + dailyNotePath, 2500);
                        }
                        else {
                            new Notice("Daily note created by external plugin, " +
                                `but a daily note with the same name ${dailyNotePath} already exists.` +
                                "No action will be taken.", 2500);
                        }
                    }
                }
            )
        );
    });
}