import { App, Notice, TFile } from 'obsidian';
import BetterDailyNotePlugin from '../main';
import { getDailyNotePath, openOrSwitchToNote } from '../utils';
import { BetterDailyNotesSettings } from '../settings/settings';

export async function createSummaryPageCommands(plugin: BetterDailyNotePlugin) {
    plugin.addCommand({
        id: 'open-summary-page',
        name: 'Open and update summary page',
        callback: async () => {
            await updateSummaryPage(plugin.app, plugin.settings, true, true);
        }
    });
}

export async function createSummaryPageRibbonIcons(plugin: BetterDailyNotePlugin) {
    plugin.addRibbonIcon(
        'list',
        'Open and update summary page',
        async (evt: MouseEvent) => {
            await updateSummaryPage(plugin.app, plugin.settings, true, true);
        }
    ).addClass('better-daily-notes-ribbon-class');
}

export async function updateSummaryPage(
        app: App,
        settings: BetterDailyNotesSettings,
        createIfNotExists: boolean,
        open: boolean): Promise<void> {

    if (!settings.enableSummaryPage) {
        new Notice("Summary Page is disabled. Not opening the summary page.");
        return;
    }
    const summaryPagePath = settings.rootDir + '/' + settings.summaryPageFile + '.md';
    const previousDailyNotePaths = getPreviousDailyNotePaths(app, settings, settings.summaryOfDaysCount);
    // add links to the summary page
    let summary = "";
    for (let path of previousDailyNotePaths) {
        summary += `![[${path}]]\n\n`;
    }
    const summaryPageExists = await app.vault.adapter.exists(summaryPagePath);
    if (summaryPageExists) {
        const summaryPage = app.vault.getAbstractFileByPath(summaryPagePath);
        await app.vault.modify(summaryPage as TFile, summary);
        if (open) { openOrSwitchToNote(app, summaryPagePath); }
        return;
    }

    if (createIfNotExists){
        await app.vault.create(summaryPagePath, summary);
    }

    if (open) { openOrSwitchToNote(app, summaryPagePath); }
}

function getPreviousDailyNotePaths(app: App, settings: BetterDailyNotesSettings, days: number): string[] {
    const rootDir = settings.rootDir;
    const dateFormat = settings.dateFormat;
    let date = new Date();
    const paths: string[] = [];
    for (let i = 1; i <= days; i++) {
        const targetNotePath = getDailyNotePath(
            rootDir, 0, dateFormat, date);
        if (app.vault.getAbstractFileByPath(targetNotePath)) {
            paths.push(targetNotePath);
        }
        date.setDate(date.getDate() - 1);
    }
    return paths;
}