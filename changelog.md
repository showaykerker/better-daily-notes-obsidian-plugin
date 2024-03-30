# Changelog

## 0.3.8 pre-release

### Features
- Add live preview of date format

### Refactors
- Slightly refactor settings for readability
- Modify default folder name from "daily-notes" to "Daily Notes"
- Modify default attachments folder name from "other" to "attachments"

### Chore
- Rename from "Better Daily Notes Plugin" to "Better Daily Note"
- Rename header of pre-release in changelog

## 0.3.7

### Refactor
- Refactor notice levels to be better understood

### Fixes
- Fix template not possible to disable error


## 0.3.6
### Features
- compatibility: isolate main functionality from event listener to utils
- logging: add settings for notice level

### Refactor
- compatibility: rename rather than fallback when target exists
- compatibility: use template only when the original file is empty
- compatibility: rename configuration.
- settings: modify from header to .setHeading()
- settings: disable log level

### Fixes
- Compatibility mode templater failed issue
- Summary page skip some notes when updated before assumeSameDayHours.

## 0.3.3

### Features
- A setting to list data formats that should be considered as a daily note created by external plugin.
- Now template can be used in externally created daily notes!

### Refactor
- Make date format preview in settingsTab isolated.
- Add class to long paragraph in settingsTab.

### Fixes
- Compatibility issue with dayjs trying to parse a non Date string

## 0.3.2

### Features
- Add a setting option to disable compatible mode.

### Adjustment
- logging

## 0.3.1

### Features
- Add a setting option to enable debug info through `Notice`.

### Refactoring
- Refactored logic to determine whether a string is a daily note.
- Added dayjs custom format extension in utils.

### Fixes
- Fixed compatibility issue with Calendar caused by certain configurations.
- Corrected false assumption of same day when creating with calendar.

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
