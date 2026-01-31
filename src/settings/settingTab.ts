import {App, normalizePath, PluginSettingTab, Setting, AbstractInputSuggest, TFile} from 'obsidian';
import { createNotice, formatDate, isValidDateFormat } from '../utils';

class TemplateFileSuggester extends AbstractInputSuggest<TFile> {
  private inputRef: HTMLInputElement;
  constructor(app: App, inputEl: HTMLInputElement) {
    super(app, inputEl);
    this.inputRef = inputEl;
  }

  getSuggestions(query: string): TFile[] {
    const lower = query.toLowerCase();
    return this.app.vault
      .getAllLoadedFiles()
      .filter((f): f is TFile => f instanceof TFile)
      .filter((f) => f.extension === 'md' && f.path.toLowerCase().includes(lower));
  }

  renderSuggestion(file: TFile, el: HTMLElement): void {
    el.setText(file.path);
  }

  selectSuggestion(file: TFile): void {
    this.inputRef.value = file.path;
    this.inputRef.dispatchEvent(new Event('input'));
    this.inputRef.dispatchEvent(new Event('change'));
    this.close();
    this.inputRef.focus();
  }
}

export class BetterDailyNotesSettingTab extends PluginSettingTab {
	plugin: any;
	private collapsibleStates: Map<string, boolean> = new Map();

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

	getFolderStructurePreview = (): string => {
		const exampleDate = formatDate(this.plugin.settings.dateFormat);
		if (this.plugin.settings.useStructuredFolders) {
			const now = new Date();
			const year = now.getFullYear();
			const month = formatDate('MMM', now);
			return `${this.plugin.settings.rootDir}/${year}/${month}/${exampleDate}.md`;
		} else {
			return `${this.plugin.settings.rootDir}/${exampleDate}.md`;
		}
	}

	createCollapsibleSection(
		containerEl: HTMLElement,
		title: string,
		defaultCollapsed: boolean = false
	): { header: HTMLElement; content: HTMLElement } {
		const sectionEl = containerEl.createDiv('better-daily-notes-section');

		// Check if we have a saved state for this section
		const collapsed = this.collapsibleStates.has(title)
			? this.collapsibleStates.get(title)!
			: defaultCollapsed;

		const headerEl = sectionEl.createDiv('better-daily-notes-collapsible-header');
		// Add accessibility attributes
		headerEl.setAttribute('role', 'button');
		headerEl.setAttribute('tabindex', '0');
		headerEl.setAttribute('aria-expanded', collapsed ? 'false' : 'true');

		const iconEl = headerEl.createSpan('better-daily-notes-collapsible-icon');
		iconEl.setAttribute('aria-hidden', 'true');
		iconEl.setText(collapsed ? '▶' : '▼');
		if (collapsed) iconEl.addClass('collapsed');

		const titleEl = headerEl.createEl('h3');
		titleEl.setText(title);
		titleEl.style.margin = '0';
		titleEl.style.display = 'inline';

		const contentEl = sectionEl.createDiv('better-daily-notes-collapsible-content');
		if (collapsed) {
			contentEl.addClass('collapsed');
			contentEl.style.maxHeight = '0px';
		} else {
			// Use requestAnimationFrame for more accurate height calculation
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					contentEl.style.maxHeight = contentEl.scrollHeight + 'px';
				});
			});
		}

		const toggleSection = () => {
			const isCollapsed = contentEl.hasClass('collapsed');
			if (isCollapsed) {
				contentEl.removeClass('collapsed');
				iconEl.removeClass('collapsed');
				iconEl.setText('▼');
				headerEl.setAttribute('aria-expanded', 'true');
				// Save expanded state
				this.collapsibleStates.set(title, false);
				// Recalculate height on expand with double RAF for accuracy
				requestAnimationFrame(() => {
					requestAnimationFrame(() => {
						contentEl.style.maxHeight = contentEl.scrollHeight + 'px';
					});
				});
			} else {
				// Set to current height first for smooth transition
				contentEl.style.maxHeight = contentEl.scrollHeight + 'px';
				// Force reflow
				contentEl.offsetHeight;
				contentEl.addClass('collapsed');
				iconEl.addClass('collapsed');
				iconEl.setText('▶');
				headerEl.setAttribute('aria-expanded', 'false');
				contentEl.style.maxHeight = '0px';
				// Save collapsed state
				this.collapsibleStates.set(title, true);
			}
		};

		headerEl.addEventListener('click', toggleSection);
		headerEl.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				toggleSection();
			}
		});

		return { header: headerEl, content: contentEl };
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
		const { content } = this.createCollapsibleSection(containerEl, 'Notice Settings', true);
		new Setting(content)
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
			new Setting(content)
				.setName('Notice Duration')
				.setDesc('The duration of notices to display (in milliseconds).')
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
		const { content } = this.createCollapsibleSection(containerEl, 'Daily Notes Configuration', false);

		const dateFormatSetting = new Setting(content)
			.setName('Date Format')
			.setDesc('The date format for the daily notes. Uses Dayjs format. Format tokens: YYYY (year), MM (month), DD (day). See Dayjs documentation for more options.')
			.addText(text => text
				.setPlaceholder(this.plugin.settings.dateFormat)
				.setValue(this.plugin.settings.dateFormat)
				.onChange(async (value) => {
					this.plugin.settings.dateFormat = value.trim();
					const datePreview = content.getElementsByClassName('preview-date-format')[0];
					datePreview.setText(`Current format looks like: "${formatDate(this.plugin.settings.dateFormat)}"`);
					// Also update folder structure preview
					const folderPreview = content.getElementsByClassName('preview-folder-structure')[0];
					if (folderPreview) {
						const examplePath = this.getFolderStructurePreview();
						folderPreview.setText(`Example: ${examplePath}`);
					}
					await this.plugin.saveSettings();
				}));

		content.createEl('p', {
			text: `Current format looks like: "${formatDate(this.plugin.settings.dateFormat)}"`,
			cls: 'setting-item-description preview-date-format'});

		new Setting(content)
			.setName('Root Directory')
			.setDesc('The root directory for the daily notes.')
			.addText(text => text
				.setPlaceholder(this.plugin.settings.rootDir)
				.setValue(this.plugin.settings.rootDir)
				.onChange(async (value) => {
					this.plugin.settings.rootDir = value;
					await this.plugin.saveSettings();
					// Update folder structure preview to reflect new root directory
					const folderPreview = content.getElementsByClassName('preview-folder-structure')[0];
					if (folderPreview) {
						const examplePath = this.getFolderStructurePreview();
						folderPreview.setText(`Example: ${examplePath}`);
					}
				}));

		let templateSetting = new Setting(content)
				.setName('Template File Location')
				.setDesc('The location of the template file for the daily notes. Leave it blank to disable this feature.')
				.addExtraButton(button => button
					.setIcon('cross')
					.setTooltip('Clear')
					.onClick(async () => {
						templateSetting.settingEl.classList.remove('invalid-path');
						templateSetting.settingEl.classList.remove('valid-path');
						this.plugin.settings.templateFile = '';
						await this.plugin.saveSettings();
						createNotice(this.plugin.settings, 'Template file disabled.', 2);
						this.display();
					}))
				.addText(text => {
					text
						.setPlaceholder(this.plugin.settings.templateFile)
						.setValue(this.plugin.settings.templateFile)
						.onChange(async (value) => {
							if (value != '' && !value.endsWith('.md')) {
								value = value + '.md';
							}
							value = normalizePath(value);
							if (await this.app.vault.adapter.exists(value) && value.endsWith('.md')) {
								templateSetting.settingEl.classList.remove('invalid-path');
								templateSetting.settingEl.classList.add('valid-path');
								this.plugin.settings.templateFile = value;
								await this.plugin.saveSettings();
								createNotice(this.plugin.settings, 'Template file set to: ' + value, 2);
							}
							else if (value === '/') {
								templateSetting.settingEl.classList.remove('invalid-path');
								templateSetting.settingEl.classList.remove('valid-path');
								createNotice(this.plugin.settings, 'Template file disabled.', 2);
								this.plugin.settings.templateFile = '';
								await this.plugin.saveSettings();
							}
							else {
								templateSetting.settingEl.classList.add('invalid-path');
								templateSetting.settingEl.classList.remove('valid-path');
							}
					});
					new TemplateFileSuggester(this.app, (text as any).inputEl);
					return text;
				});

		const assumeDayHourSetting = new Setting(content)
			.setName('Assume Same Day Before Hour')
			.setDesc('If the current time is before this hour, assume it is the previous day. For example, if set to 2, notes created at 1:30 AM will be dated for the previous day.')
			.addDropdown(dropdown => {
				// Populate options 0-23
				const options: Record<string, string> = {};
				for (let i = 0; i <= 23; i++) {
					options[i.toString()] = i.toString();
				}
				dropdown
					.addOptions(options)
					.setValue(this.plugin.settings.assumeSameDayBeforeHour.toString())
					.onChange(async (value) => {
						this.plugin.settings.assumeSameDayBeforeHour = parseInt(value, 10);
						await this.plugin.saveSettings();
					});
				return dropdown;
			});

		new Setting(content)
			.setName('Use Structured Folders')
			.setDesc('Organize daily notes in Year/Month subfolders. When disabled, all notes will be saved directly in the "Root Directory" configured above.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useStructuredFolders)
				.onChange(async (value) => {
					this.plugin.settings.useStructuredFolders = value;
					await this.plugin.saveSettings();
					const preview = content.getElementsByClassName('preview-folder-structure')[0];
					const examplePath = this.getFolderStructurePreview();
					preview.setText(`Example: ${examplePath}`);
				}));

		const examplePath = this.getFolderStructurePreview();
		content.createEl('p', {
			text: `Example: ${examplePath}`,
			cls: 'setting-item-description preview-folder-structure'
		});
	}

	setFileHandlingSettings(containerEl: HTMLElement) {
		const { content } = this.createCollapsibleSection(containerEl, 'File Handling Configuration', false);

		content.createDiv({
			text: 'The plugin handles drop and paste events. If you already have other plugins that handle these events (such as automatic image upload), you may want to disable file handling from this plugin. Currently, the plugin supports handling of images, videos, pdfs, and zips.',
			cls: 'setting-item-description'
		});

		new Setting(content)
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
			new Setting(content)
				.setName('Image Subdirectory')
				.setDesc('The subdirectory for images.')
				.setClass('image-subdir')
				.addText(text => text
					.setValue(this.plugin.settings.imageSubDir)
					.onChange(async (value) => {
						this.plugin.settings.imageSubDir = value;
						await this.plugin.saveSettings();
					}));
			new Setting(content)
				.setName('Video Subdirectory')
				.setDesc('The subdirectory for video files.')
				.setClass('video-subdir')
				.addText(text => text
					.setValue(this.plugin.settings.videoSubDir)
					.onChange(async (value) => {
						this.plugin.settings.videoSubDir = value;
						await this.plugin.saveSettings();
					}));
			new Setting(content)
				.setName('Other Files Subdirectory')
				.setDesc('The subdirectory for other files.')
				.setClass('other-files-subdir')
				.addText(text => text
					.setValue(this.plugin.settings.otherFilesSubDir)
					.onChange(async (value) => {
						this.plugin.settings.otherFilesSubDir = value;
						await this.plugin.saveSettings();
					}));
			new Setting(content)
				.setName('Max Image Size (KB)')
				.setDesc('Compress images added to the daily note to this size. -1 means no compression.')
				.addText(text => text
					.setPlaceholder(this.plugin.settings.maxImageSizeKB.toString())
					.setValue(this.plugin.settings.maxImageSizeKB.toString())
					.onChange(async (value) => {
						this.plugin.settings.maxImageSizeKB = parseInt(value);
						await this.plugin.saveSettings();
					}));
			new Setting(content)
				.setName('Preserve EXIF Data')
				.setDesc('Preserve EXIF data when compressing images.')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.preserveExifData)
					.onChange(async (value) => {
						this.plugin.settings.preserveExifData = value;
						await this.plugin.saveSettings();
					}));
			new Setting(content)
				.setName('Resize Width')
				.setDesc('The width to resize images and pdfs. -1 means no resizing. This only adds a suffix to the images\' and pdfs\' markdown link. No compression is done.')
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
		const { content } = this.createCollapsibleSection(containerEl, 'Summary Page Configuration', true);

		content.createDiv({
			text: 'Summary page is a page that summarizes the daily notes from the past few days. If enabled, the feature will be available in the command palette and as ribbon icon.',
			cls: 'setting-item-description'
		});

		new Setting(content)
			.setName('Enable Summary Page Creation')
			.setDesc('Enable the command to create / update summary page. Requires restart of the app to take effect.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableSummaryPage)
				.onChange(async (value) => {
					this.plugin.settings.enableSummaryPage = value;
					await this.plugin.saveSettings();
					this.display();
				}));

		if (this.plugin.settings.enableSummaryPage) {
			new Setting(content)
				.setName('Summarize Existing Notes Only')
				.setDesc('When enabled, instead of using consecutive dates, the summary will include the latest existing daily notes found by scanning backwards up to the configured number of months.')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.summarizeByExistence ?? false)
					.onChange(async (value) => {
						this.plugin.settings.summarizeByExistence = value;
						await this.plugin.saveSettings();
					}));

			new Setting(content)
				.setName('Lookback Months')
				.setDesc('How many months back to search when collecting existing daily notes for the summary. Used only when "Summarize Existing Notes Only" is enabled.')
				.addText(text => text
					.setPlaceholder(((this.plugin.settings.summaryLookbackMonths ?? 2)).toString())
					.setValue(((this.plugin.settings.summaryLookbackMonths ?? 2)).toString())
					.onChange(async (value) => {
						const n = parseInt(value, 10);
						this.plugin.settings.summaryLookbackMonths = isNaN(n) || n < 0 ? 2 : n;
						await this.plugin.saveSettings();
					}));

			new Setting(content)
				.setName('Summary Page File')
				.setDesc('The file name for the summary page.')
				.addText(text => text
					.setValue(this.plugin.settings.summaryPageFile)
					.onChange(async (value) => {
						this.plugin.settings.summaryPageFile = value;
						await this.plugin.saveSettings();
					}));
			new Setting(content)
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
		const { content } = this.createCollapsibleSection(containerEl, 'Compatibility Mode', true);

		new Setting(content)
			.setName('Enable Compatibility Mode')
			.setDesc('If you don\'t wish to be compatible with other plugins such as "Calendar", you\'ll need to disable this feature. Modifying this setting will require restart of the app.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.compatibilityMode)
				.onChange(async (value) => {
					this.plugin.settings.compatibilityMode = value;
					await this.plugin.saveSettings();
					this.display();
				}));

		if (this.plugin.settings.compatibilityMode) {
			content.createEl('h4', {text: 'Compatible Date Formats', cls: 'setting-item-name'});
			content.createDiv({
				text: 'The date formats that are compatible with this plugin. Files created with these formats will be recognized as daily notes. By default, it will fetch all the date formats from other supported plugins. You can modify this setting to add or remove date formats, just separate each format with a newline. Set to "AUTO" to fetch all the date formats from other supported plugins. Modifying this setting will require restart of the app.',
				cls: 'setting-item-description'
			});

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
			content.appendChild(input);
		}
	}
}
