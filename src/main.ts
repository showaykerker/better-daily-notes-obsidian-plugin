import { Plugin } from 'obsidian';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { DEFAULT_SETTINGS, BetterDailyNotesSettings } from './settings/settings';
import { BetterDailyNotesSettingTab } from './settings/settingTab';
import { createCompatibilityEventListener } from './compatibility/eventListeners';
import { createSummaryPageEventListener } from './summaryPage/eventListeners';
import { createSummaryPageCommands, createSummaryPageRibbonIcons } from './summaryPage/commands';
import { createDailyNotesEventListener } from './dailyNotes/eventListeners';
import { createDailyNotesCommands, createDailyNotesRibbonIcons } from './dailyNotes/commands';


export default class BetterDailyNotes extends Plugin {
	settings: BetterDailyNotesSettings;

	async onload() {
		await this.loadSettings();

		dayjs.extend(customParseFormat);

		createDailyNotesCommands(this);
		createDailyNotesRibbonIcons(this);

		if (this.settings.enableSummaryPage) {
			createSummaryPageRibbonIcons(this);
			createSummaryPageCommands(this);
		}

		this.addSettingTab(new BetterDailyNotesSettingTab(this.app, this));
		if (this.settings.compatibilityMode) {
			createCompatibilityEventListener(this);
		}
		createDailyNotesEventListener(this);
		createSummaryPageEventListener(this);
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

