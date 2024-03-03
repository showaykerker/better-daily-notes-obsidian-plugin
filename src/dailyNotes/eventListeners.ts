import { TAbstractFile, TFile } from 'obsidian';
import BetterDailyNotePlugin from '../main';


export function createDailyNotesEventListener(plugin: BetterDailyNotePlugin) {
    plugin.app.workspace.onLayoutReady(() => {
        plugin.registerEvent(
            plugin.app.vault.on('create', (file: TAbstractFile) => {
                console.log('file created', file);
                const currentFile = plugin.app.workspace.getActiveFile();
                console.log(`currently activated file: `, currentFile);
                if (currentFile === null) {
                    return;
                }
                const currentFilePath = currentFile.path;
                console.log("metadataCache: ", plugin.app.metadataCache);
                console.log("created file: ", file.path);
                console.log("resolvedLinks: ", plugin.app.metadataCache.resolvedLinks[currentFilePath]);
                console.log("unresolvedLinks: ", plugin.app.metadataCache.unresolvedLinks[currentFilePath]);
            })
        )
    });
    plugin.registerEvent(
        plugin.app.workspace.on(
            "editor-change",
            async (editor, info) => {
                console.log('editor changed', editor, info);
            }
        )
    );

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
}