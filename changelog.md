# Changelog

## 0.3.0

### Refactoring
- Commands and event listeners have been modularized in `main.ts`.
  - A new `summaryPage/` directory has been created, containing `commands.ts` and `eventListeners.ts`.
  - A new `dailyNotes/` directory has been created, containing `commands.ts` and `eventListeners.ts`, `fileHandler.ts` and `fileSystem.ts` have been relocated here.

### Fixes
- Move on create callback registration within workspace.onLayoutReady() to avoid premature invocation during application initialization.
