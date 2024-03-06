import { Notice, TFile } from 'obsidian';
import BetterDailyNotePlugin from '../main';
import dayjs from 'dayjs';
import { checkValidDailyNotePath, getDailyNotePath } from '../utils';
import { createDirsIfNotExists } from 'src/dailyNotes/fileSystem';

export function createCompatibilityEventListener(plugin: BetterDailyNotePlugin) {
    plugin.app.workspace.onLayoutReady(() => {
        plugin.registerEvent(
            plugin.app.vault.on(
                "create",
                async (file: TFile) => {
                    console.log("Create event: ", file);
                    if (!(file.extension === "md")) return;
                    const createdByThisPlugin = checkValidDailyNotePath(file.path, plugin.settings.dateFormat);
                    const fileBasenameDate = dayjs(file.basename);
                    if (createdByThisPlugin) return;
                    if (fileBasenameDate.isValid()) {
                        const dailyNotePath = getDailyNotePath(plugin.settings, fileBasenameDate.toDate());
                        if (plugin.app.vault.getAbstractFileByPath(dailyNotePath) == null) {
                            new Notice("Daily note created by external plugin, will be renamed to "+
                                dailyNotePath + " in 1 second.", 5000);
                            const dailyNoteDir = dailyNotePath.substring(0, dailyNotePath.lastIndexOf("/"));
                            createDirsIfNotExists(plugin.app, dailyNoteDir);
                            await new Promise((resolve) => setTimeout(resolve, 1000));
                            await plugin.app.vault.rename(file, dailyNotePath);
                            new Notice("Daily note renamed to " + dailyNotePath, 5000);
                        }
                        else {
                            new Notice("Daily note created by external plugin, " +
                                `but a daily note with the same name ${dailyNotePath} already exists.` +
                                "No action will be taken.", 5000);
                        }
                    }
                }
            )
        );
    });
}