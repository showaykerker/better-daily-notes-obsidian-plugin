import { App, Notice } from "obsidian";
import { BetterDailyNotesSettings } from "src/settings/settings";
import { checkValidDailyNotePath } from "src/utils";
import imageCompression from "browser-image-compression";

export function shouldHandleAccordingToConfig(
        settings: BetterDailyNotesSettings,
        filePath: string): boolean {
    if (settings.fileHandlingScenario === "disabled") { return false; }
    const date = checkValidDailyNotePath(filePath, settings.dateFormat);
    if (settings.fileHandlingScenario === "daily notes only" && !date) { return false; }
    return true;
}

export async function limitImageFileSize(
        file: File,
        size: number,
        preserveExifData: boolean): Promise<File> {
    if (size === -1) return Promise.resolve(file);
    const options = {
        maxSizeMB: size / 1024.0,
        useWebWorker: true,
        preserveExifData: preserveExifData,
    };
    new Notice(`Compressing image "${file.name}" to ${size}KB`);
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
}

export function countFilesWithSamePrefix(app: App, dirPath: string, prefix: string): number {
    const files = app.vault.getFiles();
    console.log(files.filter(file => file.path.startsWith(dirPath) &&
        file.path.contains(prefix) &&
        !file.path.endsWith(".md")));
    return files.filter(file => file.path.startsWith(dirPath) &&
        file.path.contains(prefix) &&
        !file.path.endsWith(".md")).length;
}