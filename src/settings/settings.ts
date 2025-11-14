
export interface BetterDailyNotesSettings {
	noticeLevel: number;  // 0: can be ignored, 1: normal, 2: important
	noticeDuration: number;

	dateFormat: string;
	rootDir: string;
	templateFile: string;
	assumeSameDayBeforeHour: number;
	useStructuredFolders: boolean;

	fileHandlingScenario: string;
	imageSubDir: string;
	videoSubDir: string;
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

}

export const DEFAULT_SETTINGS: BetterDailyNotesSettings = {
	noticeLevel: 1,
	noticeDuration: 5000,

	dateFormat: 'YYYY-MM-DD',
	rootDir: 'Daily Notes',
	templateFile: '',
	assumeSameDayBeforeHour: 2,
	useStructuredFolders: true,

	fileHandlingScenario: 'daily notes only',
	imageSubDir: 'images',
	videoSubDir: 'videos',
	otherFilesSubDir: 'attachments',
	maxImageSizeKB: -1,
	maxImageSizeKBCache: -1,
	preserveExifData: true,
	resizeWidth: -1,

	enableSummaryPage: true,
	summaryPageFile: 'summary',
	summaryOfDaysCount: 7,

	compatibilityMode: true,
	compatibleDateFormats: ["AUTO"],

}