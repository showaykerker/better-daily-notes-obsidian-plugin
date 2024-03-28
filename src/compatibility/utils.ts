import { App, TFile } from 'obsidian';
import { BetterDailyNotesSettings } from 'src/settings/settings';
import dayjs from 'dayjs';
import { checkValidDailyNote, createNotice, getDailyNotePath } from '../utils';
import { createDirsIfNotExists } from 'src/dailyNotes/fileSystem';

export async function getSettingsFromExternalPlugin(app: App, settings: BetterDailyNotesSettings): Promise<Set<string>> {
    let formats: Set<string> = new Set<string>()
        .add(await getDateFormat(app, settings, 'daily-notes', '/daily-notes.json', ['format']))
        .add(await getDateFormat(app, settings, 'daily-named-folder', '/plugins/obsidian-daily-named-folder/data.json', ['format']))
        .add(await getDateFormat(app, settings, 'periodic-notes', '/plugins/periodic-notes/data.json', ['daily', 'format']));
    formats.add(settings.dateFormat);
    return formats;
}

async function getDateFormat(
        app: App,
        settings: BetterDailyNotesSettings,
        externalPluginName: string,
        externalPluginSettingsPath: string,
        keys: string[]): Promise<string> {
    const externalPluginSettingsFilePath = app.vault.configDir + externalPluginSettingsPath;
    if (app.vault.getAbstractFileByPath(externalPluginSettingsFilePath) === null) return settings.dateFormat;
    const externalSettings = await app.vault.adapter.read(externalPluginSettingsFilePath);
    if (externalSettings === null) return settings.dateFormat;
    const externalSettingsDict = JSON.parse(externalSettings);
    const format = keys.reduce((acc, key) => acc[key], externalSettingsDict) || settings.dateFormat;
    console.log(`Better Daily Notes: ${externalPluginName} plugin uses date format: ${format}`);
    return format;
}

export async function moveDailyNote(
        app: App,
        settings: BetterDailyNotesSettings,
        file_: string | TFile,
        shouldWait: boolean,
        noTemplate: boolean,
        copyInstead: boolean): Promise<string> {
    console.log(`moveDailyNote: ${file_}. shouldWait: ${shouldWait}. noTemplate: ${noTemplate}. copyInstead: ${copyInstead}`);
    let file = file_ instanceof TFile ? file_ : app.metadataCache.getFirstLinkpathDest(file_, "");
    if (file == null) return "null";
    if (!(file.extension === "md")) return "not .md file";
    const createdByThisPlugin = checkValidDailyNote(file, settings);

    // Check if filename is valid date format
    let fileBasenameDate = null;
    for (const format of settings.compatibleDateFormats) {
        fileBasenameDate = dayjs(file.basename, format, true);
        if (fileBasenameDate.isValid()) break;
    }

    if (createdByThisPlugin) return "created by this plugin";
    if (fileBasenameDate?.isValid()) {
        let dailyNotePath = getDailyNotePath(settings, fileBasenameDate.toDate(), false);
        let attempt = 0;
        while (true) {
            if (app.vault.getAbstractFileByPath(dailyNotePath) == null) {
                const dailyNoteDir = dailyNotePath.substring(0, dailyNotePath.lastIndexOf("/"));
                createDirsIfNotExists(app, dailyNoteDir);
                if (!noTemplate) {
                    // add template
                    const templateFile = app.vault.getAbstractFileByPath(settings.templateFile);
                    if (templateFile instanceof TFile) {
                        const originalContent = await app.vault.read(file);
                        if (!originalContent) {
                            const template = await app.vault.read(templateFile);
                            await app.vault.modify(file, template);
                            createNotice(app, settings, `Template "${settings.templateFile}" applied to ${dailyNotePath}`, 'info');
                        }
                        else {
                            createNotice(app, settings, `Template "${settings.templateFile}" not applied to ${dailyNotePath} `+
                                `because the file already contains content.`, 'warning');
                        }
                    }
                }
                if (shouldWait){
                    createNotice(app, settings,
                        `Daily note ${file.name} created by external plugin, will be renamed to `+
                            dailyNotePath + " in 2 second.",
                        'info');
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                }
                if (copyInstead) {
                    await app.vault.copy(file, dailyNotePath);
                    createNotice(app, settings, `Daily note copied to ${dailyNotePath}`, 'info');
                }
                else {
                    await app.vault.rename(file, dailyNotePath);
                    createNotice(app, settings, `Daily note renamed to ${dailyNotePath}`, 'info');
                }
                return dailyNotePath;
            }
            else {
                attempt += 1;
                if (attempt > 1){
                    dailyNotePath = dailyNotePath.replace(` ${attempt-1}.md`, ` ${attempt}.md`);
                }
                else {
                    dailyNotePath = dailyNotePath.replace(".md", ` ${attempt}.md`);
                }
                createNotice(app, settings, `Daily note ${file.name} created by external plugin, `+
                    `but a daily note with the same name "${dailyNotePath}" already exists. `+
                    `Will attempt to rename to "${dailyNotePath}"`, 'warning');
            }
        }
    }
    return "not daily note";
}