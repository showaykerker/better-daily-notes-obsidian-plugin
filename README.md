# Better Daily Notes Plugin

This plugin enhances the daily notes experience in Obsidian.

## Features
- **Structured Daily Notes:** Organizes daily notes in a structured folder format `[DailyNoteRootDirectory]/[Mon.]/[DateFormat].md`.
  - Customize the root directory and date format in the settings.
  - Month represented in short form (e.g., Jan, Feb, Mar).
- **Image Management:**
  - Images dropped or pasted to a daily note are saved to `[DailyNoteRootDirectory]/[Mon.]/[CustomImageFolder]` and renamed to `[DateFormat]-image#.[OriginalExt]`
    - Only notes with the right path and name will be considered to be a daily note.
    - Set custom image folder name in the settings.
  - Images are compressed using [browser-image-compression](https://github.com/Donaldcwl/browser-image-compression#readme). Adjust compression settings like max image size and EXIF data removal.
  - Images can be resized with markdown syntax to a specified width. Customize resizing width in the settings.
  - Only images added to a daily note will be modified.
- **Assume Same Day Before Hour:**
  - Considers it the same day before a specified hour after midnight.
- **Convenient Navigation:**
  - Adds a ribbon icon to quickly open today's daily note.
  - Provides commands to open today's, yesterday's, and tomorrow's daily notes.

## Installation
### Manual Installation
1. Navigate to your vault's plugin folder (`<vault>/.obsidian/plugins`).
2. Create a folder named `better-daily-notes` and move plugin files into it.
3. Download `main.js`, `styles.css`, `manifest.json` from the latest release and place them in the folder created in step 2.
4. Reload Obsidian and enable the plugin in `Settings -> Community Plugins`.

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

## Features to be Added
- [ ] Create daily note with template.
- [ ] Open daily note on startup.
- [ ] A modal to ask if image compress is required.
- [ ] Create daily note for arbitrary date.
- [ ] Support of month directory custom naming.
- [ ] Compress images and rename file for existing notes.
- [ ] Daily note one line summary by LLM.
- [ ] Generate tags by LLM.
- [ ] Image one line summary by LLM.
