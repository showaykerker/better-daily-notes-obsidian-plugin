import { App, TFile } from 'obsidian';
import BetterDailyNotePlugin from '../main';
import { createNotice, getDailyNotePath, openOrSwitchToNote } from '../utils';
import { BetterDailyNotesSettings } from '../settings/settings';
import { create } from 'domain';
import dayjs from 'dayjs';

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
        createNotice(settings, "Summary Page is disabled. Not opening the summary page.", 0);
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
    
    // If summarizeByExistence is enabled, use the new logic
    if (settings.summarizeByExistence) {
        return getExistingDailyNotePaths(app, settings);
    }
    
    // Original logic: consecutive dates
    let date = new Date();
    const paths: string[] = [];
    for (let i = 1; i <= days; i++) {
        const targetNotePath = getDailyNotePath(settings, date, false);
        if (app.vault.getAbstractFileByPath(targetNotePath)) {
            paths.push(targetNotePath);
        }
        date.setDate(date.getDate() - 1);
    }
    return paths;
}

function getExistingDailyNotePaths(app: App, settings: BetterDailyNotesSettings): string[] {
    const lookbackMonths = settings.summaryLookbackMonths ?? 2;
    const daysCount = settings.summaryOfDaysCount;
    const currentDate = new Date();
    
    // Calculate the start date (lookbackMonths ago)
    const startDate = new Date(currentDate);
    startDate.setMonth(startDate.getMonth() - lookbackMonths);
    
    // Get all markdown files in the root directory and subdirectories
    const allFiles = app.vault.getMarkdownFiles();
    
    // Filter files that match our criteria
    const validDailyNotes: { file: TFile; date: Date }[] = [];
    
    for (const file of allFiles) {
        // Check if file is in the correct directory structure
        if (!file.path.startsWith(settings.rootDir + '/')) {
            continue;
        }
        
        // Extract filename without extension
        const fileName = file.basename;
        
        // Try to parse the filename using the date format
        const parsedDate = dayjs(fileName, settings.dateFormat, true);
        
        if (parsedDate.isValid()) {
            const fileDate = parsedDate.toDate();
            
            // Check if the date is within our lookback range
            if (fileDate >= startDate && fileDate <= currentDate) {
                validDailyNotes.push({ file, date: fileDate });
            }
        }
    }
    
    // Sort by date (oldest first)
    validDailyNotes.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Extract paths and get the latest daysCount
    const allPaths = validDailyNotes.map(item => item.file.path);
    
    return allPaths.slice(-daysCount);
}