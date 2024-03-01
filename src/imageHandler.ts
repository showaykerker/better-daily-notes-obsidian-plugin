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

export function countImageFiles(app: App, dirPath: string, prefix: string): number {
    let files = app.vault.getFiles();
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
        maxIteration: 10,
        preserveExifData: preserveExifData,
    };
    new Notice(`Compressing image "${file.name}" to ${size}KB`);
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
}

export async function createAndInsertImageFromFileReader(
        app: App,
        editor: Editor,
        reader: FileReader,
        imagePath: string,
        returnTrueIfExists: boolean,
        resizeWidth: number,
    ): Promise<boolean> {
    const base64 = reader.result?.toString().split(",")[1];

    if (!base64) {
        new Notice(`Failed to create file "${imagePath}", base64 is empty.`);
        return false;
    }

    let imageLinkResizeString = resizeWidth !== -1 ? `|${resizeWidth}` : "";
    let imageLink = `![[${imagePath}${imageLinkResizeString}]]`;

    if (app.vault.getAbstractFileByPath(imagePath) && returnTrueIfExists) {
        new Notice(`File "${imagePath}" already exists. Inserting link to the existed one.`);
        editor.replaceSelection(imageLink);
        return true;
    }

    new Notice(`Creating file "${imagePath}"`);
    let imageArrayBuffer = base64ToArrayBuffer(base64);
    console.log("Save to:", imagePath);
    await app.vault.createBinary(imagePath, imageArrayBuffer);
    editor.replaceSelection(imageLink);
    return true;
}

export function shouldHandleAccordingToConfig(
        settings: any,
        file: File,
        markdownView: MarkdownView,
        ): boolean {
    if (!file.type.startsWith("image")) { return false; }
    if (!markdownView || !markdownView.file) { return false; }
    if (settings.imageHandlingScenario === "disabled") { return false; }

    const date = checkValidDailyNotePath(markdownView.file.path, settings.dateFormat);
    if (settings.imageHandlingScenario === "daily notes only" && !date) { return false; }
    return true;
}

export async function handleSingleImage(
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
    const imageDirPath = `${viewParentPath}${settings.imageSubDir}`;
    const viewFileName = markdownView.file.basename;
    const imageFilePrefix = `${viewFileName}-image`;

    file = await limitImageFileSize(
        file,
        settings.maxImageSizeKB,
        settings.preserveExifData);

    let handleSuccess = true;

    reader.onloadend = async (e) => {
        // count current images under imageDirPath that starts with imageFilePrefix
        const imageCount = countImageFiles(app, imageDirPath, imageFilePrefix);
        console.log(`Number of images with same prefix "${imageFilePrefix}" under "${imageDirPath}": ${imageCount}`);
        const imageFileName = `${imageFilePrefix}${imageCount}.${file.type.split("/")[1]}`;
        const imagePath = `${imageDirPath}/${imageFileName}`;
        await createDirsIfNotExists(app, imageDirPath);
        handleSuccess = await createAndInsertImageFromFileReader(
            app,
            editor,
            reader,
            imagePath,
            true,
            settings.resizeWidth);
    };
    reader.readAsDataURL(file);
    return handleSuccess;
}
// Note: You'll need to adjust the parameters and return types based on how you plan to use these functions outside the class.