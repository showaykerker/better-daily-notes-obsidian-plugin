import { Plugin } from 'obsidian';
import dayjs from 'dayjs';
import { DEFAULT_SETTINGS, BetterDailyNotesSettings } from './settings/settings';
import { BetterDailyNotesSettingTab } from './settings/settingTab';
import { DailyNoteEventListener } from './dailyNotes/eventListeners';
import { createDailyNotesCommands, createDailyNotesRibbonIcons } from './dailyNotes/commands';
import { createSummaryPageEventListener } from './summaryPage/eventListeners';
import { createSummaryPageCommands, createSummaryPageRibbonIcons } from './summaryPage/commands';


export default class BetterDailyNotes extends Plugin {
	settings: BetterDailyNotesSettings;
	dailyNoteEventListener: DailyNoteEventListener;

	async onload() {
		await this.loadSettings();

		const customParseFormat = require('dayjs/plugin/customParseFormat');
		dayjs.extend(customParseFormat);

		createDailyNotesCommands(this);
		createDailyNotesRibbonIcons(this);

		if (this.settings.enableSummaryPage) {
			createSummaryPageRibbonIcons(this);
			createSummaryPageCommands(this);
		}

		this.addSettingTab(new BetterDailyNotesSettingTab(this.app, this));
		// createDailyNotesEventListener(this);
		createSummaryPageEventListener(this);

		this.dailyNoteEventListener = new DailyNoteEventListener(this);
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

