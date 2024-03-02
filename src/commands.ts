import { App, Editor, MarkdownView, normalizePath, Notice, TFile, TAbstractFile } from 'obsidian'; // Added TAbstractFile
import { getDailyNotePath } from './utils';
import { BetterDailyNotesSettings } from './settings/settings';
import { createDirIfNotExists } from './fileSystem';

function openOrSwitchToNote(app: App, dailyNotePath: string) {
    const leaves = app.workspace.getLeavesOfType("markdown");
    for (let leaf of leaves) {
        if (!(leaf.view instanceof MarkdownView)) { continue; }
        const file = leaf.view.file;
        if (file?.path === dailyNotePath) {
            leaf.openFile(file);
            return;
        }
    }
    app.workspace.openLinkText(dailyNotePath, '', true);
}

export async function openDailyNote(
        app: App,
        settings: BetterDailyNotesSettings,
        dateOffset: number = 0,
        date: Date = new Date()) {
    const rootDir = settings.rootDir;
    const assumeSameDayBeforeHour = settings.assumeSameDayBeforeHour;
    const dateFormat = settings.dateFormat;
    date.setDate(date.getDate() + dateOffset);
    const targetNotePath = getDailyNotePath(
        rootDir, assumeSameDayBeforeHour, dateFormat, date);

    if (!app.vault.getAbstractFileByPath(targetNotePath)) {
        console.log("templateFile", settings.templateFile);
        const templateFile = app.vault.getAbstractFileByPath(settings.templateFile);
        console.log(templateFile, templateFile instanceof TFile);
        if (templateFile instanceof TFile) {
            let template = await app.vault.read(templateFile);
            await createDirIfNotExists(app, rootDir, assumeSameDayBeforeHour, date);
            await app.vault.create(targetNotePath, template);
            new Notice("Daily Note \"" + targetNotePath + "\"" +
                " with template \"" + settings.templateFile + "\" created!");
        } else {
            new Notice("Template File " + settings.templateFile + " not found!");
        }
    }
    openOrSwitchToNote(app, targetNotePath);
    updateSummaryPage(app, settings, false, false);
}

function getPreviousDailyNotePaths(app: App, settings: BetterDailyNotesSettings, days: number): string[] {
    const rootDir = settings.rootDir;
    const assumeSameDayBeforeHour = settings.assumeSameDayBeforeHour;
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