import { CachedMetadata, normalizePath, Notice, TAbstractFile, TFile } from 'obsidian';
import { Mutex } from 'async-mutex';
import { createDirsIfNotExists } from './fileSystem';
import BetterDailyNotePlugin from 'src/main';
import { countFilesWithSamePrefix, limitImageFileSize, shouldHandleAccordingToConfig } from './utils';
import assert from 'assert';

interface CreateDetails {
    activatedFile: TFile;
    createdFile: TFile;
    fileType: string;
    timestamp: number;
}

interface ImageCounter {
    added: number;
    used: number;
    checked: boolean; // check for previously added
}

async function handleIfTFileIsImage(file: TFile, plugin: BetterDailyNotePlugin): Promise<[TFile, boolean]> {
    if (!(["png", "jpg", "jpeg", "gif", "heic"].includes(file.extension.toLowerCase()))) return [file, false];
    if (plugin.settings.maxImageSizeKB === -1) return [file, false];
    const fileBlob = await plugin.app.vault.readBinary(file);
    const compressedFileBlob = await limitImageFileSize(
        new File([fileBlob], file.name, { type: 'image/' + file.extension }),
        plugin.settings.maxImageSizeKB,
        plugin.settings.preserveExifData);
    await plugin.app.vault.modifyBinary(file, new Uint8Array(await compressedFileBlob.arrayBuffer()));
    return [file, true];
}

export class DailyNoteEventListener {
    plugin: BetterDailyNotePlugin;
    createQueue: CreateDetails[] = [];
    createQueueMutex = new Mutex();
    acquired = 0;
    imageCounter: {[notePath: string]: ImageCounter} = {};

    constructor(plugin: BetterDailyNotePlugin) {
        this.plugin = plugin;
        this.createDailyNotesEventListener();
    }

    createDailyNotesEventListener() {
        this.plugin.app.workspace.onLayoutReady(() => {
            this.plugin.registerEvent(
                this.plugin.app.vault.on('create', async (file: TFile) => {
                    if (!(file instanceof TFile)) return;
                    const activatedFile = this.plugin.app.workspace.getActiveFile() ?? null;
                    if (activatedFile === null) return;
                    if (!shouldHandleAccordingToConfig(this.plugin.settings, activatedFile.path)) return;
                    let isImage = false;
                    [file, isImage] = await handleIfTFileIsImage(file, this.plugin);
                    if (isImage) {
                        if (this.imageCounter[activatedFile.path] === undefined) {
                            this.imageCounter[activatedFile.path] = {
                                added: 0, used: 0, checked: false
                            };
                        }
                        this.imageCounter[activatedFile.path].added += 1;
                    }
                    const createDetails = {
                        activatedFile: activatedFile,
                        createdFile: file,
                        fileType: isImage ? "image" : file.extension.toLowerCase(),
                        timestamp: Date.now()
                    }
                    this.acquired += 1;
                    const release = await this.createQueueMutex.acquire();
                    console.log("acquired", this.acquired);
                    this.createQueue.push(createDetails);
                    console.log("released", this.acquired);
                    release();
                    this.acquired -= 1;
                })
            )
        });
        this.plugin.registerEvent(
            this.plugin.app.metadataCache.on('changed', async (file: TFile, data: string, cache: CachedMetadata) => {
                console.log("metadata changed file name: ", file.name);
                const notePath = file.path;
                let renameFromTo: {[file: string]: [[string, string]]} = {};
                const release = await this.createQueueMutex.acquire();
                this.createQueue = this.createQueue.filter(async (createDetails, index) => {
                    if (createDetails.timestamp < Date.now() - 1000 * 60 * 5) {
                        return false; // Remove outdated createDetails
                    }
                    if (notePath === createDetails.activatedFile.path) {
                        const embed = cache.embeds?.find(e => e.link === createDetails.createdFile.name);
                        if (embed === undefined) {
                            return true; // Keep createDetails not meeting any criteria above
                        }
                        let targetDirectory = file.parent?.path ?? "/";
                        let newName = ""
                        if (createDetails.fileType === "image") {
                            targetDirectory = `${targetDirectory}/${this.plugin.settings.imageSubDir}`;
                            if (this.plugin.settings.keepImageOriginalName) {
                                newName = `${file.basename}-${createDetails.createdFile.name}`;
                            }
                            else {
                                const prefix = `${file.basename}-${this.plugin.settings.imageFileDefaultName}-`;
                                assert(this.imageCounter[notePath] !== undefined);
                                if (this.imageCounter[notePath].checked === false) {
                                    this.imageCounter[notePath].checked = true;
                                    this.imageCounter[notePath].used = countFilesWithSamePrefix(
                                        this.plugin.app, targetDirectory, prefix);;
                                }
                                this.imageCounter[notePath].used += 1;
                                console.log("checked", this.imageCounter[notePath].used);
                                const imageWithSamePrefix = this.imageCounter[notePath].used;
                                let imageNumber = (imageWithSamePrefix + 1).toString().padStart(2, "0");
                                newName = prefix + imageNumber + "." + createDetails.createdFile.extension.toLowerCase();
                            }
                        }
                        else {
                            targetDirectory = `${targetDirectory}/${this.plugin.settings.otherFilesSubDir}`;
                            newName = `${file.basename}-${createDetails.createdFile.name}`;
                        }
                        await createDirsIfNotExists(this.plugin.app, normalizePath(targetDirectory));
                        const newPath = `${targetDirectory}/${newName}`;
                        new Notice(`renaming ${createDetails.createdFile.path} to ${newPath}`);
                        console.log(`before rename to ${newPath}`);
                        await this.plugin.app.vault.rename(createDetails.createdFile, newPath);
                        console.log(`after rename to ${newPath}`);
                        this.acquired -= 1;
                        const linkText = embed.original;
                        const shouldResize = ["image", "pdf"].includes(createDetails.fileType) &&
                            this.plugin.settings.resizeWidth !== -1;
                        const resizeString = shouldResize ? `|${this.plugin.settings.resizeWidth}` : "";
                        const newLinkText = `![[${newPath}${resizeString}]]`;)
                        // const content = await this.plugin.app.vault.read(createDetails.activatedFile);
                        // const newContent = content.replace(linkText, newLinkText);
                        // await this.plugin.app.vault.modify(createDetails.activatedFile, newContent);
                        return false; // Remove processed createDetails
                    }
                    return true; // Keep createDetails not meeting any criteria above
                });
                for (const [file, [from, to]] of Object.entries(renameFromTo ?? {})) {
                    let content = await this.plugin.app.vault.read(file);
                    const newContent = content.replace(from, to);
                    await this.plugin.app.vault.modify(file, newContent);
                }
                

                console.log("released", this.acquired);
                release();
                this.acquired -= 1;
            })
        );
    }
}

// export function createDailyNotesEventListener(plugin: BetterDailyNotePlugin) {
//     plugin.app.workspace.onLayoutReady(() => {
//         plugin.registerEvent(
//             plugin.app.vault.on('create', (file: TAbstractFile) => {
//                 const currentFile = plugin.app.workspace.getActiveFile();
//                 if (currentFile === null) {
//                     return;
//                 }
//                 const currentFilePath = currentFile.path;
//             })
//         )
//     });
//     plugin.registerEvent(
//         plugin.app.workspace.on(
//             "editor-change",
//             async (editor, info) => {
//                 console.log('editor changed', editor, info);
//             }
//         )
//     );

    // plugin.registerEvent(
    //     plugin.app.workspace.on(
    //         "editor-drop",
    //         async (evt: DragEvent, editor: Editor, markdownView: MarkdownView) => {
    //             handleFiles(evt.dataTransfer, evt, plugin.app, plugin.settings, editor, markdownView);
    //         }
    //     )
    // );
    // plugin.registerEvent(
    //     plugin.app.workspace.on(
    //         "editor-paste",
    //         async (evt: ClipboardEvent, editor: Editor, markdownView: MarkdownView) => {
    //             handleFiles(evt.clipboardData, evt, plugin.app, plugin.settings, editor, markdownView);
    //         }
    //     )
    // );
// }