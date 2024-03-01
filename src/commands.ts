import { App, Notice, TFile} from 'obsidian';
import { getDailyNotePath } from './utils';
import { BetterDailyNotesSettings } from './settings/settings';
import { createDirIfNotExists } from './fileSystem';

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
    app.workspace.openLinkText(targetNotePath, '', true);
}
