import { Editor, MarkdownView, Notice, Plugin, TAbstractFile, TFile } from 'obsidian';
import dayjs from 'dayjs';
import { handleFiles } from './fileHandler';
import { openDailyNote, updateSummaryPage } from './commands';
import { DEFAULT_SETTINGS, BetterDailyNotesSettings } from './settings/settings';
import { BetterDailyNotesSettingTab } from './settings/settingTab';
import { checkValidDailyNotePath } from './utils';


export default class BetterDailyNotes extends Plugin {
	settings: BetterDailyNotesSettings;

	async onload() {
		await this.loadSettings();

		const customParseFormat = require('dayjs/plugin/customParseFormat');
		dayjs.extend(customParseFormat);


		const openDailyNoteRibbonIconEl = this.addRibbonIcon(
			'book-open-check',
			'Open today\'s daily note',
			async (evt: MouseEvent) => {
				await openDailyNote(this.app, this.settings, 0);
			}
		);
		openDailyNoteRibbonIconEl.addClass('better-daily-notes-ribbon-class');

		if (this.settings.enableSummaryPage) {
			const openSummaryPageRibbonIconEl = this.addRibbonIcon(
				'list',
				'Open and update summary page',
				async (evt: MouseEvent) => {
					updateSummaryPage(this.app, this.settings, true, true);
				}
			);
			openSummaryPageRibbonIconEl.addClass('better-daily-notes-ribbon-class');
		}

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

		if (this.settings.enableSummaryPage) {
			this.addCommand({
				id: 'open-summary-page',
				name: 'Open and update summary page',
				callback: async () => {
					updateSummaryPage(this.app, this.settings, true, true);
				}
			});
		}

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
					handleFiles(evt.dataTransfer, evt, this.app, this.settings, editor, markdownView);
				}
			)
		);
		this.registerEvent(
			this.app.workspace.on(
				"editor-paste",
				async (evt: ClipboardEvent, editor: Editor, markdownView: MarkdownView) => {
					handleFiles(evt.clipboardData, evt, this.app, this.settings, editor, markdownView);
				}
			)
		);
		this.registerEvent(
			this.app.vault.on(
				"delete",
				async (file: TAbstractFile) => {
					if (!this.settings.enableSummaryPage) return;
					if (!(file instanceof TFile)) return;
					if (!checkValidDailyNotePath(file.path, this.settings.dateFormat)) return;
					await updateSummaryPage(this.app, this.settings, false, false);
				}
			)
		);
		this.registerEvent(
			this.app.vault.on(
				"rename",
				async (file: TAbstractFile, oldPath: string) => {
					if (!this.settings.enableSummaryPage) return;
					if (!(file instanceof TFile)) return;
					if (!checkValidDailyNotePath(oldPath, this.settings.dateFormat) &&
						!checkValidDailyNotePath(file.path, this.settings.dateFormat)) return;
					await updateSummaryPage(this.app, this.settings, false, false);
				}
			)
		);
		this.registerEvent(
			this.app.vault.on(
				"create",
				async (file: TAbstractFile) => {
					if (!this.settings.enableSummaryPage) return;
					if (!(file instanceof TFile)) return;
					if (!checkValidDailyNotePath(file.path, this.settings.dateFormat)) return;
					await updateSummaryPage(this.app, this.settings, false, false);
				}
			)
		);
	}
}

