import {App, normalizePath, Notice, PluginSettingTab, Setting} from 'obsidian';
import { formatDate, isValidDateFormat } from '../utils';
import { create } from 'domain';

export class BetterDailyNotesSettingTab extends PluginSettingTab {
	plugin: any;

	constructor(app: App, plugin: any) {
		super(app, plugin);
		this.plugin = plugin;
	}

	templateExists = (): Boolean => {
		if (this.plugin.settings.templateFile == '') { return true; }
		const templateFile = normalizePath(this.plugin.settings.templateFile);
		const abstract = this.app.vault.getAbstractFileByPath(templateFile);
		return this.plugin.settings.templateFile != '' && abstract != null;
	}

	display(): void {
		const {containerEl} = this;

		if (!this.templateExists()) {
			new Notice(`Template file ${this.plugin.settings.templateFile} not found. `+
				'Please modify path to the template file.');
			this.plugin.settings.templateFile = '';
		}

		containerEl.empty();
		containerEl.createEl('h2', {text: 'Better Daily Notes', cls: 'section-header'});
		// containerEl.createEl('h2', {text: 'General Configuration', cls: 'section-header'});
		new Setting(containerEl)
			.setName('Date Format')
			.setDesc('The date format for the daily notes. (Using Dayjs)')
			.addText(text => text
				.setPlaceholder(this.plugin.settings.dateFormat)
				.setValue(this.plugin.settings.dateFormat)
				.onChange(async (value) => {
					if (!isValidDateFormat(value)) {
						return;
					}
					this.plugin.settings.dateFormat = value.trim();
					const preview = containerEl.getElementsByClassName('preview-date-format')[0];
					preview.setText(`Current format looks like: "${formatDate(this.plugin.settings.dateFormat)}"`);
					await this.plugin.saveSettings();
				}));
		containerEl.createEl('p', {
			text: `Current format looks like: "${formatDate(this.plugin.settings.dateFormat)}"`,
			cls: 'setting-item-description preview-date-format'});

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

		let templateSetting = new Setting(containerEl)
				.setName('Template File Location')
				.setDesc('The location of the template file for the daily notes. ' +
					'Leave it blank to disable this feature.')
				.addText(text => text
					.setPlaceholder(this.plugin.settings.templateFile)
					.setValue(this.plugin.settings.templateFile)
					.onChange(async (value) => {
						if (value != '' && !value.endsWith('.md')) {
							value = value + '.md';
						}
						value = normalizePath(value);
						if (await this.app.vault.adapter.exists(value) && value.endsWith('.md')) {
							templateSetting.settingEl.classList.remove('invalid-path');
							this.plugin.settings.templateFile = value;
							await this.plugin.saveSettings();
							new Notice('Template file set to: ' + value);
						} else {
							templateSetting.setClass('invalid-path');
						}
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
		containerEl.createEl('h2', {
			text: 'File Handling Configuration', cls: 'section-header'});
		containerEl.createEl('p', {
			text: 'The plugin handles drop and paste events, ',
			cls: 'setting-item-description' });
		containerEl.createEl('p', {
			text: "if you already have other plugins that handle these events, ",
			cls: 'setting-item-description'});
		containerEl.createEl('p', {
			text: "such as automatic image upload, ",
			cls: 'setting-item-description' });
		containerEl.createEl('p', {
			text: "you may want to disable file handling from this plugin.",
			cls: 'setting-item-description'});
		containerEl.createEl(
			'p', {
			text: 'Currently, the plugin only supports handling of images, pdfs, and zips.',
			cls: 'setting-item-description' });
		new Setting(containerEl)
			.setName('File Handling')
			.setDesc('Select how files should be handled.' +
				'This will disable all the settings below' +
				' if set to "Disable All Image Handling".')
			.addDropdown(dropdown => dropdown
				.addOptions({
					'disabled': 'Disable All Handling',
					'daily notes only': 'Only in Daily Notes',
					'all': 'Handle in All Files'
				})
				.setValue(this.plugin.settings.fileHandlingScenario)
				.onChange(async (value) => {
					this.plugin.settings.fileHandlingScenario = value;
					await this.plugin.saveSettings();
					this.display();
				}));

		if (this.plugin.settings.fileHandlingScenario != 'disabled') {
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
				.setName('Other Files Subdirectory')
				.setDesc('The subdirectory for other files.')
				.setClass('other-files-subdir')
				.addText(text => text
					.setValue(this.plugin.settings.otherFilesSubDir)
					.onChange(async (value) => {
						this.plugin.settings.otherFilesSubDir = value;
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
				.setDesc('The width to resize images and pdfs. -1 means no resizing. ' +
					'This only add a suffix to the images\' and pdfs\' markdown link. ' +
					'No compression is done.')
				.addText(text => text
					.setPlaceholder(this.plugin.settings.resizeWidth.toString())
					.setValue(this.plugin.settings.resizeWidth.toString())
					.onChange(async (value) => {
						this.plugin.settings.resizeWidth = parseInt(value);
						await this.plugin.saveSettings();
					}));
		}

		containerEl.createEl('hr');
		containerEl.createEl('h2', {text: 'Summary Page Configuration', cls: 'section-header'});
		containerEl.createEl('p', {text: "Summary page is a page that summarizes the daily notes from the past few days. " +
			" If enabled, the feature will be available in the command palette and as ribbon icon. ", cls: 'setting-item-description'});

		new Setting(containerEl)
			.setName('Enable Summary Page Creation')
			.setDesc('Enable the command to create / update summary page. ' +
				"Requires restart of th app to take effect.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableSummaryPage)
				.onChange(async (value) => {
					this.plugin.settings.enableSummaryPage = value;
					await this.plugin.saveSettings();
					this.display();
				}));

		if (this.plugin.settings.enableSummaryPage) {
			new Setting(containerEl)
				.setName('Summary Page File')
				.setDesc('The file name for the summary page.')
				.addText(text => text
					.setValue(this.plugin.settings.summaryPageFile)
					.onChange(async (value) => {
						this.plugin.settings.summaryPageFile = value;
						await this.plugin.saveSettings();
					}));
			new Setting(containerEl)
				.setName('Number of Days to Summarize')
				.setDesc('The number of days to summarize.')
				.addText(text => text
					.setPlaceholder(this.plugin.settings.summaryOfDaysCount.toString())
					.setValue(this.plugin.settings.summaryOfDaysCount.toString())
					.onChange(async (value) => {
						this.plugin.settings.summaryOfDaysCount = parseInt(value);
						await this.plugin.saveSettings();
					}));
		}

		containerEl.createEl('hr');
		containerEl.createEl('h2', {text: 'Compatibility Mode', cls: 'section-header'});
		new Setting(containerEl)
			.setName('Disable Compatibility Mode')
			.setDesc('Disable compatibility mode. ' +
				'If you don\'t wish to be compatible with other plugins such as "Calendar", ' +
				'you\'ll need to disable this feature. ' +
				'Modify this setting will require restart of the app.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.disableCompatibilityMode)
				.onChange(async (value) => {
					this.plugin.settings.disableCompatibilityMode = value;
					await this.plugin.saveSettings();
					this.display();
				}));
		if (!this.plugin.settings.disableCompatibilityMode) {
			containerEl.createEl('h4', {text: 'Compatible Date Formats', cls: 'setting-item-name'})
			containerEl.createEl('p', {
				text: 'The date formats that are compatible with this plugin. ',
				cls: 'setting-item-description'});
			containerEl.createEl('p', {
				text: 'Files created with these formats will be recognized as daily notes. ',
				cls: 'setting-item-description'});
			containerEl.createEl('p', {
				text: 'By default, it will fetch all the date formats from other supported plugins. ',
				cls: 'setting-item-description'});
			containerEl.createEl('p', {
				text: 'You can modify this setting to add or remove date formats, ',
				cls: 'setting-item-description'});
			containerEl.createEl('p', {
				text: 'just separate each format with a comma. ',
				cls: 'setting-item-description'});
			containerEl.createEl('p', {
				text: 'Set to "AUTO" to fetch all the date formats from other supported plugins. ',
				cls: 'setting-item-description'});
			containerEl.createEl('p', {
				text: 'Modify this setting will require restart of the app.',
				cls: 'setting-item-description'});
			const input = document.createElement('textarea');
			input.cols = 15;
			input.rows = 5;
			input.placeholder = this.plugin.settings.compatibleDateFormats.toString().replaceAll(',', '\n');
			input.value = this.plugin.settings.compatibleDateFormats.toString().replaceAll(',', '\n');
			input.addEventListener('change', async (event) => {
				this.plugin.settings.compatibleDateFormats =
					input.value.split('\n')
						.map((format: string) => format.trim())
						.filter((format: string) => format != '');
				await this.plugin.saveSettings();
			});
			containerEl.appendChild(input);
		}

		// containerEl.createEl('hr');
		// containerEl.createEl('h2', {text: 'Developer Option', cls: 'section-header'});
		// containerEl.createEl('p', {text: 'This section is for debugging purposes. ' +
		// 	'Please do not modify these settings unless you know what you are doing.'});
		// new Setting(containerEl)
		// 	.setName('Debug Mode')
		// 	.setDesc('Enable debug mode. This will show debug message as Notice (that is really annoying).')
		// 	.addToggle(toggle => toggle
		// 		.setValue(this.plugin.settings.debugMode)
		// 		.onChange(async (value) => {
		// 			this.plugin.settings.debugMode = value;
		// 			await this.plugin.saveSettings();
		// 		}));
	}
}
