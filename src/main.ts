import { Editor, MarkdownView, Notice, Plugin } from 'obsidian';
import dayjs from 'dayjs';
import { checkValidDailyNotePath } from './utils';
import { createAndInsertWithFileReader, shouldHandleAccordingToConfig } from './fileHandler';
import { handleFiles, handleSingleFile } from './fileHandler';
import { openDailyNote } from './commands';
import { DEFAULT_SETTINGS, BetterDailyNotesSettings } from './settings/settings';
import { BetterDailyNotesSettingTab } from './settings/settingTab';


export default class BetterDailyNotes extends Plugin {
	settings: BetterDailyNotesSettings;

	async onload() {
		await this.loadSettings();

		const customParseFormat = require('dayjs/plugin/customParseFormat');
		dayjs.extend(customParseFormat);


		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon(
			'book-open-check',
			'Open today\'s daily note',
			async (evt: MouseEvent) => {
				await openDailyNote(this.app, this.settings, 0);
			}
		);
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('better-daily-notes-ribbon-class');

		this.addCommand({
			id: 'open-todays-daily-note',
			name: 'Open today\'s daily note',
			callback: async () => {
				await openDailyNote(this.app, this.settings, 0);
			}
		})

		this.addCommand({
			id: 'open-yesterdays-daily-note',
			name: 'Open yesterday\'s daily note',
			callback: async () => {
				await openDailyNote(this.app, this.settings, -1);
			}
		});

		this.addCommand({
			id: 'open-tomorrows-daily-note',
			name: 'Open tomorrow\'s daily note',
			callback: async () => {
				await openDailyNote(this.app, this.settings, +1);
			}
		});

		this.addCommand({
			id: 'toggle-image-compression',
			name: 'Toggle image compression',
			callback: async () => {
				// If Cache is -1 and maxImageSizeKB is not -1,
				// it means that it is currently toggled to not upload.
				// will be toggled back after restart
				const curr = this.settings.maxImageSizeKB;
				const cache = this.settings.maxImageSizeKBCache;
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
				this.settings.maxImageSizeKB = cache;
				this.settings.maxImageSizeKBCache = curr;
				await this.saveSettings();
			}
		});

		if (this.settings.maxImageSizeKBCache != -1) {
			this.settings.maxImageSizeKB = this.settings.maxImageSizeKBCache;
			this.settings.maxImageSizeKBCache = -1;
			await this.saveSettings();
		}

		this.addSettingTab(new BetterDailyNotesSettingTab(this.app, this));
		this.setupFileHandler();
	}


	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	setupFileHandler() {
		this.registerEvent(
			this.app.workspace.on(
				"editor-drop",
				async (evt: DragEvent, editor: Editor, markdownView: MarkdownView) => {
					console.log("editor-drop", evt, editor, markdownView);
					handleFiles(evt.dataTransfer, evt, this.app, this.settings, editor, markdownView);
				}
			)
		);
		this.registerEvent(
			this.app.workspace.on(
				"editor-paste",
				async (evt: ClipboardEvent, editor: Editor, markdownView: MarkdownView) => {
					console.log("editor-paste", evt, editor, markdownView);
					handleFiles(evt.clipboardData, evt, this.app, this.settings, editor, markdownView);
				}
			)
		);
	}
}

