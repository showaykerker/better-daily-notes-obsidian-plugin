import { Plugin } from 'obsidian';
import dayjs from 'dayjs';
import { DEFAULT_SETTINGS, BetterDailyNotesSettings } from './settings/settings';
import { BetterDailyNotesSettingTab } from './settings/settingTab';
import { CreateSummaryPageEventListener } from './summaryPage/eventListeners';
import { CreateSummaryPageCommands, CreateSummaryPageRibbonIcons } from './summaryPage/commands';
import { CreateDailyNotesEventListener } from './dailyNotes/eventListeners';
import { CreateDailyNotesCommands, CreateDailyNotesRibbonIcons } from './dailyNotes/commands';


export default class BetterDailyNotes extends Plugin {
	settings: BetterDailyNotesSettings;

	async onload() {
		await this.loadSettings();

		const customParseFormat = require('dayjs/plugin/customParseFormat');
		dayjs.extend(customParseFormat);

		CreateDailyNotesCommands(this);
		CreateDailyNotesRibbonIcons(this);

		if (this.settings.enableSummaryPage) {
			CreateSummaryPageRibbonIcons(this);
			CreateSummaryPageCommands(this);
		}

		this.addSettingTab(new BetterDailyNotesSettingTab(this.app, this));
		CreateDailyNotesEventListener(this);
		CreateSummaryPageEventListener(this);
	}


	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

}

