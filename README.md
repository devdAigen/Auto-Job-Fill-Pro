# ⚡ JobFill Pro — Chrome Extension

Auto-fill job applications on Workday, Greenhouse, Lever, and more. Stop filling the same form over and over.

---

## 📦 Installation (Load Unpacked)

1. Download and unzip this folder
2. Open Chrome and go to: `chrome://extensions/`
3. Enable **Developer Mode** (toggle in top-right corner)
4. Click **"Load unpacked"**
5. Select the `jobfill-pro` folder
6. The ⚡ extension icon will appear in your toolbar

---

## 🚀 Quick Start

1. Click the ⚡ JobFill Pro icon in your toolbar
2. Go to the **Profile** tab and fill in your details
3. Upload your resume (PDF or TXT)
4. Click **"Save Profile"**
5. Navigate to a job application page (e.g., Workday)
6. Click the extension → **Fill** tab → **"⚡ Fill This Page Now"**

---

## 🌐 Supported Platforms

| Platform | Support Level |
|---|---|
| Workday (`*.myworkdayjobs.com`) | ⭐⭐⭐ Full |
| Greenhouse | ⭐⭐⭐ Full |
| Lever | ⭐⭐⭐ Full |
| LinkedIn | ⭐⭐ Good |
| Naukri | ⭐⭐ Good |
| Jobvite | ⭐⭐ Good |
| SmartRecruiters | ⭐⭐ Good |
| iCIMS | ⭐⭐ Good |
| Taleo | ⭐ Basic |
| Generic forms | ⭐⭐ Good |

---

## ✨ Features

### Profile Tab
- Store all personal, professional, and education details
- Upload and store your resume (PDF/TXT up to 5MB)
- Work authorization settings

### Fill Tab
- See which platform and how many fields are detected
- "Fill This Page Now" button
- Toggle: auto-fill on page load
- Toggle: skip already-filled fields
- Clear all fields option

### Answers Tab
- Add custom Q&A pairs for textarea questions
- Example: "Why do you want to work here?" → your pre-written answer
- Matches by question keyword automatically

### Backup / Restore
- Export all stored extension data to JSON
- Import saved backups into `chrome.storage.local` and `chrome.storage.sync`
- Restore profiles, settings, credentials, and history from backup files

### History Tab
- Log of every page where you triggered auto-fill
- Shows site name, time, and number of fields filled

---

## 🧪 Testing on Workday

1. Go to: `https://synechron.wd1.myworkdayjobs.com/en-US/SynechronCareers/userHome`
2. Click "Apply" on any job
3. The badge will turn green ✓
4. Open the extension → Fill tab
5. Check "Fields Found" count
6. Click "Fill This Page Now"
7. Open browser console (F12) to see any errors

---

## ⚠️ Known Limitations

| Issue | Reason |
|---|---|
| CAPTCHAs | Cannot be automated |
| Login screens | Out of scope |
| Workday multi-page flows | Fill each page separately |
| File upload (resume) | Manual upload still needed on some ATS |
| Dropdown with fuzzy match | May not match if values differ |

---

## 🔧 Troubleshooting

**Extension shows "Cannot detect"**
→ Refresh the job application page, then click the extension again

**Fields not filling**
→ Try turning off "Skip already-filled fields"
→ The page may use non-standard inputs — add a Custom Answer for that field

**Workday fields not filling**  
→ Workday loads sections dynamically. Scroll down to load all sections, then fill again.

---

## 📁 File Structure

```
jobfill-pro/
├── manifest.json       # Extension config
├── background.js       # Service worker (badge, history)
├── content.js          # Form detection + auto-fill engine
├── popup.html          # Extension popup UI
├── popup.js            # Popup logic
├── storage.js          # Profile data helpers (reference)
├── styles/
│   └── popup.css       # Popup styles
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

---

## 🔒 Privacy

All data is stored **locally** in your browser using `chrome.storage.local`. Nothing is sent to any server. Your profile data never leaves your machine.
