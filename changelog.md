# Changelog

## 0.3.0

### Refactors
- Isolate by commands, `main.ts` adds commands and eventListeners from functions.
  - Add a `summaryPage/` folder with `commands.ts` and `eventListeners.ts`.
  - Add a `dailyNotes/` folder with `commands.ts` and `eventListeners.ts`, also move `fileHandler.ts` and `fileSystem.ts` into it.