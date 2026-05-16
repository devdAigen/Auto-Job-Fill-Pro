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
    naukri: { match: /naukri\.com/, name: "Naukri" }
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
    } catch { try { el.value = value; } catch {} }
    try { el.dispatchEvent(new Event("input", { bubbles: true })); } catch {}
    try { el.dispatchEvent(new Event("change", { bubbles: true })); } catch {}
    // IMPORTANT: Do NOT dispatch keydown/keyup on Workday — it triggers internal
    // React navigation that fetches community.workday.com causing a CORS crash.
    if (currentPlatform.id !== "workday") {
      try { el.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true })); } catch {}
      try { el.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true })); } catch {}
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

  // ─── Field Matcher ────────────────────────────────────────────────────────
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
    if (el.disabled || el.readOnly) return false;
    if (isWorkdayInternalInput(el)) return false;

    if (skipFilled) {
      const currentVal = (el.value || "").trim();
      const placeholder = el.getAttribute("placeholder") || el.getAttribute("data-placeholder") || "";

      // Standard check: has a real value (not just the placeholder text)
      if (currentVal && currentVal !== placeholder) return false;

      // Workday: fields show current value in aria-label as "<Label> <Value> Required"
      // e.g. aria-label=" India Required" means India is already selected
      if (currentPlatform.id === "workday") {
        const ariaLabel = (el.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim().toLowerCase();
        const fieldLabel = getLabelText(el).toLowerCase();
        if (ariaLabel && fieldLabel) {
          // Extract value portion: aria-label minus the field label and "required"
          const stripped = ariaLabel
            .replace(fieldLabel, "")
            .replace(/\brequired\b/gi, "")
            .trim();
          // If there's meaningful content remaining, field is already filled
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

      let bestMatch = null, bestScore = 0, bestIndex = -1;
      customAnswers.forEach((qa, idx) => {
        if (!qa.question || !qa.answer) return;
        const score = fuzzyMatchScore(combined, qa.question);
        if (score > bestScore && score >= 0.35) { bestScore = score; bestMatch = qa; bestIndex = idx; }
      });
      if (bestMatch) {
        console.log("[JobFill] Matched custom answer:", bestMatch.question, "score:", bestScore, "field:", combined);
        el.tagName.toLowerCase() === "textarea"
          ? setReactTextareaValue(el, bestMatch.answer)
          : setReactInputValue(el, bestMatch.answer);
        count++;
        customAnswers.splice(bestIndex, 1); // Remove used answer
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
      await new Promise(r => setTimeout(r, 300));

      const options = Array.from(document.querySelectorAll('[role="option"], [data-automation-id*="option"], [data-automation-id*="Option"], li[role="option"], div[role="option"], button[role="option"]'));
      const desired = desiredAnswer.toLowerCase().trim();
      const normalizedDesired = normalizeYesNo(desired);

      let match = options.find(o => normalizeYesNo(o.textContent) === normalizedDesired);
      if (!match) match = options.find(o => o.textContent.toLowerCase().trim() === desired);
      if (!match) match = options.find(o => o.textContent.toLowerCase().includes(desired));
      if (!match) match = options.find(o => desired.includes(o.textContent.toLowerCase().trim()) && o.textContent.trim().length > 2);

      if (match) {
        match.click();
        await new Promise(r => setTimeout(r, 200));
        return true;
      }
    } catch (e) {}
    return false;
  }

  // ─── Yes/No Answers (Context-Aware) ───────────────────────────────────────
  async function fillYesNoAnswers(yesNoAnswers) {
    if (!yesNoAnswers?.length) return 0;
    console.log("[JobFill] fillYesNoAnswers called with", yesNoAnswers.length, "items");
    let count = 0;

    // Handle <select> dropdowns
    document.querySelectorAll("select").forEach(sel => {
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
        if (fillSelectBestMatch(sel, bestMatch.answer)) {
          count++;
          yesNoAnswers.splice(bestIndex, 1); // Remove used answer
        }
      }
    });

    // Handle button dropdowns (Workday-style custom listboxes)
    if (currentPlatform.id === "workday") {
      const buttonCandidates = Array.from(document.querySelectorAll('button[aria-haspopup="listbox"], button[role="combobox"], [role="combobox"]'));
      for (const btn of buttonCandidates) {
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
          const filled = await fillButtonDropdown(btn, bestMatch.answer);
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
          const rv = normalizeYesNo(r.value || getLabelText(r));
          if (rv === desired) { r.click(); count++; }
        });
        yesNoAnswers.splice(bestIndex, 1); // Remove used answer
      }
    }
    return count;
  }

  // ─── Smart Checkbox Handler ───────────────────────────────────────────────
  function autoAcceptTerms() {
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
      const isOptOut = OPT_OUT_PATTERNS.some(r => r.test(label));
      console.log("[JobFill] isOptOut:", isOptOut, "|", label.slice(0, 50));

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
      await new Promise(r => setTimeout(r, 400));
    }

    try {
      console.log("[JobFill Workday] Opening dropdown for:", value);
      btn.click();

      // Poll for options instead of fixed delay — faster and more reliable
      let options = [];
      for (let attempt = 0; attempt < 8; attempt++) {
        await new Promise(r => setTimeout(r, 200));
        for (const sel of ['[role="listbox"] [role="option"]', '[role="option"]', '[data-automation-id*="option"]', 'ul[role="listbox"] li']) {
          options = Array.from(document.querySelectorAll(sel));
          if (options.length) break;
        }
        if (options.length) break;
      }
      console.log("[JobFill Workday] Options found:", options.length);

      if (!options.length) {
        // Close gracefully
        try { btn.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); } catch {}
        document.body.click();
        await new Promise(r => setTimeout(r, 300));
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
        await new Promise(r => setTimeout(r, 500));
        const stillOpen = document.querySelector('[role="listbox"]');
        if (stillOpen) { document.body.click(); await new Promise(r => setTimeout(r, 300)); }
        return true;
      }

      // No match — close cleanly
      try { btn.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); } catch {}
      document.body.click();
      await new Promise(r => setTimeout(r, 300));
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

  async function fillAllWorkdayComboboxes(profile) {
    if (currentPlatform.id !== "workday") return;

    // Close any already-open listbox first
    if (document.querySelector('[role="listbox"]')) {
      document.body.click();
      await new Promise(r => setTimeout(r, 400));
    }

    const dropdownBtns = Array.from(document.querySelectorAll('button[aria-haspopup="listbox"]'));
    console.log("[JobFill Workday] Button dropdowns:", dropdownBtns.length);

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

      await fillWorkdayButtonDropdown(btn, valueToSet);
      // Mandatory gap — let Workday React settle between dropdowns
      await new Promise(r => setTimeout(r, 600));
    }

    // SECONDARY: role="combobox" non-button elements
    const comboboxes = document.querySelectorAll('[role="combobox"]:not(button), [data-automation-id*="prompt"]:not(button)');
    for (const el of comboboxes) {
      const fieldKey = matchField(el);
      if (!fieldKey) continue;
      const value = getProfileValue(fieldKey, profile);
      if (!value) continue;
      await fillWorkdayCombobox(el, value);
      await new Promise(r => setTimeout(r, 400));
    }
  }


  // ─── Main Auto-Fill ───────────────────────────────────────────────────────
  async function autoFill(profile, skipFilled = true, acceptTerms = true) {
    if (isFilling) return { filled: 0, skipped: 0, errors: [], fields: [] };
    isFilling = true;
    console.log("[JobFill] autoFill start — customAnswers:", profile.customAnswers?.length, "customFields:", profile.customFields?.length, "yesNoAnswers:", profile.yesNoAnswers?.length);
    const results = { filled: 0, skipped: 0, errors: [], fields: [] };

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

    const customCount = fillCustomAnswers([...profile.customAnswers || []]);
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
    isFilling = false;
    return results;
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
          // Also click the label (Naukri uses label click to trigger submission)
          const lbl = document.querySelector(`label[for="${targetRadio.id}"]`);
          if (lbl) { await new Promise(r => setTimeout(r, 100)); lbl.click(); }
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
      autoFillEnabled = true;
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
