import { TFile } from 'obsidian';
import BetterDailyNotePlugin from '../main';
import { createNotice } from '../utils';
import { getSettingsFromExternalPlugin, moveDailyNote } from './utils';

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
                    let moveResult = await moveDailyNote(plugin.app, plugin.settings, file, true, false, false);
                    if (moveResult.startsWith("already exists")){
                        const dailyNotePath = moveResult.split(": ")[1];
                        createNotice(plugin.app, plugin.settings,"Daily note created by external plugin, " +
                            `but a daily note with the same name "${dailyNotePath}" already exists.` +
                            "No action will be taken.", 'warning');
                    }
                }
            )
        );
    });
}