// storage.js — Profile data management for JobFill Pro

const DEFAULT_PROFILE = {
  personal: {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    linkedIn: "",
    github: "",
    portfolio: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    zipCode: ""
  },
  professional: {
    currentTitle: "",
    yearsOfExperience: "",
    currentCompany: "",
    noticePeriod: "",
    expectedSalary: "",
    currentSalary: "",
    currency: "INR"
  },
  work: {
    authorized: true,
    sponsorship: false,
    workType: ["Full-time"],
    preferredLocations: []
  },
  education: {
    degree: "",
    field: "",
    university: "",
    graduationYear: ""
  },
  diversity: {
    gender: "",
    ethnicity: "",
    veteranStatus: "I am not a protected veteran",
    disabilityStatus: "No, I don't have a disability"
  },
  resume: {
    fileName: "",
    fileData: ""
  },
  coverLetter: {
    default: ""
  },
  customAnswers: []
};

async function getProfile() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["profile"], (result) => {
      resolve(result.profile || DEFAULT_PROFILE);
    });
  });
}

async function saveProfile(profile) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ profile }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(true);
      }
    });
  });
}

async function getHistory() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["history"], (result) => {
      resolve(result.history || []);
    });
  });
}

async function addHistoryEntry(entry) {
  const history = await getHistory();
  history.unshift({ ...entry, timestamp: Date.now() });
  const trimmed = history.slice(0, 100); // keep last 100
  return new Promise((resolve) => {
    chrome.storage.local.set({ history: trimmed }, resolve);
  });
}

async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["settings"], (result) => {
      resolve(result.settings || { autoFillOnLoad: false, skipFilled: true });
    });
  });
}

async function saveSettings(settings) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ settings }, resolve);
  });
}
