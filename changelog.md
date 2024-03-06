# Changelog

## 0.3.1

### Refactoring
- Refactor logic to tell whether a string is a daily note.
- Add dayjs extend custom format in utils

### Fixes
- Some configuration makes compatibility of Calendar broken issue.
- Falsely assume same day when creating with calendar.

## 0.3.0

### Features
- Add compatibility to [Calendar](https://github.com/liamcain/obsidian-calendar-plugin) plugin. Now you can easily create a daily note by clicking a date on the calendar view! The plugin will wait for 1 second (for the calendar to done opening the leaf), then rename the file.

### Refactoring
- Modularized commands and event listeners in `main.ts`.
- Created `summaryPage/` directory with `commands.ts` and `eventListeners.ts`.
- Created `dailyNotes/` directory with `commands.ts`, `eventListeners.ts`, `fileHandler.ts`, and `fileSystem.ts` have been relocated here.

### Fixes
- Moved on create callback registration within `workspace.onLayoutReady()` to avoid premature invocation during application initialization.
- Fixed a bug where image naming would be incorrect after deleting an image between the minimum and maximum numbers.
