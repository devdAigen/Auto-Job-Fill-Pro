// content.js — JobFill Pro v3

(function () {
  "use strict";

  // ─── Platform Detection ───────────────────────────────────────────────────
  const PLATFORMS = {
    workday: { match: /myworkdayjobs\.com/, name: "Workday" },
    greenhouse: { match: /greenhouse\.io|boards\.greenhouse\.io/, name: "Greenhouse" },
    lever: { match: /jobs\.lever\.co/, name: "Lever" },
    jobvite: { match: /jobvite\.com/, name: "Jobvite" },
    smartrecruiters: { match: /smartrecruiters\.com/, name: "SmartRecruiters" },
    icims: { match: /icims\.com/, name: "iCIMS" },
    taleo: { match: /taleo\.net/, name: "Taleo" },
    successfactors: { match: /successfactors\.com/, name: "SuccessFactors" }
  };

  function detectPlatform() {
    const url = window.location.href;
    for (const [key, platform] of Object.entries(PLATFORMS)) {
      if (platform.match.test(url)) return { id: key, ...platform };
    }
    return { id: "generic", name: "Generic" };
  }

  const currentPlatform = detectPlatform();

  // ─── Field Mappings ───────────────────────────────────────────────────────
  const FIELD_MAPPINGS = {
    firstName: {
      keys: ["firstname", "first_name", "fname", "givenname", "given_name", "applicant_first"],
      labels: ["first name", "given name"],
      workdayIds: ["legalNameSection_firstName", "firstName"]
    },
    lastName: {
      keys: ["lastname", "last_name", "lname", "familyname", "family_name", "surname", "applicant_last"],
      labels: ["last name", "family name", "surname"],
      workdayIds: ["legalNameSection_lastName", "lastName"]
    },
    fullName: {
      keys: ["fullname", "full_name", "name", "applicantname", "candidate_name", "legalname", "yourname"],
      labels: ["full name", "legal name", "your name"],
      workdayIds: ["legalName"]
    },
    email: {
      keys: ["email", "emailaddress", "email_address", "applicantemail"],
      labels: ["email", "email address", "e-mail"],
      workdayIds: ["email"]
    },
    phone: {
      keys: ["phone", "phonenumber", "phone_number", "mobile", "cell", "telephone", "contact_number"],
      labels: ["phone", "mobile", "telephone", "contact number"],
      workdayIds: ["phone", "phoneNumber"]
    },
    dob: {
      keys: ["dob", "dateofbirth", "date_of_birth", "birthdate", "birthday"],
      labels: ["date of birth", "dob", "birth date", "birthday"],
      workdayIds: ["dateOfBirth"]
    },
    gender: {
      keys: ["gender", "sex"],
      labels: ["gender", "sex"],
      workdayIds: ["gender"]
    },
    nationality: {
      keys: ["nationality", "citizenship", "national"],
      labels: ["nationality", "citizenship"],
      workdayIds: []
    },
    currentLocation: {
      keys: ["currentlocation", "current_location", "location", "presentlocation", "baselocation"],
      labels: ["current location", "location", "present location", "where are you based", "base location"],
      workdayIds: []
    },
    linkedIn: {
      keys: ["linkedin", "linkedinurl", "linkedin_url", "linkedinprofile"],
      labels: ["linkedin", "linkedin url", "linkedin profile"],
      workdayIds: ["linkedIn"]
    },
    github: {
      keys: ["github", "githuburl", "github_url"],
      labels: ["github", "github url"],
      workdayIds: []
    },
    portfolio: {
      keys: ["portfolio", "portfoliourl", "website", "personalwebsite"],
      labels: ["portfolio", "website", "personal website"],
      workdayIds: []
    },
    address: {
      keys: ["address", "street", "streetaddress", "address1", "address_line1"],
      labels: ["address", "street address"],
      workdayIds: ["addressSection_addressLine1"]
    },
    city: {
      keys: ["city", "town", "locality"],
      labels: ["city", "town"],
      workdayIds: ["addressSection_city"]
    },
    state: {
      keys: ["state", "province", "region", "state_province"],
      labels: ["state", "province", "region"],
      workdayIds: ["addressSection_countryRegion"]
    },
    country: {
      keys: ["country", "countrycode", "country_code"],
      labels: ["country"],
      workdayIds: ["addressSection_country"]
    },
    zipCode: {
      keys: ["zip", "zipcode", "zip_code", "postalcode", "postal_code", "postcode"],
      labels: ["zip", "zip code", "postal code", "postcode"],
      workdayIds: ["addressSection_postalCode"]
    },
    currentTitle: {
      keys: ["jobtitle", "job_title", "currenttitle", "title", "position"],
      labels: ["job title", "current title", "current position", "title"],
      workdayIds: []
    },
    currentCompany: {
      keys: ["company", "employer", "currentcompany", "current_company"],
      labels: ["current company", "employer", "current employer"],
      workdayIds: []
    },
    yearsOfExperience: {
      keys: ["experience", "yearsofexperience", "years_of_experience", "yoe"],
      labels: ["years of experience", "total experience", "experience"],
      workdayIds: []
    },
    currentSalary: {
      keys: ["currentsalary", "current_salary", "currentctc", "ctc"],
      labels: ["current salary", "current ctc", "present salary"],
      workdayIds: []
    },
    expectedSalary: {
      keys: ["salary", "expectedsalary", "expected_salary", "desiredsalary", "expectedctc"],
      labels: ["expected salary", "desired salary", "salary expectation", "expected ctc"],
      workdayIds: []
    },
    noticePeriod: {
      keys: ["noticeperiod", "notice_period", "notice"],
      labels: ["notice period", "notice"],
      workdayIds: []
    },
    availableFrom: {
      keys: ["availablefrom", "available_from", "startdate", "joiningdate"],
      labels: ["available from", "start date", "when can you start", "joining date"],
      workdayIds: []
    },
    workType: {
      keys: ["worktype", "work_type", "employmenttype", "employment_type", "jobtype"],
      labels: ["work type", "employment type", "job type"],
      workdayIds: []
    },
    workMode: {
      keys: ["workmode", "work_mode", "workarrangement", "remote", "workstyle"],
      labels: ["work mode", "remote", "hybrid", "work arrangement", "work style"],
      workdayIds: []
    },
    preferredLocation: {
      keys: ["preferredlocation", "preferred_location", "preferredcity", "desiredlocation"],
      labels: ["preferred location", "desired location", "preferred city", "preferred work location"],
      workdayIds: []
    },
    countryCode: {
      keys: ["countrycode", "country_code", "regioncode", "dialcode", "phonecode", "phonecountrycode"],
      labels: ["country code", "region code", "country/region code", "dial code", "phone country code"],
      workdayIds: []
    },
    degree: {
      keys: ["degree", "educationlevel", "education_level", "highestdegree", "qualification"],
      labels: ["degree", "education level", "highest degree", "qualification"],
      workdayIds: []
    },
    university: {
      keys: ["university", "school", "college", "institution"],
      labels: ["university", "school", "college", "institution"],
      workdayIds: []
    },
    gpa: {
      keys: ["gpa", "grade", "cgpa", "percentage", "marks"],
      labels: ["gpa", "cgpa", "grade", "percentage", "marks"],
      workdayIds: []
    },
    workAuthorized: {
      keys: ["authorized", "workauthorization", "legallyauthorized"],
      labels: ["authorized to work", "work authorization", "legally authorized", "eligible to work"],
      workdayIds: []
    },
    sponsorship: {
      keys: ["sponsorship", "visasponsorship", "requiresponsorship"],
      labels: ["sponsorship", "visa sponsorship", "require sponsorship", "need sponsorship"],
      workdayIds: []
    },
    veteranStatus: {
      keys: ["veteran", "veteranstatus", "veteran_status"],
      labels: ["veteran", "veteran status", "military status"],
      workdayIds: []
    },
    disabilityStatus: {
      keys: ["disability", "disabilitystatus", "disability_status"],
      labels: ["disability", "disability status"],
      workdayIds: []
    }
  };

  // ─── React Input Setters ──────────────────────────────────────────────────
  function setReactInputValue(el, value) {
    try {
      const proto = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
      if (proto?.set) proto.set.call(el, value); else el.value = value;
    } catch { el.value = value; }
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
  }

  function setReactTextareaValue(el, value) {
    try {
      const proto = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value");
      if (proto?.set) proto.set.call(el, value); else el.value = value;
    } catch { el.value = value; }
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // ─── Label Finder ─────────────────────────────────────────────────────────
  function getLabelText(el) {
    if (el.id) {
      try {
        const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
        if (label) return label.textContent.trim().toLowerCase();
      } catch {}
    }
    const parent = el.closest("label");
    if (parent) return parent.textContent.trim().toLowerCase();
    if (el.getAttribute("aria-label")) return el.getAttribute("aria-label").toLowerCase();
    const labelledBy = el.getAttribute("aria-labelledby");
    if (labelledBy) {
      const parts = labelledBy.split(/\s+/).map(id => document.getElementById(id)?.textContent || "");
      if (parts.some(p => p)) return parts.join(" ").trim().toLowerCase();
    }
    const container = el.closest("div, fieldset, section, li, td, [class*='field'], [class*='Field']");
    if (container) {
      const nearLabel = container.querySelector("label, .label, [class*='label'], legend, [data-automation-id*='Label']");
      if (nearLabel && !nearLabel.contains(el)) return nearLabel.textContent.trim().toLowerCase();
    }
    return "";
  }

  // ─── Field Matcher ────────────────────────────────────────────────────────
  function matchField(el) {
    const name = (el.name || "").toLowerCase().replace(/[-\s]/g, "");
    const id = (el.id || "").toLowerCase().replace(/[-\s]/g, "");
    const placeholder = (el.placeholder || "").toLowerCase();
    const automationId = (el.getAttribute("data-automation-id") || "").toLowerCase();
    const labelText = getLabelText(el);

    for (const [fieldKey, mapping] of Object.entries(FIELD_MAPPINGS)) {
      if (currentPlatform.id === "workday" && mapping.workdayIds?.length) {
        for (const wdId of mapping.workdayIds) {
          if (automationId.includes(wdId.toLowerCase())) return fieldKey;
        }
      }
      for (const key of mapping.keys) {
        if (name === key || id === key) return fieldKey;
        if (name.includes(key) || id.includes(key)) return fieldKey;
      }
      for (const lbl of mapping.labels) {
        if (labelText.includes(lbl) || placeholder.includes(lbl)) return fieldKey;
      }
    }
    return null;
  }

  // ─── Get Profile Value ────────────────────────────────────────────────────
  function getProfileValue(fieldKey, profile) {
    const map = {
      firstName: profile.personal?.firstName,
      lastName: profile.personal?.lastName,
      fullName: profile.personal?.fullName,
      email: profile.personal?.email,
      phone: profile.personal?.phone,
      dob: profile.personal?.dob,
      gender: profile.personal?.gender,
      nationality: profile.personal?.nationality,
      currentLocation: profile.personal?.currentLocation,
      linkedIn: profile.personal?.linkedIn,
      github: profile.personal?.github,
      portfolio: profile.personal?.portfolio,
      address: profile.personal?.address,
      city: profile.personal?.city,
      state: profile.personal?.state,
      country: profile.personal?.country,
      zipCode: profile.personal?.zipCode,
      currentTitle: profile.professional?.currentTitle,
      currentCompany: profile.professional?.currentCompany,
      yearsOfExperience: profile.professional?.yearsOfExperience,
      currentSalary: profile.professional?.currentSalary,
      expectedSalary: profile.professional?.expectedSalary,
      noticePeriod: profile.professional?.noticePeriod,
      availableFrom: profile.professional?.availableFrom,
      workType: profile.professional?.workType,
      workMode: profile.professional?.workMode,
      preferredLocation: profile.professional?.preferredLocation,
      countryCode: profile.professional?.countryCode,
      degree: profile.education?.degree,
      university: profile.education?.university,
      gpa: profile.education?.gpa,
      workAuthorized: profile.work?.authorized ? "Yes" : "No",
      sponsorship: profile.work?.sponsorship ? "Yes" : "No",
      veteranStatus: profile.diversity?.veteranStatus,
      disabilityStatus: profile.diversity?.disabilityStatus
    };
    return map[fieldKey] || null;
  }

  // ─── Yes/No Normalizer ────────────────────────────────────────────────────
  function normalizeYesNo(value) {
    const v = String(value).toLowerCase().trim();
    if (["true", "yes", "1", "y"].includes(v)) return "yes";
    if (["false", "no", "0", "n"].includes(v)) return "no";
    return v;
  }

  // ─── Fuzzy Match Score ────────────────────────────────────────────────────
  function fuzzyMatchScore(fieldText, question) {
    if (!fieldText || !question) return 0;
    const ft = fieldText.toLowerCase();
    const q = question.toLowerCase().trim();

    // Direct substring — highest priority
    if (ft.includes(q) || q.includes(ft.slice(0, Math.min(ft.length, 30)))) return 1.0;

    const fieldWords = new Set(ft.split(/\W+/).filter(w => w.length > 2));
    const qWords = q.split(/\W+/).filter(w => w.length > 2);
    if (qWords.length === 0) return 0;

    let matches = 0;
    for (const w of qWords) {
      if (fieldWords.has(w) || ft.includes(w)) matches++;
    }
    const overlapRatio = matches / qWords.length;

    const synonymGroups = [
      ["why", "reason", "motivation", "interest", "passionate", "joining"],
      ["experience", "background", "worked", "years", "expertise"],
      ["strength", "strong", "good", "best", "excel"],
      ["weakness", "improve", "challenge", "difficult"],
      ["salary", "compensation", "pay", "ctc", "expect", "package"],
      ["location", "relocate", "move", "city", "remote", "preferred"],
      ["availability", "start", "join", "notice", "when"],
      ["visa", "sponsor", "authorized", "work permit", "legal", "eligible"],
      ["reference", "contact", "referee"],
      ["cover", "letter", "introduce", "yourself", "summary", "about"],
      ["employed", "employment", "work", "worked", "previously", "before", "past"],
      ["honeywell", "company", "employer", "subsidiary", "intern", "contract"]
    ];

    let synonymBoost = 0;
    for (const group of synonymGroups) {
      const fHas = group.some(s => ft.includes(s));
      const qHas = group.some(s => q.includes(s));
      if (fHas && qHas) { synonymBoost += 0.2; break; }
    }

    return Math.min(1.0, overlapRatio + synonymBoost);
  }

  // ─── Improved Select Fill ─────────────────────────────────────────────────
  function fillSelectBestMatch(selectEl, desiredValue) {
    if (!desiredValue) return false;
    const desired = String(desiredValue).toLowerCase().trim();
    const normalizedDesired = normalizeYesNo(desired);
    const options = Array.from(selectEl.options);

    let match = null;

    // Yes/No normalization first
    if (["yes", "no"].includes(normalizedDesired)) {
      match = options.find(o => normalizeYesNo(o.text.toLowerCase().trim()) === normalizedDesired);
    }
    if (!match) match = options.find(o => o.value.toLowerCase() === desired);
    if (!match) match = options.find(o => o.text.toLowerCase().trim() === desired);
    if (!match) match = options.find(o => o.text.toLowerCase().trim().startsWith(desired));
    if (!match) match = options.find(o => desired.startsWith(o.text.toLowerCase().trim()) && o.text.trim().length > 2);
    if (!match) match = options.find(o => o.text.toLowerCase().includes(desired));
    if (!match) match = options.find(o => desired.includes(o.text.toLowerCase().trim()) && o.text.trim().length > 2);

    if (match) {
      selectEl.value = match.value;
      selectEl.dispatchEvent(new Event("change", { bubbles: true }));
      selectEl.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    }
    return false;
  }

  // ─── Workday Combobox ─────────────────────────────────────────────────────
  async function fillWorkdayCombobox(el, value) {
    if (!value) return false;
    try {
      el.click(); el.focus();
      await new Promise(r => setTimeout(r, 400));
      const optSels = '[role="option"], [data-automation-id*="option"], [data-automation-id*="Option"], li[role="option"]';
      let options = document.querySelectorAll(optSels);
      if (options.length === 0 && el.tagName === "INPUT") {
        setReactInputValue(el, value);
        await new Promise(r => setTimeout(r, 500));
        options = document.querySelectorAll(optSels);
      }
      if (options.length > 0) {
        const desired = value.toLowerCase().trim();
        const match = Array.from(options).find(o =>
          o.textContent.toLowerCase().trim() === desired ||
          o.textContent.toLowerCase().includes(desired) ||
          desired.includes(o.textContent.toLowerCase().trim())
        );
        if (match) { match.click(); await new Promise(r => setTimeout(r, 200)); return true; }
      }
    } catch {}
    return false;
  }

  // ─── Fill Single Input ────────────────────────────────────────────────────
  function fillInput(el, value, skipFilled = true) {
    if (!value) return false;
    if (skipFilled && el.value && el.value.trim() !== "") return false;
    if (el.disabled || el.readOnly) return false;

    const tag = el.tagName.toLowerCase();
    const type = (el.type || "").toLowerCase();

    if (tag === "textarea") { setReactTextareaValue(el, value); return true; }
    if (tag === "select") return fillSelectBestMatch(el, value);

    if (type === "radio") {
      const elLabel = getLabelText(el);
      const elValue = (el.value || "").toLowerCase();
      const desired = normalizeYesNo(value.toLowerCase());
      if (elLabel.includes(value.toLowerCase()) || elValue === value.toLowerCase() ||
          normalizeYesNo(elLabel) === desired || normalizeYesNo(elValue) === desired) {
        el.click(); return true;
      }
      return false;
    }

    if (type === "date") {
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) { setReactInputValue(el, value); return true; }
      return false;
    }

    if (type === "checkbox") return false;

    if (["text", "email", "tel", "url", "number", "search", ""].includes(type)) {
      setReactInputValue(el, value); return true;
    }
    return false;
  }

  // ─── Yes/No Radio Groups ──────────────────────────────────────────────────
  function fillYesNoRadios(profile) {
    const groups = {};
    document.querySelectorAll('input[type="radio"]').forEach(r => {
      const grp = r.name || r.getAttribute("data-automation-id") || Math.random();
      if (!groups[grp]) groups[grp] = [];
      groups[grp].push(r);
    });

    for (const group of Object.values(groups)) {
      if (group.length < 2) continue;
      const labelText = getLabelText(group[0]);
      const isAuthQ = /authorized|eligible|legally|work in/i.test(labelText);
      const isSponsorQ = /sponsor|sponsorship|visa/i.test(labelText);
      if (isAuthQ) {
        const want = profile.work?.authorized ? "yes" : "no";
        group.forEach(r => { if (normalizeYesNo(r.value || getLabelText(r)) === want) r.click(); });
      }
      if (isSponsorQ) {
        const want = profile.work?.sponsorship ? "yes" : "no";
        group.forEach(r => { if (normalizeYesNo(r.value || getLabelText(r)) === want) r.click(); });
      }
    }
  }

  // ─── Fuzzy Custom Answers ─────────────────────────────────────────────────
  function fillCustomAnswers(customAnswers) {
    if (!customAnswers?.length) return 0;
    console.log("[JobFill] fillCustomAnswers called with", customAnswers.length, "items");
    let count = 0;
    const candidates = [
      ...document.querySelectorAll("textarea"),
      ...document.querySelectorAll('input[type="text"]')
    ];
    candidates.forEach(el => {
      if (el.value?.trim()) return;
      const label = getLabelText(el);
      const ph = (el.placeholder || "").toLowerCase();
      const combined = (label + " " + ph).trim();
      if (!combined) return;

      let bestMatch = null, bestScore = 0;
      for (const qa of customAnswers) {
        if (!qa.question || !qa.answer) continue;
        const score = fuzzyMatchScore(combined, qa.question);
        if (score > bestScore && score >= 0.35) { bestScore = score; bestMatch = qa; }
      }
      if (bestMatch) {
        console.log("[JobFill] Matched custom answer:", bestMatch.question, "score:", bestScore, "field:", combined);
        el.tagName.toLowerCase() === "textarea"
          ? setReactTextareaValue(el, bestMatch.answer)
          : setReactInputValue(el, bestMatch.answer);
        count++;
      }
    });
    return count;
  }

  // ─── Fuzzy Custom Fields ──────────────────────────────────────────────────
  function fillCustomFields(customFields) {
    if (!customFields?.length) return 0;
    console.log("[JobFill] fillCustomFields called with", customFields.length, "items");
    let count = 0;
    const candidates = [
      ...document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="file"]):not([type="radio"]):not([type="checkbox"])'),
      ...document.querySelectorAll("textarea")
    ];
    candidates.forEach(el => {
      if (el.value?.trim()) return;
      const label = getLabelText(el);
      const ph = (el.placeholder || "").toLowerCase();
      const name = (el.name || "").toLowerCase();
      const id = (el.id || "").toLowerCase();
      const combined = (label + " " + ph + " " + name + " " + id).trim();

      let bestMatch = null, bestScore = 0;
      for (const cf of customFields) {
        if (!cf.label || !cf.value) continue;
        const score = fuzzyMatchScore(combined, cf.label);
        if (score > bestScore && score >= 0.4) { bestScore = score; bestMatch = cf; }
      }
      if (bestMatch) {
        console.log("[JobFill] Matched custom field:", bestMatch.label, "score:", bestScore);
        el.tagName.toLowerCase() === "textarea"
          ? setReactTextareaValue(el, bestMatch.value)
          : setReactInputValue(el, bestMatch.value);
        count++;
      }
    });
    return count;
  }

  // ─── Yes/No Answers (Context-Aware) ───────────────────────────────────────
  function fillYesNoAnswers(yesNoAnswers) {
    if (!yesNoAnswers?.length) return 0;
    console.log("[JobFill] fillYesNoAnswers called with", yesNoAnswers.length, "items");
    let count = 0;

    // Handle <select> dropdowns
    document.querySelectorAll("select").forEach(sel => {
      const label = getLabelText(sel);
      const ph = (sel.placeholder || "").toLowerCase();
      const combined = (label + " " + ph).trim();
      if (!combined) return;

      let bestMatch = null, bestScore = 0;
      for (const yn of yesNoAnswers) {
        if (!yn.question || yn.answer === "Skip") continue;
        const score = fuzzyMatchScore(combined, yn.question);
        if (score > bestScore && score >= 0.3) { bestScore = score; bestMatch = yn; }
      }
      if (bestMatch) {
        console.log("[JobFill] Yes/No select match:", bestMatch.question, "->", bestMatch.answer, "score:", bestScore);
        if (fillSelectBestMatch(sel, bestMatch.answer)) count++;
      }
    });

    // Handle radio groups
    const groups = {};
    document.querySelectorAll('input[type="radio"]').forEach(r => {
      const grp = r.name || r.closest("fieldset")?.id || "";
      if (!groups[grp]) groups[grp] = [];
      groups[grp].push(r);
    });

    for (const group of Object.values(groups)) {
      if (group.length < 2) continue;
      const label = getLabelText(group[0]);
      if (!label) continue;

      let bestMatch = null, bestScore = 0;
      for (const yn of yesNoAnswers) {
        if (!yn.question || yn.answer === "Skip") continue;
        const score = fuzzyMatchScore(label, yn.question);
        if (score > bestScore && score >= 0.3) { bestScore = score; bestMatch = yn; }
      }
      if (bestMatch) {
        console.log("[JobFill] Yes/No radio match:", bestMatch.question, "->", bestMatch.answer, "score:", bestScore);
        const desired = normalizeYesNo(bestMatch.answer);
        group.forEach(r => {
          const rv = normalizeYesNo(r.value || getLabelText(r));
          if (rv === desired) { r.click(); count++; }
        });
      }
    }
    return count;
  }

  // ─── Smart Checkbox Handler ───────────────────────────────────────────────
  function autoAcceptTerms() {
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      const label = getLabelText(cb).toLowerCase();
      if (!label) return;

      // CASE 1: ALWAYS UNCHECK — marketing, follow, newsletter, social opt-ins
      const OPT_OUT = /follow\s+\w+|subscribe|newsletter|marketing email|promotional|notify me|keep me updated|stay up to date|updates from|news from|send me offers|send me deals|send me jobs|send me alerts|opt.?in to marketing|opt.?in to promo|connect on linkedin|follow \S+ on linkedin|follow \S+ page/i;
      const isOptOut = OPT_OUT.test(label);

      if (isOptOut) {
        if (cb.checked) {
          cb.checked = false;
          cb.dispatchEvent(new Event("change", { bubbles: true }));
          cb.dispatchEvent(new Event("click", { bubbles: true }));
        }
        return;
      }

      // CASE 2: ALWAYS CHECK — consent, terms, privacy, application submission
      const isConsent = /i consent|i agree|i accept|i certify|i acknowledge|i authorize|i confirm|terms and conditions|terms & conditions|privacy policy|submit my application|application information|data processing|gdpr|consent to process|consent to submit|consent to share|consent to store|consent to use/i.test(label);

      if (isConsent && !cb.checked) {
        cb.checked = true;
        cb.dispatchEvent(new Event("change", { bubbles: true }));
        cb.dispatchEvent(new Event("click", { bubbles: true }));
        return;
      }

      // CASE 3: GENERIC TERMS fallback
      const isGenericTerms = /\bterms\b|\bconditions\b|\bprivacy\b|\bagree\b|\baccept\b|\backnowledge\b|\bcertify\b|\bconfirm\b|\bauthorize\b/i.test(label);
      if (isGenericTerms && !cb.checked) {
        cb.checked = true;
        cb.dispatchEvent(new Event("change", { bubbles: true }));
        cb.dispatchEvent(new Event("click", { bubbles: true }));
      }
    });
  }

  // ─── Workday Comboboxes ───────────────────────────────────────────────────
  async function fillAllWorkdayComboboxes(profile) {
    if (currentPlatform.id !== "workday") return;
    const comboboxes = document.querySelectorAll('[role="combobox"], [aria-haspopup="listbox"], [data-automation-id*="prompt"]');
    for (const el of comboboxes) {
      const fieldKey = matchField(el);
      if (!fieldKey) continue;
      const value = getProfileValue(fieldKey, profile);
      if (!value) continue;
      await fillWorkdayCombobox(el, value);
    }
  }

  // ─── Main Auto-Fill ───────────────────────────────────────────────────────
  async function autoFill(profile, skipFilled = true, acceptTerms = true) {
    console.log("[JobFill] autoFill start — customAnswers:", profile.customAnswers?.length, "customFields:", profile.customFields?.length, "yesNoAnswers:", profile.yesNoAnswers?.length);
    const results = { filled: 0, skipped: 0, errors: [], fields: [] };

    const inputs = document.querySelectorAll(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="file"]), textarea, select'
    );

    inputs.forEach(el => {
      try {
        const fieldKey = matchField(el);
        if (!fieldKey) { results.skipped++; return; }
        const value = getProfileValue(fieldKey, profile);
        if (!value) { results.skipped++; return; }
        const filled = fillInput(el, value, skipFilled);
        if (filled) { results.filled++; results.fields.push(fieldKey); }
        else { results.skipped++; }
      } catch (err) { results.errors.push(err.message); }
    });

    fillYesNoRadios(profile);

    const ynCount = fillYesNoAnswers(profile.yesNoAnswers || []);
    results.filled += ynCount;

    const customCount = fillCustomAnswers(profile.customAnswers || []);
    results.filled += customCount;

    const cfCount = fillCustomFields(profile.customFields || []);
    results.filled += cfCount;

    await fillAllWorkdayComboboxes(profile);

    if (acceptTerms) autoAcceptTerms();

    console.log("[JobFill] autoFill done — filled:", results.filled, "skipped:", results.skipped);
    return results;
  }

  // ─── Clear All Fields ─────────────────────────────────────────────────────
  function clearAllFields() {
    document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="file"])').forEach(el => {
      if (!el.disabled && !el.readOnly) setReactInputValue(el, "");
    });
    document.querySelectorAll("textarea").forEach(el => setReactTextareaValue(el, ""));
  }

  // ─── MutationObserver ─────────────────────────────────────────────────────
  let fillDebounce = null;
  let autoFillEnabled = false;
  let storedProfile = null;
  let acceptTermsEnabled = true;

  const observer = new MutationObserver(() => {
    if (!autoFillEnabled || !storedProfile) return;
    clearTimeout(fillDebounce);
    fillDebounce = setTimeout(() => autoFill(storedProfile, true, acceptTermsEnabled), 800);
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // ─── Message Listener ─────────────────────────────────────────────────────
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "fillNow") {
      storedProfile = message.profile;
      acceptTermsEnabled = message.autoAcceptTerms !== false;
      console.log("[JobFill] fillNow received — customAnswers:", message.profile?.customAnswers?.length, "customFields:", message.profile?.customFields?.length, "yesNoAnswers:", message.profile?.yesNoAnswers?.length);
      autoFill(message.profile, message.skipFilled !== false, acceptTermsEnabled)
        .then(results => sendResponse({ success: true, results }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;
    }
    if (message.action === "clearFields") {
      clearAllFields(); sendResponse({ success: true }); return true;
    }
    if (message.action === "getStatus") {
      const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="file"]), textarea, select');
      let detectedCount = 0;
      inputs.forEach(el => { if (matchField(el)) detectedCount++; });
      sendResponse({ platform: currentPlatform, fieldsDetected: detectedCount, url: window.location.href, isJobSite: currentPlatform.id !== "generic" });
      return true;
    }
    if (message.action === "setAutoFill") {
      autoFillEnabled = message.enabled; storedProfile = message.profile || storedProfile;
      sendResponse({ success: true }); return true;
    }
  });

  // ─── Auto-fill on page load ───────────────────────────────────────────────
  chrome.storage.local.get(["profile", "settings"], result => {
    const settings = result.settings || {};
    storedProfile = result.profile || null;
    acceptTermsEnabled = settings.autoAcceptTerms !== false;
    if (settings.autoFillOnLoad && storedProfile) {
      setTimeout(() => autoFill(storedProfile, true, acceptTermsEnabled), 1500);
    }
  });

  // ─── Credentials Auto-fill ────────────────────────────────────────────────
  chrome.storage.local.get(["credentials"], result => {
    const creds = result.credentials || [];
    if (!creds.length) return;

    const url = window.location.href;

    // Specific URL match first, then fallback to blank URL (wildcard)
    const matched = creds.find(c => c.siteUrl && url.includes(c.siteUrl))
                 || creds.find(c => !c.siteUrl); // blank = all sites

    if (!matched) return;

    setTimeout(() => {
      const hasPasswordField = document.querySelector('input[type="password"]');
      if (!hasPasswordField) return; // Only fill on actual login pages

      const emailInputs = document.querySelectorAll([
        'input[type="email"]',
        'input[type="text"][name*="email" i]',
        'input[type="text"][id*="email" i]',
        'input[name*="username" i]',
        'input[name*="login" i]',
        'input[id*="username" i]',
        'input[id*="login" i]'
      ].join(", "));
      const passInputs = document.querySelectorAll('input[type="password"]');

      if (emailInputs[0] && matched.email) {
        setReactInputValue(emailInputs[0], matched.email);
        console.log("[JobFill] Filled email credential");
      }
      if (passInputs[0] && matched.password) {
        setReactInputValue(passInputs[0], matched.password);
        console.log("[JobFill] Filled password credential");
      }
    }, 1200);
  });

  // Notify background
  try { chrome.runtime.sendMessage({ action: "pageLoaded", platform: currentPlatform, url: window.location.href }); } catch {}

})();
