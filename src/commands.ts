import { App } from 'obsidian';
import { getDailyNotePath } from './utils';
import { BetterDailyNotesSettings } from './settings/settings';

export function openDailyNote(
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
    app.workspace.openLinkText(targetNotePath, '', true);

    // const dailyNotePath = getDailyNotePath(rootDir, assumeSameDayBeforeHour, dateFormat);
    // await createDirIfNotExists(this.app, rootDir, assumeSameDayBeforeHour);
    // const dailyNote = this.app.vault.getAbstractFileByPath(dailyNotePath);
    // if (!dailyNote) {
    //     await this.app.vault.create(dailyNotePath, '');
    //     new Notice(`Daily note ${dailyNotePath} created.`);
    // }
    // if (dailyNote) {
    //     await this.app.workspace.openLinkText(dailyNotePath, '', true);
    // }
    // else {
    //     await this.app.workspace.openLinkText(dailyNotePath, '', true);
    // }
}
