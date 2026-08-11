// flow-engine.js — JobFill Pro "Full Flow Automation"
//
// Records the SEQUENCE of navigation actions across a whole multi-page
// Workday application (which button advances each step, how long the next
// step took to appear, where the resume-upload step sits) — not literal
// clicks-by-selector. Workday regenerates element ids/classes every session
// and every tenant, so literally replaying "click #input-55" next time would
// break immediately. Instead, replay re-finds each step's button by its
// recorded label text and re-runs the existing autoFill() engine (from
// content.js, already a robust label-fuzzy-matcher) on every intermediate
// page, so the actual field-filling adapts per-application instead of being
// a stale recording.
//
// Waiting is dynamic, not a blind sleep: replay polls for the next expected
// button/element and proceeds the moment it's actually there. The wait time
// recorded during the human pass is only used to size the polling timeout
// (so replay doesn't wait forever if something never appears, and doesn't
// give up too early on a step that's normally slow).

(function () {
  "use strict";

  // ── Recording state ───────────────────────────────────────────────────
  let recordingFlow = false;
  let flowSteps = [];
  let lastActionTime = 0;
  let uploadMarkedForStep = new Set();

  // ── Replay state ─────────────────────────────────────────────────────
  let running = false;
  let runAborted = false;
  let runPaused = false;
  let resumeSignal = null; // resolver for the paused promise

  const NAV_BUTTON_PATTERN = /^(next|continue|save\s*(and|&)\s*continue|save\s*(and|&)\s*next|create account|sign\s*up|register|submit application|submit\s*my\s*application|^submit$|apply manually|apply now|autofill with resume|use my last application|upload resume|select file|browse|get started|proceed|save)\b/i;
  const UPLOAD_TRIGGER_PATTERN = /upload resume|select file|browse|attach resume|choose file/i;
  const SUBMIT_PATTERN = /submit application|submit my application|^submit$/i;
  const ACCOUNT_PATTERN = /create account|sign\s*up|register/i;

  function core() { return window.__jobFillCore || {}; }
  function cleanText(t) { return (t || "").replace(/\s+/g, " ").trim(); }

  function getCurrentStepName() {
    const active = document.querySelector(
      '[data-automation-id="progressBar"] [aria-current="step"], [aria-current="step"], [aria-current="page"]'
    );
    if (active && cleanText(active.textContent)) return cleanText(active.textContent);
    const heading = document.querySelector('h1, [data-automation-id="pageHeader"], h2[data-automation-id]');
    if (heading && cleanText(heading.textContent)) return cleanText(heading.textContent);
    return cleanText(document.title) || "Unnamed step";
  }

  function getButtonLabel(el) {
    return cleanText(el.textContent || el.value || el.getAttribute("aria-label") || "");
  }

  // ─────────────────────────────────────────────────────────────────────
  // RECORDING
  // ─────────────────────────────────────────────────────────────────────
  function persistFlowBuffer() {
    try { chrome.storage.local.set({ flowRecordingBuffer: flowSteps }); } catch {}
  }

  function classifyClick(label) {
    if (flowSteps.length === 0) return "choice-click";
    if (ACCOUNT_PATTERN.test(label)) return "account-create";
    if (SUBMIT_PATTERN.test(label)) return "submit-click";
    return "continue-click";
  }

  function onFlowClick(e) {
    if (!recordingFlow) return;
    const btn = e.target.closest('button, [role="button"], input[type="submit"]');
    if (!btn) return;
    const label = getButtonLabel(btn);
    if (!label || !NAV_BUTTON_PATTERN.test(label)) return;

    const stepName = getCurrentStepName();

    if (UPLOAD_TRIGGER_PATTERN.test(label) && !uploadMarkedForStep.has(stepName)) {
      uploadMarkedForStep.add(stepName);
      const now = Date.now();
      flowSteps.push({ type: "resume-upload", stepName, waitMsBefore: now - lastActionTime, timestamp: now });
      lastActionTime = now;
      persistFlowBuffer();
      return; // the upload trigger itself isn't a nav step; the *next* nav click will be recorded normally
    }

    const now = Date.now();
    const waitMsBefore = now - lastActionTime;
    lastActionTime = now;
    flowSteps.push({ type: classifyClick(label), stepName, buttonLabel: label, waitMsBefore, timestamp: now });
    persistFlowBuffer();
  }

  function onFileInputChange(e) {
    if (!recordingFlow) return;
    const el = e.target;
    if (!el || el.tagName !== "INPUT" || el.type !== "file") return;
    const stepName = getCurrentStepName();
    if (uploadMarkedForStep.has(stepName)) return;
    uploadMarkedForStep.add(stepName);
    const now = Date.now();
    flowSteps.push({ type: "resume-upload", stepName, waitMsBefore: now - lastActionTime, timestamp: now });
    lastActionTime = now;
    persistFlowBuffer();
  }

  function attachRecordingListeners() {
    document.addEventListener("click", onFlowClick, true);
    document.addEventListener("change", onFileInputChange, true);
  }
  function detachRecordingListeners() {
    document.removeEventListener("click", onFlowClick, true);
    document.removeEventListener("change", onFileInputChange, true);
  }

  // ─────────────────────────────────────────────────────────────────────
  // ON-PAGE STATUS BANNER (always visible while automation runs — gives the
  // user a real-time view + one-click kill switch, especially important
  // since Submit fires automatically with no confirmation step).
  // ─────────────────────────────────────────────────────────────────────
  let bannerEl = null;
  function ensureBanner() {
    if (bannerEl && document.body.contains(bannerEl)) return bannerEl;
    bannerEl = document.createElement("div");
    bannerEl.id = "__jobfill_flow_banner";
    Object.assign(bannerEl.style, {
      position: "fixed", top: "12px", right: "12px", zIndex: "2147483647",
      background: "#111827", color: "#fff", padding: "10px 14px", borderRadius: "10px",
      fontFamily: "system-ui, -apple-system, sans-serif", fontSize: "13px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.35)", maxWidth: "320px", lineHeight: "1.5",
      display: "flex", alignItems: "center", gap: "10px"
    });
    const text = document.createElement("span");
    text.id = "__jobfill_flow_banner_text";
    text.textContent = "🤖 JobFill Pro automation running…";
    const stopBtn = document.createElement("button");
    stopBtn.textContent = "Stop";
    Object.assign(stopBtn.style, {
      background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px",
      padding: "6px 10px", fontSize: "12px", fontWeight: "700", cursor: "pointer", flexShrink: "0"
    });
    stopBtn.addEventListener("click", () => { runAborted = true; setBanner("⏹ Stopping…"); });
    bannerEl.appendChild(text);
    bannerEl.appendChild(stopBtn);
    document.documentElement.appendChild(bannerEl);
    return bannerEl;
  }
  function setBanner(msg) {
    ensureBanner();
    const t = document.getElementById("__jobfill_flow_banner_text");
    if (t) t.textContent = msg;
  }
  function removeBanner() {
    if (bannerEl && bannerEl.parentNode) bannerEl.parentNode.removeChild(bannerEl);
    bannerEl = null;
  }

  // ─────────────────────────────────────────────────────────────────────
  // REPLAY
  // ─────────────────────────────────────────────────────────────────────
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  function findNavButton(label) {
    const normLabel = label.toLowerCase();
    const candidates = Array.from(document.querySelectorAll('button, [role="button"], input[type="submit"]'))
      .filter(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return false;
        if (el.disabled || el.getAttribute("aria-disabled") === "true") return false;
        return true;
      });
    // Exact match first, then "starts with", then "includes"
    let match = candidates.find(el => getButtonLabel(el).toLowerCase() === normLabel);
    if (!match) match = candidates.find(el => getButtonLabel(el).toLowerCase().startsWith(normLabel.split(/\s+/)[0]));
    if (!match) match = candidates.find(el => getButtonLabel(el).toLowerCase().includes(normLabel) || normLabel.includes(getButtonLabel(el).toLowerCase()));
    return match || null;
  }

  async function waitForNavButton(label, timeoutMs) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (runAborted) return null;
      const btn = findNavButton(label);
      if (btn) return btn;
      await sleep(400);
    }
    return null;
  }

  function timeoutFor(step) {
    const hint = step.waitMsBefore || 4000;
    return Math.min(45000, Math.max(8000, hint * 3));
  }

  async function waitForPause() {
    runPaused = true;
    return new Promise(resolve => { resumeSignal = resolve; });
  }

  function logSubmission(flow, filledSummary) {
    try {
      chrome.runtime.sendMessage({
        action: "saveHistory",
        url: window.location.href,
        title: document.title,
        fieldCount: filledSummary.filled || 0,
        flowName: flow.name,
        submitted: true
      });
    } catch {}
  }

  async function runFlow(flow, profile) {
    running = true;
    runAborted = false;
    runPaused = false;
    ensureBanner();
    try {
      chrome.runtime.sendMessage({ action: "flowRunUpdate", state: "running", stepName: "Starting…" });
    } catch {}

    for (let i = 0; i < flow.steps.length; i++) {
      if (runAborted) break;
      const step = flow.steps[i];
      setBanner(`🤖 Running: ${step.stepName || "…"}`);
      try { chrome.runtime.sendMessage({ action: "flowRunUpdate", state: "running", stepName: step.stepName, stepIndex: i, totalSteps: flow.steps.length }); } catch {}

      if (step.type === "resume-upload") {
        setBanner("⏸ Upload your resume, then click Resume in the JobFill Pro popup");
        try { chrome.runtime.sendMessage({ action: "flowRunUpdate", state: "paused-upload", stepName: step.stepName }); } catch {}
        await waitForPause();
        if (runAborted) break;
        setBanner("▶ Resuming…");
        await sleep(600);
        continue;
      }

      if (step.type === "account-create") {
        // content.js already auto-fills email/password ~1200ms after page load
        // when a saved credential matches this host. Give that a moment, then
        // proceed to find the button.
        await sleep(1500);
      }

      if (step.type === "continue-click" || step.type === "submit-click" || step.type === "account-create") {
        // Fill whatever's on this page with the existing engine before advancing.
        try {
          const c = core();
          if (c.autoFill) {
            const result = await c.autoFill(profile, true, true);
            if (step.type === "submit-click") logSubmission(flow, result || {});
          }
        } catch {}
        await sleep(500);
      }

      const btn = step.buttonLabel ? await waitForNavButton(step.buttonLabel, timeoutFor(step)) : null;
      if (runAborted) break;
      if (!btn) {
        setBanner(`⚠ Couldn't find "${step.buttonLabel}" — automation stopped, please continue manually`);
        try { chrome.runtime.sendMessage({ action: "flowRunUpdate", state: "error", stepName: step.stepName, message: `Couldn't find button "${step.buttonLabel}"` }); } catch {}
        running = false;
        return;
      }
      btn.click();
      await sleep(300);
    }

    running = false;
    if (runAborted) {
      setBanner("⏹ Automation stopped");
      try { chrome.runtime.sendMessage({ action: "flowRunUpdate", state: "stopped" }); } catch {}
    } else {
      setBanner("✅ Flow complete");
      try { chrome.runtime.sendMessage({ action: "flowRunUpdate", state: "done" }); } catch {}
    }
    setTimeout(removeBanner, 6000);
  }

  // ─────────────────────────────────────────────────────────────────────
  // MESSAGE API
  // ─────────────────────────────────────────────────────────────────────
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "startFlowRecording") {
      recordingFlow = true;
      flowSteps = [];
      uploadMarkedForStep = new Set();
      lastActionTime = Date.now();
      attachRecordingListeners();
      chrome.storage.local.set({ flowRecordingBuffer: [], flowRecordingActive: true });
      sendResponse({ success: true });
      return true;
    }
    if (message.action === "stopFlowRecording") {
      recordingFlow = false;
      detachRecordingListeners();
      chrome.storage.local.set({ flowRecordingActive: false });
      sendResponse({ success: true, steps: flowSteps, siteHost: window.location.hostname });
      return true;
    }
    if (message.action === "discardFlowRecording") {
      recordingFlow = false;
      detachRecordingListeners();
      flowSteps = [];
      chrome.storage.local.set({ flowRecordingBuffer: [], flowRecordingActive: false });
      sendResponse({ success: true });
      return true;
    }
    if (message.action === "getFlowRecordingStatus") {
      sendResponse({ recording: recordingFlow, count: flowSteps.length });
      return true;
    }
    if (message.action === "runFlow") {
      if (running) { sendResponse({ success: false, error: "Already running" }); return true; }
      runFlow(message.flow, message.profile || {});
      sendResponse({ success: true });
      return true;
    }
    if (message.action === "resumeFlowStep") {
      if (runPaused && resumeSignal) {
        runPaused = false;
        const fn = resumeSignal;
        resumeSignal = null;
        fn();
      }
      sendResponse({ success: true });
      return true;
    }
    if (message.action === "stopFlowRun") {
      runAborted = true;
      if (runPaused && resumeSignal) { const fn = resumeSignal; resumeSignal = null; runPaused = false; fn(); }
      sendResponse({ success: true });
      return true;
    }
    if (message.action === "getFlowRunStatus") {
      sendResponse({ running, paused: runPaused });
      return true;
    }
  });

  try {
    chrome.storage.local.get(["flowRecordingActive"], r => {
      if (r && r.flowRecordingActive) {
        recordingFlow = true;
        lastActionTime = Date.now();
        attachRecordingListeners();
      }
    });
  } catch {}
})();
