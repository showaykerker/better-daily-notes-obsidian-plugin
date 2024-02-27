
export interface BetterDailyNotesSettings {
	rootDir: string;
	imageSubDir: string;
	maxImageSizeKB: number;
	preserveExifData: boolean;
	dateFormat: string;
	resizeWidth: number;
	assumeSameDayBeforeHour: number;
}

export const DEFAULT_SETTINGS: BetterDailyNotesSettings = {
	rootDir: 'daily-notes',
	imageSubDir: 'images',
	maxImageSizeKB: -1,
	preserveExifData: true,
	dateFormat: 'YYYY-MM-DD',
	resizeWidth: -1,
	assumeSameDayBeforeHour: 2,
}