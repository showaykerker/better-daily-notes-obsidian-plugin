import { TAbstractFile, TFile } from 'obsidian';
import { updateSummaryPage } from './commands';
import BetterDailyNotePlugin from '../main';
import { checkValidDailyNotePath } from '../utils';

export function CreateSummaryPageEventListener(plugin: BetterDailyNotePlugin) {
    plugin.registerEvent(
        plugin.app.vault.on(
            "delete",
            async (file: TAbstractFile) => {
                if (!plugin.settings.enableSummaryPage) return;
                if (!(file instanceof TFile)) return;
                if (!checkValidDailyNotePath(file.path, plugin.settings.dateFormat)) return;
                await updateSummaryPage(plugin.app, plugin.settings, false, false);
            }
        )
    );
    plugin.registerEvent(
        plugin.app.vault.on(
            "rename",
            async (file: TAbstractFile, oldPath: string) => {
                if (!plugin.settings.enableSummaryPage) return;
                if (!(file instanceof TFile)) return;
                if (!checkValidDailyNotePath(oldPath, plugin.settings.dateFormat) &&
                    !checkValidDailyNotePath(file.path, plugin.settings.dateFormat)) return;
                await updateSummaryPage(plugin.app, plugin.settings, false, false);
            }
        )
    );
    plugin.app.workspace.onLayoutReady(() => {
        plugin.registerEvent(
            plugin.app.vault.on(
                "create",
                async (file: TAbstractFile) => {
                    if (!plugin.settings.enableSummaryPage) return;
                    if (!(file instanceof TFile)) return;
                    if (!checkValidDailyNotePath(file.path, plugin.settings.dateFormat)) return;
                    await updateSummaryPage(plugin.app, plugin.settings, false, false);
                }
            )
        );
    });
}

