import { TAbstractFile, TFile } from 'obsidian';
import { updateSummaryPage } from './commands';
import BetterDailyNotePlugin from '../main';
import { checkValidDailyNote, checkValidDailyNotePath } from '../utils';

export function createSummaryPageEventListener(plugin: BetterDailyNotePlugin) {
    plugin.registerEvent(
        plugin.app.vault.on(
            "delete",
            async (file: TAbstractFile) => {
                if (!plugin.settings.enableSummaryPage) return;
                if (!(file instanceof TFile)) return;
                if (!checkValidDailyNote(file, plugin.settings)) return;
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
                if (!checkValidDailyNotePath(oldPath, plugin.settings) &&
                    !checkValidDailyNote(file, plugin.settings)) return;
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
                    if (!checkValidDailyNote(file, plugin.settings)) return;
                    await updateSummaryPage(plugin.app, plugin.settings, false, false);
                }
            )
        );
    });
}

