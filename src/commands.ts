import { App, Editor, MarkdownView, normalizePath, Notice, TFile, TAbstractFile } from 'obsidian'; // Added TAbstractFile
import { getDailyNotePath } from './utils';
import { BetterDailyNotesSettings } from './settings/settings';
import { createDirIfNotExists } from './fileSystem';

export function openOrSwitchToNote(app: App, dailyNotePath: string) {
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
        const templateFile = app.vault.getAbstractFileByPath(settings.templateFile);
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
}
