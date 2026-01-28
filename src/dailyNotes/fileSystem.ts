import { App, normalizePath } from 'obsidian';
import { getMonthDirPath } from '../utils';

export async function createDirsIfNotExists(app: App, dir: string): Promise<void> {
    let dirPath = "";
    for (let dirName of dir.split("/")) {
        dirPath = `${dirPath}${dirName}`;
        if (dirPath === "") { continue; }
        dirPath = normalizePath(dirPath);
        const hasDirPath = app.vault.getAbstractFileByPath(dirPath);
        if (!hasDirPath) {
            await app.vault.createFolder(dirPath);
        }
        dirPath = `${dirPath}/`;
    }
}

export async function createImageDirIfNotExists(
        app: App,
        rootDir: string,
        assumeSameDayBeforeHour: number,
        imageSubDirName: string,
        useStructuredFolders: boolean,
        date: Date = new Date()) {
    let imgDirPath: string;
    if (useStructuredFolders) {
        imgDirPath = `${getMonthDirPath(rootDir, assumeSameDayBeforeHour, date)}/${imageSubDirName}`;
    } else {
        imgDirPath = `${rootDir}/${imageSubDirName}`;
    }
    const imgDirPathNormalized = normalizePath(imgDirPath);
    createDirsIfNotExists(app, imgDirPathNormalized);
}

export async function createDirIfNotExists(
        app:App,
        rootDir: string,
        assumeSameDayBeforeHour: number,
        useStructuredFolders: boolean,
        date: Date = new Date()) {
    let dirPath: string;
    if (useStructuredFolders) {
        dirPath = getMonthDirPath(rootDir, assumeSameDayBeforeHour, date, true);
    } else {
        dirPath = rootDir;
    }
    const dirPathNormalized = normalizePath(dirPath);
    await createDirsIfNotExists(app, dirPathNormalized);
}


// Adjust the function parameters and return types as needed.