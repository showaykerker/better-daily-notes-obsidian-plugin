# Better Daily Notes Plugin

Transform your daily note-taking experience with the **Better Daily Notes** Plugin.

Seamlessly integrated, this plugin empowers you to organize and manage your daily notes effortlessly.

<img src='imgs/2024-02-20-image2.png' width='140'/> <img src='imgs/better-daily-note-demo.gif' width='560'/>


## Features
- **Structured Daily Notes:** Organizes daily notes in a structured folder format `[DailyNoteRootDirectory]/[Mon.]/[DateFormat].md`.
  - Customize the root directory and date format in the settings.
  - Month represented in short form (e.g., Jan, Feb, Mar).
- **Files Management:** Handle image, pdf, zip files dropped or pasted to your notes.
  - ***[New in 0.2.1]*** Configuration of files handling scenario.
    - `Disable All Handling`: No file handling. If you have another plugin such as automatic image upload, you should disable the handling from this plugin.
    - `Only in Daily Notes`: Only files added to a valid daily-note name will be handled.
    - `Handle in All Files`: Handle all files added to your notes.
  - Images dropped or pasted are saved to a *"image subdirectory"* under the same parent of current note, and renamed to `[CurrentNoteBasename]-image#.[OriginalExt]`
  - PDF and ZIP files dropped or pasted are saved to *"other files subdirectory"* under the same parent of current note, and renamed to `[CurrentNoteBasename]-[OriginFileBaseName].[OriginalExt]`. If there exists a file with same name, this plugin simply add a link pointing to that file, no file will be added.
  - Customize image and other files' folder name in the settings.
  - Images are compressed using [browser-image-compression](https://github.com/Donaldcwl/browser-image-compression#readme). Adjust compression settings like max image size and EXIF data removal.
  - Images and pdfs can be resized with markdown syntax to a specified width. Customize resizing width in the settings.
  - ~~***[Removed in 0.2.1]*** Only images added to a daily note will be modified.~~
- **Assume Same Day Before Hour:**
  - Considers it the same day before a specified hour after midnight.
- **Convenient Navigation:**
  - Adds a ribbon icon to quickly open today's daily note.
  - Provides commands to open today's, yesterday's, and tomorrow's daily notes.

## Installation
For manual installation,
1. navigate to your vault's plugin folder (`<vault>/.obsidian/plugins`)
2. Download `better-daily-notes-obsidian-plugin-version.zip` from the release page and extract them in the `plugins` folder.
3. Reload Obsidian and enable the plugin in `Settings` -> `Community Plugins`.

## Development
This plugin is built with TypeScript. Here's how to contribute:
1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Make changes in `main.ts` or create new `.ts` files.
4. Compile changes with `$ npm run dev`.
5. Reload Obsidian to load the updated plugin.

## Known Bugs
- [x] ~~Assume same day before hour logic error.~~
  > ~~Will need to set actual value + 1 for now.~~
- [x] ~~Images will still be resized with markdown syntax in notes that's not wishes to handle images.~~
- [x] Images are not compress to exact wished size.

## Features to be Added
- [ ] Support of other file types. e.g. `.dill`.
- [ ] Support of installing through [BRAT](https://github.com/TfTHacker/obsidian42-brat).
- [ ] Support of customizing drag and paste behavior.
- [ ] Create daily note with template.
- [ ] Open daily note on startup.
- [ ] A modal to ask if image compression is required.
- [ ] Commands to toggle image compression.
- [ ] Create daily note for arbitrary date.
- [ ] Support of month directory custom naming.
- [ ] Compress images and rename file for existing notes.
- [ ] Daily note one line summary by LLM.
- [ ] Generate tags by LLM.
- [ ] Image one line summary by LLM.
- [x] ~~Support of other file types. e.g. `.pdf`, `.zip`.~~ (Added v0.2.1)