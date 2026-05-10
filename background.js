// background.js — JobFill Pro Service Worker

const JOB_SITE_PATTERNS = [
  /myworkdayjobs\.com/,
  /greenhouse\.io/,
  /lever\.co/,
  /jobvite\.com/,
  /smartrecruiters\.com/,
  /icims\.com/,
  /taleo\.net/,
  /successfactors\.com/,
  /ashbyhq\.com/,
  /breezy\.hr/,
  /workable\.com/,
  /bamboohr\.com/
];

function isJobSite(url) {
  return JOB_SITE_PATTERNS.some(p => p.test(url));
}

function getPlatformName(url) {
  if (/myworkdayjobs\.com/.test(url)) return "Workday";
  if (/greenhouse\.io/.test(url)) return "Greenhouse";
  if (/lever\.co/.test(url)) return "Lever";
  if (/jobvite\.com/.test(url)) return "Jobvite";
  if (/smartrecruiters\.com/.test(url)) return "SmartRecruiters";
  return "Job Site";
}

// Badge management
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    if (isJobSite(tab.url)) {
      chrome.action.setBadgeText({ text: "✓", tabId });
      chrome.action.setBadgeBackgroundColor({ color: "#10b981", tabId });
    } else {
      chrome.action.setBadgeText({ text: "", tabId });
    }
  }
});

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "pageLoaded") {
    if (isJobSite(message.url)) {
      chrome.action.setBadgeText({ text: "✓", tabId: sender.tab?.id });
      chrome.action.setBadgeBackgroundColor({ color: "#10b981", tabId: sender.tab?.id });
    }
  }

  if (message.action === "saveHistory") {
    chrome.storage.local.get(["history"], (result) => {
      const history = result.history || [];
      history.unshift({
        url: message.url,
        siteName: getPlatformName(message.url),
        timestamp: Date.now(),
        fieldCount: message.fieldCount || 0,
        title: message.title || ""
      });
      const trimmed = history.slice(0, 100);
      chrome.storage.local.set({ history: trimmed });
    });
  }

  if (message.action === "getHistory") {
    chrome.storage.local.get(["history"], (result) => {
      sendResponse({ history: result.history || [] });
    });
    return true;
  }
});
