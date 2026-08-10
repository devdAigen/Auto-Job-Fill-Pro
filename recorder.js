// recorder.js — JobFill Pro "Learn Mode"
//
// Watches the user manually fill out an application form once, captures each
// field's label + value + type + id, and hands the list back to the popup for
// review. The popup then saves the reviewed entries into the existing
// customAnswers / customFields / yesNoAnswers / standard-profile stores, which
// the autoFill engine in content.js already knows how to replay via fuzzy
// label matching. This module never guesses at replay time — it only records.
//
// Why match by label instead of element id: Workday regenerates element ids
// (and often automation ids) per session/tenant, so an id captured today is
// unlikely to exist tomorrow. Label/question text is the stable signal, so
// that's what capture is keyed on. The id is still recorded and shown to the
// user as a debugging hint, but it isn't used for matching on replay.

(function () {
  "use strict";

  let recording = false;
  let attachedListeners = false;
  const capturedMap = new Map(); // key -> record

  function core() {
    return window.__jobFillCore || {};
  }

  function normalizeKey(text) {
    return (text || "").replace(/\s+/g, " ").trim().toLowerCase().replace(/[*:]+$/, "");
  }

  function cleanText(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }

  function detectInputType(el) {
    const tag = el.tagName.toLowerCase();
    if (tag === "select") return "select";
    if (tag === "textarea") return "textarea";
    if (tag === "button") return "workday-dropdown";
    if (tag === "input") {
      const t = (el.type || "text").toLowerCase();
      if (t === "radio") return "radio";
      if (t === "checkbox") return "checkbox";
      return "text";
    }
    return tag;
  }

  function persistBuffer() {
    try {
      chrome.storage.local.set({ recordingBuffer: Array.from(capturedMap.values()) });
    } catch {}
  }

  function upsertCapture(record) {
    if (!record.value) return;
    const label = cleanText(record.label);
    const key = label ? "label:" + normalizeKey(label) : "id:" + (record.elementId || record.elementName || Math.random());
    capturedMap.set(key, {
      label: label || "(unlabeled field)",
      value: cleanText(record.value),
      type: record.type,
      elementId: record.elementId || "",
      elementName: record.elementName || "",
      automationId: record.automationId || "",
      capturedAt: Date.now()
    });
    persistBuffer();
  }

  // ─── Field-type handlers ────────────────────────────────────────────────
  function handleTextLike(el) {
    const value = (el.value || "").trim();
    if (!value) return;
    const c = core();
    const label = c.getGroupQuestionLabel ? c.getGroupQuestionLabel(el) : (c.getLabelText ? c.getLabelText(el) : "");
    upsertCapture({
      label,
      value,
      type: detectInputType(el),
      elementId: el.id,
      elementName: el.name,
      automationId: el.getAttribute && el.getAttribute("data-automation-id")
    });
  }

  function handleSelect(el) {
    const opt = el.options && el.options[el.selectedIndex];
    const value = opt ? opt.textContent : el.value;
    if (!value || !value.trim()) return;
    const c = core();
    const label = c.getGroupQuestionLabel ? c.getGroupQuestionLabel(el) : (c.getLabelText ? c.getLabelText(el) : "");
    upsertCapture({ label, value, type: "select", elementId: el.id, elementName: el.name });
  }

  function handleRadioOrCheckbox(el) {
    if (!el.checked) return;
    const c = core();
    const groupLabel = c.getGroupQuestionLabel ? c.getGroupQuestionLabel(el) : "";
    const optionLabel = c.getRadioOptionLabel ? c.getRadioOptionLabel(el) : "";
    const value = optionLabel || el.value || (el.type === "checkbox" ? "Checked" : "");
    upsertCapture({
      label: groupLabel || value,
      value,
      type: el.type,
      elementId: el.id,
      elementName: el.name
    });
  }

  // Workday (and similar) render dropdowns as <button aria-haspopup="listbox">
  // with the options rendered into a detached listbox. Capture on the option
  // click, then resolve the owning button via aria-controls.
  function handleOptionClick(optionEl) {
    const listbox = optionEl.closest('[role="listbox"]') || optionEl.closest("ul[id], div[id]");
    const listboxId = listbox && listbox.id;
    let btn = null;
    if (listboxId) {
      try { btn = document.querySelector(`button[aria-controls="${CSS.escape(listboxId)}"]`); } catch {}
    }
    const value = cleanText(optionEl.textContent);
    if (!value) return;
    const c = core();
    const label = btn
      ? (c.getWorkdayButtonLabel ? c.getWorkdayButtonLabel(btn) : (c.getLabelText ? c.getLabelText(btn) : ""))
      : "";
    // Small delay lets Workday's React state (button text/aria-label) settle
    // before we treat this as final — avoids capturing a stale label.
    setTimeout(() => {
      upsertCapture({
        label: label || value,
        value,
        type: "workday-dropdown",
        elementId: (btn && btn.id) || ""
      });
    }, 150);
  }

  // ─── Delegated listeners (capture phase so we see blur/change on every field) ──
  function onChange(e) {
    if (!recording) return;
    const el = e.target;
    if (!el || !el.tagName) return;
    const tag = el.tagName.toLowerCase();
    if (tag === "select") return handleSelect(el);
    if (tag === "input") {
      const t = (el.type || "text").toLowerCase();
      if (t === "radio" || t === "checkbox") return handleRadioOrCheckbox(el);
    }
  }

  function onBlur(e) {
    if (!recording) return;
    const el = e.target;
    if (!el || !el.tagName) return;
    const tag = el.tagName.toLowerCase();
    if (tag === "textarea") return handleTextLike(el);
    if (tag === "input") {
      const t = (el.type || "text").toLowerCase();
      if (t !== "radio" && t !== "checkbox" && t !== "hidden" && t !== "submit" && t !== "button" && t !== "file") {
        handleTextLike(el);
      }
    }
  }

  function onClick(e) {
    if (!recording) return;
    const optionEl = e.target.closest && e.target.closest('[role="option"]');
    if (optionEl) handleOptionClick(optionEl);
  }

  function attachListeners() {
    if (attachedListeners) return;
    document.addEventListener("change", onChange, true);
    document.addEventListener("blur", onBlur, true);
    document.addEventListener("click", onClick, true);
    attachedListeners = true;
  }

  function detachListeners() {
    document.removeEventListener("change", onChange, true);
    document.removeEventListener("blur", onBlur, true);
    document.removeEventListener("click", onClick, true);
    attachedListeners = false;
  }

  // ─── Message API ────────────────────────────────────────────────────────
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "startRecording") {
      recording = true;
      capturedMap.clear();
      attachListeners();
      chrome.storage.local.set({ recordingBuffer: [], recordingActive: true });
      sendResponse({ success: true });
      return true;
    }
    if (message.action === "stopRecording") {
      recording = false;
      detachListeners();
      chrome.storage.local.set({ recordingActive: false });
      sendResponse({ success: true, fields: Array.from(capturedMap.values()) });
      return true;
    }
    if (message.action === "discardRecording") {
      recording = false;
      detachListeners();
      capturedMap.clear();
      chrome.storage.local.set({ recordingBuffer: [], recordingActive: false });
      sendResponse({ success: true });
      return true;
    }
    if (message.action === "getRecordingStatus") {
      sendResponse({ recording, count: capturedMap.size });
      return true;
    }
  });

  // If the popup was closed mid-recording (e.g. user switched tabs to fill the
  // form), pick the session back up so recording keeps going.
  try {
    chrome.storage.local.get(["recordingActive"], (r) => {
      if (r && r.recordingActive) {
        recording = true;
        attachListeners();
      }
    });
  } catch {}
})();
