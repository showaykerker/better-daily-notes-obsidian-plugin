import { App, Notice, TFile } from 'obsidian';
import { createDirIfNotExists } from './fileSystem';
import BetterDailyNotePlugin from '../main';
import { getDailyNotePath, openOrSwitchToNote } from '../utils';
import { BetterDailyNotesSettings } from '../settings/settings';

export async function createDailyNotesCommands(plugin: BetterDailyNotePlugin) {
    plugin.addCommand({
        id: 'open-todays-daily-note',
        name: 'Open today\'s daily note',
        callback: async () => {
            await openDailyNote(plugin.app, plugin.settings, 0);
        }
    })

    plugin.addCommand({
        id: 'open-yesterdays-daily-note',
        name: 'Open yesterday\'s daily note',
        callback: async () => {
            await openDailyNote(plugin.app, plugin.settings, -1);
        }
    });

    plugin.addCommand({
        id: 'open-tomorrows-daily-note',
        name: 'Open tomorrow\'s daily note',
        callback: async () => {
            await openDailyNote(plugin.app, plugin.settings, +1);
        }
    });

    plugin.addCommand({
        id: 'toggle-image-compression',
        name: 'Toggle image compression',
        callback: async () => {
            // If Cache is -1 and maxImageSizeKB is not -1,
            // it means that it is currently toggled to not upload.
            // will be toggled back after restart
            const curr = plugin.settings.maxImageSizeKB;
            const cache = plugin.settings.maxImageSizeKBCache;
            if (curr == -1 && cache == -1) {
                new Notice("Nothing happens because image compression is already disabled.");
                return;
            }
            else if (curr == -1 && cache != -1) {
                new Notice(
                    "Image compression is now ENABLED.\n" +
                    "Set back to maximum size: " + cache + "KB.", 7500);
            }
            else if (curr != -1 && cache == -1) {
                new Notice("Image compression is now DISABLED.\n" +
                    "Execute the command again to set it back to maximum size: " + curr + "KB.\n" +
                    "Will be set back automatically when restart.", 7500);
            }
            plugin.settings.maxImageSizeKB = cache;
            plugin.settings.maxImageSizeKBCache = curr;
            await plugin.saveSettings();
        }
    });

    if (plugin.settings.maxImageSizeKBCache != -1) {
        plugin.settings.maxImageSizeKB = plugin.settings.maxImageSizeKBCache;
        plugin.settings.maxImageSizeKBCache = -1;
        await plugin.saveSettings();
    }
}

export async function createDailyNotesRibbonIcons(plugin: BetterDailyNotePlugin) {
    const openDailyNoteRibbonIconEl = plugin.addRibbonIcon(
        'book-open-check',
        'Open today\'s daily note',
        async (evt: MouseEvent) => {
            await openDailyNote(plugin.app, plugin.settings, 0);
        }
    ).addClass('better-daily-notes-ribbon-class');;
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
    const targetNotePath = getDailyNotePath(settings, date);

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