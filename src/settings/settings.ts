
export interface BetterDailyNotesSettings {
	noticeLevel: number;  // 0: none, 1: error, 2: warning, 3: info
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
	compatibleWaitTime: number;

	debugMode: boolean;
}

export const DEFAULT_SETTINGS: BetterDailyNotesSettings = {
	noticeLevel: 3,
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
	compatibleWaitTime: 2000,

	debugMode: false
}