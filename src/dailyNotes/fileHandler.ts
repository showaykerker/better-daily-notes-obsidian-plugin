import imageCompression from 'browser-image-compression';
import { App, Editor, MarkdownView, normalizePath, Notice } from "obsidian";
import { createDirsIfNotExists } from "./fileSystem";
import { checkValidDailyNotePath } from "../utils";
import { BetterDailyNotesSettings } from "../settings/settings";

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const length = binaryString.length;
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

export function getNextNumberedImageIndex(app: App, dirPath: string, prefix: string): number {
    const files = app.vault.getFiles();
    let nextIndex = 0;
    const filteredFiles = files.filter(file =>
        file.path.startsWith(dirPath) &&
        file.path.match(/.*-image(-\d+)?\..*/) &&
        !file.path.endsWith(".md") &&
        file.path.includes(prefix)
    )
    filteredFiles.forEach(file => {
        const index = (parseInt(file.path.match(/.*-image(-(\d+))?\..*/)![2]) || 0) + 1;
        nextIndex = index > nextIndex ? index : nextIndex;
    });
    return nextIndex;
}

export async function limitImageFileSize(file: File, size: number, preserveExifData: boolean): Promise<File> {
    if (size === -1) {
        return Promise.resolve(file);
    }
    const options = {
        maxSizeMB: size / 1024.0,
        useWebWorker: true,
        preserveExifData: preserveExifData,
    };
    new Notice(`Compressing image "${file.name}" to ${size}KB`);
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
}

export function shouldHandleAccordingToConfig(
        settings: BetterDailyNotesSettings,
        markdownView: MarkdownView): boolean {
    if (!markdownView || !markdownView.file) { return false; }
    if (settings.fileHandlingScenario === "disabled") { return false; }

    const date = checkValidDailyNotePath(markdownView.file.path, settings.dateFormat);
    if (settings.fileHandlingScenario === "daily notes only" && !date) { return false; }
    return true;
}

function isFileSupported(file: File): boolean {

    const acceptableFileTypes = [
        "application/zip", "application/pdf", "application/json",
        "application/vnd.google-earth.kml+xml"];
    const acceptableFileExtensionsWithEmptyFileType = [ "dill", "dmg", "pkl" ];
    const fileExtension = file.name.split(".").slice(-1)[0];

    return file.type.startsWith("image") ||
        acceptableFileTypes.includes(file.type) ||
        (acceptableFileExtensionsWithEmptyFileType.includes(fileExtension) && file.type === "");
}

export async function handleFiles(
    dataTransfer: DataTransfer | null,
    evt: DragEvent | ClipboardEvent,
    app: App,
    settings: BetterDailyNotesSettings,
    editor: Editor,
    markdownView: MarkdownView): Promise<void> {

    if (!dataTransfer || !dataTransfer.files) {
        return;
    }
    if (!shouldHandleAccordingToConfig(settings, markdownView)) {
        return;
    }

    // only handle image, zip, and pdf files
    const files = dataTransfer.files;

    if (files.length === 0) { return; }  // pasted text

    // Check if all file types are supported
    for (let i = 0; i < files.length; i++) {
        if (!isFileSupported(files[i])) {
            new Notice(
                `Only image, pdf, and zip files are supported. ` +
                `Get file "${files[i]?.name}" with type "${files[i].type}" instead.`,
                7500);
            return;
        }
    }
    evt.preventDefault();
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await handleSingleFile(
            app, settings, file, editor, markdownView);
    }
}

export async function handleSingleFile(
    app: App,
    settings: any,
    file: File,
    editor: Editor,
    markdownView: MarkdownView,
    reader: FileReader = new FileReader()): Promise<boolean>{

    if (!markdownView || !markdownView.file) { return false; }

    let viewParentPath = markdownView.file.parent?.path ?? "";
    viewParentPath = viewParentPath === "/" ? "" : viewParentPath;
    let fileSaveSubDir = "";
    const viewFileName = markdownView.file.basename;
    let filePrefix = `${viewFileName}`;
    let fileSuffix = "";

    if (file.type.startsWith("image")) {
        file = await limitImageFileSize(
            file,
            settings.maxImageSizeKB,
            settings.preserveExifData);
        const getImageNumber = getNextNumberedImageIndex(app, fileSaveSubDir, filePrefix);
        fileSaveSubDir = `${viewParentPath}/${settings.imageSubDir}`;
        filePrefix = `${filePrefix}-image`;
        fileSuffix = getImageNumber === 0 ? "" : `-${getImageNumber}`;
    }
    else {
        fileSaveSubDir = `${viewParentPath}/${settings.otherFilesSubDir}`;
        filePrefix = `${filePrefix}-${file.name.split(".")[0]}`;
    }
    fileSaveSubDir = normalizePath(fileSaveSubDir);
    const ext = file.name.split(".").slice(-1)[0];
    const fileName = `${filePrefix}${fileSuffix}.${ext}`;
    const filePath = normalizePath(`${fileSaveSubDir}/${fileName}`);

    let handleSuccess = true;
    await createDirsIfNotExists(app, fileSaveSubDir);

    reader.onloadend = async (e) => {
        handleSuccess = await createAndInsertWithFileReader(
            app,
            editor,
            reader,
            filePath,
            file.name,
            true,
            settings.resizeWidth);
    };
    reader.readAsDataURL(file);
    return handleSuccess;
}

export async function createAndInsertWithFileReader(
        app: App,
        editor: Editor,
        reader: FileReader,
        filePath: string,
        fileName: string, // only for logging
        returnTrueIfExists: boolean,
        resizeWidth: number): Promise<boolean> {
    const base64 = reader.result?.toString().split(",")[1];

    if (!base64) {
        new Notice(`Failed to create file "${filePath}", base64 is empty.`);
        return false;
    }

    const fileLinkResizeString = resizeWidth !== -1 ? `|${resizeWidth}` : "";
    const fileLink = `![[${filePath}${fileLinkResizeString}]]`;

    filePath = filePath[0] === '/' ? filePath.substring(1) : filePath;
    if (app.vault.getAbstractFileByPath(filePath) && returnTrueIfExists) {
        new Notice(`File "${filePath}" already exists. Inserting link to the existed one.`);
        editor.replaceSelection(fileLink);
        return true;
    }

    const fileArrayBuffer = base64ToArrayBuffer(base64);
    try {
        await app.vault.createBinary(filePath, fileArrayBuffer);
        editor.replaceSelection(fileLink);
        return true;
    }
    catch (e) {
        new Notice(`Failed to create file "${fileName}".`, 0);
        console.error(e);
        editor.replaceSelection(fileLink);
        return false;
    }
}