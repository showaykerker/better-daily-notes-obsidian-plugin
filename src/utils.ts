import { App, MarkdownView, normalizePath, Notice, TFile } from 'obsidian';
import dayjs from 'dayjs';
import { BetterDailyNotesSettings } from './settings/settings';

const customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);

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

export function getDailyNoteName(
        assumeSameDayBeforeHour: number,
        dateFormat: string,
        date: Date = new Date(),
        considerAssumeSameDayBeforeHour: boolean = false) {
    // if the current time is before assumeSameDayBeforeHour, assume it is the previous day
    if (dayjs().get('hour') < assumeSameDayBeforeHour &&
            considerAssumeSameDayBeforeHour) {
        date.setDate(date.getDate() - 1);
    }
    return formatDate(dateFormat, date);
}

export function getDailyNotePath(settings: BetterDailyNotesSettings, date: Date = new Date(), considerAssumeSameDayBeforeHour: boolean = true) {
    const noteName = getDailyNoteName(settings.assumeSameDayBeforeHour, settings.dateFormat, date, considerAssumeSameDayBeforeHour);
    const dirPath = getMonthDirPath(settings.rootDir, settings.assumeSameDayBeforeHour, date, considerAssumeSameDayBeforeHour);
    return `${dirPath}/${noteName}.md`;
}

export function getMonthDirPath(
        rootDir: string,
        assumeSameDayBeforeHour: number,
        date: Date = new Date(),
        considerAssumeSameDayBeforeHour: boolean = false) {
    // if the current time is before assumeSameDayBeforeHour, assume it is the previous day
    if (dayjs().get('hour') + 1 < assumeSameDayBeforeHour &&
            considerAssumeSameDayBeforeHour) {
        date.setDate(date.getDate() - 1);
    }
    const year = date.getFullYear();
    const monthStr = date.toLocaleString('en-GB', { month: 'short' });
    return `${rootDir}/${year}/${monthStr}`;
}

export function formatDate(format: string, date: Date = new Date()): string {
    return dayjs(date).format(format);
}

export function isValidDateFormat(format: string): boolean {
    if (format.match("/")) {
        return false;
    }
    try {
        dayjs().format(format);
        return true;
    }
    catch (e) {
        console.log(e);
        return false;
    }
}

export function checkValidDailyNotePath(filePath: string, settings: BetterDailyNotesSettings): Date | null {
    const debugMode = settings.debugMode;
    if (debugMode) new Notice("checkValidDailyNotePath | debug | Checking valid daily note path: " + filePath, 10000);
    if (!filePath.endsWith(".md")) {
        if (debugMode) new Notice("checkValidDailyNotePath | debug | Not a markdown file", 10000);
        return null;
    }
    if (!filePath.startsWith(normalizePath(settings.rootDir))) {
        if (debugMode) new Notice("checkValidDailyNotePath | debug | Not in root dir", 10000);
        return null;
    }
    const fileBasename = filePath.split("/").slice(-1)[0].split(".")[0];
    const fileDate = dayjs(fileBasename, settings.dateFormat, true);
    if (!fileDate.isValid()) {
        if (debugMode) new Notice("checkValidDailyNotePath | debug | Invalid date format", 10000);
        return null;
    }
    if (filePath !== getDailyNotePath(settings, fileDate.toDate(), false)) {
        if (debugMode) new Notice("checkValidDailyNotePath | debug | Not a valid daily note path", 10000);
        return null;
    }
    if (debugMode) new Notice("checkValidDailyNotePath | debug | Valid daily note path: " + filePath, 10000);
    return fileDate.toDate();

}

export function checkValidDailyNote(file: TFile, settings: BetterDailyNotesSettings): Date | null{
    return checkValidDailyNotePath(file.path, settings);
}