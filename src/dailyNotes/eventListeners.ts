import { Editor, MarkdownView } from 'obsidian';
import { handleFiles } from './fileHandler';
import BetterDailyNotePlugin from '../main';


export function CreateDailyNotesEventListener(plugin: BetterDailyNotePlugin) {
    plugin.registerEvent(
        plugin.app.workspace.on(
            "editor-drop",
            async (evt: DragEvent, editor: Editor, markdownView: MarkdownView) => {
                handleFiles(evt.dataTransfer, evt, plugin.app, plugin.settings, editor, markdownView);
            }
        )
    );
    plugin.registerEvent(
        plugin.app.workspace.on(
            "editor-paste",
            async (evt: ClipboardEvent, editor: Editor, markdownView: MarkdownView) => {
                handleFiles(evt.clipboardData, evt, plugin.app, plugin.settings, editor, markdownView);
            }
        )
    );
}