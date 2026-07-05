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
    successfactors: { match: /successfactors\.com/, name: "SuccessFactors" },
    naukri: { match: /naukri\.com/, name: "Naukri" },
    linkedin: { match: /linkedin\.com|lnkd\.in/i, name: "LinkedIn" }
  };

  function detectPlatform() {
    const url = window.location.href;
    const hostname = window.location.hostname.toLowerCase();
    for (const [key, platform] of Object.entries(PLATFORMS)) {
      if (platform.match.test(url) || platform.match.test(hostname)) return { id: key, ...platform };
    }
    return { id: "generic", name: "Generic" };
  }

  const currentPlatform = detectPlatform();
  console.log("[JobFill] content.js loaded", currentPlatform, "hostname=", window.location.hostname);
  if (currentPlatform.id === "linkedin") {
    try { watchLinkedInFollowCheckbox(); } catch (e) { console.warn("[JobFill] watchLinkedInFollowCheckbox failed", e); }
  }

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
      labels: ["phone number", "mobile number", "telephone number", "contact number", "phone no"],
      workdayIds: ["phone", "phoneNumber"]
    },
    phoneDeviceType: {
      keys: ["phonedevicetype", "phone_device_type", "devicetype", "phonetype"],
      labels: ["phone device type", "device type", "phone type"],
      workdayIds: ["phoneDeviceType"]
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
      keys: ["country","nation","nationality"],
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
    field: {
      keys: ["fieldofstudy", "field_of_study", "major", "specialization", "course", "study"],
      labels: ["field of study", "major", "specialization", "course", "study"],
      workdayIds: []
    },
    graduationYear: {
      keys: ["graduationyear", "graduation_year", "gradyear", "yearofgraduation", "graduated"],
      labels: ["graduation year", "year of graduation", "graduated"],
      workdayIds: []
    },
    secondarySchool: {
      keys: ["secondaryschool", "secondary_school", "highschool", "high_school", "schoolname"],
      labels: ["secondary school", "high school", "school"],
      workdayIds: []
    },
    secondaryYear: {
      keys: ["secondaryyear", "secondary_year", "highschoolgraduationyear", "high_school_graduation_year"],
      labels: ["secondary graduation year", "high school graduation year", "graduation year"],
      workdayIds: []
    },
    gpa: {
      keys: ["gpa", "grade", "cgpa", "percentage", "marks"],
      labels: ["gpa", "cgpa", "grade", "percentage", "marks"],
      workdayIds: []
    },
    employeeId: {
      keys: ["employeeid", "employee_id", "empid", "emp_id"],
      labels: ["employee id", "employee identification", "emp id"],
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
  const DEBUG_FILL_EVENTS = false;

  function describeFillElement(el) {
    if (!el) return null;
    let label = "";
    try { label = getLabelText(el); } catch {}
    return {
      tag: el.tagName || "",
      type: el.type || "",
      id: el.id || "",
      name: el.name || "",
      className: String(el.className || ""),
      role: el.getAttribute?.("role") || "",
      ariaLabel: el.getAttribute?.("aria-label") || "",
      ariaHaspopup: el.getAttribute?.("aria-haspopup") || "",
      ariaOwns: el.getAttribute?.("aria-owns") || "",
      ariaControls: el.getAttribute?.("aria-controls") || "",
      dataAutomationId: el.getAttribute?.("data-automation-id") || "",
      value: el.value || "",
      label,
      platform: currentPlatform.id
    };
  }

  function debugFillPoint(stage, el, value, extra = {}) {
    if (!DEBUG_FILL_EVENTS) return;
    try {
      console.groupCollapsed(`[JobFill Debug] ${stage}`);
      console.log("element", describeFillElement(el));
      console.log("value", value);
      if (Object.keys(extra).length) console.log("extra", extra);
      console.trace("trace");
      console.groupEnd();
    } catch (err) {
      try { console.log("[JobFill Debug]", stage, err?.message || err); } catch {}
    }
  }

  function setReactInputValue(el, value) {
    debugFillPoint("setReactInputValue:before-set", el, value);
    try {
      const proto = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
      if (proto?.set) proto.set.call(el, value); else el.value = value;
      debugFillPoint("setReactInputValue:after-set", el, value);
    } catch (err) {
      debugFillPoint("setReactInputValue:set-error", el, value, { error: err?.message || String(err) });
      try { el.value = value; } catch {}
    }
    debugFillPoint("setReactInputValue:before-input-event", el, value);
    try { el.dispatchEvent(new Event("input", { bubbles: true })); } catch (err) { debugFillPoint("setReactInputValue:input-error", el, value, { error: err?.message || String(err) }); }
    debugFillPoint("setReactInputValue:after-input-event", el, value);
    debugFillPoint("setReactInputValue:before-change-event", el, value);
    try { el.dispatchEvent(new Event("change", { bubbles: true })); } catch (err) { debugFillPoint("setReactInputValue:change-error", el, value, { error: err?.message || String(err) }); }
    debugFillPoint("setReactInputValue:after-change-event", el, value);
    // IMPORTANT: Do NOT dispatch keydown/keyup on Workday — it triggers internal
    // React navigation that fetches community.workday.com causing a CORS crash.
    if (currentPlatform.id !== "workday") {
      debugFillPoint("setReactInputValue:before-keydown-event", el, value);
      try { el.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true })); } catch (err) { debugFillPoint("setReactInputValue:keydown-error", el, value, { error: err?.message || String(err) }); }
      debugFillPoint("setReactInputValue:after-keydown-event", el, value);
      debugFillPoint("setReactInputValue:before-keyup-event", el, value);
      try { el.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true })); } catch (err) { debugFillPoint("setReactInputValue:keyup-error", el, value, { error: err?.message || String(err) }); }
      debugFillPoint("setReactInputValue:after-keyup-event", el, value);
    }
  }

  function setReactTextareaValue(el, value) {
    try {
      const proto = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value");
      if (proto?.set) proto.set.call(el, value); else el.value = value;
    } catch { try { el.value = value; } catch {} }
    try { el.dispatchEvent(new Event("input", { bubbles: true })); } catch {}
    try { el.dispatchEvent(new Event("change", { bubbles: true })); } catch {}
  }

  // Workday pairs each button dropdown with a hidden text input for its internal
  // value (e.g. class="css-77hcv" value="44b328d5b94e..."). Filling these directly
  // corrupts Workday's React state and causes Symbol.iterator crashes.
  // Detect them by: Workday platform + single CSS class + no visible label.
  function isWorkdayInternalInput(el) {
    if (currentPlatform.id !== "workday") return false;
    if (el.type === "hidden") return true;
    const cls = (el.className || "").trim();
    // Workday internal inputs have a single generated css-XXXXX class and no label
    if (/^css-[a-z0-9]+$/.test(cls) && !getLabelText(el)) return true;
    return false;
  }

  function isWorkdayManagedPickerInput(el) {
    if (currentPlatform.id !== "workday") return false;
    if (el.tagName?.toLowerCase() !== "input") return false;

    const type = (el.type || "").toLowerCase();
    if (!["text", "search", ""].includes(type)) return false;

    // Workday multiselect widgets (e.g. Country Phone Code) render a search <input>
    // with data-automation-id="searchBox" inside a data-uxi-widget-type="multiselect"
    // container. Filling this input directly re-opens the dropdown in a loop.
    const automationId = (el.getAttribute("data-automation-id") || "").toLowerCase();
    if (automationId === "searchbox") return true;
    if (el.getAttribute("data-uxi-widget-type") === "selectinput") return true;
    if (el.closest('[data-uxi-widget-type="multiselect"], [data-automation-id="multiSelectContainer"]')) return true;

    const attrs = [
      el.getAttribute("role"),
      el.getAttribute("aria-haspopup"),
      el.getAttribute("aria-owns"),
      el.getAttribute("aria-controls"),
      el.getAttribute("aria-expanded"),
      automationId,
      el.getAttribute("aria-label"),
      el.name,
      el.id,
      getLabelText(el)
    ].filter(Boolean).join(" ").toLowerCase();

    if (/\b(combobox|listbox|prompt|country|country\/region|region|state|province|phone device type|phone country code|country code)\b/.test(attrs)) {
      return true;
    }

    return false;
  }

  // ─── Label Finder ─────────────────────────────────────────────────────────
  function getLabelText(el) {
    if (!el) return "";

    // Helper: clean innerText (collapses whitespace from nested spans)
    const clean = node => node.innerText.replace(/\s+/g, " ").trim().toLowerCase();

    if (el.id) {
      try {
        const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
        if (label) return clean(label);
      } catch {}
      // Brute-force scan for Ember/React IDs with special chars (e.g. LinkedIn)
      const allLabels = document.querySelectorAll("label[for]");
      for (const l of allLabels) {
        if (l.getAttribute("for") === el.id) return clean(l);
      }
    }

    const parentLabel = el.closest("label");
    if (parentLabel) return clean(parentLabel);

    if (el.getAttribute("aria-label"))
      return el.getAttribute("aria-label").replace(/\s+/g, " ").toLowerCase();

    const labelledBy = el.getAttribute("aria-labelledby");
    if (labelledBy) {
      const parts = labelledBy.split(/\s+/).map(id => document.getElementById(id)?.innerText || "");
      if (parts.some(p => p)) return parts.join(" ").replace(/\s+/g, " ").trim().toLowerCase();
    }

    // Workday: fieldset/legend + richText walker
    if (currentPlatform.id === "workday") {
      const fieldset = el.closest("fieldset");
      if (fieldset) {
        const legend = fieldset.querySelector("legend");
        if (legend) { const t = clean(legend); if (t) return t; }
      }
      let ancestor = el.parentElement;
      while (ancestor) {
        if (ancestor.matches("label, legend")) return clean(ancestor);
        const nearLabel = ancestor.querySelector(
          "label, legend, .label, [class*='label'], [data-automation-id*='Label'], [data-automation-id*='richText']"
        );
        if (nearLabel && !nearLabel.contains(el)) { const t = clean(nearLabel); if (t) return t; }
        ancestor = ancestor.parentElement;
      }
    }

    // LinkedIn Easy Apply: handle sibling labels and popup form wrappers
    if (currentPlatform.id === "linkedin") {
      const linkedInFieldWrapper = el.closest(
        "[data-test-single-line-text-form-component], [data-test-text-form-component], [data-test-form-component], [data-test-text-entity-list-form-select], .artdeco-text-input--container, .artdeco-text-input"
      );
      if (linkedInFieldWrapper) {
        const wrapperLabel = linkedInFieldWrapper.querySelector(
          "label[for], .artdeco-text-input--label, .fb-form-element__label, [class*='label'], span[data-test-single-line-text-form-component__title]"
        );
        if (wrapperLabel && !wrapperLabel.contains(el)) {
          const t = clean(wrapperLabel);
          if (t) return t;
        }
      }

      let ancestor = el.parentElement;
      while (ancestor) {
        if (ancestor.matches("label, legend")) return clean(ancestor);
        const nearLabel = ancestor.querySelector(
          "label, legend, .fb-form-element__label, [class*='label'], span[data-test-single-line-text-form-component__title]"
        );
        if (nearLabel && !nearLabel.contains(el)) { const t = clean(nearLabel); if (t) return t; }
        ancestor = ancestor.parentElement;
        if (ancestor?.classList?.contains("jobs-easy-apply-modal")) break;
      }
    }

    const container = el.closest(".form-group, .form-field, .control-group, .question, .form-row, .field-group, .input-group, fieldset");
    if (container) {
      const groupLabel = container.querySelector(
        "label, legend, .control-label, .field-label, .question-label, [class*='label'], [data-automation-id*='Label'], [data-automation-id*='richText']"
      );
      if (groupLabel && !groupLabel.contains(el)) { const t = clean(groupLabel); if (t) return t; }
    }

    let ancestor = el.parentElement;
    while (ancestor) {
      if (ancestor.matches("label, legend")) return clean(ancestor);
      const nearLabel = ancestor.querySelector("label, legend, .label, [class*='label'], [data-automation-id*='Label']");
      if (nearLabel && !nearLabel.contains(el)) { const t = clean(nearLabel); if (t) return t; }
      ancestor = ancestor.parentElement;
    }

    return (el.placeholder || el.getAttribute("data-placeholder") || el.title || el.name || "").toLowerCase();
  }

  function escapeForRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function textMatchesWordBoundary(containerText, phrase) {
    if (!containerText || !phrase) return false;
    const normalized = phrase.trim().toLowerCase();
    if (!normalized) return false;
    if (/\s/.test(normalized) || normalized.length <= 3) {
      return containerText.includes(normalized);
    }
    const regex = new RegExp("\\b" + escapeForRegex(normalized) + "\\b", "i");
    return regex.test(containerText);
  }

  function isSelectFilled(selectEl) {
    const selected = selectEl.options[selectEl.selectedIndex];
    if (!selected) return false;
    const text = (selected.text || "").trim();
    const value = (selected.value || "").trim();
    if (!text && !value) return false;
    return !/^(select|choose|please|optional)/i.test(text);
  }

  function isButtonDropdownFilled(btn) {
    const text = (btn.textContent || "").trim();
    const aria = (btn.getAttribute("aria-label") || "").trim();
    const current = text || aria;
    if (!current) return false;
    return !/^(select|choose|please|optional|required)/i.test(current.toLowerCase());
  }

  function isRadioGroupFilled(group) {
    return group.some(r => r.checked);
  }

  // ─── Field Matcher ────────────────────────────────────────────────────────
  const EXACT_ONLY_KEYS = new Set([
    "fname",
    "lname",
    "name",
    "title",
    "position",
    "location",
    "state",
    "country",
    "field",
    "school",
    "degree",
    "experience",
    "notice",
    "remote",
    "website",
    "address",
    "street",
    "zip",
    "phone",
    "email"
  ]);

  function normalizedAttrMatches(attr, key) {
    if (!attr || !key) return false;
    const normalizedKey = key.toLowerCase().replace(/[-\s]/g, "");
    if (attr === normalizedKey) return true;
    if (EXACT_ONLY_KEYS.has(normalizedKey)) return false;
    return normalizedKey.length >= 4 && attr.includes(normalizedKey);
  }

  function matchField(el) {
    const name = (el.name || "").toLowerCase().replace(/[-\s]/g, "");
    const id = (el.id || "").toLowerCase().replace(/[-\s]/g, "");
    const placeholder = (el.placeholder || el.getAttribute("data-placeholder") || "").toLowerCase();
    const automationId = (el.getAttribute("data-automation-id") || "").toLowerCase();
    const labelText = getLabelText(el);

    for (const [fieldKey, mapping] of Object.entries(FIELD_MAPPINGS)) {
      if (currentPlatform.id === "workday" && mapping.workdayIds?.length) {
        for (const wdId of mapping.workdayIds) {
          if (automationId.includes(wdId.toLowerCase())) return fieldKey;
        }
      }
      for (const lbl of mapping.labels) {
        const normalizedLabel = lbl.toLowerCase();
        if (textMatchesWordBoundary(labelText, normalizedLabel) || textMatchesWordBoundary(placeholder, normalizedLabel)) return fieldKey;
      }
    }

    for (const [fieldKey, mapping] of Object.entries(FIELD_MAPPINGS)) {
      for (const key of mapping.keys) {
        if (normalizedAttrMatches(name, key) || normalizedAttrMatches(id, key)) return fieldKey;
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
      phoneDeviceType: "Mobile", // Default to Mobile for phone device type dropdowns
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
      field: profile.education?.field,
      graduationYear: profile.education?.graduationYear,
      gpa: profile.education?.gpa,
      secondarySchool: profile.education?.secondarySchool,
      secondaryYear: profile.education?.secondaryYear,
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
      ["company", "employer", "subsidiary", "intern", "contract"]
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
    //  await new Promise(r => setTimeout(r, 400));
      const optSels = '[role="option"], [data-automation-id*="option"], [data-automation-id*="Option"], li[role="option"]';
      let options = document.querySelectorAll(optSels);
      if (options.length === 0 && el.tagName === "INPUT" && !isWorkdayManagedPickerInput(el)) {
        setReactInputValue(el, value);
      //  await new Promise(r => setTimeout(r, 500));
        options = document.querySelectorAll(optSels);
      }
      if (options.length > 0) {
        const desired = value.toLowerCase().trim();
        const match = Array.from(options).find(o =>
          o.textContent.toLowerCase().trim() === desired ||
          o.textContent.toLowerCase().includes(desired) ||
          desired.includes(o.textContent.toLowerCase().trim())
        );
        if (match) { match.click();
          // await new Promise(r => setTimeout(r, 200)); 
           return true; }
      }
    } catch {
      console.log("error in fillWorkdayCombobox")
    }
    return false;
  }

  // ─── Fill Single Input ────────────────────────────────────────────────────
  function fillInput(el, value, skipFilled = true) {
    if (!value) return false;
    if (el.disabled || el.readOnly) return false;
    if (isWorkdayInternalInput(el)) return false;
    if (isWorkdayManagedPickerInput(el)) return false;

    if (skipFilled) {
      const currentVal = (el.value || "").trim();
      const placeholder = el.getAttribute("placeholder") || el.getAttribute("data-placeholder") || "";

      // If there's no meaningful current value, allow filling
      if (!currentVal || currentVal === placeholder) {
        // proceed to fill
      } else {
        // Detect token-like / generated internal values (hex, random ids) which shouldn't block filling
        let isTokenLike = false;
        try {
          if (/^[0-9a-f]{6,}$/i.test(currentVal)) isTokenLike = true;
          if (/^[A-Za-z0-9_-]{8,}$/i.test(currentVal) && !/\s/.test(currentVal)) isTokenLike = true;
        } catch {}

        if (isTokenLike && currentPlatform.id === "workday") {
          const ariaLabel = (el.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim().toLowerCase();
          const fieldLabel = getLabelText(el).toLowerCase();
          const stripped = ariaLabel.replace(fieldLabel, "").replace(/\brequired\b/gi, "").trim();
          // If aria-label contains a human-friendly value, treat as filled; otherwise allow overwrite
          if (stripped && stripped.length > 1) {
            console.log("[JobFill] Workday skip already filled (aria):", stripped.slice(0, 50));
            return false;
          }
          // else treat token-like value as not a real filled value and continue to fill
        } else {
          // Non-token or non-Workday: consider field filled and skip
          return false;
        }
      }

      // Workday: fallback check using aria-label for visible values (unchanged behavior)
      if (currentPlatform.id === "workday") {
        const ariaLabel = (el.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim().toLowerCase();
        const fieldLabel = getLabelText(el).toLowerCase();
        if (ariaLabel && fieldLabel) {
          const stripped = ariaLabel
            .replace(fieldLabel, "")
            .replace(/\brequired\b/gi, "")
            .trim();
          if (stripped && stripped.length > 1) {
            console.log("[JobFill] Workday skip already filled:", stripped, "in", ariaLabel.slice(0, 50));
            return false;
          }
        }
      }
    }

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
  function getGroupQuestionLabel(el) {
    if (!el) return "";
    const fieldset = el.closest("fieldset");
    if (fieldset) {
      const legend = fieldset.querySelector("legend");
      if (legend) return getLabelText(legend);
    }
    const container = el.closest(".form-group, .form-field, .control-group, .question, .form-row, .field-group, .input-group");
    if (container) {
      const groupLabel = container.querySelector(
        "label, legend, .control-label, .field-label, .question-label, [class*='label'], [data-automation-id*='Label'], [data-automation-id*='richText']"
      );
      if (groupLabel && !groupLabel.contains(el)) return getLabelText(groupLabel);
    }
    return getLabelText(el);
  }

  function getRadioOptionLabel(radioEl) {
    if (!radioEl?.id) return getLabelText(radioEl);
    try {
      const label = document.querySelector(`label[for="${CSS.escape(radioEl.id)}"]`);
      if (label) return label.innerText.replace(/\s+/g, " ").trim().toLowerCase();
    } catch {}
    return getLabelText(radioEl);
  }

  function fillYesNoRadios(profile) {
    const groups = {};
    document.querySelectorAll('input[type="radio"]').forEach(r => {
      const grp = r.name || r.getAttribute("data-automation-id") || Math.random();
      if (!groups[grp]) groups[grp] = [];
      groups[grp].push(r);
    });

    for (const group of Object.values(groups)) {
      if (group.length < 2) continue;
      const labelText = getGroupQuestionLabel(group[0]);
      const isAuthQ = /authorized|eligible|legally|work in/i.test(labelText);
      const isSponsorQ = /sponsor|sponsorship|visa/i.test(labelText);
      if (isAuthQ) {
        const want = profile.work?.authorized ? "yes" : "no";
        group.forEach(r => { if (normalizeYesNo(r.value || getRadioOptionLabel(r)) === want) r.click(); });
      }
      if (isSponsorQ) {
        const want = profile.work?.sponsorship ? "yes" : "no";
        group.forEach(r => { if (normalizeYesNo(r.value || getRadioOptionLabel(r)) === want) r.click(); });
      }
    }
  }

  // ─── Fuzzy Custom Answers ─────────────────────────────────────────────────
  function findVisibleAutocompleteInput(el) {
    const container = el.closest(".fieldcontain, .form-group, .form-field, .control-group, .question, .form-row, .field-group, .input-group, fieldset");
    if (!container) return null;
    const inputs = Array.from(container.querySelectorAll('input[type="search"], input.ui-autocomplete-input, input[role="listbox"], input[type="text"]'));
    return inputs.find(input => input !== el && !input.disabled && !input.readOnly && input.offsetParent !== null) || null;
  }

  function fillAnswerElement(el, answer) {
    if (isWorkdayManagedPickerInput(el)) {
      debugFillPoint("fillAnswerElement:skip-workday-managed-picker", el, answer);
      return false;
    }

    const tag = el.tagName.toLowerCase();
    const type = (el.type || "").toLowerCase();
    debugFillPoint("fillAnswerElement:start", el, answer, { tag, type });

    if (tag === "textarea") {
      debugFillPoint("fillAnswerElement:textarea", el, answer);
      setReactTextareaValue(el, answer);
      return true;
    }

    if (tag === "select") {
      debugFillPoint("fillAnswerElement:select", el, answer);
      if (fillSelectBestMatch(el, answer)) {
        debugFillPoint("fillAnswerElement:select-native-filled", el, answer);
        return true;
      }
      const autocompleteInput = findVisibleAutocompleteInput(el);
      if (autocompleteInput && !isWorkdayManagedPickerInput(autocompleteInput)) {
        debugFillPoint("fillAnswerElement:select-autocomplete-input", autocompleteInput, answer, { sourceSelect: describeFillElement(el) });
        setReactInputValue(autocompleteInput, answer);
        return true;
      }
      debugFillPoint("fillAnswerElement:select-not-filled", el, answer, { autocompleteInput: describeFillElement(autocompleteInput) });
      return false;
    }

    if (["text", "search", ""].includes(type)) {
      debugFillPoint("fillAnswerElement:text-input", el, answer);
      setReactInputValue(el, answer);
      return true;
    }

    debugFillPoint("fillAnswerElement:unsupported", el, answer, { tag, type });
    return false;
  }

  async function fillCustomAnswers(customAnswers) {
    if (!customAnswers?.length) return 0;
    console.log("[JobFill] fillCustomAnswers called with", customAnswers.length, "items");
    let count = 0;
    const candidates = [
      ...document.querySelectorAll("textarea"),
      ...document.querySelectorAll('input[type="text"], input[type="search"]'),
      ...document.querySelectorAll("select")
    ];
    candidates.forEach(el => {
      if (el.tagName.toLowerCase() === "select") {
        if (isSelectFilled(el)) return;
      } else if (el.value?.trim()) return;
      const label = getLabelText(el);
      const ph = (el.placeholder || "").toLowerCase();
      const combined = (label + " " + ph).trim();
      if (!combined) return;

      let bestMatch = null, bestScore = 0, bestIndex = -1;
      customAnswers.forEach((qa, idx) => {
        if (!qa.question || !qa.answer) return;
        const score = fuzzyMatchScore(combined, qa.question);
        if (score > bestScore && score >= 0.35) { bestScore = score; bestMatch = qa; bestIndex = idx; }
      });
      if (bestMatch) {
        console.log("[JobFill] Matched custom answer:", bestMatch.question, "score:", bestScore, "field:", combined);
        debugFillPoint("fillCustomAnswers:best-match", el, bestMatch.answer, {
          question: bestMatch.question,
          score: bestScore,
          field: combined,
          index: bestIndex
        });
        if (fillAnswerElement(el, bestMatch.answer)) {
          count++;
          customAnswers.splice(bestIndex, 1); // Remove used answer
        }
      }
    });

    if (currentPlatform.id === "workday" || currentPlatform.id === "linkedin") {
      const buttonCandidates = Array.from(document.querySelectorAll('button[aria-haspopup="listbox"], button[role="combobox"], [role="combobox"]'));
      for (const btn of buttonCandidates) {
        if (isButtonDropdownFilled(btn)) continue;
        const label = getLabelText(btn);
        const ph = (btn.getAttribute("aria-label") || "").toLowerCase();
        const combined = (label + " " + ph).trim();
        if (!combined) continue;

        let bestMatch = null, bestScore = 0, bestIndex = -1;
        customAnswers.forEach((qa, idx) => {
          if (!qa.question || !qa.answer || qa.answer === "Skip") return;
          const score = fuzzyMatchScore(combined, qa.question);
          if (score > bestScore && score >= 0.3) { bestScore = score; bestMatch = qa; bestIndex = idx; }
        });

        if (bestMatch) {
          console.log("[JobFill] Custom answer dropdown match:", bestMatch.question, "->", bestMatch.answer, "score:", bestScore);
          const filled = await fillDropdownButtonByAnswer(btn, bestMatch.answer);
          if (filled) {
            count++;
            customAnswers.splice(bestIndex, 1);
          }
        }
      }
    }

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

      let bestMatch = null, bestScore = 0, bestIndex = -1;
      customFields.forEach((cf, idx) => {
        if (!cf.label || !cf.value) return;
        const score = fuzzyMatchScore(combined, cf.label);
        if (score > bestScore && score >= 0.4) { bestScore = score; bestMatch = cf; bestIndex = idx; }
      });
      if (bestMatch) {
        console.log("[JobFill] Matched custom field:", bestMatch.label, "score:", bestScore);
        el.tagName.toLowerCase() === "textarea"
          ? setReactTextareaValue(el, bestMatch.value)
          : setReactInputValue(el, bestMatch.value);
        count++;
        customFields.splice(bestIndex, 1); // Remove used field
      }
    });
    return count;
  }

  async function fillButtonDropdown(buttonEl, desiredAnswer) {
    if (!buttonEl || !desiredAnswer) return false;
    try {
      buttonEl.focus();
      buttonEl.click();
     // await new Promise(r => setTimeout(r, 300));

      const options = Array.from(document.querySelectorAll('[role="option"], [data-automation-id*="option"], [data-automation-id*="Option"], li[role="option"], div[role="option"], button[role="option"]'));
      const desired = desiredAnswer.toLowerCase().trim();
      const normalizedDesired = normalizeYesNo(desired);

      let match = options.find(o => normalizeYesNo(o.textContent) === normalizedDesired);
      if (!match) match = options.find(o => o.textContent.toLowerCase().trim() === desired);
      if (!match) match = options.find(o => o.textContent.toLowerCase().includes(desired));
      if (!match) match = options.find(o => desired.includes(o.textContent.toLowerCase().trim()) && o.textContent.trim().length > 2);

      if (match) {
        match.click();
      //  await new Promise(r => setTimeout(r, 200));
        return true;
      }
    } catch (e) {}
    return false;
  }

  async function fillDropdownButtonByAnswer(buttonEl, desiredAnswer) {
    if (!buttonEl || !desiredAnswer) return false;
    if (currentPlatform.id === "workday") {
      return fillWorkdayButtonDropdown(buttonEl, desiredAnswer);
    }
    return fillButtonDropdown(buttonEl, desiredAnswer);
  }

  // ─── Yes/No Answers (Context-Aware) ───────────────────────────────────────
  async function fillYesNoAnswers(yesNoAnswers) {
    if (!yesNoAnswers?.length) return 0;
    console.log("[JobFill] fillYesNoAnswers called with", yesNoAnswers.length, "items");
    let count = 0;

    // Handle <select> dropdowns
    document.querySelectorAll("select").forEach(sel => {
      if (isSelectFilled(sel)) return;
      const label = getLabelText(sel);
      const ph = (sel.placeholder || "").toLowerCase();
      const combined = (label + " " + ph).trim();
      if (!combined) return;

      let bestMatch = null, bestScore = 0, bestIndex = -1;
      yesNoAnswers.forEach((yn, idx) => {
        if (!yn.question || yn.answer === "Skip") return;
        const score = fuzzyMatchScore(combined, yn.question);
        if (score > bestScore && score >= 0.3) { bestMatch = yn; bestScore = score; bestIndex = idx; }
      });
      if (bestMatch) {
        console.log("[JobFill] Yes/No select match:", bestMatch.question, "->", bestMatch.answer, "score:", bestScore);
        if (fillAnswerElement(sel, bestMatch.answer)) {
          count++;
          yesNoAnswers.splice(bestIndex, 1); // Remove used answer
        }
      }
    });

    // Handle button dropdowns (Workday-style custom listboxes, and LinkedIn)
    if (currentPlatform.id === "workday" || currentPlatform.id === "linkedin") {
      const buttonCandidates = Array.from(document.querySelectorAll('button[aria-haspopup="listbox"], button[role="combobox"], [role="combobox"]'));
      for (const btn of buttonCandidates) {
        if (isButtonDropdownFilled(btn)) continue;
        const label = getLabelText(btn);
        const ph = (btn.getAttribute("aria-label") || "").toLowerCase();
        const combined = (label + " " + ph).trim();
        if (!combined) continue;

        let bestMatch = null, bestScore = 0, bestIndex = -1;
        yesNoAnswers.forEach((yn, idx) => {
          if (!yn.question || yn.answer === "Skip") return;
          const score = fuzzyMatchScore(combined, yn.question);
          if (score > bestScore && score >= 0.3) { bestMatch = yn; bestScore = score; bestIndex = idx; }
        });
        if (bestMatch) {
          console.log("[JobFill] Yes/No dropdown match:", bestMatch.question, "->", bestMatch.answer, "score:", bestScore);
          const filled = await fillDropdownButtonByAnswer(btn, bestMatch.answer);
          if (filled) {
            count++;
            yesNoAnswers.splice(bestIndex, 1); // Remove used answer
          }
        }
      }
    }

    // Handle radio groups
    const groups = {};
    document.querySelectorAll('input[type="radio"]').forEach(r => {
      const grp = r.name || r.closest("fieldset")?.id || "";
      if (!groups[grp]) groups[grp] = [];
      groups[grp].push(r);
    });

    for (const group of Object.values(groups)) {
      if (group.length < 2) continue;
      if (isRadioGroupFilled(group)) continue;
      const label = getLabelText(group[0]);
      if (!label) continue;

      let bestMatch = null, bestScore = 0, bestIndex = -1;
      yesNoAnswers.forEach((yn, idx) => {
        if (!yn.question || yn.answer === "Skip") return;
        const score = fuzzyMatchScore(label, yn.question);
        if (score > bestScore && score >= 0.3) { bestScore = score; bestMatch = yn; bestIndex = idx; }
      });
      if (bestMatch) {
        console.log("[JobFill] Yes/No radio match:", bestMatch.question, "->", bestMatch.answer, "score:", bestScore);
        const desired = normalizeYesNo(bestMatch.answer);
        group.forEach(r => {
          const rv = normalizeYesNo(r.value || getRadioOptionLabel(r));
          if (rv === desired) { r.click(); count++; }
        });
        yesNoAnswers.splice(bestIndex, 1); // Remove used answer
      }
    }
    return count;
  }

  function uncheckLinkedInFollowCheckbox() {
    const cb = document.getElementById("follow-company-checkbox");
    if (!cb) return false;
    if (!cb.checked) return true;

    const lbl = document.querySelector('label[for="follow-company-checkbox"]');
    try { cb.click(); } catch {}
    if (cb.checked && lbl) {
      try { lbl.click(); } catch {}
    }
    if (cb.checked) {
      cb.checked = false;
      cb.dispatchEvent(new Event("change", { bubbles: true }));
      cb.dispatchEvent(new Event("input", { bubbles: true }));
      cb.dispatchEvent(new Event("click", { bubbles: true }));
    }
    console.log("[JobFill] uncheckLinkedInFollowCheckbox ->", cb.checked ? "failed" : "success");
    return !cb.checked;
  }

  function watchLinkedInFollowCheckbox() {
    if (currentPlatform.id !== "linkedin") return;
    const observer = new MutationObserver(() => {
      uncheckLinkedInFollowCheckbox();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => uncheckLinkedInFollowCheckbox(), 500);
  }

  // ─── Smart Checkbox Handler ───────────────────────────────────────────────
  function autoAcceptTerms() {
    if (currentPlatform.id === "linkedin") uncheckLinkedInFollowCheckbox();
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      const label = getLabelText(cb);
      if (!label) return;

      console.log("[JobFill] Checkbox:", label.slice(0, 70));

      // Helper: find associated label element
      function findLabelEl(checkbox) {
        if (!checkbox.id) return null;
        try { const l = document.querySelector(`label[for="${CSS.escape(checkbox.id)}"]`); if (l) return l; } catch {}
        return Array.from(document.querySelectorAll("label[for]")).find(l => l.getAttribute("for") === checkbox.id) || null;
      }

      // CASE 1: ALWAYS UNCHECK — marketing, follow, newsletter, social opt-ins
      const OPT_OUT_PATTERNS = [
        /^follow\s+\S+(\s+\S+)?\s+to\s+stay/i,
        /follow\s+\S+\s+on\s+linkedin/i,
        /follow\s+\S+\s+page/i,
        /\bsubscribe\b/i,
        /\bnewsletter\b/i,
        /marketing email/i,
        /\bpromotional\b/i,
        /notify me/i,
        /keep me updated/i,
        /stay up to date/i,
        /updates from/i,
        /news from/i,
        /send me offers/i,
        /send me deals/i,
        /send me jobs/i,
        /send me alerts/i,
        /opt.?in to marketing/i,
        /opt.?in to promo/i,
        /connect on linkedin/i
      ];
      const linkedInFollowCheckbox = cb.id === "follow-company-checkbox";
      const isOptOut = linkedInFollowCheckbox || OPT_OUT_PATTERNS.some(r => r.test(label));
      console.log("[JobFill] isOptOut:", isOptOut, "|", label.slice(0, 50), "| id=", cb.id);

      if (isOptOut) {
        if (cb.checked) {
          cb.checked = false;
          cb.dispatchEvent(new Event("change", { bubbles: true }));
          cb.dispatchEvent(new Event("input", { bubbles: true }));
          cb.dispatchEvent(new Event("click", { bubbles: true }));
          // Label click fallback for Ember/React visually-hidden checkboxes
          const lbl = findLabelEl(cb);
          if (lbl) setTimeout(() => { if (cb.checked) { console.log("[JobFill] Label-click to UNCHECK:", label.slice(0, 40)); lbl.click(); } }, 150);
        }
        return;
      }

      // CASE 2: ALWAYS CHECK — consent/terms/privacy/application submission
      const CONSENT_PATTERNS = [
        /i consent/i, /i agree/i, /i accept/i, /i certify/i,
        /i acknowledge/i, /i authorize/i, /i confirm/i,
        /terms and conditions/i, /terms & conditions/i,
        /privacy policy/i, /submit my application/i,
        /application information/i, /data processing/i,
        /\bgdpr\b/i, /consent to process/i, /consent to submit/i,
        /consent to share/i, /consent to store/i, /consent to use/i
      ];
      const isConsent = CONSENT_PATTERNS.some(r => r.test(label));
      console.log("[JobFill] isConsent:", isConsent, "|", label.slice(0, 50));

      if (isConsent && !cb.checked) {
        cb.checked = true;
        cb.dispatchEvent(new Event("change", { bubbles: true }));
        cb.dispatchEvent(new Event("input", { bubbles: true }));
        cb.dispatchEvent(new Event("click", { bubbles: true }));
        const lbl = findLabelEl(cb);
        if (lbl) setTimeout(() => { if (!cb.checked) { console.log("[JobFill] Label-click to CHECK:", label.slice(0, 40)); lbl.click(); } }, 150);
        return;
      }

      // CASE 3: GENERIC TERMS fallback — only if label actually looks like a consent/terms statement
      // Exclude labels that are clearly questions or field labels (e.g. "preferred name", "how did you hear")
      const isQuestion = /^(do|did|are|were|have|has|will|would|can|could|is|what|how|when|where|why|which)\b/i.test(label);
      const isFieldLabel = /preferred name|hear about us|referral|source|pronouns|suffix|prefix/i.test(label);
      const isGenericTerms = !isQuestion && !isFieldLabel &&
        /\bterms\b|\bconditions\b|\bprivacy\b|\bagree\b|\baccept\b|\backnowledge\b|\bcertify\b|\bconfirm\b|\bauthorize\b/i.test(label);
      if (isGenericTerms && !cb.checked) {
        cb.checked = true;
        cb.dispatchEvent(new Event("change", { bubbles: true }));
        cb.dispatchEvent(new Event("click", { bubbles: true }));
      }
    });
  }

  // ─── Workday Button Dropdown Fill ─────────────────────────────────────────
  // Workday renders dropdowns as <button aria-haspopup="listbox"> inside
  // <fieldset><legend> — the legend holds the question text.

  async function fillWorkdayButtonDropdown(btn, value) {
    if (!value) return false;
    const desired = String(value).toLowerCase().trim();
    const normalizedDesired = normalizeYesNo(desired);

    // Check button text AND aria-label for current value
    const currentText = (btn.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
    const ariaLabel = (btn.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim().toLowerCase();
    const ariaValue = ariaLabel.replace(/\brequired\b/gi, "").replace(/\boptional\b/gi, "").trim();

    const alreadySet = (
      currentText === desired ||
      ariaValue === desired ||
      (["yes","no"].includes(normalizedDesired) && (
        normalizeYesNo(currentText) === normalizedDesired ||
        normalizeYesNo(ariaValue) === normalizedDesired
      ))
    );

    if (alreadySet) {
      console.log("[JobFill Workday] Already set:", currentText || ariaValue);
      return true;
    }

    // Close any open listbox before opening a new one
    const existingListbox = document.querySelector('[role="listbox"]');
    if (existingListbox) {
      document.body.click();
      await new Promise(r => setTimeout(r, 200));
    }

    try {
      console.log("[JobFill Workday] Opening dropdown for:", value);
      // openDropdownAndGetOptions handles focus + click internally; do not click twice.
      const options = await openDropdownAndGetOptions(btn);
      console.log("[JobFill Workday] Options found:", options.length);

      if (!options.length) {
        // Close gracefully
        try { btn.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); } catch {}
        document.body.click();
      //  await new Promise(r => setTimeout(r, 300));
        return false;
      }

      let match = null;
      if (["yes","no"].includes(normalizedDesired))
        match = options.find(o => normalizeYesNo(o.textContent.replace(/\s+/g," ").trim().toLowerCase()) === normalizedDesired);
      if (!match) match = options.find(o => o.textContent.replace(/\s+/g," ").trim().toLowerCase() === desired);
      if (!match) match = options.find(o => o.textContent.toLowerCase().includes(desired));
      if (!match) match = options.find(o => desired.includes(o.textContent.replace(/\s+/g," ").trim().toLowerCase()) && o.textContent.trim().length > 2);

      if (match) {
        console.log("[JobFill Workday] Clicking option:", match.textContent.trim());
        match.click();
        // Wait for listbox to fully close before next dropdown
       // await new Promise(r => setTimeout(r, 500));
        const stillOpen = document.querySelector('[role="listbox"]');
        if (stillOpen) { document.body.click();
          // await new Promise(r => setTimeout(r, 300)); 
          }
        return true;
      }

      // No match — close cleanly
      try { btn.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); } catch {}
      document.body.click();
    //  await new Promise(r => setTimeout(r, 300));
      return false;

    } catch (e) {
      console.error("[JobFill Workday] Error:", e.message);
      try { document.body.click(); } catch {}
      return false;
    }
  }

  function getWorkdayButtonLabel(btn) {
    const fieldset = btn.closest("fieldset");
    if (fieldset) {
      const legend = fieldset.querySelector("legend");
      if (legend) return legend.innerText.replace(/\s+/g, " ").trim().toLowerCase();
    }
    return getLabelText(btn);
  }

  // Match legend text against a field label using word boundaries.
  // Prevents "state" matching "statements", "have" matching "behavior", etc.
  function legendMatchesLabel(legendText, fieldLabel) {
    if (!legendText || !fieldLabel) return false;
    const escaped = fieldLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    try {
      return new RegExp("\\b" + escaped + "\\b", "i").test(legendText);
    } catch { return legendText.includes(fieldLabel); }
  }

  function hasMeaningfulValue(el) {
    // For Workday multiselect widgets (e.g. Country Phone Code), the "value" lives
    // as a pill inside data-automation-id="selectedItemList". Check for any pill
    // that isn't a placeholder before falling through to text/value checks.
    if (currentPlatform.id === "workday") {
      const formField = el.closest('[data-automation-id^="formField"]');
      if (formField) {
        const pills = formField.querySelectorAll('[data-automation-id="selectedItem"]');
        if (pills.length > 0) return true;
      }
    }

    // For Workday button dropdowns, after selection React updates aria-label to
    // e.g. "State India" or "Country Phone Code United States (+1)".
    // Strip the field label prefix to isolate the actual selected value.
    if (el.tagName?.toLowerCase() === "button" && currentPlatform.id === "workday") {
      const ariaLabel = (el.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim();
      const fieldLabel = getLabelText(el);
      if (ariaLabel && fieldLabel) {
        const stripped = ariaLabel
          .replace(new RegExp(fieldLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "")
          .replace(/\brequired\b/gi, "")
          .replace(/\bselect one\b/gi, "")
          .trim();
        if (stripped.length > 1) return true;
      }
    }

    const text =
      el.value?.trim() ||
      el.textContent?.trim();

    if (!text) return false;

    const invalidValues = [
      'select',
      'select one',
      'choose',
      'none'
    ];

    return !invalidValues.includes(text.toLowerCase());
  }

  async function fillAllWorkdayComboboxes(profile) {
    if (currentPlatform.id !== "workday" && currentPlatform.id !== "linkedin") return;

    // Close any already-open listbox first
    if (document.querySelector('[role="listbox"]')) {
      document.body.click();
     //      await new Promise(r => setTimeout(r, 400));
    }

    // ── Workday multiselect pill widgets (e.g. Country Phone Code) ────────────
    // These render as: formField container → multiSelectContainer → searchBox input
    // They are NOT button[aria-haspopup="listbox"] so need separate handling.
    if (currentPlatform.id === "workday") {
      const multiSelectFields = Array.from(
        document.querySelectorAll('[data-automation-id="multiSelectContainer"]')
      );
      for (const container of multiSelectFields) {
        // Skip if a pill is already selected
        const existingPills = container.querySelectorAll('[data-automation-id="selectedItem"]');
        if (existingPills.length > 0) {
          console.log("[JobFill Workday] Multiselect already has pill — skipping");
          continue;
        }

        // Resolve field label from the nearest formField ancestor
        const formField = container.closest('[data-automation-id^="formField"]');
        const labelEl = formField?.querySelector('label');
        const legendText = (labelEl?.innerText || "").replace(/\s+/g, " ").trim().toLowerCase();
        if (!legendText) continue;

        // Find a profile value for this field label
        let valueToSet = null;
        for (const [fieldKey, mapping] of Object.entries(FIELD_MAPPINGS)) {
          for (const lbl of mapping.labels) {
            if (legendMatchesLabel(legendText, lbl)) {
              const v = getProfileValue(fieldKey, profile);
              if (v) { valueToSet = v; break; }
            }
          }
          if (valueToSet) break;
        }
        if (!valueToSet) continue;

        // Type into the search box and select the first matching option
        const searchInput = container.querySelector('[data-automation-id="searchBox"]');
        if (!searchInput) continue;
        console.log("[JobFill Workday] Multiselect fill:", legendText, "->", valueToSet);

        searchInput.focus();
        const proto = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
        if (proto?.set) proto.set.call(searchInput, valueToSet); else searchInput.value = valueToSet;
        searchInput.dispatchEvent(new Event("input", { bubbles: true }));
        searchInput.dispatchEvent(new Event("change", { bubbles: true }));

        // Wait for options to appear, then pick the best match
        const options = await openDropdownAndGetOptions(searchInput);
        if (options.length) {
          const desired = valueToSet.toLowerCase().trim();
          const match =
            options.find(o => o.textContent.toLowerCase().trim() === desired) ||
            options.find(o => o.textContent.toLowerCase().includes(desired)) ||
            options.find(o => desired.includes(o.textContent.toLowerCase().trim()) && o.textContent.trim().length > 2);
          if (match) {
            console.log("[JobFill Workday] Multiselect option clicked:", match.textContent.trim());
            match.click();
          }
        }
      }
    }

    // LinkedIn: handle phone country-code and similar custom button-dropdowns
    const dropdownBtnSelector = currentPlatform.id === "linkedin"
      ? 'button[aria-label*="Phone country code" i], button[data-test-text-entity-list-form-select], select[data-test-text-selectable-option]'
      : 'button[aria-haspopup="listbox"]';

    const dropdownBtns = Array.from(document.querySelectorAll(dropdownBtnSelector));
    console.log("[JobFill] Button dropdowns:", dropdownBtns.length);

    const processedBtns = new Set();

    for (const btn of dropdownBtns) {
      if (processedBtns.has(btn)) continue;
      processedBtns.add(btn);

      const legendText = getWorkdayButtonLabel(btn);
      if (!legendText) continue;

      // Skip navigation/progress buttons
      if (/^completed step|^step \d+|^page \d|^next\b|^back\b|^previous\b|^submit\b|^save\b|^cancel\b/i.test(legendText)) {
        console.log("[JobFill Workday] Skipping navigation:", legendText.slice(0, 40));
        continue;
      }

      console.log("[JobFill Workday] Label:", legendText.slice(0, 80));

      let valueToSet = null;

      // 1. Profile field match — word-boundary for short labels to avoid false matches
      //    e.g. "state" must not match "statements" or "do either of the following statements"
      for (const [fieldKey, mapping] of Object.entries(FIELD_MAPPINGS)) {
        for (const lbl of mapping.labels) {
          const wordCount = lbl.trim().split(/\s+/).length;
          const matched = wordCount <= 2
            ? legendMatchesLabel(legendText, lbl)  // short: word boundary required
            : legendText.includes(lbl);             // long: substring ok
          if (matched) {
            const v = getProfileValue(fieldKey, profile);
            if (v) { valueToSet = v; console.log("[JobFill Workday] Field match:", fieldKey, "->", v); break; }
          }
        }
        if (valueToSet) break;
      }

      // 2. yesNoAnswers fuzzy match
      if (!valueToSet && profile.yesNoAnswers?.length) {
        let best = 0;
        for (const yn of profile.yesNoAnswers) {
          if (!yn.question || yn.answer === "Skip") continue;
          const score = fuzzyMatchScore(legendText, yn.question.toLowerCase());
          if (score > best && score >= 0.28) { best = score; valueToSet = yn.answer; }
        }
        if (valueToSet) console.log("[JobFill Workday] Yes/No match ->", valueToSet);
      }

      // 3. Keyword inference
      if (!valueToSet) {
        if (/\bvisa\b|\bsponsorship\b/i.test(legendText))
          valueToSet = profile.work?.sponsorship ? "Yes" : "No";
        else if (/\bauthorized\b|\blegally authorized\b|\beligible to work\b/i.test(legendText))
          valueToSet = profile.work?.authorized !== false ? "Yes" : "No";
        else if (/\bat least 18\b|\b18 years of age\b/i.test(legendText))
          valueToSet = "Yes";
      }

      if (!valueToSet) {
        console.log("[JobFill Workday] No match for:", legendText.slice(0, 60));
        continue;
      }

      if(hasMeaningfulValue(btn)){
        console.log("[JobFill Workday] Skipping already filled dropdown:", legendText.slice(0, 60), "current value:", btn.textContent.trim().slice(0,30));
        continue;
      }
      await fillWorkdayButtonDropdown(btn, valueToSet);
      // Mandatory gap — let Workday React settle between dropdowns
     // await new Promise(r => setTimeout(r, 600));
    }

    // SECONDARY: role="combobox" non-button elements
    // const comboboxes = document.querySelectorAll('[role="combobox"]:not(button), [data-automation-id*="prompt"]:not(button)');
    // for (const el of comboboxes) {
    //   const fieldKey = matchField(el);
    //   if (!fieldKey) continue;
    //   const value = getProfileValue(fieldKey, profile);
    //   if (!value) continue;
    //   await fillWorkdayCombobox(el, value);
    //  //      await new Promise(r => setTimeout(r, 400));
    // }
  }

  async function openDropdownAndGetOptions(btn) {

  btn.focus();
  btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  btn.click();

  // Determine which listbox belongs to THIS button.
  // Workday sets aria-controls on the button pointing to the listbox id.
  // Using this prevents picking up a concurrently open listbox from a different field
  // (e.g. country options appearing when state dropdown is clicked).
  const ownedListboxId = btn.getAttribute("aria-controls");

  function getOwnedOptions() {
    let listbox = null;
    if (ownedListboxId) {
      listbox = document.getElementById(ownedListboxId);
    }
    if (!listbox) {
      // Fallback: last visible listbox on the page
      const visibleBoxes = [...document.querySelectorAll('[role="listbox"]')]
        .filter(lb => {
          const rect = lb.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && getComputedStyle(lb).visibility !== 'hidden';
        });
      listbox = visibleBoxes.at(-1) || null;
    } else {
      // Verify the owned listbox is actually visible
      const rect = listbox.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0 || getComputedStyle(listbox).visibility === 'hidden') {
        listbox = null;
      }
    }
    if (!listbox) return [];
    return [...listbox.querySelectorAll('[role="option"]')];
  }

  // Wait for options using MutationObserver — resolves as soon as options appear
  return new Promise(resolve => {
    const timeout = setTimeout(() => {
      obs.disconnect();
      resolve([]);
    }, 2000);

    const obs = new MutationObserver(() => {
      const options = getOwnedOptions();
      if (options.length) {
        clearTimeout(timeout);
        obs.disconnect();
        resolve(options);
      }
    });

    obs.observe(document.body, { childList: true, subtree: true });

    // Check immediately in case the dropdown rendered synchronously
    const immediate = getOwnedOptions();
    if (immediate.length) {
      clearTimeout(timeout);
      obs.disconnect();
      resolve(immediate);
    }
  });
}


  // ─── Main Auto-Fill ───────────────────────────────────────────────────────
  async function autoFill(profile, skipFilled = true, acceptTerms = true) {
    if (isFilling) return { filled: 0, skipped: 0, errors: [], fields: [] };
    isFilling = true;
    console.log("[JobFill] autoFill start — customAnswers:", profile.customAnswers?.length, "customFields:", profile.customFields?.length, "yesNoAnswers:", profile.yesNoAnswers?.length);
    const results = { filled: 0, skipped: 0, errors: [], fields: [] };
    try {

    // Track every DOM element we fill — prevents same input being matched by two
    // different field keys (e.g. "country" and "countryCode" both matching one input)
    const filledElements = new Set();

    const inputs = document.querySelectorAll(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="file"]), textarea, select'
    );

    inputs.forEach(el => {
      try {
        if (filledElements.has(el)) { results.skipped++; return; }
        const fieldKey = matchField(el);
        if (!fieldKey) { results.skipped++; return; }
        const value = getProfileValue(fieldKey, profile);
        if (!value) { results.skipped++; return; }
        const filled = fillInput(el, value, skipFilled);
        if (filled) {
          filledElements.add(el);
          results.filled++;
          results.fields.push(fieldKey);
        } else { results.skipped++; }
      } catch (err) { results.errors.push(err.message); }
    });

    fillYesNoRadios(profile);

    const ynCount = await fillYesNoAnswers([...profile.yesNoAnswers || []]);
    results.filled += ynCount;

    const customCount = await fillCustomAnswers([...profile.customAnswers || []]);
    results.filled += customCount;

    const cfCount = fillCustomFields([...profile.customFields || []]);
    results.filled += cfCount;

    await fillAllWorkdayComboboxes(profile);

    if (acceptTerms) autoAcceptTerms();

    // Naukri chatbot — starts async, doesn't block return
    if (currentPlatform.id === "naukri") {
      naukriFillCount = 0;
      fillNaukriChatbot(profile);
    }

    console.log("[JobFill] autoFill done — filled:", results.filled, "skipped:", results.skipped);
    return results;
    } finally {
      isFilling = false;
    }
  }

  // ─── Naukri Chatbot Handler ───────────────────────────────────────────────
  // Naukri chatbot has two modes:
  //   A) Radio buttons: .singleselect-radiobutton with input[type="radio"] options
  //   B) Text input:    contenteditable div.textArea (hidden when radio mode active)
  // The bot question is always in: .botItem .botMsg span (last one)

  let naukriFillCount = 0;

  function getNaukriQuestion() {
    // Get text of last bot message
    const botSpans = document.querySelectorAll(".botItem .botMsg span, .botMsg.msg span");
    if (!botSpans.length) return "";
    return botSpans[botSpans.length - 1].innerText.replace(/\s+/g, " ").trim().toLowerCase();
  }

  async function fillNaukriChatbot(profile) {
    if (naukriFillCount++ > 25) { naukriFillCount = 0; return; }
         await new Promise(r => setTimeout(r, 700));

    const questionText = getNaukriQuestion();
    if (!questionText) { console.log("[JobFill Naukri] No question found"); return; }
    console.log("[JobFill Naukri] Question:", questionText.slice(0, 90));

    // ── MODE A: Radio buttons ────────────────────────────────────────────────
    const radioContainer = document.querySelector(
      ".singleselect-radiobutton-container, .singleselect-radiobutton, #singleselect_radiobutton__" + /[a-z0-9]+/.exec(questionText)?.[0]
    ) || document.querySelector(".singleselect-radiobutton-container, .ssrc__radio-btn-container")?.closest("div");

    const radioInputs = document.querySelectorAll('.singleselect-radiobutton input[type="radio"], .ssrc__radio');

    if (radioInputs.length > 0) {
      console.log("[JobFill Naukri] Radio mode, options:", radioInputs.length);
      let answerValue = null;

      // 1. Match via profile field map
      const profileFieldMap = [
        { keywords: ["relocate", "location", "bengaluru", "mumbai", "delhi", "hyderabad", "pune", "chennai", "kolkata"], value: null }, // location questions need Yes/No from yesNoAnswers
        { keywords: ["authorized", "eligible", "legally", "work permit"], value: profile.work?.authorized ? "Yes" : "No" },
        { keywords: ["sponsor", "sponsorship", "visa"], value: profile.work?.sponsorship ? "Yes" : "No" },
      ];
      for (const entry of profileFieldMap) {
        if (entry.value && entry.keywords.some(kw => questionText.includes(kw))) {
          answerValue = entry.value; break;
        }
      }

      // 2. Match via yesNoAnswers fuzzy
      if (!answerValue && profile.yesNoAnswers?.length) {
        let best = 0;
        for (const yn of profile.yesNoAnswers) {
          if (!yn.question || yn.answer === "Skip") continue;
          const score = fuzzyMatchScore(questionText, yn.question.toLowerCase());
          if (score > best && score >= 0.25) { best = score; answerValue = yn.answer; }
        }
        if (answerValue) console.log("[JobFill Naukri] Yes/No match:", answerValue);
      }

      // 3. Match via customAnswers fuzzy
      if (!answerValue && profile.customAnswers?.length) {
        let best = 0;
        for (const qa of profile.customAnswers) {
          if (!qa.question || !qa.answer) continue;
          const score = fuzzyMatchScore(questionText, qa.question.toLowerCase());
          if (score > best && score >= 0.28) { best = score; answerValue = qa.answer; }
        }
        if (answerValue) console.log("[JobFill Naukri] Custom answer radio match:", answerValue);
      }

      if (answerValue) {
        const desired = answerValue.toLowerCase().trim();
        const normalizedDesired = normalizeYesNo(desired);

        // Find matching radio button by value or label
        let targetRadio = null;
        for (const radio of radioInputs) {
          const rv = (radio.value || "").toLowerCase().trim();
          const labelEl = document.querySelector(`label[for="${radio.id}"]`);
          const labelText = (labelEl?.innerText || "").toLowerCase().trim();
          if (rv === desired || normalizeYesNo(rv) === normalizedDesired ||
              labelText === desired || normalizeYesNo(labelText) === normalizedDesired) {
            targetRadio = radio; break;
          }
        }

        if (targetRadio) {
          console.log("[JobFill Naukri] Clicking radio:", targetRadio.value);
          targetRadio.click();
          // Click the label too — Naukri uses the label click to advance the chatbot
          const lbl = document.querySelector(`label[for="${targetRadio.id}"]`);
          if (lbl) {
            await new Promise(r => setTimeout(r, 100));
            lbl.click();
          }
          await new Promise(r => setTimeout(r, 1800));
          fillNaukriChatbot(profile); // recurse for next question
          return;
        } else {
          console.log("[JobFill Naukri] No matching radio for:", answerValue);
        }
      } else {
        console.log("[JobFill Naukri] No answer found for radio question — skipping");
      }
      return; // Don't try text input when in radio mode
    }

    // ── MODE B: Text input (contenteditable) ─────────────────────────────────
    // Input box is visible (not d-none) when it's a text question
    const inputBoxWrapper = document.querySelector("#\\39 z8wxss05InputBox, [id*='InputBox']");
    const inputBox = document.querySelector(".chatbot_InputContainer .textArea[contenteditable='true']:not(.d-none), .textAreaWrapper [contenteditable='true']");

    // Check the wrapper isn't hidden
    const isHidden = inputBoxWrapper?.classList.contains("d-none");
    if (!inputBox || isHidden) {
      console.log("[JobFill Naukri] Text input hidden or not found");
      return;
    }

    let valueToFill = "";

    const textFieldMap = [
      { keywords: ["full name", "your name", "legal name", "name"], value: profile.personal?.fullName || ((profile.personal?.firstName || "") + " " + (profile.personal?.lastName || "")).trim() },
      { keywords: ["first name"], value: profile.personal?.firstName },
      { keywords: ["last name", "surname"], value: profile.personal?.lastName },
      { keywords: ["email"], value: profile.personal?.email },
      { keywords: ["phone", "mobile", "contact number", "number"], value: profile.personal?.phone },
      { keywords: ["total experience", "years of experience", "experience"], value: profile.professional?.yearsOfExperience },
      { keywords: ["current salary", "current ctc", "present salary"], value: profile.professional?.currentSalary },
      { keywords: ["expected salary", "expected ctc", "salary expectation"], value: profile.professional?.expectedSalary },
      { keywords: ["notice period"], value: profile.professional?.noticePeriod },
      { keywords: ["current location", "present location", "where are you based", "residing"], value: profile.personal?.currentLocation || profile.personal?.city },
      { keywords: ["preferred location", "desired location"], value: profile.professional?.preferredLocation },
      { keywords: ["current company", "current employer", "current organization"], value: profile.professional?.currentCompany },
      { keywords: ["current designation", "current title", "current role", "designation"], value: profile.professional?.currentTitle },
      { keywords: ["linkedin"], value: profile.personal?.linkedIn },
      { keywords: ["github"], value: profile.personal?.github },
      { keywords: ["degree", "qualification", "highest education"], value: profile.education?.degree }
    ];

    for (const entry of textFieldMap) {
      if (!entry.value) continue;
      if (entry.keywords.some(kw => questionText.includes(kw))) { valueToFill = entry.value; break; }
    }

    if (!valueToFill && profile.customAnswers?.length) {
      let best = 0;
      for (const qa of profile.customAnswers) {
        if (!qa.question || !qa.answer) continue;
        const score = fuzzyMatchScore(questionText, qa.question.toLowerCase());
        if (score > best && score >= 0.28) { best = score; valueToFill = qa.answer; }
      }
    }

    if (!valueToFill) { console.log("[JobFill Naukri] No text match — stopping"); return; }
    console.log("[JobFill Naukri] Text fill:", valueToFill.slice(0, 60));

    inputBox.focus();
    inputBox.innerText = valueToFill;
    inputBox.dispatchEvent(new Event("input", { bubbles: true }));
    inputBox.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));

    await new Promise(r => setTimeout(r, 350));

    const sendBtn = document.querySelector(".chatbot_InputContainer button, [class*='sendBtn'], button[class*='send']");
    if (sendBtn) {
      console.log("[JobFill Naukri] Clicking send");
      sendBtn.click();
      await new Promise(r => setTimeout(r, 1800));
      fillNaukriChatbot(profile);
    }
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
  let isFilling = false;

  const observer = new MutationObserver(() => {
    if (!autoFillEnabled || !storedProfile || isFilling) return;
    clearTimeout(fillDebounce);
    fillDebounce = setTimeout(() => autoFill(storedProfile, true, acceptTermsEnabled), 800);
  });

  // Only observe DOM mutations on known job platforms — avoids constant CPU overhead
  // on high-churn sites like LinkedIn feed, news, etc.
  if (currentPlatform.id !== "generic") {
    observer.observe(document.body, { childList: true, subtree: true });
  }

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
      // Use a lightweight visible-field count rather than running the full matchField
      // scan (which does DOM label lookups per element) on every status poll.
      const detectedCount = inputs.length;
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
      autoFillEnabled = true;
      setTimeout(() => autoFill(storedProfile, true, acceptTermsEnabled), 1500);
    }
  });

  // ─── Credentials Auto-fill ────────────────────────────────────────────────
  chrome.storage.local.get(["credentials"], result => {
    const creds = result.credentials || [];
    if (!creds.length) return;

    const host = window.location.hostname.toLowerCase();

    function normalizeCredentialHost(pattern) {
      const raw = String(pattern || "").trim().toLowerCase();
      if (!raw) return "";
      try {
        return new URL(raw.includes("://") ? raw : `https://${raw}`).hostname;
      } catch {
        return raw.replace(/^https?:\/\//, "").split("/")[0].split("?")[0].split("#")[0];
      }
    }

    function credentialMatchesCurrentHost(cred) {
      const patternHost = normalizeCredentialHost(cred.siteUrl);
      if (!patternHost) return false;
      return host === patternHost || host.endsWith(`.${patternHost}`);
    }

    // Specific domain match first, then blank credentials only on detected job sites.
    const matched = creds.find(credentialMatchesCurrentHost)
                 || (currentPlatform.id !== "generic" ? creds.find(c => !c.siteUrl) : null);

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

        if (passInputs.length > 1) {
          const confirmPattern = /confirm|confirmation|retype|repeat|verify|verify password|confirm password|password confirmation/i;
          for (let i = 1; i < passInputs.length; i++) {
            const candidate = passInputs[i];
            const candidateText = ((candidate.name || "") + " " + (candidate.id || "") + " " + (candidate.placeholder || "")).toLowerCase();
            if (passInputs.length === 2 || confirmPattern.test(candidateText)) {
              setReactInputValue(candidate, matched.password);
              console.log("[JobFill] Filled password confirmation");
              break;
            }
          }
        }
      }
    }, 1200);
  });

  // Notify background
  try { chrome.runtime.sendMessage({ action: "pageLoaded", platform: currentPlatform, url: window.location.href }); } catch {}

})();