
export interface BetterDailyNotesSettings {
	dateFormat: string;
	rootDir: string;
	templateFile: string;
	assumeSameDayBeforeHour: number;
	fileHandlingScenario: string;
	imageSubDir: string;
	otherFilesSubDir: string;
	maxImageSizeKB: number;
	maxImageSizeKBCache: number
	preserveExifData: boolean;
	resizeWidth: number;
}

export const DEFAULT_SETTINGS: BetterDailyNotesSettings = {
	dateFormat: 'YYYY-MM-DD',
	rootDir: 'daily-notes',
	templateFile: '',
	assumeSameDayBeforeHour: 2,
	fileHandlingScenario: 'daily notes only',
	imageSubDir: 'images',
	otherFilesSubDir: 'other',
	maxImageSizeKB: -1,
	maxImageSizeKBCache: -1,
	preserveExifData: true,
	resizeWidth: -1,
}