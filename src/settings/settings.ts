
export interface BetterDailyNotesSettings {
	dateFormat: string;
	rootDir: string;
	templateFile: string;
	assumeSameDayBeforeHour: number;

	fileHandlingScenario: string;
	imageSubDir: string;
	otherFilesSubDir: string;
	keepImageOriginalName: boolean,
	imageFileDefaultName: string;
	maxImageSizeKB: number;
	maxImageSizeKBCache: number
	preserveExifData: boolean;
	resizeWidth: number;

	enableSummaryPage: boolean;
	summaryPageFile: string;
	summaryOfDaysCount: number;
}

export const DEFAULT_SETTINGS: BetterDailyNotesSettings = {
	dateFormat: 'YYYY-MM-DD',
	rootDir: 'daily-notes',
	templateFile: '',
	assumeSameDayBeforeHour: 2,

	fileHandlingScenario: 'daily notes only',
	imageSubDir: 'images',
	otherFilesSubDir: 'attachments',
	keepImageOriginalName: true,
	imageFileDefaultName: 'image',
	maxImageSizeKB: -1,
	maxImageSizeKBCache: -1,
	preserveExifData: true,
	resizeWidth: -1,

	enableSummaryPage: true,
	summaryPageFile: 'summary',
	summaryOfDaysCount: 7
}