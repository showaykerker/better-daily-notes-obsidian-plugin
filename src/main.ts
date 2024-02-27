import { Editor, MarkdownView, Notice, Plugin } from 'obsidian';
import dayjs from 'dayjs';
import { checkValidDailyNotePath, base64ToArrayBuffer } from './utils';
import { getDailyNoteName, getDailyNotePath, getMonthDirPath } from './utils';
import { limitImageFileSize } from './imageHandler';
import { createImageDirIfNotExists } from './fileSystem';
import { openDailyNote } from './commands';
import { DEFAULT_SETTINGS, BetterDailyNotesSettings } from './settings/settings';
import { BetterDailyNotesSettingTab } from './settings/settingTab';


export default class BetterDailyNotes extends Plugin {
	settings: BetterDailyNotesSettings;

	async onload() {
		await this.loadSettings();

		var customParseFormat = require('dayjs/plugin/customParseFormat');
		dayjs.extend(customParseFormat);


		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon(
			'book-open-check',
			'Open today\'s daily note',
			(evt: MouseEvent) => {
				openDailyNote(this.app, this.settings, 0);
			}
		);
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('better-daily-notes-ribbon-class');

		this.addCommand({
			id: 'open-todays-daily-note',
			name: 'Open today\'s daily note',
			callback: () => {
				openDailyNote(this.app, this.settings, 0);
			}
		})

		this.addCommand({
			id: 'open-yesterdays-daily-note',
			name: 'Open yesterday\'s daily note',
			callback: () => {
				openDailyNote(this.app, this.settings, -1);
			}
		})

		this.addCommand({
			id: 'open-tomorrows-daily-note',
			name: 'Open tomorrow\'s daily note',
			callback: () => {
				openDailyNote(this.app, this.settings, +1);
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
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));

		this.setupImageHandler();
	}


	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async handleSingleImage(
		file: File,
		editor: Editor,
		markdownView: MarkdownView,
		reader: FileReader = new FileReader(),
	 	): Promise<boolean>{
		// rename and move a image to the image directory of the month
		// and replace the markdown link with the new path

		if (!file.type.startsWith("image")) { return false; }
		if (!markdownView || !markdownView.file) { return false; }
		const date = checkValidDailyNotePath(markdownView.file.path, this.settings.dateFormat);
		if (!date) { return false; }

		file = await limitImageFileSize(
			file,
			this.settings.maxImageSizeKB,
			this.settings.preserveExifData);

		var handleSuccess = true;

		reader.onloadend = async (e) => {
			// new Notice(`Image ${file.name} dropped.`);
			let result = reader.result;
			if (typeof result !== "string") {
				handleSuccess = false;
				return false;
			}
			let base64 = result.split(",")[1];
			let rootDir = this.settings.rootDir;
			let assumeSameDayBeforeHour = this.settings.assumeSameDayBeforeHour;
			let dateFormat = this.settings.dateFormat;
			let imageDirPath = `${getMonthDirPath(rootDir, assumeSameDayBeforeHour, date)}/${this.settings.imageSubDir}`;
			let imageFilePrefix = `${getDailyNoteName(assumeSameDayBeforeHour, dateFormat, date)}-image`;
			// count current images under imageDirPath that starts with imageFilePrefix
			const countImageFiles = (dirPath: string) => {
				let count = 0;
				for (let file of this.app.vault.getFiles()) {
					if (file.path.startsWith(dirPath) &&
						file.path.contains(imageFilePrefix) &&
						!file.path.endsWith(".md")) {count += 1;}
				}
				return count;
			};
			const imageCount = countImageFiles(imageDirPath);
			console.log(`Number of images today: ${imageCount}`);
			var imageFileName = `${imageFilePrefix}${imageCount}.${file.type.split("/")[1]}`;
			let imagePath = `${imageDirPath}/${imageFileName}`;
			await createImageDirIfNotExists(
				this.app,
				rootDir,
				assumeSameDayBeforeHour,
				this.settings.imageSubDir,
				date);
			let imageArrayBuffer = base64ToArrayBuffer(base64);
			await this.app.vault.createBinary(imagePath, imageArrayBuffer);
			var imageLink = `![[${imagePath}]]`;
			if (this.settings.resizeWidth !== -1) {
				imageLink = `![[${imagePath}|${this.settings.resizeWidth}]]`;
			}
			editor.replaceSelection(imageLink);
		};
		reader.readAsDataURL(file);
		return handleSuccess;
	}

	setupImageHandler() {
		this.registerEvent(
			this.app.workspace.on(
				"editor-drop",
				async (evt: DragEvent, editor: Editor, markdownView: MarkdownView) => {
					console.log("editor-drop", evt, editor, markdownView);
					const date = new Date();
					if (evt.dataTransfer &&
						evt.dataTransfer.files.length !== 0 &&
						evt.dataTransfer.files[0].type.startsWith("image")) {
						// only handle images
						evt.preventDefault();
						let files = evt.dataTransfer.files;
						for (let i = 0; i < files.length; i++) {
							console.log(files[i]);
							let result = await this.handleSingleImage(files[i], editor, markdownView);
							console.log("result:", result);
							if (!result) {
								const file = evt.dataTransfer.files[0];
								const reader = new FileReader();
								reader.onloadend = async () => {
									const base64 = reader.result?.toString().split(",")[1];
									if (base64) {
										const imageArrayBuffer = base64ToArrayBuffer(base64);
										const imagePath = `/${file.name}`;
										await this.app.vault.createBinary(imagePath, imageArrayBuffer);
										const imageLink = `![[${imagePath}]]`;
										editor.replaceSelection(imageLink);
									}
								};
								reader.readAsDataURL(file);
							}
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
					if (evt.clipboardData &&
						evt.clipboardData.files.length !== 0 &&
						evt.clipboardData.files[0].type.startsWith("image")) {
						// only handle images
						evt.preventDefault();
						let files = evt.clipboardData.files;
						for (let i = 0; i < files.length; i++) {
							console.log(files[i]);
							let result = await this.handleSingleImage(files[i], editor, markdownView);
							console.log("result:", result);
							if (!result) {
								const file = evt.clipboardData.files[0];
								const reader = new FileReader();
								reader.onloadend = async () => {
									const base64 = reader.result?.toString().split(",")[1];
									if (base64) {
										const imageArrayBuffer = base64ToArrayBuffer(base64);
										const imagePath = `/${file.name}`;
										await this.app.vault.createBinary(imagePath, imageArrayBuffer);
										const imageLink = `![[${imagePath}]]`;
										editor.replaceSelection(imageLink);
									}
								};
								reader.readAsDataURL(file);
							}
						}
					}
				}
			)
		);
	}
}

