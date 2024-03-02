# Better Daily Notes Obsidian Plugin

[English Version](README.md)

透過 **Better Daily Notes** Plugin 改善你的每日筆記體驗。

無縫整合，讓你輕鬆組織和管理你的每日筆記與檔案。

<img src='imgs/better-daily-note-demo.gif' width='560'/>
<img src='imgs/2024-02-20-image2.png' width='140'/>

## 功能
- **結構化的每日筆記：** 以結構化的資料夾格式 `[DailyNoteRootDirectory]/[Mon.]/[DateFormat].md` 歸檔每日筆記。
  - 在設定中自定日期格式（`Date Format`）和根目錄（`Root Directory`）。
  - 月份以簡寫表示（如，Jan、Feb、Mar）。
- **檔案管理：** 處理拖曳或貼上到你的筆記中的檔案。
  - ***[0.2.6 中的更新]*** 支援的檔案類型為 `images`, `json`, `pdf`, `zip`, `.dill`, `.dmg`, `.kml`, `.pickle`.
  - ***[0.2.1 中的新增]*** 處理檔案的時機選項
    - `停用所有處理 Disable All Handling：` 不處理任何檔案。如果你有其他Plugin 如自動圖片上傳等，建議選用此項。
    - `僅在每日筆記中 Only in Daily Notes：` 只處理被拖曳或是貼上到有效每日筆記名稱中的檔案。
    - `在所有檔案中處理 Handle in All Files：` 在包含每日筆記在內的任何筆記上都處理被拖曳或是貼上。
  - 拖曳或貼上的圖片會被存在目前筆記所在文件夾下的`「影像資料夾 Image Subdirectory」`，並且重新命名為 `[筆記檔名]-image#`。
  - 圖片以外被拖曳或貼上的檔案會被存在目前筆記所在文件夾下的`「其他檔案資料夾 Other File Subdirectory」`，並重新命名為 `[筆記檔名]-[原始檔名]`。如果有同名的檔案在同樣的資料夾，則只在筆記中插入該檔案的連結，不新增檔案到Vault裡。
  - 在設置中可以自定圖片和其他檔案的文件夾名稱。
  - 使用 [browser-image-compression](https://github.com/Donaldcwl/browser-image-compression#readme) 壓縮圖片。調整壓縮設定，如最大圖片大小和是否刪除照片的 EXIF。
    - ***[0.2.5 中的新增]*** 使用 `Toggle image compression` 指令 取消/恢復 自動的圖片壓縮。
  - 可以使用 markdown 語法將圖片和 PDF 調整為指定寬度。
  - ~~***[0.2.1 後移除]*** 只有新增到每日筆記的圖片將被修改。~~
- **在某個指定時間之前認定為同一天 Assume Same Day Before Hour：**
  - 可以設定在凌晨的某個時間之前會認定仍然是前一天。
- **從模板建立每日筆記：**
  - ***[0.2.2 中的新增]*** 手動指定要在建立每日筆記時使用的模板。
- **好用的指令：**
  - 增加一個指令按鈕用來快速打開今天的筆記。
  - 提供命令打開今天、昨天和明天的每日筆記。

## 安裝指南

由於這個Plugin目前處於測試版階段，安裝過程需要另外安裝一個名為 [BRAT](obsidian://show-plugin?id=obsidian42-brat) 的Plugin。

你可以在這裡找到 BRAT 的 GitHub [連結](https://github.com/TfTHacker/obsidian42-brat)。

### 步驟

1. 通過以下任一種方式安裝 BRAT：
   - 點擊[此連結](obsidian://show-plugin?id=obsidian42-brat)。
   - 在 Obsidian 中的「社群插件」選項中搜尋「BRAT」，然後安裝並啟用它。
   ![BRAT 安裝](imgs/how-to-install-0.png)
   ![BRAT 安裝](imgs/how-to-install-1.png)
   ![BRAT 安裝](imgs/how-to-install-2.png)
   ![BRAT 安裝](imgs/how-to-install-3.png)

2. 進入 BRAT 的設置頁面，找到「Beta Plugin List」的區塊，然後點擊「Add Beta Plugin」按鈕。
   ![BRAT 設置](imgs/how-to-install-4.png)

3. 輸入這個repository的連結：`https://github.com/showaykerker/better-daily-notes-obsidian-plugin`，然後點擊「Add Plugin」。
   ![插件配置](imgs/how-to-install-5.png)

4. 現在你應該能在設置選單中找到「Better Daily Notes Plugin」的設定頁面了！
