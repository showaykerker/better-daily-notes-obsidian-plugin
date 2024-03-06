# Changelog

## 0.3.0

### Features
- Add compatibility to [Calendar](https://github.com/liamcain/obsidian-calendar-plugin) plugin.  Now you can easily create a daily note by clicking a date on the calendar view! The plugin will wait for 1 second (for th)

### Refactoring
- Commands and event listeners have been modularized in `main.ts`.
  - A new `summaryPage/` directory has been created, containing `commands.ts` and `eventListeners.ts`.
  - A new `dailyNotes/` directory has been created, containing `commands.ts` and `eventListeners.ts`, `fileHandler.ts` and `fileSystem.ts` have been relocated here.

### Fixes
- Move on create callback registration within workspace.onLayoutReady() to avoid premature invocation during application initialization.
- Fixed a bug where image naming would be incorrect after deleting an image between the minimum and maximum numbers.
