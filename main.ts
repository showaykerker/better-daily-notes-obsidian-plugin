import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import dayjs from 'dayjs';

// Remember to rename these classes and interfaces!

interface BetterDailyNotesSettings {
	rootDir: string;
	imageSubDir: string;
	defaultImageWidth: number;
	dateFormat: string;
}

const DEFAULT_SETTINGS: BetterDailyNotesSettings = {
	rootDir: 'daily-notes',
	imageSubDir: 'images',
	defaultImageWidth: -1,
	dateFormat: 'YYYY-MM-DD',
}

function formatDate(format: string = DEFAULT_SETTINGS.dateFormat, date: Date = new Date()): string {
	return dayjs(date).format(format);
}

function isValidDateFormat(format: string): boolean {
	// if format contains invalid slashes, even if dayjs accepts it, it is not a valid format
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
					const date = this.checkValidDailyNotePath(activeView.file.path);
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

	getMonthDirPath(date: Date = new Date()) {
		const year = date.getFullYear();
		const monthStr = date.toLocaleString('en-GB', { month: 'short' });
		return `${this.settings.rootDir}/${year}/${monthStr}`;
	}

	getDailyNoteName(date: Date = new Date()) {
		return formatDate(this.settings.dateFormat, date);
	}

	getDailyNotePath(date: Date = new Date(), noteName: string = this.getDailyNoteName()){
		const dirPath = this.getMonthDirPath(date);
		return `${dirPath}/${noteName}.md`;
	}

	async createDirsIfNotExists(dir: string) {
		// check and create from parent to child
		let dirPath = "";
		// new Notice(`Target: ${dir}`);
		for (let dirName of dir.split("/")) {
			dirPath = `${dirPath}${dirName}`;
			console.log(dirPath);
			const hasDirPath = this.app.vault.getAbstractFileByPath(dirPath);
			// new Notice(`${dirPath}: ${hasDirPath}`);
			console.log(`${dirPath}: ${hasDirPath}`);
			if (hasDirPath) {
				console.log(`Directory ${dirPath} exists.`);
				// new Notice(`Directory ${dirPath} exists.`);
			}
			else {
				console.log(`Directory ${dirPath} does not exist.`);
				await this.app.vault.createFolder(dirPath);
				new Notice(`Directory ${dirPath} created.`);
				console.log(`Directory ${dirPath} created.`);
			}
			dirPath = `${dirPath}/`
		}
	}

	async createImageDirIfNotExists(date: Date = new Date()) {
		const imgDirPath = `${this.getMonthDirPath(date)}/${this.settings.imageSubDir}`;
		this.createDirsIfNotExists(imgDirPath);
	}

	async createDirIfNotExists(date: Date = new Date()) {
		const dirPath = this.getMonthDirPath(date);
		await this.createDirsIfNotExists(dirPath);
	}

	async openTodaysDailyNote() {
		const dailyNotePath = this.getDailyNotePath();
		await this.createDirIfNotExists();
		const dailyNote = this.app.vault.getAbstractFileByPath(dailyNotePath);
		if (!dailyNote) {
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

	checkValidDailyNotePath(notePath: string): Date | null{
		// return None if the notePath is not a daily note
		const noteName = notePath.split("/").slice(-1)[0].split(".")[0];
		if (!noteName) {
			console.log("No note name.");
			return null;
		}
		// first check if the file name matches the settings.dateFormat
		const date = dayjs(noteName, this.settings.dateFormat, true);
		if (!date.isValid()) {
			console.log("Invalid date.");
			return null;
		}
		// then check if the file is monthly note directory
		const monthDir = notePath.split("/").slice(-2, -1);
		if (!monthDir) {
			console.log("No month directory.");
			return null;
		}
		return date.toDate();
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

	async limitImageFileWidth(file: File, width: number, reader: FileReader = new FileReader()): Promise<File>{
		// if width is -1, do nothing. Otherwise
		// Modify image size to fit the width while keeping the aspect ratio
		// and keep all other properties of the file
		if (width === -1) {
			return Promise.resolve(file);
		}
		return new Promise((resolve, reject) => {
			reader.onloadend = (e) => {
				let result = reader.result;
				if (typeof result !== "string") {
					reject("Failed to read the file.");
					return;
				}
				let img = new Image();
				img.src = result;
				img.onload = () => {
					let canvas = document.createElement('canvas');
					let ctx = canvas.getContext('2d');
					if (!ctx) {
						reject("Failed to create canvas.");
						return;
					}
					canvas.width = width;
					canvas.height = img.height * width / img.width;
					ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
					canvas.toBlob((blob) => {
						if (!blob) {
							reject("Failed to create blob.");
							return;
						}
						let newFile = new File([blob], file.name, {type: file.type});
						resolve(newFile);
					}, file.type);
				}
			}
			reader.readAsDataURL(file);
		});
	}

	async handleSingleImage(
		file: File,
		editor: Editor,
		markdownView: MarkdownView,
		reader: FileReader = new FileReader(),
	 	): Promise<boolean>{
		// rename and move a image to the image directory of the month
		// and replace the markdown link with the new path

		if (!file.type.startsWith("image")) {
			return false;
		}
		if (!markdownView || !markdownView.file) {
			return false;
		}
		const date = this.checkValidDailyNotePath(markdownView.file.path);
		if (!date) {
			console.log("Not a daily note.")
			return false;
		}

		file = await this.limitImageFileWidth(file, this.settings.defaultImageWidth, reader);

		reader.onloadend = async (e) => {
			// new Notice(`Image ${file.name} dropped.`);
			let result = reader.result;
			if (typeof result !== "string") {
				return false;
			}
			let base64 = result.split(",")[1];
			let imageDirPath = `${this.getMonthDirPath(date)}/${this.settings.imageSubDir}`;
			let imageFilePrefix = `${this.getDailyNoteName(date)}-image`;
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
			await this.createImageDirIfNotExists(date);
			let imageArrayBuffer = this.base64ToArrayBuffer(base64);
			await this.app.vault.createBinary(imagePath, imageArrayBuffer);
			let imageLink = `![[${imagePath}]]`;
			editor.replaceSelection(imageLink);
		};
		reader.readAsDataURL(file);
		return true;
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
						let files = evt.dataTransfer.files;
						for (let i = 0; i < files.length; i++) {
							console.log(files[i]);
							let result = await this.handleSingleImage(files[i], editor, markdownView);
							if (result) {
								evt.preventDefault();
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
					const date = new Date();
					if (evt.clipboardData &&
						evt.clipboardData.files.length !== 0 &&
						evt.clipboardData.files[0].type.startsWith("image")) {
						// only handle images
						let files = evt.clipboardData.files;
						for (let i = 0; i < files.length; i++) {
							console.log(files[i]);
							let result = await this.handleSingleImage(files[i], editor, markdownView);
							if (result) {
								evt.preventDefault();
							}
						}
					}
				}
			)
		);
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
		function getDescription() {
			return 'The date format for the daily notes. (Using Dayjs) \n' +
				'Current format looks like:' +
				formatDate(this.plugin.settings.dateFormat);
		}
		containerEl.empty();
		new Setting(containerEl)
			.setName('Date Format')
			.setDesc(getDescription.bind(this)())
			.addText(text => text
				.setPlaceholder(this.plugin.settings.dateFormat)
				.setValue(this.plugin.settings.dateFormat)
				.onChange(async (value) => {
					if (!isValidDateFormat(value)) {
						return;
					}
					this.plugin.settings.dateFormat = value;
					const previewElement = containerEl.querySelector('.setting-item-description');
					if (previewElement instanceof HTMLDivElement) {
						previewElement.innerText = getDescription.bind(this)();
					}
					await this.plugin.saveSettings();
				}));
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
		new Setting(containerEl)
			.setName('Default Image Width')
			.setDesc('The default width of images. -1 means no width specified.')
			.addText(text => text
				.setPlaceholder(this.plugin.settings.defaultImageWidth.toString())
				.setValue(this.plugin.settings.defaultImageWidth.toString())
				.onChange(async (value) => {
					this.plugin.settings.defaultImageWidth = parseInt(value);
					await this.plugin.saveSettings();
				}));
	}
}
