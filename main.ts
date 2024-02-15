import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

// Remember to rename these classes and interfaces!

interface BetterDailyNotesSettings {
	rootDir: string;
	imageSubDir: string;
}

const DEFAULT_SETTINGS: BetterDailyNotesSettings = {
	rootDir: 'daily-notes',
	imageSubDir: 'images'
}

export default class BetterDailyNotes extends Plugin {
	settings: BetterDailyNotesSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon(
			'book-open-check',
			'Open today\'s daily note',
			(evt: MouseEvent) => {
				this.openTodaysDailyNote();
			}
		);
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('better-daily-notes-ribbon-class');

		this.addCommand({
			id: 'open-todays-daily-note',
			name: 'Open today\'s daily note',
			callback: () => {
				this.openTodaysDailyNote();
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

	getMonthDirPath(date: Date = new Date()) {
		const year = date.getFullYear();
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		return `${this.settings.rootDir}/${year}-${month}`;
	}

	getTodaysDailyNoteName(date: Date = new Date()) {
		const year = date.getFullYear();
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const day = date.getDate().toString().padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	getTodaysDailyNotePath(date: Date = new Date(), noteName: string = this.getTodaysDailyNoteName()){
		const dirPath = this.getMonthDirPath(date);
		return `${dirPath}/${noteName}.md`;
	}

	async createMonthlyImageDirIfNotExists(date: Date = new Date()) {
		const dirPath = `${this.getMonthDirPath(date)}/${this.settings.imageSubDir}`;
		if (this.app.vault.getAbstractFileByPath(dirPath)) {
			console.log(`Directory ${dirPath} exists.`);
		}
		else {
			console.log(`Directory ${dirPath} does not exist.`);
			await this.app.vault.createFolder(dirPath);
			new Notice(`Directory ${dirPath} created.`);
			console.log(`Directory ${dirPath} created.`);
		}
	}

	async createMonthlyDirIfNotExists(date: Date = new Date()) {
		const dirPath = this.getMonthDirPath(date);
		if (this.app.vault.getAbstractFileByPath(dirPath)) {
			console.log(`Directory ${dirPath} exists.`);
		}
		else {
			console.log(`Directory ${dirPath} does not exist.`);
			await this.app.vault.createFolder(dirPath);
			new Notice(`Directory ${dirPath} created.`);
			console.log(`Directory ${dirPath} created.`);		}
	}

	async openTodaysDailyNote() {
		const dailyNotePath = this.getTodaysDailyNotePath();
		const dailyNote = this.app.vault.getAbstractFileByPath(dailyNotePath);
		this.createMonthlyDirIfNotExists();
		if (!dailyNote) {
			console.log(`Daily note ${dailyNotePath} not exists.`);
			new Notice(`Daily note ${dailyNotePath} not exists.`);
			await this.app.vault.create(dailyNotePath, '');
			new Notice(`Daily note ${dailyNotePath} created.`);
			console.log(`Daily note ${dailyNotePath} created.`);
		}
		if (dailyNote) {
			await this.app.workspace.openLinkText(dailyNotePath, '', true);
		}
		else {
			await this.app.workspace.openLinkText(dailyNotePath, '', true);
		}
	}

	getDateFromNotePath(notePath: string): Date | null{
		// return None if the notePath is not a daily note
		const noteName = notePath.split("/").pop();
		if (!noteName) {
			return null;
		}
		const dateStr = noteName.split(".")[0];
		const year = parseInt(dateStr.split("-")[0]);
		const month = parseInt(dateStr.split("-")[1]);
		const day = parseInt(dateStr.split("-")[2]);
		if (isNaN(year) || isNaN(month) || isNaN(day)) {
			return null;
		}
		return new Date(year, month - 1, day);
	}

	base64ToArrayBuffer(base64: string): ArrayBuffer {
		const binaryString = window.atob(base64);
		const length = binaryString.length;
		const bytes = new Uint8Array(length);
		for (let i = 0; i < length; i++) {
			bytes[i] = binaryString.charCodeAt(i);
		}
		return bytes.buffer;
	}

	handleSingleImage(
		file: File,
		editor: Editor,
		markdownView: MarkdownView,
		) {
		// rename and move a image to the image directory of the month
		// and replace the markdown link with the new path

		if (!file.type.startsWith("image")) {
			return;
		}
		if (!markdownView || !markdownView.file) {
			return;
		}
		const date = this.getDateFromNotePath(markdownView.file.path);
		if (!date) {
			console.log("Not a daily note.")
			return;
		}

		let reader = new FileReader();
		reader.onloadend = async (e) => {
			new Notice(`Image ${file.name} dropped.`);
			let result = reader.result;
			if (typeof result !== "string") {
				return;
			}
			let base64 = result.split(",")[1];
			let imageDirPath = `${this.getMonthDirPath(date)}/${this.settings.imageSubDir}`;
			let imageFilePrefix = `${this.getTodaysDailyNoteName(date)}-image`;
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
			await this.createMonthlyImageDirIfNotExists(date);
			await this.app.vault.createBinary(imagePath, this.base64ToArrayBuffer(base64));
			let imageLink = `![[${imagePath}]]`;
			editor.replaceSelection(imageLink);
		};
		reader.readAsDataURL(file);
	}

	setupImageHandler() {
		this.registerEvent(
			this.app.workspace.on(
				"editor-drop",
				async (evt: DragEvent, editor: Editor, markdownView: MarkdownView) => {
					evt.preventDefault();
					console.log("editor-drop", evt, editor, markdownView);
					const date = new Date();
					if (evt.dataTransfer &&
						evt.dataTransfer.files.length !== 0 &&
						evt.dataTransfer.files[0].type.startsWith("image")) {
						// only handle images
						let files = evt.dataTransfer.files;
						for (let i = 0; i < files.length; i++) {
							console.log(files[i]);
							this.handleSingleImage(files[i], editor, markdownView);
						}
					}
				}
			)
		)
	}
}



class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class BetterDailyNotesSettingTab extends PluginSettingTab {
	plugin: BetterDailyNotes;

	constructor(app: App, plugin: BetterDailyNotes) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Root Directory')
			.setDesc('The root directory for the daily notes.')
			.addText(text => text
				.setPlaceholder(this.plugin.settings.rootDir)
				.setValue(this.plugin.settings.rootDir)
				.onChange(async (value) => {
					this.plugin.settings.rootDir = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Image Subdirectory')
			.setDesc('The subdirectory for images.')
			.addText(text => text
				.setPlaceholder(this.plugin.settings.imageSubDir)
				.setValue(this.plugin.settings.imageSubDir)
				.onChange(async (value) => {
					this.plugin.settings.imageSubDir = value;
					await this.plugin.saveSettings();
				}));
	}
}
