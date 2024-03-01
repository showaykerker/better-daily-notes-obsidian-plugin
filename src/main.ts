import { Editor, MarkdownView, Notice, Plugin } from 'obsidian';
import dayjs from 'dayjs';
import { checkValidDailyNotePath } from './utils';
import { createAndInsertWithFileReader, handleSingleFile, shouldHandleAccordingToConfig } from './fileHandler';
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
		})

		this.addCommand({
			id: 'open-tomorrows-daily-note',
			name: 'Open tomorrow\'s daily note',
			callback: async () => {
				await openDailyNote(this.app, this.settings, +1);
			}
		})

		this.addCommand({
			id: 'check-valid-daily-note-path',
			name: 'Check if the current note is a valid daily note',
			callback: () => {
				const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (!activeView || !activeView.file) {
					new Notice(`No active view.`);
					return;
				}
				if (activeView instanceof MarkdownView) {
					const date = checkValidDailyNotePath(activeView.file.path, this.settings.dateFormat);
					if (date) {
						new Notice(`${activeView.file.path} is a valid daily note on ${date}`);
					}
					else {
						new Notice(`This is not a valid daily note.`);
					}
				}
			}
		})

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new BetterDailyNotesSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		// 	console.log('click', evt);
		// });

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));

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
					if (!evt.dataTransfer || !evt.dataTransfer.files) {
						console.log("No files in the event.");
						return;
					}
					if (!shouldHandleAccordingToConfig(this.settings, evt.dataTransfer?.files[0], markdownView)) {
						console.log("Should not handle according to config.");
						return false;
					}

					// only handle image, zip, and pdf files
					const files = evt.dataTransfer.files;
					console.log("files", files);
					if (files.length === 0) { return; }  // dropped text
					for (let i = 0; i < files.length; i++) {
						if (!files[i].type.startsWith("image") &&
								files[i].type != "application/zip" &&
								files[i].type != "application/pdf") {
							new Notice(
								`Only image, pdf, and zip files are supported. ` +
								`Get ${files[i].type} instead.`);
							return false;
						}
					}
					evt.preventDefault();
					for (let i = 0; i < files.length; i++) {
						console.log("file ", i, ":", files[i]);
						const file = evt.dataTransfer.files[i];
						const filePath = file ? file.name : '';
						if (!file) {
							new Notice(`No file ${i} found.`);
							continue;
						}
						let result = await handleSingleFile(
							this.app, this.settings, files[i], editor, markdownView);
						if (!result) {
							const reader = new FileReader();
							reader.onloadend = async () => {
								await createAndInsertWithFileReader(
									this.app, editor, reader, filePath, true, -1);
							};
							reader.readAsDataURL(file);
						}
					}
				}
			)
		);
		this.registerEvent(
			this.app.workspace.on(
				"editor-paste",
				async (evt: ClipboardEvent, editor: Editor, markdownView: MarkdownView) => {
					console.log("editor-paste", editor, markdownView, evt);
					if (!evt.clipboardData || !evt.clipboardData.files) { return; }
					if (!shouldHandleAccordingToConfig(this.settings, evt.clipboardData?.files[0], markdownView)) {
						return false;
					}

					// only handle images, zip, and pdf files
					const files = evt.clipboardData.files;
					console.log("files", files);
					if (files.length === 0) { return; }  // pasted text
					for (let i = 0; i < files.length; i++) {
						if (!files[i].type.startsWith("image") &&
								files[i].type != "application/zip" &&
								files[i].type != "application/pdf") {
							new Notice(
								`Only image, pdf, and zip files are supported. ` +
								`Get ${files[i].type} instead.`);
							return false;
						}
					}
					evt.preventDefault();
					for (let i = 0; i < files.length; i++) {
						let result = await handleSingleFile(
							this.app, this.settings, files[i], editor, markdownView);
						if (!result) {
							const file = evt.clipboardData.files[0];
							const filePath = file.name;
							const reader = new FileReader();
							reader.onloadend = async () => {
								await createAndInsertWithFileReader(
									this.app, editor, reader, filePath, true, -1);
							};
							reader.readAsDataURL(file);
						}
					}
				}
			)
		);
	}
}

