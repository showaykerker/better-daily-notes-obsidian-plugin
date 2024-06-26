import {App, normalizePath, PluginSettingTab, Setting} from 'obsidian';
import { createNotice, formatDate, isValidDateFormat } from '../utils';

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

		containerEl.empty();

		this.setNoticeSettings(containerEl);
		this.setGeneralSettings(containerEl);
		this.setFileHandlingSettings(containerEl);
		this.setSummaryPageSettings(containerEl);
		this.setCompatibilitySettings(containerEl);

	}

	setNoticeSettings(containerEl: HTMLElement) {
		new Setting(containerEl).setName('Notice Settings').setHeading();
		new Setting(containerEl)
			.setName('Notice Level')
			.setDesc('The level of notices to display.')
			.addDropdown(dropdown => dropdown
				.addOptions({
					0: 'Show Me Everything',
					1: 'Normal',
					2: 'Show Me Only Important Things',
					3: 'Show Me Nothing'
				})
				.setValue(this.plugin.settings.noticeLevel)
				.onChange(async (value) => {
					this.plugin.settings.noticeLevel = value;
					await this.plugin.saveSettings();
					this.display();
				}));
		if (this.plugin.settings.noticeLevel < 3) {
			new Setting(containerEl)
				.setName('Notice Duration')
				.setDesc('The duration of notices to display.')
				.addText(text => text
					.setPlaceholder(this.plugin.settings.noticeDuration.toString())
					.setValue(this.plugin.settings.noticeDuration.toString())
					.onChange(async (value) => {
						this.plugin.settings.noticeDuration = parseInt(value);
						await this.plugin.saveSettings();
					}));
		}
	}

	setGeneralSettings(containerEl: HTMLElement) {
		new Setting(containerEl).setName('Daily Notes Configuration').setHeading();
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
					this.display();
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
				.addExtraButton(button => button
					.setIcon('cross')
					.setTooltip('Clear')
					.onClick(async () => {
						templateSetting.settingEl.classList.remove('invalid-path');
						this.plugin.settings.templateFile = '';
						await this.plugin.saveSettings();
						createNotice(this.plugin.settings, 'Template file disabled.', 2);
						this.display();
					}))
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
							createNotice(this.plugin.settings, 'Template file set to: ' + value, 2);
							this.display();
						}
						else if (value === '/') {
							templateSetting.settingEl.classList.remove('invalid-path');
							createNotice(this.plugin.settings, 'Template file disabled.', 2);
							this.plugin.settings.templateFile = '';
							await this.plugin.saveSettings();
							this.display();
						}
						else {
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
	}

	setFileHandlingSettings(containerEl: HTMLElement) {
		new Setting(containerEl).setName('File Handling Configuration').setHeading();
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
	}

	setSummaryPageSettings(containerEl: HTMLElement) {
		new Setting(containerEl).setName('Summary Page Configuration').setHeading();
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
	}

	setCompatibilitySettings(containerEl: HTMLElement) {
		new Setting(containerEl).setName('Compatibility Mode').setHeading();
		new Setting(containerEl)
			.setName('Compatibility Mode')
			.setDesc(
				'If you don\'t wish to be compatible with other plugins such as "Calendar", ' +
				'you\'ll need to disable this feature. ' +
				'Modify this setting will require restart of the app.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.compatibilityMode)
				.onChange(async (value) => {
					this.plugin.settings.compatibilityMode = value;
					await this.plugin.saveSettings();
					this.display();
				}));
		if (this.plugin.settings.compatibilityMode) {
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
	}
}
