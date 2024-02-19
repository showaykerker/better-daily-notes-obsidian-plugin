import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

// Remember to rename these classes and interfaces!

interface BetterDailyNotesSettings {
	rootDir: string;
	imageSubDir: string;
	defaultImageWidth: number;
}

const DEFAULT_SETTINGS: BetterDailyNotesSettings = {
	rootDir: 'daily-notes',
	imageSubDir: 'images',
	defaultImageWidth: -1,
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
		const monthStr = date.toLocaleString('en-GB', { month: 'short' });
		return `${this.settings.rootDir}/${year}/${monthStr}`;
	}

	getDailyNoteName(date: Date = new Date()) {
		const year = date.getFullYear();
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const day = date.getDate().toString().padStart(2, '0');
		return `${year}-${month}-${day}`;
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
