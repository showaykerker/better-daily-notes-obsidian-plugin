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
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('better-daily-notes-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

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
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	getMonthDirPath(date_: Date = new Date()) {
		const date = date_ || new Date();
		const year = date.getFullYear();
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		return `${this.settings.rootDir}/${year}-${month}`;
	}

	getTodaysDailyNotePath() {
		const date = new Date();
		const dirPath = this.getMonthDirPath(date);
		const year = date.getFullYear();
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const day = date.getDate().toString().padStart(2, '0');
		return `${dirPath}/${year}-${month}-${day}.md`;
	}

	async createMonthlyImageDirIfNotExists() {
		const dirPath = `${this.getMonthDirPath()}/${this.settings.imageSubDir}`;
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

	async createMonthlyDirIfNotExists() {
		const dirPath = this.getMonthDirPath();
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
