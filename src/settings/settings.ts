
export interface BetterDailyNotesSettings {
	noticeLevel: number;  // 0: can be ignored, 1: normal, 2: important
	noticeDuration: number;

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

	enableSummaryPage: boolean;
	summaryPageFile: string;
	summaryOfDaysCount: number;

	compatibilityMode: boolean;
	compatibleDateFormats: string[];

	debugMode: boolean;
}

export const DEFAULT_SETTINGS: BetterDailyNotesSettings = {
	noticeLevel: 1,
	noticeDuration: 5000,

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

	enableSummaryPage: true,
	summaryPageFile: 'summary',
	summaryOfDaysCount: 7,

	compatibilityMode: true,
	compatibleDateFormats: ["AUTO"],

	debugMode: false
}