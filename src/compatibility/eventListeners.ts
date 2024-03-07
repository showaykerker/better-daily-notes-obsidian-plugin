import { Notice, TFile } from 'obsidian';
import BetterDailyNotePlugin from '../main';
import dayjs from 'dayjs';
import { checkValidDailyNote, getDailyNotePath } from '../utils';
import { createDirsIfNotExists } from 'src/dailyNotes/fileSystem';

export function createCompatibilityEventListener(plugin: BetterDailyNotePlugin) {
    plugin.app.workspace.onLayoutReady(() => {
        plugin.registerEvent(
            plugin.app.vault.on(
                "create",
                async (file: TFile) => {
                    if (plugin.settings.debugMode) new Notice("Create event: " + file.path, 0);
                    if (!(file.extension === "md")) return;
                    const createdByThisPlugin = checkValidDailyNote(file, plugin.settings);
                    const fileBasenameDate = dayjs(file.basename);
                    if (plugin.settings.debugMode)
                        new Notice(`oncreate | debug | createByThisPlugin: ${createdByThisPlugin}, ` +
                            `${fileBasenameDate} valid: ${fileBasenameDate?.isValid()}`, 10000);

                    if (createdByThisPlugin) return;
                    if (fileBasenameDate.isValid()) {
                        const dailyNotePath = getDailyNotePath(plugin.settings, fileBasenameDate.toDate(), false);
                        if (plugin.app.vault.getAbstractFileByPath(dailyNotePath) == null) {
                            new Notice("Daily note created by external plugin, will be renamed to "+
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