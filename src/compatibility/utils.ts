import { App, Notice } from 'obsidian';
import { BetterDailyNotesSettings } from 'src/settings/settings';

const DEFAULT_DATE_FORMAT = 'YYYY-MM-DD';

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
    const externalSettings = await app.vault.adapter.read(externalPluginSettingsFilePath);
    if (settings === null) return DEFAULT_DATE_FORMAT;
    const externalSettingsDict = JSON.parse(externalSettings);
    const format = keys.reduce((acc, key) => acc[key], externalSettingsDict) || DEFAULT_DATE_FORMAT;
    console.log(`Better Daily Notes: ${externalPluginName} plugin uses date format: ${format}`);
    if (settings.debugMode) new Notice(`Better Daily Notes: ${externalPluginName} plugin uses date format: ${format}`);
    return format;
}
