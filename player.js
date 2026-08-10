// player.js — JobFill Pro "Full Automation Flow" replay engine
//
// Takes the ordered step sequence recorded by recorder.js (clicks, file-upload
// triggers, autofill checkpoints) and replays it on a fresh Workday
// application. Two deliberate design choices:
//
// 1. Adaptive waiting, not fixed-duration sleeps. The recording captures how
//    long the user paused between actions (elapsedMs) mainly as a debugging/
//    display signal — replaying that literally would be fragile (network and
//    render speed vary run to run). Instead each step waits for its target
//    element to actually exist, then waits for the DOM to stop mutating
//    ("settle") before moving on.
// 2. Fill checkpoints delegate to the existing autoFill() engine in content.js
//    (via window.__jobFillCore.triggerAutoFill) rather than replaying the
//    literal values captured during recording. That's what lets one recorded
//    flow work across different job postings / resumes — the values come
//    fresh from the saved profile each run, only the *sequence* is replayed.

(function () {
  "use strict";

  let running = false;
  let stopRequested = false;
  let currentStepIndex = 0;
  let currentSteps = [];
  let resolveConfirm = null;

  function core() {
    return window.__jobFillCore || {};
  }

  function cleanText(t) {
    return (t || "").replace(/\s+/g, " ").trim();
  }

  function log(message, extra) {
    try { chrome.runtime.sendMessage(Object.assign({ action: "flowLog", message }, extra || {})); } catch {}
  }

  function isVisible(el) {
    if (!el || !el.getBoundingClientRect) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    const style = window.getComputedStyle(el);
    if (style.visibility === "hidden" || style.display === "none") return false;
    if (el.disabled) return false;
    return true;
  }

  function scoreCandidate(el, d) {
    let score = 0;
    const automationId = el.getAttribute && el.getAttribute("data-automation-id");
    if (d.automationId && automationId === d.automationId) score += 100;
    const ariaLabel = cleanText(el.getAttribute && el.getAttribute("aria-label"));
    if (d.ariaLabel && ariaLabel === d.ariaLabel) score += 60;
    const text = cleanText(el.textContent).slice(0, 80);
    if (d.text && text === d.text) score += 50;
    else if (d.text && text && (text.includes(d.text) || d.text.includes(text))) score += 20;
    if (d.tag && el.tagName.toLowerCase() === d.tag) score += 10;
    if (d.role && (el.getAttribute("role") || "") === d.role) score += 10;
    if (!isVisible(el)) score -= 1000;
    return score;
  }

  function findBestMatch(d) {
    if (d.automationId) {
      let el = null;
      try { el = document.querySelector(`[data-automation-id="${CSS.escape(d.automationId)}"]`); } catch {}
      if (el && isVisible(el)) return el;
    }
    const candidates = document.querySelectorAll(
      'button, a, [role="button"], input[type="submit"], input[type="button"], input[type="file"]'
    );
    let best = null;
    let bestScore = -Infinity;
    candidates.forEach(el => {
      const s = scoreCandidate(el, d);
      if (s > bestScore) { bestScore = s; best = el; }
    });
    return bestScore >= 20 ? best : null;
  }

  function waitForElement(d, timeoutMs) {
    return new Promise((resolve, reject) => {
      const existing = findBestMatch(d);
      if (existing) return resolve(existing);
      const timer = setTimeout(() => {
        obs.disconnect();
        reject(new Error(`Couldn't find "${d.text || d.ariaLabel || d.automationId || "element"}" within ${Math.round(timeoutMs / 1000)}s`));
      }, timeoutMs);
      const obs = new MutationObserver(() => {
        const found = findBestMatch(d);
        if (found) { clearTimeout(timer); obs.disconnect(); resolve(found); }
      });
      obs.observe(document.body, { childList: true, subtree: true, attributes: true });
    });
  }

  function waitForSettle(maxMs) {
    return new Promise(resolve => {
      let lastMutation = Date.now();
      const obs = new MutationObserver(() => { lastMutation = Date.now(); });
      obs.observe(document.body, { childList: true, subtree: true, attributes: true });
      const start = Date.now();
      const interval = setInterval(() => {
        if (Date.now() - lastMutation > 600 || Date.now() - start > maxMs) {
          clearInterval(interval);
          obs.disconnect();
          resolve();
        }
      }, 200);
    });
  }

  function waitForFileSelected(timeoutMs) {
    return new Promise(resolve => {
      const start = Date.now();
      (function check() {
        if (stopRequested) return resolve();
        const inputs = document.querySelectorAll('input[type="file"]');
        for (const inp of inputs) {
          if (inp.files && inp.files.length > 0) return resolve();
        }
        if (Date.now() - start > timeoutMs) return resolve(); // don't block the flow forever
        setTimeout(check, 500);
      })();
    });
  }

  async function clickElement(el) {
    el.scrollIntoView({ block: "center", behavior: "instant" });
    await new Promise(r => setTimeout(r, 150));
    ["pointerdown", "mousedown", "pointerup", "mouseup", "click"].forEach(type => {
      try { el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window })); } catch {}
    });
  }

  function waitForConfirm() {
    return new Promise(resolve => { resolveConfirm = resolve; });
  }

  async function runAutofillCheckpoint() {
    const c = core();
    if (!c.triggerAutoFill) { log("Autofill engine unavailable on this page — skipping checkpoint."); return; }
    const stored = await new Promise(res => chrome.storage.local.get(["profile", "settings"], res));
    if (!stored.profile) { log("No saved profile — skipping autofill checkpoint."); return; }
    log("Filling this page from your saved profile…");
    try {
      const results = await c.triggerAutoFill(stored.profile, true, (stored.settings || {}).autoAcceptTerms !== false);
      const count = (results && (results.filled ?? results.length)) ?? "some";
      log(`Filled ${count} field(s) on this page.`);
    } catch (e) {
      log("Autofill checkpoint hit an error: " + e.message);
    }
  }

  async function runStep(step, index, total) {
    if (step.type === "autofill-checkpoint") {
      log(`Step ${index + 1}/${total}: fill page from profile`);
      await runAutofillCheckpoint();
      await waitForSettle(4000);
      return;
    }

    if (step.type === "click" || step.type === "file-upload") {
      const label = (step.target && (step.target.text || step.target.ariaLabel || step.target.automationId)) || "element";
      log(`Step ${index + 1}/${total}: ${step.type === "file-upload" ? "open file picker for" : "click"} "${label}"`);

      const el = await waitForElement(step.target, 15000);

      if (step.pauseBeforeSubmit) {
        log(`⏸ Paused before what looks like the final submit step ("${label}"). Review the application, then hit Confirm & Continue.`, { flowPaused: true });
        await waitForConfirm();
        if (stopRequested) return;
        log("Confirmed — continuing.");
      }

      await clickElement(el);
      await waitForSettle(8000);

      if (step.type === "file-upload") {
        log("⏸ If a file dialog opened, choose your resume now — I'll continue automatically once it's attached (up to 2 min).", { flowPaused: true });
        await waitForFileSelected(120000);
        log("Continuing.");
      }
      return;
    }
  }

  async function runFlow(steps) {
    running = true;
    stopRequested = false;
    currentSteps = steps;
    currentStepIndex = 0;
    log(`Starting automation — ${steps.length} step(s) to replay.`, { flowStarted: true });

    for (let i = 0; i < steps.length; i++) {
      if (stopRequested) { log("Stopped."); break; }
      currentStepIndex = i;
      try {
        await runStep(steps[i], i, steps.length);
      } catch (e) {
        log(`⚠️ Step ${i + 1} failed: ${e.message}. Stopping here — take a look at the page.`, { flowError: true });
        running = false;
        return;
      }
    }
    running = false;
    log(stopRequested ? "Automation stopped." : "✅ Flow complete. Give the application a final look before submitting anything not already confirmed.", { flowDone: true });
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "runFlow") {
      if (running) { sendResponse({ success: false, error: "A flow is already running on this page." }); return true; }
      runFlow(message.steps || []);
      sendResponse({ success: true });
      return true;
    }
    if (message.action === "stopFlow") {
      stopRequested = true;
      if (resolveConfirm) { resolveConfirm(); resolveConfirm = null; }
      sendResponse({ success: true });
      return true;
    }
    if (message.action === "confirmStep") {
      if (resolveConfirm) { resolveConfirm(); resolveConfirm = null; }
      sendResponse({ success: true });
      return true;
    }
    if (message.action === "getFlowStatus") {
      sendResponse({ running, currentStepIndex, totalSteps: currentSteps.length });
      return true;
    }
  });
})();
