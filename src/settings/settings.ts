
export interface BetterDailyNotesSettings {
	rootDir: string;
	fileHandlingScenario: string;
	imageSubDir: string;
	otherFilesSubDir: string;
	maxImageSizeKB: number;
	preserveExifData: boolean;
	dateFormat: string;
	resizeWidth: number;
	assumeSameDayBeforeHour: number;
}

export const DEFAULT_SETTINGS: BetterDailyNotesSettings = {
	rootDir: 'daily-notes',
	fileHandlingScenario: 'daily notes only',
	imageSubDir: 'images',
	otherFilesSubDir: 'other',
	maxImageSizeKB: -1,
	preserveExifData: true,
	dateFormat: 'YYYY-MM-DD',
	resizeWidth: -1,
	assumeSameDayBeforeHour: 2,
}