import { App, Editor, MarkdownView, Notice } from "obsidian";
import { checkValidDailyNotePath } from "./utils";
import { createDirsIfNotExists } from "./fileSystem";
import imageCompression from 'browser-image-compression';

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const length = binaryString.length;
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

export function countFilesWithSamePrefix(app: App, dirPath: string, prefix: string): number {
    const files = app.vault.getFiles();
    let count = 0;
    for (let file of files.filter(file => file.path.startsWith(dirPath))) {
        if (file.path.startsWith(dirPath) &&
            file.path.contains(prefix) &&
            !file.path.endsWith(".md")) {count += 1;}
    }
    return count;
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

export async function createAndInsertWithFileReader(
        app: App,
        editor: Editor,
        reader: FileReader,
        filePath: string,
        returnTrueIfExists: boolean,
        resizeWidth: number,
    ): Promise<boolean> {
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

    new Notice(`Creating file "${filePath}"`);
    const fileArrayBuffer = base64ToArrayBuffer(base64);
    console.log("Save to:", filePath);
    await app.vault.createBinary(filePath, fileArrayBuffer);
    editor.replaceSelection(fileLink);
    return true;
}

export function shouldHandleAccordingToConfig(
        settings: any,
        file: File,
        markdownView: MarkdownView,
        ): boolean {
    if (!markdownView || !markdownView.file) { return false; }
    if (settings.imageHandlingScenario === "disabled") { return false; }

    const date = checkValidDailyNotePath(markdownView.file.path, settings.dateFormat);
    if (settings.imageHandlingScenario === "daily notes only" && !date) { return false; }
    return true;
}

export async function handleSingleFile(
    app: App,
    settings: any,
    file: File,
    editor: Editor,
    markdownView: MarkdownView,
    reader: FileReader = new FileReader(),
    ): Promise<boolean>{

    if (!shouldHandleAccordingToConfig(settings, file, markdownView)) {
        return false;
    }
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
        // count current images under imageDirPath that starts with filePrefix
        const countPrefix = countFilesWithSamePrefix(app, fileSaveSubDir, filePrefix);
        console.log(`Number of file with same prefix "${filePrefix}" under "${fileSaveSubDir}": ${countPrefix}`);
        fileSaveSubDir = `${viewParentPath}/${settings.imageSubDir}`;
        filePrefix = `${filePrefix}-image`;
        fileSuffix = countPrefix === 0 ? "" : `-${countPrefix}`;
    }
    else {
        const fileType = file.type.split("/")[1];
        fileSaveSubDir = `${viewParentPath}/${settings.otherFilesSubDir}`;
        filePrefix = `${filePrefix}-${file.name.split(".")[0]}`;
    }

    const fileName = `${filePrefix}${fileSuffix}.${file.type.split("/")[1]}`;
    const filePath = `${fileSaveSubDir}/${fileName}`;

    let handleSuccess = true;

    reader.onloadend = async (e) => {
        await createDirsIfNotExists(app, fileSaveSubDir);
        handleSuccess = await createAndInsertWithFileReader(
            app,
            editor,
            reader,
            filePath,
            true,
            settings.resizeWidth);
    };
    reader.readAsDataURL(file);
    return handleSuccess;
}
// Note: You'll need to adjust the parameters and return types based on how you plan to use these functions outside the class.