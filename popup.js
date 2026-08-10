// popup.js — JobFill Pro v3

// ─── Tab System ───────────────────────────────────────────────────────────────
const tabBtns = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");
const saveBar = document.getElementById("saveBar");

tabBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;
    tabBtns.forEach(b => b.classList.remove("active"));
    tabContents.forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`tab-${tab}`).classList.add("active");
    saveBar.style.display = tab === "profile" ? "flex" : "none";
    if (tab === "history") loadHistory();
    if (tab === "settings") loadCredentials();
    if (tab === "answers") {
      // Re-render answers from storage to ensure fresh data
      chrome.storage.local.get(["profile"], r => {
        const p = r.profile || {};
        renderQAList(p.customAnswers || []);
        renderCFList(p.customFields || []);
        renderYNList(p.yesNoAnswers || []);
      });
    }
    if (tab === "recorder") refreshRecorderStatus();
  });
});

saveBar.style.display = "none";

// ─── Utilities ─────────────────────────────────────────────────────────────
function showResult(msg, type = "success") {
  const b = document.getElementById("resultBanner");
  b.textContent = type === "success" ? `✓ ${msg}` : `✗ ${msg}`;
  b.className = `result-banner show ${type}`;
  setTimeout(() => b.classList.remove("show"), 4000);
}

function setSaveStatus(msg, cls = "") {
  const el = document.getElementById("saveStatus");
  el.textContent = msg;
  el.className = `save-status ${cls}`;
}

function escHtml(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el && val !== undefined && val !== null && val !== "") el.value = val;
}

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

// ─── API Key Management ───────────────────────────────────────────────────────
let cachedApiKey = "";

async function getApiKey() {
  return new Promise(resolve => chrome.storage.local.get(["anthropicApiKey"], r => resolve(r.anthropicApiKey || "")));
}
async function saveApiKey(key) {
  return new Promise(resolve => chrome.storage.local.set({ anthropicApiKey: key }, resolve));
}

function setApiKeyStatus(msg, type) {
  const el = document.getElementById("apiKeyStatus");
  el.textContent = msg;
  el.className = `api-key-status ${type}`;
  el.style.display = "flex";
  if (type !== "loading") setTimeout(() => { el.style.display = "none"; }, 4000);
}

function setBackupStatus(msg, type = "success") {
  const el = document.getElementById("backupStatus");
  if (!el) return;
  el.textContent = msg;
  el.style.color = type === "error" ? "var(--red)" : "var(--green)";
  el.style.display = "block";
  setTimeout(() => { el.style.display = "none"; }, 4000);
}

chrome.storage.local.get(["anthropicApiKey"], r => {
  if (r.anthropicApiKey) { cachedApiKey = r.anthropicApiKey; document.getElementById("apiKeyInput").value = r.anthropicApiKey; }
});

document.getElementById("toggleApiKey").addEventListener("click", () => {
  const inp = document.getElementById("apiKeyInput");
  inp.type = inp.type === "password" ? "text" : "password";
});

document.getElementById("saveApiKeyBtn").addEventListener("click", async () => {
  const key = document.getElementById("apiKeyInput").value.trim();
  if (!key) { setApiKeyStatus("✗ Please enter an API key", "error"); return; }
  if (!key.startsWith("sk-ant-")) { setApiKeyStatus("✗ Key should start with sk-ant-…", "error"); return; }
  await saveApiKey(key); cachedApiKey = key;
  setApiKeyStatus("✓ API key saved successfully", "success");
});

document.getElementById("clearApiKeyBtn").addEventListener("click", async () => {
  if (!confirm("Remove your saved API key?")) return;
  await saveApiKey(""); cachedApiKey = "";
  document.getElementById("apiKeyInput").value = "";
  setApiKeyStatus("✓ API key cleared", "success");
});

document.getElementById("testApiKeyBtn").addEventListener("click", async () => {
  const key = document.getElementById("apiKeyInput").value.trim() || cachedApiKey;
  if (!key) { setApiKeyStatus("✗ No API key entered", "error"); return; }
  setApiKeyStatus("⏳ Testing connection...", "loading");
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 10, messages: [{ role: "user", content: "Hi" }] })
    });
    if (res.ok) {
      setApiKeyStatus("✓ Connection successful! Key is valid.", "success");
      if (key !== cachedApiKey) { await saveApiKey(key); cachedApiKey = key; }
    } else {
      const err = await res.json().catch(() => ({}));
      if (res.status === 401) setApiKeyStatus("✗ Invalid key — check and try again", "error");
      else if (res.status === 429) setApiKeyStatus("✗ Rate limited — try again shortly", "error");
      else setApiKeyStatus(`✗ Error: ${err.error?.message || res.status}`, "error");
    }
  } catch (e) { setApiKeyStatus(`✗ Network error: ${e.message}`, "error"); }
});

document.getElementById("goToSettingsBtn")?.addEventListener("click", () => {
  document.getElementById("apiKeyBanner").style.display = "none";
  tabBtns.forEach(b => b.classList.remove("active"));
  tabContents.forEach(c => c.classList.remove("active"));
  document.querySelector('[data-tab="settings"]').classList.add("active");
  document.getElementById("tab-settings").classList.add("active");
  saveBar.style.display = "none";
  document.getElementById("apiKeyInput").focus();
});

document.getElementById("dismissBannerBtn")?.addEventListener("click", () => {
  document.getElementById("apiKeyBanner").style.display = "none";
});

document.getElementById("exportBackupBtn")?.addEventListener("click", exportBackup);
document.getElementById("importBackupBtn")?.addEventListener("click", () => document.getElementById("importBackupFile")?.click());
document.getElementById("importBackupFile")?.addEventListener("change", event => {
  const file = event.target.files?.[0];
  if (!file) return;
  importBackupFile(file);
  event.target.value = "";
});

// ─── Diversity Collapsible ─────────────────────────────────────────────────────
document.getElementById("diversityToggle").addEventListener("click", () => {
  const s = document.getElementById("diversitySection");
  const a = document.getElementById("diversityArrow");
  const open = s.style.display !== "none";
  s.style.display = open ? "none" : "grid";
  a.textContent = open ? "▶" : "▼";
});

// ─── Toggle Immediate Save ─────────────────────────────────────────────────────
function saveSettingsNow() {
  chrome.storage.local.set({
    settings: {
      autoFillOnLoad: document.getElementById("autoFillToggle").checked,
      skipFilled: document.getElementById("skipFilledToggle").checked,
      autoAcceptTerms: document.getElementById("autoAcceptTermsToggle").checked
    }
  });
}
document.getElementById("autoFillToggle").addEventListener("change", saveSettingsNow);
document.getElementById("skipFilledToggle").addEventListener("change", saveSettingsNow);
document.getElementById("autoAcceptTermsToggle").addEventListener("change", saveSettingsNow);

function exportBackup() {
  chrome.storage.local.get(null, localData => {
    chrome.storage.sync.get(null, syncData => {
      const backup = {
        metadata: { exportedAt: new Date().toISOString(), source: "JobFill Pro" },
        local: localData,
        sync: syncData
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `jobfill-pro-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showResult("Backup exported successfully");
      setBackupStatus("Backup downloaded to your device.");
    });
  });
}

function importBackupFile(file) {
  if (!file.name.toLowerCase().endsWith(".json")) {
    showResult("Please select a JSON backup file", "error");
    setBackupStatus("Invalid file type", "error");
    return;
  }

  if (!confirm("Importing a backup will overwrite your current stored data. Continue?")) return;

  const reader = new FileReader();
  reader.onload = event => {
    try {
      const raw = event.target.result;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") throw new Error("Invalid backup format");
      const localData = parsed.local || {};
      const syncData = parsed.sync || {};
      chrome.storage.local.set(localData, () => {
        chrome.storage.sync.set(syncData, () => {
          showResult("Backup imported successfully");
          setBackupStatus("Backup imported. Reloading popup state...");
          applyImportedBackup(localData);
        });
      });
    } catch (err) {
      showResult("Failed to import backup", "error");
      setBackupStatus(err.message || "Invalid backup file", "error");
    }
  };
  reader.readAsText(file);
}

function applyImportedBackup(localData) {
  if (localData.profile) {
    currentProfile = localData.profile;
    loadProfileToForm(currentProfile);
  }
  if (localData.settings) {
    document.getElementById("autoFillToggle").checked = !!localData.settings.autoFillOnLoad;
    document.getElementById("skipFilledToggle").checked = localData.settings.skipFilled !== false;
    document.getElementById("autoAcceptTermsToggle").checked = localData.settings.autoAcceptTerms !== false;
  }
  if (localData.credentials) {
    credsData = localData.credentials;
    renderCredList(credsData);
  }
  if (localData.anthropicApiKey) {
    cachedApiKey = localData.anthropicApiKey;
    document.getElementById("apiKeyInput").value = cachedApiKey;
  }
  refreshStatus();
}

// ─── Default Profile ───────────────────────────────────────────────────────────
function getDefaultProfile() {
  return {
    personal: {
      firstName: "", lastName: "", fullName: "", email: "", phone: "",
      dob: "", gender: "", nationality: "", currentLocation: "",
      linkedIn: "", github: "", portfolio: "",
      address: "", city: "", state: "", country: "India", zipCode: ""
    },
    professional: {
      currentTitle: "", currentCompany: "", yearsOfExperience: "",
      currentSalary: "", expectedSalary: "", currency: "INR",
      noticePeriod: "", availableFrom: "",
      workType: "Full-time", workMode: "On-site",
      preferredLocation: "", countryCode: ""
    },
    work: { authorized: true, sponsorship: false },
    education: { degree: "", field: "", university: "", graduationYear: "", gpa: "", secondarySchool: "", secondaryYear: "" },
    diversity: { gender: "Prefer not to say", ethnicity: "", veteranStatus: "I am not a protected veteran", disabilityStatus: "No, I don't have a disability" },
    resume: { fileName: "", fileData: "", mimeType: "" },
    coverLetter: { default: "" },
    customAnswers: [],
    customFields: [],
    yesNoAnswers: []
  };
}

// ─── Profile Load/Save ────────────────────────────────────────────────────────
let currentProfile = null;
let resumeData = { fileName: "", fileData: "", mimeType: "" };

function loadProfileToForm(profile) {
  const p = profile;
  // Personal
  setVal("firstName", p.personal?.firstName);
  setVal("lastName", p.personal?.lastName);
  setVal("fullName", p.personal?.fullName);
  setVal("email", p.personal?.email);
  setVal("phone", p.personal?.phone);
  setVal("dob", p.personal?.dob);
  setVal("gender", p.personal?.gender);
  setVal("nationality", p.personal?.nationality);
  setVal("currentLocation", p.personal?.currentLocation);
  setVal("linkedIn", p.personal?.linkedIn);
  setVal("github", p.personal?.github);
  setVal("portfolio", p.personal?.portfolio);
  setVal("address", p.personal?.address);
  setVal("city", p.personal?.city);
  setVal("state", p.personal?.state);
  setVal("country", p.personal?.country);
  setVal("zipCode", p.personal?.zipCode);
  // Professional
  setVal("currentTitle", p.professional?.currentTitle);
  setVal("currentCompany", p.professional?.currentCompany);
  setVal("yearsOfExperience", p.professional?.yearsOfExperience);
  setVal("currentSalary", p.professional?.currentSalary);
  setVal("expectedSalary", p.professional?.expectedSalary);
  setVal("currency", p.professional?.currency || "INR");
  setVal("noticePeriod", p.professional?.noticePeriod);
  setVal("availableFrom", p.professional?.availableFrom);
  setVal("workType", p.professional?.workType || "Full-time");
  setVal("workMode", p.professional?.workMode || "On-site");
  setVal("preferredLocation", p.professional?.preferredLocation);
  setVal("countryCode", p.professional?.countryCode);
  // Work auth
  setVal("workAuthorized", p.work?.authorized !== false ? "true" : "false");
  setVal("sponsorship", p.work?.sponsorship ? "true" : "false");
  // Education
  setVal("degree", p.education?.degree);
  setVal("field", p.education?.field);
  setVal("university", p.education?.university);
  setVal("graduationYear", p.education?.graduationYear);
  setVal("gpa", p.education?.gpa);
  setVal("secondarySchool", p.education?.secondarySchool);
  setVal("secondaryYear", p.education?.secondaryYear);
  // Diversity
  setVal("diversityGender", p.diversity?.gender);
  setVal("ethnicity", p.diversity?.ethnicity);
  setVal("veteranStatus", p.diversity?.veteranStatus);
  setVal("disabilityStatus", p.diversity?.disabilityStatus);
  // Resume
  if (p.resume?.fileName) {
    document.getElementById("resumeFileName").textContent = `✓ ${p.resume.fileName}`;
    document.getElementById("parseResumeBtn").style.display = "flex";
    resumeData = p.resume;
  }
  // Answers
  renderQAList(p.customAnswers || []);
  renderCFList(p.customFields || []);
  renderYNList(p.yesNoAnswers || []);
}

function getFormProfile(existing) {
  const fn = val("firstName");
  const ln = val("lastName");
  return {
    personal: {
      firstName: fn, lastName: ln,
      fullName: val("fullName") || (fn + " " + ln).trim(),
      email: val("email"), phone: val("phone"),
      dob: val("dob"), gender: val("gender"), nationality: val("nationality"),
      currentLocation: val("currentLocation"),
      linkedIn: val("linkedIn"), github: val("github"), portfolio: val("portfolio"),
      address: val("address"), city: val("city"), state: val("state"),
      country: val("country"), zipCode: val("zipCode")
    },
    professional: {
      currentTitle: val("currentTitle"), currentCompany: val("currentCompany"),
      yearsOfExperience: val("yearsOfExperience"), currentSalary: val("currentSalary"),
      expectedSalary: val("expectedSalary"), currency: val("currency") || "INR",
      noticePeriod: val("noticePeriod"), availableFrom: val("availableFrom"),
      workType: val("workType") || "Full-time", workMode: val("workMode") || "On-site",
      preferredLocation: val("preferredLocation"), countryCode: val("countryCode")
    },
    work: { authorized: val("workAuthorized") === "true", sponsorship: val("sponsorship") === "true" },
    education: {
      degree: val("degree"), field: val("field"), university: val("university"),
      graduationYear: val("graduationYear"), gpa: val("gpa"),
      secondarySchool: val("secondarySchool"), secondaryYear: val("secondaryYear")
    },
    diversity: {
      gender: val("diversityGender") || "Prefer not to say",
      ethnicity: val("ethnicity"),
      veteranStatus: val("veteranStatus") || "I am not a protected veteran",
      disabilityStatus: val("disabilityStatus") || "No, I don't have a disability"
    },
    resume: resumeData.fileName ? resumeData : (existing?.resume || { fileName: "", fileData: "", mimeType: "" }),
    coverLetter: existing?.coverLetter || { default: "" },
    customAnswers: getQAData(),
    customFields: getCFData(),
    yesNoAnswers: getYNData()
  };
}

// Initial load
chrome.storage.local.get(["profile", "settings"], (result) => {
  currentProfile = result.profile || getDefaultProfile();
  loadProfileToForm(currentProfile);
  setSaveStatus("", "");

  const settings = result.settings || {};
  document.getElementById("autoFillToggle").checked = !!settings.autoFillOnLoad;
  document.getElementById("skipFilledToggle").checked = settings.skipFilled !== false;
  document.getElementById("autoAcceptTermsToggle").checked = settings.autoAcceptTerms !== false;

  refreshStatus();
  loadHistory();
});

document.getElementById("saveBtn").addEventListener("click", () => {
  currentProfile = getFormProfile(currentProfile);
  chrome.storage.local.set({ profile: currentProfile }, () => {
    setSaveStatus("✓ Saved!", "saved");
    setTimeout(() => setSaveStatus("", ""), 3000);
  });
});

document.getElementById("resetBtn").addEventListener("click", () => {
  if (!confirm("Reset all profile data?")) return;
  currentProfile = getDefaultProfile();
  loadProfileToForm(currentProfile);
  resumeData = { fileName: "", fileData: "", mimeType: "" };
  chrome.storage.local.remove("profile");
  setSaveStatus("Profile reset");
});

document.querySelectorAll("#tab-profile input, #tab-profile select").forEach(el => {
  el.addEventListener("change", () => setSaveStatus("Unsaved changes"));
  el.addEventListener("input", () => setSaveStatus("Unsaved changes"));
});

// ─── Custom Q&A ───────────────────────────────────────────────────────────────
function renderQAList(data) {
  const container = document.getElementById("qaList");
  container.innerHTML = "";
  const items = Array.isArray(data) ? data : [];
  if (items.length === 0) {
    container.innerHTML = `<div class="empty-list-msg">No custom answers yet.</div>`;
    return;
  }
  items.forEach((qa, i) => {
    const item = document.createElement("div");
    item.className = "qa-item";
    item.innerHTML = `
      <button class="qa-delete" title="Delete">✕</button>
      <div><label>Question / Keyword</label>
        <input type="text" class="qa-question" placeholder="e.g. Why do you want to work here?" value="${escHtml(qa.question)}"></div>
      <div style="margin-top:6px;"><label>Your Answer</label>
        <textarea class="qa-answer" rows="3" placeholder="Type your answer...">${escHtml(qa.answer)}</textarea></div>
    `;
    container.appendChild(item);
    item.querySelector(".qa-delete").addEventListener("click", () => item.remove());
  });
}

function getQAData() {
  return Array.from(document.querySelectorAll("#qaList .qa-item")).map(item => ({
    question: (item.querySelector(".qa-question")?.value || "").trim(),
    answer: (item.querySelector(".qa-answer")?.value || "").trim()
  })).filter(qa => qa.question || qa.answer);
}

document.getElementById("addQaBtn").addEventListener("click", () => {
  const existing = getQAData();
  existing.push({ question: "", answer: "" });
  renderQAList(existing);
  document.getElementById("qaList").lastElementChild?.querySelector(".qa-question")?.focus();
});

// ─── Custom Fields ────────────────────────────────────────────────────────────
function renderCFList(data) {
  const container = document.getElementById("cfList");
  container.innerHTML = "";
  const items = Array.isArray(data) ? data : [];
  if (items.length === 0) {
    container.innerHTML = `<div class="empty-list-msg">No custom fields yet.</div>`;
    return;
  }
  items.forEach((cf) => {
    const item = document.createElement("div");
    item.className = "qa-item";
    item.innerHTML = `
      <button class="qa-delete" title="Delete">✕</button>
      <div class="form-grid" style="gap:6px;">
        <div class="form-group">
          <label>Field Label</label>
          <input type="text" class="cf-label" placeholder="e.g. Referral Code" value="${escHtml(cf.label)}">
        </div>
        <div class="form-group">
          <label>Value</label>
          <input type="text" class="cf-value" placeholder="e.g. ABC123" value="${escHtml(cf.value)}">
        </div>
      </div>
    `;
    container.appendChild(item);
    item.querySelector(".qa-delete").addEventListener("click", () => item.remove());
  });
}

function getCFData() {
  return Array.from(document.querySelectorAll("#cfList .qa-item")).map(item => ({
    label: (item.querySelector(".cf-label")?.value || "").trim(),
    value: (item.querySelector(".cf-value")?.value || "").trim()
  })).filter(cf => cf.label);
}

document.getElementById("addCfBtn").addEventListener("click", () => {
  const existing = getCFData();
  existing.push({ label: "", value: "" });
  renderCFList(existing);
  document.getElementById("cfList").lastElementChild?.querySelector(".cf-label")?.focus();
});

// ─── Yes/No Answers ───────────────────────────────────────────────────────────
function renderYNList(data) {
  const container = document.getElementById("ynList");
  container.innerHTML = "";
  const items = Array.isArray(data) ? data : [];
  if (items.length === 0) {
    container.innerHTML = `<div class="empty-list-msg">No Yes/No answers yet.</div>`;
    return;
  }
  items.forEach((yn) => {
    const item = document.createElement("div");
    item.className = "qa-item yn-item";
    item.innerHTML = `
      <button class="qa-delete" title="Delete">✕</button>
      <div class="yn-row">
        <div class="form-group" style="flex:1;">
          <label>Question / Context</label>
          <input type="text" class="yn-question" placeholder="e.g. Previously employed by Honeywell?" value="${escHtml(yn.question)}">
        </div>
        <div class="form-group yn-answer-group">
          <label>Answer</label>
          <select class="yn-answer">
            <option value="Yes" ${yn.answer === "Yes" ? "selected" : ""}>Yes</option>
            <option value="No" ${yn.answer === "No" ? "selected" : ""}>No</option>
            <option value="Skip" ${yn.answer === "Skip" ? "selected" : ""}>Skip</option>
          </select>
        </div>
      </div>
    `;
    container.appendChild(item);
    item.querySelector(".qa-delete").addEventListener("click", () => item.remove());
  });
}

function getYNData() {
  return Array.from(document.querySelectorAll("#ynList .yn-item")).map(item => ({
    question: (item.querySelector(".yn-question")?.value || "").trim(),
    answer: item.querySelector(".yn-answer")?.value || "Yes"
  })).filter(yn => yn.question);
}

document.getElementById("addYnBtn").addEventListener("click", () => {
  const existing = getYNData();
  existing.push({ question: "", answer: "Yes" });
  renderYNList(existing);
  document.getElementById("ynList").lastElementChild?.querySelector(".yn-question")?.focus();
});

// Save Answers & Fields (all three lists)
document.getElementById("saveAnswersBtn").addEventListener("click", () => {
  chrome.storage.local.get(["profile"], (result) => {
    const profile = result.profile || getDefaultProfile();
    profile.customAnswers = getQAData();
    profile.customFields = getCFData();
    profile.yesNoAnswers = getYNData();
    chrome.storage.local.set({ profile }, () => {
      currentProfile = profile;
      const status = document.getElementById("answersSaveStatus");
      status.textContent = "✓ Saved!";
      status.style.display = "block";
      setTimeout(() => { status.style.display = "none"; }, 2500);
    });
  });
});

// ─── Resume Upload ────────────────────────────────────────────────────────────
const uploadZone = document.getElementById("uploadZone");
const resumeFileInput = document.getElementById("resumeFile");

uploadZone.addEventListener("click", () => resumeFileInput.click());
uploadZone.addEventListener("dragover", e => { e.preventDefault(); uploadZone.classList.add("drag-over"); });
uploadZone.addEventListener("dragleave", () => uploadZone.classList.remove("drag-over"));
uploadZone.addEventListener("drop", e => {
  e.preventDefault(); uploadZone.classList.remove("drag-over");
  if (e.dataTransfer.files[0]) handleResumeFile(e.dataTransfer.files[0]);
});
resumeFileInput.addEventListener("change", () => { if (resumeFileInput.files[0]) handleResumeFile(resumeFileInput.files[0]); });

function handleResumeFile(file) {
  const allowedExts = [".pdf", ".txt"];
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  if (!allowedExts.includes(ext)) { showResult("Only PDF and TXT resumes can be parsed", "error"); return; }
  if (file.size > 5 * 1024 * 1024) { showResult("File too large (max 5MB)", "error"); return; }
  const reader = new FileReader();
  reader.onload = e => {
    resumeData = { fileName: file.name, fileData: e.target.result.split(",")[1], mimeType: file.type || (ext === ".pdf" ? "application/pdf" : "text/plain") };
    document.getElementById("resumeFileName").textContent = `✓ ${file.name}`;
    document.getElementById("parseResumeBtn").style.display = "flex";
    setSaveStatus("Unsaved changes");
  };
  reader.readAsDataURL(file);
}

function decodeBase64Text(base64) {
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

// ─── AI Resume Parser ──────────────────────────────────────────────────────────
const RESUME_PARSE_PROMPT = `Extract ALL information from this resume and return ONLY valid JSON. No preamble, no markdown, no explanation — pure JSON only.

Return this exact structure (use "" for missing fields, never null):
{
  "firstName":"","lastName":"","fullName":"","email":"","phone":"",
  "dob":"","gender":"","nationality":"","currentLocation":"",
  "linkedIn":"","github":"","portfolio":"",
  "address":"","city":"","state":"","country":"","zipCode":"",
  "currentTitle":"","currentCompany":"","yearsOfExperience":"",
  "currentSalary":"","expectedSalary":"","noticePeriod":"","availableFrom":"",
  "workType":"","workMode":"","preferredLocation":"","countryCode":"",
  "degree":"","field":"","university":"","graduationYear":"","gpa":"",
  "secondarySchool":"","secondaryYear":"",
  "workAuthorized":"true","sponsorship":"false",
  "summary":"","skills":[]
}

Rules:
- fullName: first + last name combined
- yearsOfExperience: number string calculated from work history
- graduationYear/secondaryYear: 4-digit string
- currentTitle: most recent job title
- currentLocation: city + state/country of current residence
- workType: "Full-time","Part-time","Contract","Freelance","Internship"
- workMode: "Remote","Hybrid","On-site" or ""
- dob: YYYY-MM-DD format if found
- skills: array of strings`;

document.getElementById("parseResumeBtn").addEventListener("click", async () => {
  if (!resumeData.fileData) { showResult("Please upload a resume first", "error"); return; }
  const apiKey = document.getElementById("apiKeyInput").value.trim() || cachedApiKey || await getApiKey();
  if (!apiKey) { document.getElementById("apiKeyBanner").style.display = "flex"; return; }
  cachedApiKey = apiKey;

  const parseBtn = document.getElementById("parseResumeBtn");
  const parseStatus = document.getElementById("parseStatus");
  const parseMsg = document.getElementById("parseMsg");
  parseBtn.disabled = true; parseBtn.textContent = "⏳ Analyzing...";
  parseStatus.style.display = "block"; parseMsg.textContent = "Sending resume to AI...";

  try {
    const isPDF = resumeData.mimeType === "application/pdf" || resumeData.fileName.toLowerCase().endsWith(".pdf");
    const messages = isPDF
      ? [{ role: "user", content: [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: resumeData.fileData } }, { type: "text", text: RESUME_PARSE_PROMPT }] }]
      : [{ role: "user", content: `Resume:\n\n${decodeBase64Text(resumeData.fileData)}\n\n${RESUME_PARSE_PROMPT}` }];

    parseMsg.textContent = "AI is reading your resume...";

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1500, messages })
    });

    if (!response.ok) { const e = await response.json().catch(() => ({})); throw new Error(e.error?.message || `HTTP ${response.status}`); }

    parseMsg.textContent = "Processing...";
    const data = await response.json();
    const rawText = data.content.filter(b => b.type === "text").map(b => b.text).join("");
    const parsed = JSON.parse(rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim());
    applyParsedProfile(parsed);

    parseStatus.style.display = "none";
    parseBtn.textContent = "✓ Profile filled from resume!";
    parseBtn.style.background = "var(--green)";
    setSaveStatus("Unsaved changes — review and save");

    tabBtns.forEach(b => b.classList.remove("active"));
    tabContents.forEach(c => c.classList.remove("active"));
    document.querySelector('[data-tab="profile"]').classList.add("active");
    document.getElementById("tab-profile").classList.add("active");
    saveBar.style.display = "flex";
    document.getElementById("tab-profile").scrollTop = 0;

    setTimeout(() => { parseBtn.textContent = "🤖 Parse Resume with AI — Auto-fill Profile"; parseBtn.style.background = ""; parseBtn.disabled = false; }, 3000);
  } catch (err) {
    parseStatus.style.display = "none"; parseBtn.disabled = false;
    parseBtn.textContent = "🤖 Parse Resume with AI — Auto-fill Profile";
    let msg = `Error: ${err.message}`;
    if (err.message.includes("401")) { msg = "Invalid API key. Go to ⚙️ Settings."; document.getElementById("apiKeyBanner").style.display = "flex"; }
    else if (err.message.includes("429")) msg = "Rate limited. Try again shortly.";
    else if (err.message.includes("JSON")) msg = "Could not parse AI response. Try again.";
    showResult(msg, "error");
  }
});

function applyParsedProfile(parsed) {
  const s = v => (v && String(v).trim()) ? String(v).trim() : null;
  const fields = {
    firstName: s(parsed.firstName), lastName: s(parsed.lastName), fullName: s(parsed.fullName),
    email: s(parsed.email), phone: s(parsed.phone), dob: s(parsed.dob),
    gender: s(parsed.gender), nationality: s(parsed.nationality), currentLocation: s(parsed.currentLocation),
    linkedIn: s(parsed.linkedIn), github: s(parsed.github), portfolio: s(parsed.portfolio),
    address: s(parsed.address), city: s(parsed.city), state: s(parsed.state),
    country: s(parsed.country), zipCode: s(parsed.zipCode),
    currentTitle: s(parsed.currentTitle), currentCompany: s(parsed.currentCompany),
    yearsOfExperience: s(parsed.yearsOfExperience), currentSalary: s(parsed.currentSalary),
    expectedSalary: s(parsed.expectedSalary), noticePeriod: s(parsed.noticePeriod),
    availableFrom: s(parsed.availableFrom), workType: s(parsed.workType), workMode: s(parsed.workMode),
    preferredLocation: s(parsed.preferredLocation), countryCode: s(parsed.countryCode),
    degree: s(parsed.degree), field: s(parsed.field), university: s(parsed.university),
    graduationYear: s(parsed.graduationYear), gpa: s(parsed.gpa),
    secondarySchool: s(parsed.secondarySchool), secondaryYear: s(parsed.secondaryYear)
  };
  Object.entries(fields).forEach(([id, v]) => { if (v) setVal(id, v); });

  if (parsed.summary?.trim()) {
    const existing = getQAData();
    if (!existing.some(q => q.question.toLowerCase().includes("summary") || q.question.toLowerCase().includes("about yourself"))) {
      existing.push({ question: "Tell us about yourself / Professional Summary", answer: parsed.summary });
      renderQAList(existing);
    }
  }
}

// ─── Status Detection ─────────────────────────────────────────────────────────
async function refreshStatus() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    chrome.tabs.sendMessage(tab.id, { action: "getStatus" }, response => {
      if (chrome.runtime.lastError || !response) {
        document.getElementById("statusPlatform").textContent = "Cannot detect";
        document.getElementById("statusFields").textContent = "–";
        document.getElementById("statusUrl").textContent = (tab.url || "").replace(/https?:\/\//, "").slice(0, 50);
        document.getElementById("siteBadge").textContent = "Not a job site";
        document.getElementById("siteBadge").className = "site-badge inactive";
        return;
      }
      document.getElementById("statusPlatform").textContent = response.platform?.name || "Unknown";
      document.getElementById("statusFields").textContent = response.fieldsDetected ?? "0";
      document.getElementById("statusUrl").textContent = (response.url || "").replace(/https?:\/\//, "").slice(0, 50);
      if (response.isJobSite) {
        document.getElementById("siteBadge").textContent = response.platform.name;
        document.getElementById("siteBadge").className = "site-badge";
      } else {
        document.getElementById("siteBadge").textContent = "Not a job site";
        document.getElementById("siteBadge").className = "site-badge inactive";
      }
    });
  } catch {}
}

// ─── Fill Now ─────────────────────────────────────────────────────────────────
document.getElementById("fillNowBtn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) { showResult("Cannot access this tab", "error"); return; }

  // Always load fresh from storage so customAnswers/customFields/yesNoAnswers are current
  chrome.storage.local.get(["profile"], result => {
    const profile = result.profile;
    if (!profile || !profile.personal?.email) {
      showResult("Please save your profile first!", "error");
      return;
    }

    console.log("[JobFill] Sending fill - customAnswers:", profile.customAnswers?.length, "customFields:", profile.customFields?.length, "yesNoAnswers:", profile.yesNoAnswers?.length);

    const skipFilled = document.getElementById("skipFilledToggle").checked;
    const autoAcceptTerms = document.getElementById("autoAcceptTermsToggle").checked;

    chrome.tabs.sendMessage(tab.id, { action: "fillNow", profile, skipFilled, autoAcceptTerms }, response => {
      if (chrome.runtime.lastError) { showResult("Could not connect. Refresh the page and try again.", "error"); return; }
      if (response?.success) {
        const r = response.results;
        showResult(`Filled ${r.filled} field${r.filled !== 1 ? "s" : ""}!`);
        document.getElementById("lastResultCard").style.display = "block";
        document.getElementById("lastFilled").textContent = r.filled;
        document.getElementById("lastSkipped").textContent = r.skipped;
        document.getElementById("lastFields").textContent = (r.fields || []).join(", ") || "–";
        chrome.runtime.sendMessage({ action: "saveHistory", url: tab.url, title: tab.title, fieldCount: r.filled });
        refreshStatus();
      } else {
        showResult("Fill failed: " + (response?.error || "Unknown error"), "error");
      }
    });
  });
});

document.getElementById("clearFieldsBtn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  chrome.tabs.sendMessage(tab.id, { action: "clearFields" }, () => showResult("Fields cleared"));
});

document.getElementById("refreshStatusBtn").addEventListener("click", refreshStatus);

// ─── History ──────────────────────────────────────────────────────────────────
function loadHistory() {
  chrome.storage.local.get(["history"], result => {
    const history = result.history || [];
    const container = document.getElementById("historyList");
    if (history.length === 0) {
      container.innerHTML = `<div class="empty-state"><span class="emoji">📋</span>No fill history yet. Start applying!</div>`;
      return;
    }
    container.innerHTML = history.slice(0, 30).map(h => {
      const dateStr = new Date(h.timestamp).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
      return `<div class="history-item">
        <div class="history-icon">💼</div>
        <div class="history-info">
          <div class="history-site">${escHtml(h.siteName || "Unknown")}</div>
          <div class="history-meta">${dateStr} · ${escHtml((h.url || "").replace(/https?:\/\//, "").slice(0, 40))}</div>
        </div>
        <div class="history-count">+${h.fieldCount || 0}</div>
      </div>`;
    }).join("");
  });
}

document.getElementById("clearHistoryBtn").addEventListener("click", () => {
  if (!confirm("Clear all fill history?")) return;
  chrome.storage.local.remove("history", () => loadHistory());
});

// ─── Credentials Vault ────────────────────────────────────────────────────────
let credsData = [];

function loadCredentials() {
  chrome.storage.local.get(["credentials"], result => {
    credsData = result.credentials || [];
    renderCredList(credsData);
  });
}

function renderCredList(data) {
  const container = document.getElementById("credList");
  container.innerHTML = "";
  const items = Array.isArray(data) ? data : [];
  if (items.length === 0) {
    container.innerHTML = `<div class="empty-list-msg">No credentials saved yet.</div>`;
    return;
  }
  items.forEach((cred, i) => {
    const item = document.createElement("div");
    item.className = "cred-item";
    item.innerHTML = `
      <div class="cred-header">
        <span class="cred-site-name">${escHtml(cred.siteName || `Site ${i + 1}`)}</span>
        <button class="qa-delete" title="Delete">✕</button>
      </div>
      <div class="form-grid" style="gap:6px;margin-top:6px;">
        <div class="form-group span2">
          <label>Site Name</label>
          <input type="text" class="cred-sitename" placeholder="Workday - Synechron" value="${escHtml(cred.siteName)}">
        </div>
        <div class="form-group span2">
          <label>URL Pattern (leave blank to apply to all sites)</label>
          <input type="text" class="cred-url" placeholder="e.g. myworkdayjobs.com or leave blank for all" value="${escHtml(cred.siteUrl || '')}">
        </div>
        <div class="form-group span2">
          <label>Email / Username</label>
          <input type="email" class="cred-email" placeholder="you@email.com" value="${escHtml(cred.email)}">
        </div>
        <div class="form-group">
          <label>Password</label>
          <div class="api-key-input-wrap">
            <input type="password" class="cred-password" placeholder="Password" value="${escHtml(cred.password || '')}">
            <button class="api-key-toggle cred-pw-toggle" title="Show/hide">👁</button>
          </div>
        </div>
        <div class="form-group">
          <label>Confirm Password</label>
          <input type="password" class="cred-confirm" placeholder="Re-enter password" value="${escHtml(cred.password || '')}">
        </div>
      </div>
    `;
    container.appendChild(item);
    item.querySelector(".qa-delete").addEventListener("click", () => item.remove());
    item.querySelector(".cred-pw-toggle").addEventListener("click", () => {
      const pw = item.querySelector(".cred-password");
      pw.type = pw.type === "password" ? "text" : "password";
    });
    item.querySelector(".cred-sitename").addEventListener("input", e => {
      item.querySelector(".cred-site-name").textContent = e.target.value || `Site ${i + 1}`;
    });
  });
}

function getCredsData() {
  return Array.from(document.querySelectorAll("#credList .cred-item")).map(item => {
    const pw = item.querySelector(".cred-password")?.value || "";
    const confirm = item.querySelector(".cred-confirm")?.value || "";
    return {
      siteName: (item.querySelector(".cred-sitename")?.value || "").trim(),
      siteUrl: (item.querySelector(".cred-url")?.value || "").trim(), // blank = all sites
      email: (item.querySelector(".cred-email")?.value || "").trim(),
      password: pw,
      _confirmMatch: pw === confirm
    };
  }).filter(c => c.email);
}

document.getElementById("addCredBtn").addEventListener("click", () => {
  const existing = getCredsData().map(({ _confirmMatch, ...rest }) => rest);
  existing.push({ siteName: "", siteUrl: "", email: "", password: "" });
  renderCredList(existing);
  document.getElementById("credList").lastElementChild?.querySelector(".cred-sitename")?.focus();
});

document.getElementById("saveCredsBtn").addEventListener("click", () => {
  const data = getCredsData();
  const mismatch = data.find(c => !c._confirmMatch);
  if (mismatch) { alert(`Passwords don't match for "${mismatch.siteName || "a site"}". Fix before saving.`); return; }
  const clean = data.map(({ _confirmMatch, ...rest }) => rest);
  chrome.storage.local.set({ credentials: clean }, () => {
    credsData = clean;
    const status = document.getElementById("credsSaveStatus");
    status.textContent = "✓ Credentials saved!";
    status.style.display = "block";
    setTimeout(() => { status.style.display = "none"; }, 2500);
  });
});

// ─── Recorder / Learn Mode ──────────────────────────────────────────────────
// Records a manual pass through a form (id, type, label, value per field) and
// lets the user save the reviewed entries into the same stores the Fill engine
// already reads from — customAnswers / customFields / yesNoAnswers, or a
// standard profile field when the label is confidently recognized.

let recorderFields = [];

const STANDARD_FIELD_GUESSES = [
  { path: "personal.firstName", test: /\bfirst name\b|\bgiven name\b/ },
  { path: "personal.lastName", test: /\blast name\b|\bfamily name\b|\bsurname\b/ },
  { path: "personal.email", test: /e-?mail/ },
  { path: "personal.phone", test: /\bphone\b|\bmobile\b|\btelephone\b|contact number/ },
  { path: "personal.linkedIn", test: /linkedin/ },
  { path: "personal.github", test: /github/ },
  { path: "personal.portfolio", test: /portfolio|personal website|\bwebsite\b/ },
  { path: "personal.address", test: /\baddress\b|\bstreet\b/ },
  { path: "personal.city", test: /\bcity\b|\btown\b/ },
  { path: "personal.state", test: /\bstate\b|\bprovince\b|\bregion\b/ },
  { path: "personal.country", test: /\bcountry\b/ },
  { path: "personal.zipCode", test: /\bzip\b|postal code|\bpostcode\b/ },
  { path: "professional.currentTitle", test: /current title|job title|current position|\bdesignation\b/ },
  { path: "professional.currentCompany", test: /current company|current employer/ },
  { path: "professional.yearsOfExperience", test: /years of experience|total experience/ },
  { path: "professional.noticePeriod", test: /notice period/ },
  { path: "professional.expectedSalary", test: /expected salary|expected ctc|salary expectation/ },
  { path: "professional.currentSalary", test: /current salary|current ctc/ }
];

function guessStandardField(label) {
  const l = (label || "").toLowerCase();
  for (const g of STANDARD_FIELD_GUESSES) if (g.test.test(l)) return g.path;
  return "";
}

function setPathValue(obj, path, value) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    cur[parts[i]] = cur[parts[i]] || {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

function setRecorderUI(recording) {
  document.getElementById("recStartBtn").style.display = recording ? "none" : "block";
  document.getElementById("recStopBtn").style.display = recording ? "block" : "none";
  document.getElementById("recIndicator").style.display = recording ? "flex" : "none";
}

function showRecStatus(msg) {
  const el = document.getElementById("recStatusMsg");
  if (el) el.textContent = msg;
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function refreshRecorderStatus() {
  getActiveTab().then(tab => {
    if (!tab) return;
    chrome.tabs.sendMessage(tab.id, { action: "getRecordingStatus" }, response => {
      if (chrome.runtime.lastError) return; // content script not injected on this page (e.g. chrome:// tab)
      setRecorderUI(!!(response && response.recording));
    });
  });
}

function renderRecorderResults(fields) {
  const container = document.getElementById("recResults");
  const saveBtn = document.getElementById("recSaveBtn");
  if (!fields.length) {
    container.innerHTML = `<div class="empty-list-msg">No fields captured. Fill a few fields on the page, then Stop &amp; Review.</div>`;
    saveBtn.style.display = "none";
    document.getElementById("recBulkRow").style.display = "none";
    return;
  }
  container.innerHTML = "";
  fields.forEach(f => {
    const guess = guessStandardField(f.label);
    const defaultTarget = guess ? "standard" : (/^(yes|no)$/i.test((f.value || "").trim()) ? "yesno" : "custom");
    const item = document.createElement("div");
    item.className = "qa-item rec-item";
    item.dataset.guess = guess;
    item.innerHTML = `
      <button class="qa-delete" title="Discard this field">✕</button>
      <label style="position:absolute;top:12px;left:12px;display:flex;align-items:center;gap:0;">
        <input type="checkbox" class="rec-include" checked title="Include in save">
      </label>
      <div class="rec-meta" style="padding-left:20px;">${escHtml(f.type || "")}${f.elementId ? " · id: " + escHtml(f.elementId) : ""}</div>
      <div style="margin-top:4px;"><label>Question / Label</label>
        <input type="text" class="rec-label" value="${escHtml(f.label || "")}"></div>
      <div style="margin-top:6px;"><label>Captured Value</label>
        <input type="text" class="rec-value" value="${escHtml(f.value || "")}"></div>
      <div style="margin-top:6px;"><label>Save As</label>
        <select class="rec-target">
          <option value="">Ignore</option>
          <option value="standard" ${guess ? "selected" : ""}>Standard profile field${guess ? " (" + escHtml(guess.split(".")[1]) + ")" : ""}</option>
          <option value="custom" ${defaultTarget === "custom" ? "selected" : ""}>Custom Q&amp;A (text answer)</option>
          <option value="yesno" ${defaultTarget === "yesno" ? "selected" : ""}>Yes / No Answer</option>
          <option value="field">Custom Field (exact label match)</option>
        </select>
      </div>
    `;
    container.appendChild(item);
    item.querySelector(".qa-delete").addEventListener("click", () => item.remove());
  });
  saveBtn.style.display = "block";
  document.getElementById("recBulkRow").style.display = "flex";
}

document.getElementById("recAcceptAllBtn")?.addEventListener("click", () => {
  document.querySelectorAll("#recResults .rec-item").forEach(item => {
    if (item.dataset.guess) item.querySelector(".rec-target").value = "standard";
  });
});

document.getElementById("recToggleAllBtn")?.addEventListener("click", () => {
  const boxes = document.querySelectorAll("#recResults .rec-include");
  const allChecked = Array.from(boxes).every(b => b.checked);
  boxes.forEach(b => { b.checked = !allChecked; });
});

// Keyboard shortcuts while reviewing captured fields (Ctrl/Cmd+Enter = save, Esc = discard)
document.getElementById("tab-recorder")?.addEventListener("keydown", e => {
  const saveBtn = document.getElementById("recSaveBtn");
  const discardBtn = document.getElementById("recDiscardBtn");
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && saveBtn && saveBtn.style.display !== "none") {
    e.preventDefault();
    saveBtn.click();
  } else if (e.key === "Escape" && discardBtn) {
    e.preventDefault();
    discardBtn.click();
  }
});

document.getElementById("recStartBtn")?.addEventListener("click", async () => {
  const tab = await getActiveTab();
  if (!tab) return;
  chrome.tabs.sendMessage(tab.id, { action: "startRecording" }, () => {
    if (chrome.runtime.lastError) { showRecStatus("Couldn't start recording on this page — try reloading it first."); return; }
    setRecorderUI(true);
    recorderFields = [];
    document.getElementById("recResults").innerHTML = `<div class="empty-list-msg">Nothing recorded yet.</div>`;
    document.getElementById("recSaveBtn").style.display = "none";
    showRecStatus("Recording — switch to the page, fill it out, then come back here.");
  });
});

document.getElementById("recStopBtn")?.addEventListener("click", async () => {
  const tab = await getActiveTab();
  if (!tab) return;
  chrome.tabs.sendMessage(tab.id, { action: "stopRecording" }, response => {
    setRecorderUI(false);
    recorderFields = (response && response.fields) || [];
    renderRecorderResults(recorderFields);
    showRecStatus(`Captured ${recorderFields.length} field${recorderFields.length === 1 ? "" : "s"}. Review and save below.`);
  });
});

document.getElementById("recDiscardBtn")?.addEventListener("click", async () => {
  const tab = await getActiveTab();
  if (tab) chrome.tabs.sendMessage(tab.id, { action: "discardRecording" }, () => {});
  setRecorderUI(false);
  recorderFields = [];
  document.getElementById("recResults").innerHTML = `<div class="empty-list-msg">Nothing recorded yet.</div>`;
  document.getElementById("recSaveBtn").style.display = "none";
  document.getElementById("recBulkRow").style.display = "none";
  showRecStatus("Discarded.");
});

document.getElementById("recSaveBtn")?.addEventListener("click", () => {
  chrome.storage.local.get(["profile"], result => {
    const profile = result.profile || getDefaultProfile();
    profile.customAnswers = profile.customAnswers || [];
    profile.customFields = profile.customFields || [];
    profile.yesNoAnswers = profile.yesNoAnswers || [];

    let savedCount = 0;
    document.querySelectorAll("#recResults .rec-item").forEach(item => {
      const included = item.querySelector(".rec-include")?.checked !== false;
      if (!included) return;
      const label = (item.querySelector(".rec-label")?.value || "").trim();
      const value = (item.querySelector(".rec-value")?.value || "").trim();
      const target = item.querySelector(".rec-target")?.value || "";
      if (!label || !value || !target) return;

      if (target === "standard") {
        const guess = item.dataset.guess || guessStandardField(label);
        if (guess) { setPathValue(profile, guess, value); savedCount++; }
        else { profile.customFields.push({ label, value }); savedCount++; }
        return;
      }
      if (target === "custom") { profile.customAnswers.push({ question: label, answer: value }); savedCount++; return; }
      if (target === "field") { profile.customFields.push({ label, value }); savedCount++; return; }
      if (target === "yesno") {
        const answer = /^y/i.test(value) ? "Yes" : /^n/i.test(value) ? "No" : "Skip";
        profile.yesNoAnswers.push({ question: label, answer }); savedCount++;
      }
    });

    chrome.storage.local.set({ profile }, () => {
      showRecStatus(`Saved ${savedCount} field${savedCount === 1 ? "" : "s"} to your profile. They'll be used next time you hit Fill.`);
      document.getElementById("recResults").innerHTML = `<div class="empty-list-msg">Nothing recorded yet.</div>`;
      document.getElementById("recSaveBtn").style.display = "none";
      document.getElementById("recBulkRow").style.display = "none";
      recorderFields = [];
    });
  });
});
