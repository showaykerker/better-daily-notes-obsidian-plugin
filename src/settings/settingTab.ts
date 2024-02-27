import {App, Plugin, PluginSettingTab, Setting} from 'obsidian';
import { formatDate, isValidDateFormat } from '../utils';

export class BetterDailyNotesSettingTab extends PluginSettingTab {
	plugin: any;

	constructor(app: App, plugin: any) {
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
		containerEl.createEl('h2', {text: 'General Configuration', cls: 'section-header'});
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
			.setName('Assume Same Day Before Hour')
			.setDesc('If the current time is before this hour, assume it is the previous day. (Range: 0-23)')
			.addText(text => text
				.setPlaceholder(this.plugin.settings.assumeSameDayBeforeHour.toString())
				.setValue(this.plugin.settings.assumeSameDayBeforeHour.toString())
				.onChange(async (value) => {
					if (parseInt(value) < 0) { value = "0"; }
					if (parseInt(value) > 23) { value = "23"; }
					value = parseInt(value).toString();
					this.plugin.settings.assumeSameDayBeforeHour = parseInt(value);
					await this.plugin.saveSettings();
				}));

		containerEl.createEl('hr');
		containerEl.createEl('h2', {text: 'Image Handling Configuration', cls: 'section-header'});
		new Setting(containerEl)
			.setName('Image Handling')
			.setDesc('Select how images should be handled.' +
				'This will disable all the settings below' +
				' if set to "Disable All Image Handling".')
			.addDropdown(dropdown => dropdown
				.addOptions({
					'disabled': 'Disable All Handling',
					'daily notes only': 'Only in Daily Notes',
					'all': 'Handle in All Files'
				})
				.setValue(this.plugin.settings.imageHandlingScenario)
				.onChange(async (value) => {
					this.plugin.settings.imageHandlingScenario = value;
					await this.plugin.saveSettings();
					this.display();
				}));

		if (this.plugin.settings.imageHandlingScenario != 'disabled') {
			new Setting(containerEl)
				.setName('Image Subdirectory')
				.setDesc('The subdirectory for images.')
				.setClass('image-subdir')
				.addText(text => text
					.setValue(this.plugin.settings.imageSubDir)
					.onChange(async (value) => {
						this.plugin.settings.imageSubDir = value;
						await this.plugin.saveSettings();
					}));
			new Setting(containerEl)
				.setName('Max Image Size (KB)')
				.setDesc('Compress images added to the daily note to this size. -1 means no compression.')
				.addText(text => text
					.setPlaceholder(this.plugin.settings.maxImageSizeKB.toString())
					.setValue(this.plugin.settings.maxImageSizeKB.toString())
					.onChange(async (value) => {
						this.plugin.settings.maxImageSizeKB = parseInt(value);
						await this.plugin.saveSettings();
					}));
			new Setting(containerEl)
				.setName('Preserve EXIF Data')
				.setDesc('Preserve EXIF data when compressing images.')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.preserveExifData)
					.onChange(async (value) => {
						this.plugin.settings.preserveExifData = value;
						await this.plugin.saveSettings();
					}));
			new Setting(containerEl)
				.setName('Resize Width')
				.setDesc('The width to resize images. -1 means no resizing.' +
					'This only add a suffix to the image\s markdown link. ' +
					'No compression is done.')
				.addText(text => text
					.setPlaceholder(this.plugin.settings.resizeWidth.toString())
					.setValue(this.plugin.settings.resizeWidth.toString())
					.onChange(async (value) => {
						this.plugin.settings.resizeWidth = parseInt(value);
						await this.plugin.saveSettings();
					}));
		}
	}
}
