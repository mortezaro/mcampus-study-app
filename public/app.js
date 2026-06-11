const app = document.querySelector("#app");

const LOCALHOST = location.hostname === "127.0.0.1" || location.hostname === "localhost";
const QUERY = new URLSearchParams(window.location.search);
const DEMO_MODE = QUERY.get("demo") === "1";
const STUDY_MODE = QUERY.get("mode") === "qualification" ? "qualification" : "main";

const SPEECH_PROMPTS = [
  "Describe situations in your everyday life when your thinking tends to feel especially clear or sharp. What are you usually doing, and what do you think helps?",
  "Describe some situations in your daily life when your thinking tends to feel slower or less clear. What kinds of activities are you usually doing, and how do you usually respond?",
  "Tell us about the kinds of things that usually make it harder for you to concentrate, and how you typically handle that.",
  "Think of a type of task that you generally find mentally demanding. Walk us through what it usually involves and how it typically feels for you.",
  "Describe what it is generally like for you when you feel mentally tired but continue with your activities. What kinds of things do you usually do in those situations?",
  "In a typical day, when do you tend to feel most alert and when do you tend to feel more tired? What are you usually doing at those times?",
  "Tell us about types of tasks that usually require more mental effort for you than you expect. What tends to make them feel harder, and how do you typically adapt?",
  "Describe a place where you often spend time. How does that kind of environment usually affect your ability to focus, if at all?",
  "Describe the kinds of interruptions that commonly happen when you are trying to focus on something, and what usually happens afterwards.",
  "Describe situations in your daily life when you need to switch quickly from one task to another. What kinds of tasks are involved, and how does that switch usually feel for you?",
  "Describe a place where you often do things that require concentration. What, if anything, makes it easier or harder to concentrate there?",
  "Describe some strategies you use to remember important things you need to do, and how well they usually work for you.",
  "Tell us about how you usually plan your day or week. What kinds of steps do you take, and how do you keep track of them?",
  "Think about the kinds of strategies you typically use to remember things, such as notes, alarms, or repeating things to yourself. Describe how you use them and how well they tend to work.",
  "Describe situations in your life where you often have to keep track of several things at once. How do you usually manage this, and how does it typically go?",
  "Think about situations in your life that usually require you to stay mentally organised or focused. Describe what tends to happen and how this usually affects your ability to think clearly.",
  "Describe types of moments in your day that you usually find positive or enjoyable. What tends to happen, how do you usually feel, and what do you notice about your focus or energy at those times?",
  "In general, what kinds of things tend to change your mood during the day, and does that usually affect what you are doing?",
  "Describe the kinds of conversations or interactions with other people that often stand out to you in a typical day. What are these situations usually like, and how do the conversations tend to go?",
  "Tell us about situations in general where it can be harder for you to get your point across or to understand someone else. What tends to make communication more difficult in those cases?",
  "Describe what a clear and effective conversation usually looks like for you. What kinds of things help you communicate especially clearly?",
  "Describe a typical sequence of events in a usual day for you, from when you wake up until later in the day. Include a few things that usually feel easy and a few that usually require more effort.",
  "Thinking about an ordinary day, what are one or two activities you generally feel satisfied with, and why?",
  "Thinking about your usual days, describe how your energy and focus tend to change from morning to evening."
];

const PICTURES = [
  ["picture_01", "Picture 1", "/assets/pictures/picture_01.png"],
  ["picture_02", "Picture 2", "/assets/pictures/picture_02.png"],
  ["picture_03", "Picture 3", "/assets/pictures/picture_03.png"],
  ["picture_04", "Picture 4", "/assets/pictures/picture_04.png"],
  ["picture_05", "Picture 5", "/assets/pictures/picture_05.png"],
  ["picture_06", "Picture 6", "/assets/pictures/picture_06.png"],
  ["picture_07", "Picture 7", "/assets/pictures/picture_07.png"],
  ["picture_08", "Picture 8", "/assets/pictures/picture_08.png"],
  ["picture_09", "Picture 9", "/assets/pictures/picture_09.png"],
  ["picture_10", "Picture 10", "/assets/pictures/picture_10.png"],
  ["picture_11", "Picture 11", "/assets/pictures/picture_11.png"],
  ["picture_12", "Picture 12", "/assets/pictures/picture_12.png"]
].map(([id, title, src]) => ({
  id,
  title,
  prompt: "Please describe this picture in as much detail as you can. Mention the main people or objects, actions, setting, and anything unusual.",
  src
}));

const COUNTRY_OPTIONS = [
  "United States",
  "Canada",
  "United Kingdom",
  "Ireland",
  "Australia",
  "New Zealand",
  "Other English-speaking country",
  "Other country"
];

const TIME_ZONE_OPTIONS = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Toronto",
  "America/Vancouver",
  "Europe/London",
  "Europe/Dublin",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Perth",
  "Pacific/Auckland",
  "Other / not listed"
];

const BEDTIME_OPTIONS = [
  "Before 9:00 PM",
  "9:00-10:00 PM",
  "10:00-11:00 PM",
  "11:00 PM-12:00 AM",
  "12:00-1:00 AM",
  "1:00-2:00 AM",
  "After 2:00 AM",
  "Varies a lot"
];

const WAKETIME_OPTIONS = [
  "Before 5:00 AM",
  "5:00-6:00 AM",
  "6:00-7:00 AM",
  "7:00-8:00 AM",
  "8:00-9:00 AM",
  "9:00-10:00 AM",
  "After 10:00 AM",
  "Varies a lot"
];

const state = {
  config: null,
  step: "welcome",
  participantId: "",
  studyId: "",
  sessionId: "",
  consent: false,
  eligible: {},
  forms: {},
  assignments: {},
  ema: {},
  emaDraft: null,
  tmb: {},
  cognitivePhase: "baseline",
  cognitiveReturn: "finalSurvey",
  cognitiveOrder: [],
  currentEma: "",
  baselineComplete: false,
  recordings: {},
  recorder: null
};

const stepOrder = [
  "welcome", "consent", "eligibility", "demographics", "sleep", "baselineState", "deviceCheck",
  "speech", "picture", "tmbIntro", "choiceRt", "digitSymbol", "gradCpt", "mot", "finalSurvey",
  "baselineComplete", "emaHome", "emaSurvey", "emaSpeech", "emaPicture", "emaFinal", "emaComplete", "done"
];

const COGNITIVE_TASK_KEYS = ["choice_rt", "digit_symbol", "grad_cpt", "mot"];

const COGNITIVE_STEP_BY_TASK = {
  choice_rt: "choiceRt",
  digit_symbol: "digitSymbol",
  grad_cpt: "gradCpt",
  mot: "mot"
};

function html(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function isSmartphone() {
  return /iPhone|iPod|Android.*Mobile/i.test(navigator.userAgent);
}

function uidHash(seed, max) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % max;
}

function params() {
  const query = QUERY;
  const participantId = query.get("PROLIFIC_PID") || query.get("participant") || query.get("pid") || (LOCALHOST ? localStorage.getItem("mcampusParticipantId") : "");
  return {
    participantId: participantId || "",
    studyId: query.get("STUDY_ID") || "",
    sessionId: query.get("SESSION_ID") || ""
  };
}

function localStateKey() {
  const suffix = STUDY_MODE === "qualification" ? ":qualification" : "";
  return `mcampus:${state.participantId}:state${suffix}`;
}

function prolificCompletionUrl() {
  const code = String(QUERY.get("completionCode") || "").trim();
  if (/^[A-Z0-9]{6,16}$/i.test(code)) {
    return `https://app.prolific.com/submissions/complete?cc=${encodeURIComponent(code)}`;
  }
  return state.config.prolificCompletionUrl;
}

async function api(path, options = {}) {
  const res = await fetch(path, options);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function logEvent(type, payload = {}) {
  return api("/api/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      type,
      participantId: state.participantId,
      studyId: state.studyId,
      sessionId: state.sessionId,
      step: state.step,
      userAgent: navigator.userAgent,
      visibilityState: document.visibilityState,
      payload
    })
  }).catch(err => console.warn("event log failed", err));
}

function saveLocal() {
  localStorage.setItem("mcampusParticipantId", state.participantId);
  localStorage.setItem(localStateKey(), JSON.stringify({
    step: state.step,
    consent: state.consent,
    eligible: state.eligible,
    forms: state.forms,
    assignments: state.assignments,
    ema: state.ema,
    emaDraft: state.emaDraft,
    tmb: state.tmb,
    cognitivePhase: state.cognitivePhase,
    cognitiveReturn: state.cognitiveReturn,
    cognitiveOrder: state.cognitiveOrder,
    currentEma: state.currentEma,
    baselineComplete: state.baselineComplete,
    recordings: state.recordings
  }));
}

function restoreLocal() {
  const p = params();
  state.participantId = p.participantId;
  state.studyId = p.studyId;
  state.sessionId = p.sessionId;
  if (new URLSearchParams(window.location.search).get("reset") === "1" && state.participantId) {
    localStorage.removeItem(localStateKey());
  }
  const saved = state.participantId && localStorage.getItem(localStateKey());
  if (!saved) return;
  try {
    Object.assign(state, JSON.parse(saved));
  } catch {
    localStorage.removeItem(localStateKey());
  }
}

function go(step) {
  state.step = step;
  saveLocal();
  render();
  logEvent("step_view", { step });
}

function topbar() {
  if (STUDY_MODE === "qualification") {
    const qSteps = ["qWelcome", "qConsent", "qProfile", "qSpeech", "qComplete"];
    const qIndex = Math.max(0, qSteps.indexOf(state.step));
    return `
      <header class="topbar">
        <div class="brand"><strong>M-CAMPUS</strong><span>Voice qualification</span></div>
        <div class="progress">${state.step === "qComplete" ? "Done" : `${qIndex + 1}/${qSteps.length}`}</div>
      </header>
    `;
  }
  const idx = Math.max(0, stepOrder.indexOf(state.step));
  const progress = state.step === "done" ? "Done" : `${idx + 1}/${stepOrder.length}`;
  return `
    <header class="topbar">
      <div class="brand"><strong>M-CAMPUS</strong><span>Baseline + EMA</span></div>
      <div class="progress">${progress}</div>
    </header>
  `;
}

function page(content) {
  app.innerHTML = `${topbar()}<section class="view">${content}</section>`;
  window.scrollTo({ top: 0, left: 0 });
}

function val(name) {
  return html(state.forms[name] || "");
}

function bindFields() {
  document.querySelectorAll("[data-field]").forEach(field => {
    field.addEventListener("input", event => {
      const target = event.target;
      state.forms[target.dataset.field] = target.type === "checkbox" ? target.checked : target.value;
      clearFormError();
      saveLocal();
    });
    field.addEventListener("change", event => {
      const target = event.target;
      state.forms[target.dataset.field] = target.type === "checkbox" ? target.checked : target.value;
      clearFormError();
      saveLocal();
    });
  });
}

function selectOptions(options, selected = "") {
  const extra = selected && !options.includes(selected) ? [selected] : [];
  return `<option value="">Choose one</option>${extra.concat(options).map(x => `<option value="${html(x)}" ${selected === x ? "selected" : ""}>${html(x)}</option>`).join("")}`;
}

function clearFormError() {
  const existing = document.querySelector("#formError");
  if (existing) existing.remove();
  document.querySelectorAll(".field-error").forEach(node => node.classList.remove("field-error"));
}

function showFormError(message, fields = []) {
  clearFormError();
  const actions = document.querySelector(".actions");
  const error = document.createElement("div");
  error.id = "formError";
  error.className = "form-error";
  error.textContent = message;
  if (actions) actions.before(error);
  fields.forEach(name => {
    document.querySelectorAll("[data-field]").forEach(node => {
      if (node.dataset.field !== name) return;
      const wrapper = node.closest(".field, .scale-row");
      if (wrapper) wrapper.classList.add("field-error");
    });
  });
  error.scrollIntoView({ block: "center", behavior: "smooth" });
}

function formValue(name) {
  return state.forms[name];
}

function requireFields(fields) {
  const missing = fields.filter(field => {
    const value = formValue(field.name);
    return value === undefined || value === null || String(value).trim() === "";
  });
  if (missing.length) {
    showFormError(`Please answer all required items before continuing. Missing: ${missing.map(field => field.label).join(", ")}.`, missing.map(field => field.name));
    return false;
  }
  clearFormError();
  return true;
}

function requireNumericRange(name, label, min, max) {
  const raw = String(formValue(name) || "").trim();
  const value = Number(raw);
  if (!raw || Number.isNaN(value) || value < min || value > max) {
    showFormError(`${label} must be a number from ${min} to ${max}.`, [name]);
    return false;
  }
  clearFormError();
  return true;
}

function scaleFieldList(items, prefix) {
  return items.map(([key, label]) => ({ name: `${prefix}_${key}`, label }));
}

function scaleRows(items, prefix, min = "Low", max = "High") {
  return `<div class="scale-block">${items.map(([key, label]) => `
    <div class="scale-row">
      <label>${html(label)}</label>
      <div class="scale">
        ${[1, 2, 3, 4, 5, 6, 7].map(n => `
          <label><input type="radio" name="${prefix}_${key}" data-field="${prefix}_${key}" value="${n}" ${state.forms[`${prefix}_${key}`] === String(n) ? "checked" : ""}><span>${n}</span></label>
        `).join("")}
      </div>
      <div class="scale-ends"><span>${html(min)}</span><span>${html(max)}</span></div>
    </div>
  `).join("")}</div>`;
}

function welcome() {
  if (!isSmartphone() && !LOCALHOST && !DEMO_MODE) {
    page(`
      <h1>Smartphone required</h1>
      <p class="lead">This study must be completed on an iPhone or Android phone.</p>
      <div class="band">
        <p>Please reopen your Prolific study link on your smartphone. Your phone needs a working microphone and internet connection.</p>
      </div>
    `);
    logEvent("device_ineligible", {
      reason: "smartphone_required",
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`
    });
    return;
  }
  page(`
    <h1>Start your M-CAMPUS session</h1>
    <p class="lead">This study includes a baseline session, short questionnaires, randomized speech tasks, cognitive tasks, and a 12-day daily check-in dashboard in one mobile-friendly flow.</p>
    <div class="field">
      <label for="pid">Participant ID</label>
      <input id="pid" class="input" autocomplete="off" value="${html(state.participantId)}" placeholder="Loaded from Prolific when available">
      <div class="small">For Prolific, this comes from <code>PROLIFIC_PID</code> in the URL.</div>
    </div>
    <div class="band">
      <h2>Baseline flow</h2>
      <p>Consent, eligibility, demographics, sleep and state/context questions, mic/device check, randomized open speech, randomized picture description, four brief cognitive tasks, and final interruption feedback.</p>
    </div>
    <div class="actions"><button class="button" id="start">Continue</button></div>
  `);
  document.querySelector("#pid").addEventListener("input", event => {
    state.participantId = event.target.value.trim();
    saveLocal();
  });
  document.querySelector("#start").onclick = () => {
    if (!state.participantId) return alert("Please enter or load a participant ID first.");
    go("consent");
  };
}

function consent() {
  page(`
    <h1>Consent</h1>
    <p class="lead">You are invited to take part in a research study about how thinking and attention vary in daily life, and whether short speech samples and information about your surroundings can help predict these fluctuations.</p>
    <div class="band">
      <p><strong>Participation.</strong> You will complete one baseline session of about 25-30 minutes, followed by 12 days of brief daily sessions, 3 times per day, each about 5-7 minutes.</p>
      <p><strong>Tasks.</strong> Each session includes short questionnaires, a 60-90 second spoken response, brief cognitive tasks, and a question about interruptions or experience.</p>
      <p><strong>Risks.</strong> Possible risks include mild fatigue, concentration effort, frustration, and privacy risks because voice recordings can be re-identifiable. Please do not speak names, addresses, passwords, or other private details.</p>
      <p><strong>Data.</strong> Research data are stored with a pseudonymous ID. Speech is not fully anonymous. Data are used for research, not diagnosis, commercial profiling, or automated decisions.</p>
      <p><strong>Withdrawal.</strong> Participation is voluntary. You may stop anytime and may request deletion up to 30 days after your final session.</p>
      <p><strong>Contact.</strong> Prof. Michael Krauthammer, michael.krauthammer@uzh.ch. Ethics Committee: chair.ethics.committee@phil.uzh.ch.</p>
    </div>
    <label class="choice">
      <input id="consentBox" type="checkbox" ${state.consent ? "checked" : ""}>
      <span>I have read and understood the study information, my questions have been answered, and I voluntarily consent to collection, use, and storage of my study data including audio recordings.</span>
    </label>
    <div class="actions">
      <button class="button secondary" id="back">Back</button>
      <button class="button" id="next" ${state.consent ? "" : "disabled"}>Continue</button>
    </div>
  `);
  document.querySelector("#consentBox").onchange = event => {
    state.consent = event.target.checked;
    document.querySelector("#next").disabled = !state.consent;
    saveLocal();
  };
  document.querySelector("#back").onclick = () => go("welcome");
  document.querySelector("#next").onclick = () => go("eligibility");
}

function eligibility() {
  const q = [
    ["age18_70", "I am between 18 and 70 years old."],
    ["english_early", "English was one of the main languages I used before age 6."],
    ["us_raised", "I lived in the United States for most of ages 5-18 and completed most of my schooling there."],
    ["american_english", "My everyday spoken English is an American English variety."],
    ["smartphone", "I have access to a smartphone with a working microphone and internet connection."],
    ["daily", "I am willing to complete 3 short sessions per day for 12 days."],
    ["audio", "I am willing to provide short audio recordings."],
    ["no_neuro", "I do not have a neurological disorder that would make the tasks unsuitable."],
    ["no_speech_hearing", "I do not have a major uncorrected speech or hearing impairment."],
    ["no_crisis", "I am not currently in an acute psychiatric crisis."],
    ["safe", "I will complete sessions only when it is safe, not while driving or operating machinery."]
  ];
  page(`
    <h1>Eligibility</h1>
    <p class="lead">These answers decide whether the participant should continue.</p>
    <div class="choices">
      ${q.map(([key, label]) => `
        <label class="choice">
          <input type="checkbox" data-key="${key}" ${state.eligible[key] ? "checked" : ""}>
          <span>${html(label)}</span>
        </label>
      `).join("")}
    </div>
    <div class="actions"><button class="button secondary" id="back">Back</button><button class="button" id="next">Continue</button></div>
  `);
  document.querySelectorAll("[data-key]").forEach(input => {
    input.onchange = event => {
      state.eligible[event.target.dataset.key] = event.target.checked;
      saveLocal();
    };
  });
  document.querySelector("#back").onclick = () => go("consent");
  document.querySelector("#next").onclick = async () => {
    const ok = q.every(([key]) => state.eligible[key]);
    await logEvent("eligibility_result", { eligible: ok, answers: state.eligible });
    if (!ok) {
      page(`<h1>Thank you</h1><p class="lead">Based on these answers, this study is not the right fit at this time.</p><div class="actions"><button class="button" id="restart">Return</button></div>`);
      document.querySelector("#restart").onclick = () => go("eligibility");
      return;
    }
    go("demographics");
  };
}

function demographics() {
  if (!state.forms.timezone) {
    const detectedTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    state.forms.timezone = TIME_ZONE_OPTIONS.includes(detectedTimeZone) ? detectedTimeZone : "";
  }
  page(`
    <h1>Baseline profile</h1>
    <p class="lead">Demographics and language background.</p>
    <div class="field"><label>Age <span class="required">*</span></label><input class="input" inputmode="numeric" data-field="age" value="${val("age")}" required></div>
    <div class="field"><label>Gender <span class="required">*</span></label><select data-field="gender" required>${selectOptions(["Woman", "Man", "Non-binary", "Prefer to self-describe", "Prefer not to say"], state.forms.gender)}</select></div>
    <div class="field"><label>Education <span class="required">*</span></label><select data-field="education" required>${selectOptions(["Secondary school", "Vocational training", "Some college/university", "Bachelor's degree", "Master's degree", "Doctoral degree", "Other"], state.forms.education)}</select></div>
    <div class="field"><label>Are you bilingual or multilingual? <span class="required">*</span></label><select data-field="multilingual" required>${selectOptions(["No, English only", "Yes, bilingual", "Yes, multilingual", "Prefer not to say"], state.forms.multilingual)}</select></div>
    <div class="field"><label>When did you begin using English regularly? <span class="required">*</span></label><select data-field="english_start_age" required>${selectOptions(["From birth", "Before age 3", "Age 3-5", "Age 6-12", "After age 12"], state.forms.english_start_age)}</select></div>
    <div class="field"><label>Where did you spend most of ages 5-18? <span class="required">*</span></label><select data-field="childhood_region" required>${selectOptions(["United States", "Mostly United States and partly elsewhere", "Outside the United States"], state.forms.childhood_region)}</select></div>
    <div class="field"><label>How would you describe your everyday English dialect or accent? <span class="required">*</span></label><input class="input" data-field="english_dialect" value="${val("english_dialect")}" placeholder="For example: American English, Southern US English" required></div>
    <div class="field"><label>Country <span class="required">*</span></label><select data-field="country" required>${selectOptions(COUNTRY_OPTIONS, state.forms.country)}</select></div>
    <div class="field"><label>Time zone <span class="required">*</span></label><select data-field="timezone" required>${selectOptions(TIME_ZONE_OPTIONS, state.forms.timezone)}</select></div>
    <div class="actions"><button class="button secondary" id="back">Back</button><button class="button" id="next">Continue</button></div>
  `);
  bindFields();
  document.querySelector("#back").onclick = () => go("eligibility");
  document.querySelector("#next").onclick = async () => {
    if (!requireFields([
      { name: "age", label: "Age" },
      { name: "gender", label: "Gender" },
      { name: "education", label: "Education" },
      { name: "multilingual", label: "Bilingual or multilingual" },
      { name: "english_start_age", label: "Age English use began" },
      { name: "childhood_region", label: "Childhood region" },
      { name: "english_dialect", label: "English dialect or accent" },
      { name: "country", label: "Country" },
      { name: "timezone", label: "Time zone" }
    ])) return;
    if (!requireNumericRange("age", "Age", 18, 70)) return;
    await logEvent("baseline_demographics", state.forms);
    go("sleep");
  };
}

function sleep() {
  const sleepScales = [["sleep_quality", "Sleep quality last night"], ["chronotype", "Morningness vs eveningness"], ["caffeine", "Caffeine since waking"]];
  page(`
    <h1>Sleep and routines</h1>
    <p class="lead">These items help anchor daily variation.</p>
    <div class="field"><label>Usual bedtime <span class="required">*</span></label><select data-field="usual_bedtime" required>${selectOptions(BEDTIME_OPTIONS, state.forms.usual_bedtime)}</select></div>
    <div class="field"><label>Usual wake time <span class="required">*</span></label><select data-field="usual_waketime" required>${selectOptions(WAKETIME_OPTIONS, state.forms.usual_waketime)}</select></div>
    <div class="field"><label>Hours slept last night <span class="required">*</span></label><input class="input" inputmode="decimal" data-field="sleep_hours" value="${val("sleep_hours")}" required></div>
    ${scaleRows(sleepScales, "sleep", "Low", "High")}
    <div class="actions"><button class="button secondary" id="back">Back</button><button class="button" id="next">Continue</button></div>
  `);
  bindFields();
  document.querySelector("#back").onclick = () => go("demographics");
  document.querySelector("#next").onclick = async () => {
    if (!requireFields([
      { name: "usual_bedtime", label: "Usual bedtime" },
      { name: "usual_waketime", label: "Usual wake time" },
      { name: "sleep_hours", label: "Hours slept last night" },
      ...scaleFieldList(sleepScales, "sleep")
    ])) return;
    if (!requireNumericRange("sleep_hours", "Hours slept last night", 0, 24)) return;
    await logEvent("baseline_sleep", state.forms);
    go("baselineState");
  };
}

function baselineState() {
  const panas = [
    ["interested", "Interested"], ["distressed", "Distressed"], ["excited", "Excited"], ["upset", "Upset"],
    ["strong", "Strong"], ["guilty", "Guilty"], ["scared", "Scared"], ["hostile", "Hostile"],
    ["enthusiastic", "Enthusiastic"], ["alert", "Alert"]
  ];
  const context = [
    ["stress", "Current stress"], ["fatigue", "Current fatigue"], ["attention_difficulty", "Difficulty focusing"],
    ["noise", "Perceived background noise"], ["interruptions", "Interruptions in the last hour"], ["social", "Social demand right now"]
  ];
  page(`
    <h1>Current state</h1>
    <p class="lead">Please answer based on how you feel right now.</p>
    <h2>Feelings</h2>
    ${scaleRows(panas, "panas", "Very slightly", "Extremely")}
    <h2>Context</h2>
    ${scaleRows(context, "ctx", "Low", "High")}
    <div class="field"><label>Where are you? <span class="required">*</span></label><select data-field="location_type" required>${selectOptions(["Home", "Work or school", "Public indoor place", "Outdoors", "In transit", "Other"], state.forms.location_type)}</select></div>
    <div class="field"><label>Who is nearby? <span class="required">*</span></label><select data-field="social_context" required>${selectOptions(["Alone", "One other person", "Several people", "Crowded place"], state.forms.social_context)}</select></div>
    <div class="actions"><button class="button secondary" id="back">Back</button><button class="button" id="next">Continue</button></div>
  `);
  bindFields();
  document.querySelector("#back").onclick = () => go("sleep");
  document.querySelector("#next").onclick = async () => {
    if (!requireFields([
      ...scaleFieldList(panas, "panas"),
      ...scaleFieldList(context, "ctx"),
      { name: "location_type", label: "Where are you?" },
      { name: "social_context", label: "Who is nearby?" }
    ])) return;
    await logEvent("baseline_state_context", state.forms);
    go("deviceCheck");
  };
}

function deviceCheck() {
  const userAgent = navigator.userAgent;
  const isPhone = isSmartphone();
  const device = {
    platform: navigator.platform,
    language: navigator.language,
    userAgent,
    isPhone,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    screen: `${window.screen?.width || ""}x${window.screen?.height || ""}`,
    colorDepth: window.screen?.colorDepth || null,
    pixelRatio: window.devicePixelRatio,
    hardwareConcurrency: navigator.hardwareConcurrency || null,
    deviceMemoryGb: navigator.deviceMemory || null,
    maxTouchPoints: navigator.maxTouchPoints || 0,
    pointerCoarse: window.matchMedia?.("(pointer: coarse)")?.matches || false,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
    connection: navigator.connection ? {
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt
    } : null
  };
  state.forms.device_metadata = device;
  page(`
    <h1>Device and mic check</h1>
    <p class="lead">Before the speech tasks, please sit somewhere safe and reasonably quiet.</p>
    <div class="band">
      <p><strong>Detected device:</strong> ${html(device.viewport)}, ${html(device.platform || "unknown platform")}</p>
      <p>Please hold the phone near you, avoid covering the microphone, and use headphones only if they do not block speech recording.</p>
    </div>
    <div class="field"><label>Are you using headphones? <span class="required">*</span></label><select data-field="headphones" required>${selectOptions(["No", "Yes, wired", "Yes, wireless", "Not sure"], state.forms.headphones)}</select></div>
    <div class="field"><label>Can you speak for about 60-90 seconds right now? <span class="required">*</span></label><select data-field="safe_to_speak" required>${selectOptions(["Yes", "No"], state.forms.safe_to_speak)}</select></div>
    <label class="choice">
      <input type="checkbox" data-field="speech_authenticity" ${state.forms.speech_authenticity ? "checked" : ""}>
      <span>I will answer spontaneously in my own words without reading from notes, a prepared script, a website, or an AI tool, and without using another device for help.</span>
    </label>
    <div class="actions"><button class="button secondary" id="back">Back</button><button class="button" id="next">Continue</button></div>
  `);
  bindFields();
  document.querySelector("#back").onclick = () => go("baselineState");
  document.querySelector("#next").onclick = async () => {
    if (!requireFields([
      { name: "headphones", label: "Headphones" },
      { name: "safe_to_speak", label: "Can speak right now" },
      { name: "speech_authenticity", label: "Spontaneous speech agreement" }
    ])) return;
    if (state.forms.safe_to_speak !== "Yes") {
      showFormError("Please continue only when you can safely speak for 60-90 seconds.", ["safe_to_speak"]);
      return;
    }
    if (state.forms.speech_authenticity !== true) {
      showFormError("Please agree to answer the speech tasks spontaneously without scripts, websites, AI tools, or another device.", ["speech_authenticity"]);
      return;
    }
    if (!device.isPhone && !LOCALHOST && !DEMO_MODE) {
      showFormError("This study must be completed on a smartphone. Please reopen your Prolific study link on an iPhone or Android phone.");
      await logEvent("device_ineligible", { reason: "smartphone_required", device });
      return;
    }
    await logEvent("device_check", state.forms);
    assignPrompts();
    go("speech");
  };
}

function promptBank() {
  return SPEECH_PROMPTS;
}

function pictureBank() {
  return PICTURES;
}

function groundedSpeechPrompt(prompt) {
  return `Begin by naming one object you can see near you right now and saying where it is. Then answer this prompt: ${prompt}`;
}

function assignPrompts() {
  if (!state.assignments.speechPrompt) {
    const prompts = promptBank();
    const idx = uidHash(`${state.participantId}:baseline:speech`, prompts.length);
    state.assignments.speechPrompt = prompts[idx];
    state.assignments.speechPromptIndex = idx;
  }
  if (!state.assignments.picture) {
    const pics = pictureBank();
    const idx = uidHash(`${state.participantId}:baseline:picture`, pics.length);
    state.assignments.picture = pics[idx];
    state.assignments.pictureIndex = idx;
  }
  saveLocal();
}

function recorderMarkup(task, session, maxSeconds = 300, minSeconds = 40, guidance = "", completed = false, revealPrompt = false) {
  const help = guidance || `Aim for 60-90 seconds if you can. Recording auto-stops at ${maxSeconds} seconds.`;
  return `
    <div class="recorder" data-recorder data-task="${html(task)}" data-session="${html(session)}" data-min="${minSeconds}" data-target="${maxSeconds}" data-completed="${completed ? "true" : "false"}" data-reveal-prompt="${revealPrompt ? "true" : "false"}">
      <div class="meter"><span style="${completed ? "width:100%" : ""}"></span></div>
      <div class="status ${completed ? "ok" : ""}">${completed ? "Recording already uploaded" : "Ready to record"}</div>
      <button class="button" data-action="start" ${completed ? "disabled" : ""}>${completed ? "Uploaded" : "Start recording"}</button>
      <button class="button danger" data-action="stop" disabled>Stop and upload</button>
      ${DEMO_MODE ? `<button class="button secondary" data-action="demo">Demo: mark uploaded</button>` : ""}
      <audio controls hidden></audio>
      <div class="small">${html(help)}</div>
    </div>
  `;
}

function attachRecorder(task, session, done) {
  const root = document.querySelector("[data-recorder]");
  const status = root.querySelector(".status");
  const meter = root.querySelector(".meter span");
  const startButton = root.querySelector("[data-action='start']");
  const stopButton = root.querySelector("[data-action='stop']");
  const demoButton = root.querySelector("[data-action='demo']");
  const audio = root.querySelector("audio");
  const backButton = document.querySelector("#back");
  const target = Number(root.dataset.target || 60);
  const minSeconds = Number(root.dataset.min || 60);
  const completed = root.dataset.completed === "true";
  const revealPrompt = root.dataset.revealPrompt === "true";
  const liveStimuli = document.querySelectorAll("[data-live-stimulus]");
  let mediaRecorder;
  let chunks = [];
  let startedAt = 0;
  let timer;
  let visibilityChanges = 0;
  let hiddenStartedAt = 0;
  let hiddenMs = 0;

  const trackVisibility = () => {
    visibilityChanges += 1;
    if (document.visibilityState === "hidden") hiddenStartedAt = Date.now();
    else if (hiddenStartedAt) {
      hiddenMs += Date.now() - hiddenStartedAt;
      hiddenStartedAt = 0;
    }
  };

  if (completed) {
    done();
    return;
  }

  const stopRecording = () => {
    stopButton.disabled = true;
    if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();
  };

  startButton.onclick = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks = [];
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = event => {
        if (event.data.size) chunks.push(event.data);
      };
      mediaRecorder.onstop = async () => {
        clearInterval(timer);
        document.removeEventListener("visibilitychange", trackVisibility);
        if (hiddenStartedAt) hiddenMs += Date.now() - hiddenStartedAt;
        meter.style.width = "100%";
        const seconds = Math.round((Date.now() - startedAt) / 1000);
        const blob = new Blob(chunks, { type: mediaRecorder.mimeType || "audio/webm" });
        audio.src = URL.createObjectURL(blob);
        audio.hidden = false;
        status.textContent = "Uploading recording...";
        status.className = "status warn";
        try {
          const response = await fetch(`/api/upload?participantId=${encodeURIComponent(state.participantId)}&task=${encodeURIComponent(task)}&session=${encodeURIComponent(session)}`, {
            method: "POST",
            headers: { "content-type": blob.type },
            body: blob
          });
          if (!response.ok) throw new Error(await response.text());
          status.textContent = seconds < minSeconds ? "Recording uploaded, but it is shorter than the production minimum" : "Recording uploaded";
          status.className = seconds < minSeconds ? "status warn" : "status ok";
          await logEvent("recording_complete", {
            task,
            session,
            seconds,
            minSeconds,
            maxSeconds: target,
            tooShort: seconds < minSeconds,
            visibilityChanges,
            hiddenMs
          });
          done();
        } catch (err) {
          meter.style.width = "0%";
          startButton.disabled = false;
          status.textContent = "Upload failed. Please check your connection and record again.";
          status.className = "status warn";
          await logEvent("recording_upload_failed", { task, session, seconds, message: err.message });
        } finally {
          if (backButton) backButton.disabled = false;
          stream.getTracks().forEach(track => track.stop());
        }
      };
      startedAt = Date.now();
      mediaRecorder.start();
      document.addEventListener("visibilitychange", trackVisibility);
      startButton.disabled = true;
      stopButton.disabled = true;
      if (backButton) backButton.disabled = true;
      if (revealPrompt) {
        liveStimuli.forEach(node => {
          node.hidden = false;
        });
        const focusTarget = document.querySelector("[data-live-stimulus][tabindex]");
        if (focusTarget) focusTarget.focus();
      }
      status.textContent = "Recording...";
      timer = setInterval(() => {
        const elapsed = (Date.now() - startedAt) / 1000;
        meter.style.width = `${Math.min(100, (elapsed / target) * 100)}%`;
        if (elapsed >= minSeconds) stopButton.disabled = false;
        status.textContent = elapsed < minSeconds
          ? `Recording... ${Math.floor(elapsed)}s (stop available at ${minSeconds}s)`
          : `Recording... ${Math.floor(elapsed)}s (you may stop now)`;
        if (elapsed >= target) stopRecording();
      }, 300);
    } catch {
      status.textContent = "Microphone permission was not granted.";
      status.className = "status warn";
    }
  };

  stopButton.onclick = stopRecording;

  if (demoButton) {
    demoButton.onclick = async () => {
      meter.style.width = "100%";
      status.textContent = "Demo recording marked complete";
      status.className = "status ok";
      await logEvent("recording_demo_complete", { task, session, minSeconds, maxSeconds: target });
      done();
    };
  }
}

function speechTask() {
  assignPrompts();
  const completed = Boolean(state.recordings.baselineOpenSpeech);
  page(`
    <h1>Spontaneous speech</h1>
    <p class="lead">The prompt appears only after recording begins. Respond immediately in your own words; natural pauses and hesitations are expected.</p>
    <div class="band"><p>Do not read a prepared answer or use notes, websites, AI tools, or another device.</p></div>
    <div class="prompt" data-live-stimulus tabindex="-1" ${completed ? "" : "hidden"}>${html(groundedSpeechPrompt(state.assignments.speechPrompt))}</div>
    ${recorderMarkup("baseline_open_speech", "baseline-open", 300, 40, "Aim for 60-90 seconds if you can. You may continue for up to 5 minutes.", completed, true)}
    <div class="actions"><button class="button secondary" id="back">Back</button><button class="button" id="next" ${completed ? "" : "disabled"}>Continue</button></div>
  `);
  attachRecorder("baseline_open_speech", "baseline-open", () => {
    state.recordings.baselineOpenSpeech = true;
    saveLocal();
    document.querySelector("#next").disabled = false;
  });
  document.querySelector("#back").onclick = () => go("deviceCheck");
  document.querySelector("#next").onclick = () => go("picture");
}

function sceneSvg(kind) {
  const palettes = {
    kitchen: ["#f7f0dc", "#d7e3da", "#8bb6c4", "#b75d4d"],
    living_room: ["#f4e9ef", "#ded6cc", "#6b8e8e", "#b6874e"],
    outdoor_market: ["#f5ead8", "#d8d2c2", "#b23a48", "#e9c46a"],
    park_picnic: ["#c9edf6", "#7fb86b", "#4d9f62", "#e9c46a"],
    cafe: ["#f2eadf", "#c7b49c", "#175c62", "#b23a48"],
    crosswalk: ["#dfe9ee", "#a9b3bd", "#343a40", "#f4c542"],
    playground: ["#d9f0f6", "#7fb86b", "#d9583b", "#2b6777"],
    birthday_party: ["#fff3d5", "#e8d5ef", "#b23a48", "#2b6777"],
    office: ["#eef2f5", "#d5dde5", "#175c62", "#6c757d"],
    supermarket: ["#f6f6ee", "#d8d2c2", "#79a86f", "#dfb15b"],
    beach: ["#bfe8f2", "#f1d492", "#2b86a3", "#d9583b"],
    train_station: ["#e7edf1", "#c8d1d8", "#175c62", "#b23a48"]
  };
  const p = palettes[kind] || palettes.kitchen;
  const variants = {
    kitchen: [[70, 92, 90, 52], [226, 78, 110, 120], [160, 188, 90, 42]],
    living_room: [[52, 120, 110, 70], [190, 98, 92, 58], [255, 185, 72, 45]],
    outdoor_market: [[55, 90, 290, 42], [76, 142, 78, 48], [248, 142, 64, 48]],
    park_picnic: [[62, 92, 70, 88], [250, 110, 72, 86], [138, 205, 110, 22]],
    cafe: [[64, 92, 96, 72], [225, 92, 82, 72], [150, 196, 108, 30]],
    crosswalk: [[0, 200, 400, 82], [55, 202, 35, 80], [160, 202, 35, 80]],
    playground: [[68, 145, 86, 78], [225, 100, 72, 122], [145, 198, 98, 16]],
    birthday_party: [[72, 90, 245, 44], [120, 190, 155, 36], [190, 150, 36, 36]],
    office: [[60, 90, 110, 80], [220, 84, 98, 78], [128, 198, 145, 34]],
    supermarket: [[45, 75, 74, 145], [165, 75, 74, 145], [285, 75, 74, 145]],
    beach: [[0, 192, 400, 108], [72, 145, 86, 38], [245, 128, 78, 52]],
    train_station: [[35, 92, 330, 42], [80, 152, 220, 56], [320, 132, 26, 120]]
  };
  const rects = (variants[kind] || variants.kitchen).map((r, i) => `<rect x="${r[0]}" y="${r[1]}" width="${r[2]}" height="${r[3]}" rx="7" fill="${p[(i + 2) % p.length]}"/>`).join("");
  return `
    <svg class="scene" viewBox="0 0 400 300" role="img" aria-label="${html(kind)} picture description scene">
      <rect width="400" height="300" fill="${p[0]}"/><rect y="210" width="400" height="90" fill="${p[1]}"/>
      ${rects}
      <circle cx="118" cy="185" r="18" fill="#6f4e37"/><rect x="104" y="204" width="28" height="54" rx="11" fill="${p[2]}"/>
      <circle cx="278" cy="184" r="17" fill="#4b3b31"/><rect x="264" y="202" width="28" height="50" rx="11" fill="${p[3]}"/>
      <circle cx="194" cy="178" r="13" fill="#87624d"/><rect x="184" y="193" width="22" height="42" rx="9" fill="#ffffff"/>
      <path d="M34 245 C105 228, 160 260, 235 238 S338 238, 374 220" fill="none" stroke="#ffffff" stroke-width="5" opacity=".75"/>
    </svg>`;
}

function pictureStimulus(pic) {
  if (pic.src) {
    return `<img class="picture-stimulus" src="${html(pic.src)}" alt="${html(pic.title)} picture description stimulus">`;
  }
  return sceneSvg(pic.svg);
}

function pictureTask() {
  assignPrompts();
  const pic = state.assignments.picture;
  const completed = Boolean(state.recordings.baselinePictureSpeech);
  page(`
    <h1>Picture description</h1>
    <p class="lead">Please describe the assigned scene in detail. Try to keep talking toward 60-90 seconds if you can.</p>
    <div data-live-stimulus ${completed ? "" : "hidden"}>${pictureStimulus(pic)}</div>
    <div class="prompt" data-live-stimulus tabindex="-1" ${completed ? "" : "hidden"}>${html(pic.prompt)}</div>
    ${recorderMarkup("baseline_picture_speech", `picture-${pic.id}`, 300, 20, "The picture appears after recording begins. Aim for 60-90 seconds if you can; you may continue for up to 5 minutes.", completed, true)}
    <div class="actions"><button class="button secondary" id="back">Back</button><button class="button" id="next" ${completed ? "" : "disabled"}>Continue</button></div>
  `);
  attachRecorder("baseline_picture_speech", `picture-${pic.id}`, () => {
    state.recordings.baselinePictureSpeech = pic.id;
    saveLocal();
    document.querySelector("#next").disabled = false;
  });
  document.querySelector("#back").onclick = () => go("speech");
  document.querySelector("#next").onclick = () => go("tmbIntro");
}

function tmbIntro() {
  page(`
    <h1>Cognitive tasks</h1>
    <p class="lead">Next are four brief cognitive tasks. The baseline version is longer; daily check-ins use shorter EMA versions, and task order may vary across sessions.</p>
    <div class="actions"><button class="button secondary" id="back">Back</button><button class="button" id="next">Start tasks</button></div>
  `);
  document.querySelector("#back").onclick = () => go("picture");
  document.querySelector("#next").onclick = () => startCognitiveBattery("baseline", "finalSurvey");
}

function buildCognitiveOrder() {
  const sessionKey = state.cognitivePhase === "ema" ? state.emaDraft?.key || state.currentEma || "ema" : "baseline";
  return COGNITIVE_TASK_KEYS
    .map(task => ({ task, rank: uidHash(`${state.participantId}:${sessionKey}:cognitive:${task}`, 1000000) }))
    .sort((a, b) => a.rank - b.rank)
    .map(item => item.task);
}

function startCognitiveBattery(phase, returnStep) {
  state.cognitivePhase = phase;
  state.cognitiveReturn = returnStep;
  state.cognitiveOrder = buildCognitiveOrder();
  saveLocal();
  logEvent("cognitive_battery_start", {
    phase,
    returnStep,
    cognitiveOrder: state.cognitiveOrder,
    emaSession: state.emaDraft?.key || null,
    emaDay: state.emaDraft?.day || null,
    emaSessionIndex: state.emaDraft ? state.emaDraft.index + 1 : null,
    emaSlot: state.emaDraft?.slot || null,
    emaSlotLabel: state.emaDraft?.label || null
  });
  go(COGNITIVE_STEP_BY_TASK[state.cognitiveOrder[0]] || "choiceRt");
}

function nextCognitiveStep(taskKey) {
  const order = Array.isArray(state.cognitiveOrder) && state.cognitiveOrder.length ? state.cognitiveOrder : COGNITIVE_TASK_KEYS;
  const index = order.indexOf(taskKey);
  const nextTask = index >= 0 ? order[index + 1] : null;
  return nextTask ? COGNITIVE_STEP_BY_TASK[nextTask] : state.cognitiveReturn || "finalSurvey";
}

function cognitiveTaskMeta(taskKey) {
  const order = Array.isArray(state.cognitiveOrder) && state.cognitiveOrder.length ? state.cognitiveOrder : COGNITIVE_TASK_KEYS;
  const index = order.indexOf(taskKey);
  const draft = state.emaDraft;
  return {
    cognitiveOrder: order,
    taskPosition: index >= 0 ? index + 1 : null,
    taskCount: order.length,
    emaSession: draft?.key || null,
    emaDay: draft?.day || null,
    emaSessionIndex: draft ? draft.index + 1 : null,
    emaSlot: draft?.slot || null,
    emaSlotLabel: draft?.label || null
  };
}

function lastCognitiveStep() {
  const order = Array.isArray(state.cognitiveOrder) && state.cognitiveOrder.length ? state.cognitiveOrder : COGNITIVE_TASK_KEYS;
  const lastTask = order[order.length - 1];
  return COGNITIVE_STEP_BY_TASK[lastTask] || "mot";
}

function finishTask(task, trials, next) {
  const correct = trials.filter(t => t.correct).length;
  const summary = { completedAt: new Date().toISOString(), ...cognitiveTaskMeta(task), trials, correct, total: trials.length };
  if (state.cognitivePhase === "ema" && state.emaDraft) {
    state.emaDraft.tmb = state.emaDraft.tmb || {};
    state.emaDraft.tmb[task] = summary;
  } else {
    state.tmb[task] = summary;
  }
  saveLocal();
  logEvent("tmb_task_complete", { phase: state.cognitivePhase, task, correct, total: trials.length, ...cognitiveTaskMeta(task), trials });
  page(`
    <h1>Task complete</h1>
    <p class="lead">${correct} of ${trials.length} trials correct.</p>
    <div class="actions"><button class="button" id="next">Continue</button></div>
  `);
  document.querySelector("#next").onclick = () => go(next);
}

const TMB_TASKS = {
  choice_rt: {
    title: "Choice Reaction Time",
    sourceFolder: "TMB_ChoiceRT",
    sourceFile: "ChoiceRT_Main.v1.Oct23.html",
    next: "digitSymbol",
    baselineParams: { ntrials: "30", nopractice: "optional", chooseinput: "false" },
    emaParams: { ntrials: "6", nopractice: "true", chooseinput: "false" },
    instructions: "Find the odd-colored square, look at the arrow inside it, then tap the left or right gray button. If you wait more than 5 seconds, the official task asks you to retry that trial.",
    baselineDuration: "30 trials, usually about 1-2 minutes plus instructions.",
    emaDuration: "6 trials, usually under 1 minute plus instructions."
  },
  digit_symbol: {
    title: "Digit Symbol Matching",
    sourceFolder: "TMB_DigitSymbolMatching",
    sourceFile: "DSM_Main.v1.Jul24.html",
    next: "gradCpt",
    baselineParams: { duration: "90", nopractice: "optional", chooseinput: "false" },
    emaParams: { duration: "20", nopractice: "true", chooseinput: "false" },
    instructions: "Use the symbol-number key and choose the matching response as quickly and accurately as you can.",
    baselineDuration: "90-second standard timed block plus instructions.",
    emaDuration: "20-second short timed block plus instructions."
  },
  grad_cpt: {
    title: "GradCPT",
    sourceFolder: "TMB_GradCPT",
    sourceFile: "GradCPT_Main.v1.Apr24.html",
    next: "mot",
    baselineParams: { ntrials: "150", nopractice: "optional", chooseinput: "false" },
    emaParams: { ntrials: "30", nopractice: "true", chooseinput: "false" },
    instructions: "Tap once for every city picture. Do not tap mountain pictures. Cities appear on most trials, so you should be tapping frequently.",
    baselineDuration: "150 image transitions, about 2 minutes plus instructions.",
    emaDuration: "30 image transitions, about 24 seconds plus instructions."
  },
  mot: {
    title: "Multiple Object Tracking",
    sourceFolder: "TMB_MOT",
    sourceFile: "MOT_Main.v1.Jun23.html",
    next: null,
    baselineParams: { dots: "10", nopractice: "optional" },
    emaParams: { dots: "10", nopractice: "true", ema: "true" },
    instructions: "Track the dots that flash, then select those target dots after they move.",
    baselineDuration: "Standard 3-, 4-, and 5-target blocks, roughly 3-5 minutes plus instructions.",
    emaDuration: "Official EMA-style 5-target block with 6 trials, roughly 1-2 minutes plus instructions."
  }
};

function tmbUrl(taskKey) {
  const task = TMB_TASKS[taskKey];
  const mode = state.cognitivePhase === "ema" ? "emaParams" : "baselineParams";
  const params = new URLSearchParams({
    ...task[mode],
    seed: String(uidHash(`${state.participantId}:${state.emaDraft?.key || "baseline"}:${taskKey}`, 1000000)),
    debug: "false"
  });
  return `/tmb/${task.sourceFolder}/src/${task.sourceFile}?${params.toString()}`;
}

async function markOfficialTmbComplete(taskKey) {
  const task = TMB_TASKS[taskKey];
  const existing = state.cognitivePhase === "ema" && state.emaDraft
    ? state.emaDraft.tmb?.[taskKey]
    : state.tmb[taskKey];
  const summary = existing || {
    completedAt: new Date().toISOString(),
    source: "manybrainsproject/TestMyBrainCodeRepo",
    sourceFolder: task.sourceFolder,
    sourceFile: task.sourceFile,
    url: tmbUrl(taskKey),
    ...cognitiveTaskMeta(taskKey),
    collectionNote: "Manual wrapper completion without captured TMB results."
  };
  if (state.cognitivePhase === "ema" && state.emaDraft) {
    state.emaDraft.tmb = state.emaDraft.tmb || {};
    state.emaDraft.tmb[taskKey] = summary;
  } else {
    state.tmb[taskKey] = summary;
  }
  saveLocal();
  await logEvent("tmb_official_task_complete", {
    phase: state.cognitivePhase,
    task: taskKey,
    ...cognitiveTaskMeta(taskKey),
    ...summary
  });
}

function officialTmbTask(taskKey) {
  const task = TMB_TASKS[taskKey];
  const next = nextCognitiveStep(taskKey);
  const url = tmbUrl(taskKey);
  const demo = DEMO_MODE;
  const duration = state.cognitivePhase === "ema" ? task.emaDuration : task.baselineDuration;
  const versionLabel = state.cognitivePhase === "ema" ? "Daily version" : "Baseline version";
  page(`
    <h1>${html(task.title)}</h1>
    <p class="lead">${html(versionLabel)}.</p>
    <div class="band compact">
      <p><strong>What to do:</strong> ${html(task.instructions)}</p>
      <p><strong>Length:</strong> ${html(duration)}</p>
    </div>
    <iframe class="tmb-frame" src="${html(url)}" title="${html(task.title)}"></iframe>
    <div class="band">
      <p id="tmbStatus">Complete the task inside the frame. The app will continue once the official TMB result is captured.</p>
    </div>
    <div class="actions">
      <button class="button secondary" id="startTask">Start / continue TMB task</button>
      <button class="button secondary" id="reloadTask">Reload task</button>
      ${demo ? `<button class="button secondary" id="skipTask">Local skip</button>` : ""}
      <button class="button" id="next" disabled>Continue</button>
    </div>
  `);
  logEvent("tmb_official_task_launch", {
    phase: state.cognitivePhase,
    task: taskKey,
    ...cognitiveTaskMeta(taskKey),
    sourceFolder: task.sourceFolder,
    sourceFile: task.sourceFile,
    url
  });
  const storeResult = async data => {
    const taskMeta = TMB_TASKS[taskKey];
    const summary = {
      completedAt: new Date().toISOString(),
      source: "manybrainsproject/TestMyBrainCodeRepo",
      sourceFolder: taskMeta.sourceFolder,
      sourceFile: taskMeta.sourceFile,
      url: tmbUrl(taskKey),
      ...cognitiveTaskMeta(taskKey),
      score: data.score ?? null,
      outcomes: data.outcomes || {},
      results: Array.isArray(data.results) ? data.results : [],
      trialCount: Array.isArray(data.results) ? data.results.length : 0,
      collectionNote: "Official TestMyBrain outcomes and trial rows captured via postMessage."
    };
    if (state.cognitivePhase === "ema" && state.emaDraft) {
      state.emaDraft.tmb = state.emaDraft.tmb || {};
      state.emaDraft.tmb[taskKey] = summary;
    } else {
      state.tmb[taskKey] = summary;
    }
    saveLocal();
    await logEvent("tmb_official_task_result", {
      phase: state.cognitivePhase,
      task: taskKey,
      ...cognitiveTaskMeta(taskKey),
      ...summary
    });
    const status = document.querySelector("#tmbStatus");
    const nextButton = document.querySelector("#next");
    if (status) status.textContent = `Result captured: ${summary.trialCount} trial rows.`;
    if (nextButton) nextButton.disabled = false;
  };
  const messageHandler = event => {
    if (!event.data || event.data.source !== "mcampus-tmb-result" || event.data.task !== taskKey) return;
    window.removeEventListener("message", messageHandler);
    storeResult(event.data);
  };
  window.addEventListener("message", messageHandler);
  const controlFrame = () => {
    const frame = document.querySelector(".tmb-frame");
    try {
      frame.focus();
      frame.contentWindow.focus();
      const frameDoc = frame.contentWindow.document;
      const alertButton = frameDoc.getElementById("alertButton");
      if (alertButton && frame.contentWindow.getComputedStyle(alertButton).display !== "none") {
        alertButton.click();
        return;
      }
      if (typeof frame.contentWindow.simulateKeyEvent === "function") {
        frame.contentWindow.simulateKeyEvent("keydown", 32);
        frame.contentWindow.simulateKeyEvent("keyup", 32);
      }
    } catch (err) {
      logEvent("tmb_frame_control_error", { task: taskKey, message: err.message });
    }
  };
  document.querySelector(".tmb-frame").addEventListener("load", () => {
    setTimeout(controlFrame, 700);
  });
  document.querySelector("#reloadTask").onclick = () => {
    document.querySelector("#next").disabled = true;
    document.querySelector("#tmbStatus").textContent = "Task reloaded. Complete it inside the frame to capture official TMB results.";
    document.querySelector(".tmb-frame").src = tmbUrl(taskKey);
  };
  document.querySelector("#startTask").onclick = controlFrame;
  if (demo) {
    document.querySelector("#skipTask").onclick = async () => {
      await storeResult({
        score: null,
        outcomes: { localSkip: true },
        results: []
      });
    };
  }
  document.querySelector("#next").onclick = async () => {
    const captured = state.cognitivePhase === "ema" && state.emaDraft
      ? state.emaDraft.tmb?.[taskKey]
      : state.tmb[taskKey];
    if (!captured) {
      alert("Please complete the TMB task first so the result can be captured.");
      return;
    }
    await markOfficialTmbComplete(taskKey);
    window.removeEventListener("message", messageHandler);
    go(next);
  };
}

function choiceRt() {
  officialTmbTask("choice_rt");
  return;
  const trials = Array.from({ length: 14 }, (_, i) => ({ trial: i + 1, side: i % 2 ? "left" : "right" })).sort(() => Math.random() - 0.5);
  let i = 0;
  const results = [];
  let started = 0;
  const draw = () => {
    const trial = trials[i];
    page(`
      <h1>Choice Reaction Time</h1>
      <p class="lead">Tap the side that matches the arrow as quickly and accurately as you can.</p>
      <div class="task-stage"><div class="stimulus">${trial.side === "left" ? "&larr;" : "&rarr;"}</div></div>
      <div class="split-actions"><button class="button secondary" data-choice="left">Left</button><button class="button secondary" data-choice="right">Right</button></div>
      <div class="small">Trial ${i + 1} of ${trials.length}</div>
    `);
    started = performance.now();
    document.querySelectorAll("[data-choice]").forEach(button => {
      button.onclick = event => {
        const choice = event.currentTarget.dataset.choice;
        results.push({ ...trial, choice, rtMs: Math.round(performance.now() - started), correct: choice === trial.side });
        i += 1;
        if (i >= trials.length) finishTask("choice_rt", results, "digitSymbol");
        else draw();
      };
    });
  };
  draw();
}

function digitSymbol() {
  officialTmbTask("digit_symbol");
  return;
  const symbols = ["○", "△", "□", "◇", "☆", "＋", "×", "=", "≡"];
  const trials = Array.from({ length: 16 }, (_, i) => {
    const digit = (i % 9) + 1;
    const match = i % 3 !== 0;
    const symbol = symbols[match ? digit - 1 : (digit + 2) % symbols.length];
    return { trial: i + 1, digit, symbol, match };
  }).sort(() => Math.random() - 0.5);
  let i = 0;
  const results = [];
  let started = 0;
  const key = symbols.map((s, idx) => `<div class="symbol-card"><strong>${idx + 1}</strong><span>${s}</span></div>`).join("");
  const draw = () => {
    const trial = trials[i];
    page(`
      <h1>Digit Symbol Matching</h1>
      <p class="lead">Use the key. Decide whether the pair matches.</p>
      <div class="symbol-grid">${key}</div>
      <div class="task-stage"><div class="pair"><strong>${trial.digit}</strong><span>${trial.symbol}</span></div></div>
      <div class="split-actions"><button class="button secondary" data-choice="true">Match</button><button class="button secondary" data-choice="false">No match</button></div>
      <div class="small">Trial ${i + 1} of ${trials.length}</div>
    `);
    started = performance.now();
    document.querySelectorAll("[data-choice]").forEach(button => {
      button.onclick = event => {
        const choice = event.currentTarget.dataset.choice === "true";
        results.push({ ...trial, choice, rtMs: Math.round(performance.now() - started), correct: choice === trial.match });
        i += 1;
        if (i >= trials.length) finishTask("digit_symbol", results, "gradCpt");
        else draw();
      };
    });
  };
  draw();
}

function gradCpt() {
  officialTmbTask("grad_cpt");
  return;
  const trials = Array.from({ length: 18 }, (_, i) => ({ trial: i + 1, go: i % 5 !== 0, label: i % 5 === 0 ? "MOUNTAIN" : "CITY" }));
  let i = 0;
  const results = [];
  let started = 0;
  let timeout;
  const draw = () => {
    const trial = trials[i];
    page(`
      <h1>GradCPT</h1>
      <p class="lead">Tap for CITY. Do not tap for MOUNTAIN.</p>
      <div class="task-stage grad ${trial.go ? "city" : "mountain"}"><div class="stimulus">${trial.label}</div></div>
      <button class="button" id="tap">Tap for city</button>
      <div class="small">Trial ${i + 1} of ${trials.length}</div>
    `);
    started = performance.now();
    let responded = false;
    document.querySelector("#tap").onclick = () => {
      responded = true;
      results.push({ ...trial, response: true, rtMs: Math.round(performance.now() - started), correct: trial.go });
      clearTimeout(timeout);
      advance();
    };
    timeout = setTimeout(() => {
      if (!responded) {
        results.push({ ...trial, response: false, rtMs: null, correct: !trial.go });
        advance();
      }
    }, 1150);
  };
  const advance = () => {
    i += 1;
    if (i >= trials.length) finishTask("grad_cpt", results, "mot");
    else draw();
  };
  draw();
}

function mot() {
  officialTmbTask("mot");
  return;
  const positions = [
    [18, 26], [42, 22], [68, 28], [28, 58], [55, 56], [78, 62]
  ];
  const targets = [1, 4];
  const results = [];
  const dots = (showTargets, selectable) => positions.map((p, i) => `
    <button class="dot ${showTargets && targets.includes(i) ? "target" : ""}" style="left:${p[0]}%;top:${p[1]}%" ${selectable ? `data-dot="${i}"` : "disabled"}>${i + 1}</button>
  `).join("");
  page(`
    <h1>Multiple Object Tracking</h1>
    <p class="lead">Remember the highlighted dots. They will move, then choose the original targets.</p>
    <div class="dot-field">${dots(true, false)}</div>
    <div class="actions"><button class="button" id="ready">I remember them</button></div>
  `);
  document.querySelector("#ready").onclick = () => {
    page(`
      <h1>Multiple Object Tracking</h1>
      <p class="lead">Select the two dots that were highlighted.</p>
      <div class="dot-field shifted">${dots(false, true)}</div>
      <div class="actions"><button class="button" id="finish" disabled>Submit</button></div>
    `);
    const chosen = new Set();
    document.querySelectorAll("[data-dot]").forEach(button => {
      button.onclick = event => {
        const dot = Number(event.currentTarget.dataset.dot);
        if (chosen.has(dot)) chosen.delete(dot);
        else if (chosen.size < 2) chosen.add(dot);
        event.currentTarget.classList.toggle("chosen", chosen.has(dot));
        document.querySelector("#finish").disabled = chosen.size !== 2;
      };
    });
    document.querySelector("#finish").onclick = () => {
      const selected = [...chosen].sort();
      results.push({ trial: 1, selected, targets, correct: selected.length === targets.length && selected.every((x, idx) => x === targets[idx]) });
      finishTask("mot", results, state.cognitiveReturn || "finalSurvey");
    };
  };
}

function finalSurvey() {
  const finalScales = [
    ["task_difficulty", "Overall task difficulty"],
    ["frustration", "Frustration or discomfort"],
    ["privacy_concern", "Concern about audio/privacy"],
    ["distraction", "Distraction during the session"],
    ["usability", "Ease of using the study on this device"]
  ];
  page(`
    <h1>Final questions</h1>
    <p class="lead">Last baseline feedback and interruption report.</p>
    ${scaleRows(finalScales, "final", "Low", "High")}
    <div class="field"><label>Did anything interrupt you? <span class="required">*</span></label><select data-field="final_interrupted" required>${selectOptions(["No", "Yes, once", "Yes, several times"], state.forms.final_interrupted)}</select></div>
    <div class="field"><label>Approximate interruption duration <span class="required">*</span></label><select data-field="final_interruption_duration" required>${selectOptions(["None", "Less than 1 minute", "1-5 minutes", "More than 5 minutes"], state.forms.final_interruption_duration)}</select></div>
    <div class="field"><label>Any adverse event, concern, or feedback?</label><textarea data-field="final_feedback" placeholder="Optional">${val("final_feedback")}</textarea></div>
    <div class="actions"><button class="button secondary" id="back">Back</button><button class="button" id="next">Save baseline</button></div>
  `);
  bindFields();
  document.querySelector("#back").onclick = () => go(lastCognitiveStep());
  document.querySelector("#next").onclick = async () => {
    if (!requireFields([
      ...scaleFieldList(finalScales, "final"),
      { name: "final_interrupted", label: "Interrupted" },
      { name: "final_interruption_duration", label: "Interruption duration" }
    ])) return;
    if (state.baselineComplete) {
      go("baselineComplete");
      return;
    }
    const saveButton = document.querySelector("#next");
    saveButton.disabled = true;
    saveButton.textContent = "Saving...";
    state.baselineComplete = true;
    saveLocal();
    await logEvent("baseline_complete", { forms: state.forms, assignments: state.assignments, tmb: state.tmb });
    go("baselineComplete");
  };
}

function baselineComplete() {
  page(`
    <h1>Baseline saved</h1>
    <p class="lead">Your baseline session is complete and your responses have been saved on the study server.</p>
    <div class="band">
      <p><strong>You are done for this session.</strong> Please return to Prolific now to submit this baseline session.</p>
      <p>For the daily EMA part, complete only one check-in each time you open a study link or reminder. Each check-in has its own short survey, speech tasks, cognitive tasks, and final save page.</p>
    </div>
    <div class="actions"><a class="button" href="${html(state.config.prolificCompletionUrl)}">Return to Prolific</a></div>
    ${LOCALHOST || DEMO_MODE ? `<div class="actions"><button class="button secondary" id="emaTest">Researcher test: open EMA dashboard</button></div>` : ""}
  `);
  const emaTest = document.querySelector("#emaTest");
  if (emaTest) emaTest.onclick = () => go("emaHome");
}

function buildPictureSchedule() {
  const pics = pictureBank();
  const sessionsPerDay = state.config.ema.sessionsPerDay;
  const days = state.config.ema.days;
  const schedule = Array.from({ length: days * sessionsPerDay });

  for (let slot = 0; slot < sessionsPerDay; slot += 1) {
    const slotOrder = pics
      .map((pic, index) => ({ id: pic.id, rank: uidHash(`${state.participantId}:pic-slot:${slot}:${index}:${pic.id}`, 100000) }))
      .sort((a, b) => a.rank - b.rank)
      .map(item => item.id);
    for (let day = 0; day < days; day += 1) {
      schedule[day * sessionsPerDay + slot] = slotOrder[day % slotOrder.length];
    }
  }

  for (let i = 1; i < schedule.length; i += 1) {
    if (schedule[i] !== schedule[i - 1]) continue;
    const slot = i % sessionsPerDay;
    const swap = schedule.findIndex((id, j) => {
      if (j <= i || j % sessionsPerDay !== slot) return false;
      const current = schedule[i];
      const leftOk = id !== schedule[i - 1];
      const rightOk = i + 1 >= schedule.length || id !== schedule[i + 1];
      const swapLeftOk = j === 0 || current !== schedule[j - 1];
      const swapRightOk = j + 1 >= schedule.length || current !== schedule[j + 1];
      return leftOk && rightOk && swapLeftOk && swapRightOk;
    });
    if (swap > i) {
      const tmp = schedule[i];
      schedule[i] = schedule[swap];
      schedule[swap] = tmp;
    }
  }

  return schedule;
}

function emaHome() {
  const rows = [];
  for (let day = 1; day <= state.config.ema.days; day += 1) {
    for (let slot = 0; slot < state.config.ema.sessionsPerDay; slot += 1) {
      const key = `d${day}s${slot + 1}`;
      rows.push({ key, day, slot: slot + 1, label: state.config.ema.windows[slot], done: state.ema[key]?.done });
    }
  }
  page(`
    <h1>EMA dashboard</h1>
    <p class="lead">Researcher/session dashboard. Participants should complete one check-in per link or reminder, then stop when the check-in saved page appears.</p>
    <div class="actions"><button class="button" id="nextDue">Start next check-in</button></div>
    <div class="schedule">
      ${rows.map(row => `
        <div class="session-row">
          <div><strong>Day ${row.day}</strong><br><span class="small">${html(row.label)}</span></div>
          <span class="pill ${row.done ? "done" : ""}">${row.done ? "Done" : "Due"}</span>
        </div>
      `).join("")}
    </div>
    <div class="actions"><button class="button" id="finish">Finish study</button></div>
  `);
  document.querySelector("#nextDue").onclick = () => {
    const next = rows.find(row => !row.done) || rows[0];
    startEmaDraft(next, rows.findIndex(r => r.key === next.key));
    saveLocal();
    logEvent("ema_session_start", {
      session: state.emaDraft.key,
      day: state.emaDraft.day,
      slot: state.emaDraft.slot,
      slotLabel: state.emaDraft.label,
      sessionIndex: state.emaDraft.index + 1,
      spontaneousPrompt: state.emaDraft.spontaneousPrompt,
      picture: state.emaDraft.picture,
      pictureScheduleVersion: state.emaDraft.pictureScheduleVersion,
      pictureSchedulePosition: state.emaDraft.pictureSchedulePosition
    });
    go("emaSurvey");
  };
  document.querySelector("#finish").onclick = () => go("done");
}

function startEmaDraft(row, index = 0) {
  const schedule = buildPictureSchedule();
  const pic = pictureBank().find(x => x.id === schedule[index % schedule.length]) || pictureBank()[0];
  const speech = promptBank()[uidHash(`${state.participantId}:${row.key}:speech`, promptBank().length)];
  state.currentEma = row.key;
  state.emaDraft = {
    key: row.key,
    day: row.day,
    slot: row.slot,
    label: row.label,
    index,
    startedAt: new Date().toISOString(),
    spontaneousPrompt: speech,
    picture: pic,
    pictureScheduleVersion: "balanced-slot-v1",
    pictureSchedulePosition: index + 1,
    survey: {},
    final: {},
    recordings: {},
    tmb: {}
  };
}

function ensureEmaDraft() {
  if (state.emaDraft) return state.emaDraft;
  const [dayPart, sessionPart] = (state.currentEma || "d1s1").replace("d", "").split("s");
  const row = {
    key: state.currentEma || "d1s1",
    day: Number(dayPart || 1),
    slot: Number(sessionPart || 1),
    label: state.config.ema.windows[Number(sessionPart || 1) - 1] || "Morning"
  };
  startEmaDraft(row, 0);
  return state.emaDraft;
}

function emaSurvey() {
  const draft = ensureEmaDraft();
  page(`
    <h1>Day ${draft.day}: ${html(draft.label)}</h1>
    <p class="lead">First, answer based on how you feel right now.</p>
    ${scaleRows([["mood", "Mood"], ["stress", "Stress"], ["fatigue", "Fatigue"], ["focus", "Difficulty focusing"], ["noise", "Background noise"]], `ema_${draft.key}`, "Low", "High")}
    <div class="field"><label>Where are you?</label><select data-field="ema_${draft.key}_location">${selectOptions(["Home", "Work or school", "Public indoor place", "Outdoors", "In transit", "Other"], state.forms[`ema_${draft.key}_location`])}</select></div>
    <div class="field"><label>Current context</label><textarea id="emaContext" placeholder="A few words about where you are or what you are doing"></textarea></div>
    <div class="actions"><button class="button secondary" id="cancel">Back</button><button class="button" id="next">Continue</button></div>
  `);
  bindFields();
  document.querySelector("#cancel").onclick = () => go("emaHome");
  document.querySelector("#next").onclick = async () => {
    draft.survey = {
      mood: state.forms[`ema_${draft.key}_mood`],
      stress: state.forms[`ema_${draft.key}_stress`],
      fatigue: state.forms[`ema_${draft.key}_fatigue`],
      focus: state.forms[`ema_${draft.key}_focus`],
      noise: state.forms[`ema_${draft.key}_noise`],
      location: state.forms[`ema_${draft.key}_location`],
      context: document.querySelector("#emaContext").value
    };
    saveLocal();
    await logEvent("ema_survey_complete", { session: draft.key, day: draft.day, slot: draft.slot, sessionIndex: draft.index + 1, survey: draft.survey });
    go("emaSpeech");
  };
}

function emaSpeech() {
  const draft = ensureEmaDraft();
  const completed = Boolean(draft.recordings.openSpeech);
  page(`
    <h1>Spontaneous speech</h1>
    <p class="lead">The prompt appears only after recording begins. Respond immediately in your own words; natural pauses and hesitations are expected.</p>
    <div class="band"><p>Do not read a prepared answer or use notes, websites, AI tools, or another device.</p></div>
    <div class="prompt" data-live-stimulus tabindex="-1" ${completed ? "" : "hidden"}>${html(groundedSpeechPrompt(draft.spontaneousPrompt))}</div>
    ${recorderMarkup("ema_open_speech", draft.key, 300, 40, "Aim for 60-90 seconds if you can. You may continue for up to 5 minutes.", completed, true)}
    <div class="actions"><button class="button secondary" id="back">Back</button><button class="button" id="next" ${completed ? "" : "disabled"}>Continue</button></div>
  `);
  attachRecorder("ema_open_speech", draft.key, () => {
    draft.recordings.openSpeech = true;
    saveLocal();
    document.querySelector("#next").disabled = false;
  });
  document.querySelector("#back").onclick = () => go("emaSurvey");
  document.querySelector("#next").onclick = () => go("emaPicture");
}

function emaPicture() {
  const draft = ensureEmaDraft();
  const pic = draft.picture;
  const completed = draft.recordings.pictureSpeech === pic.id;
  page(`
    <h1>Picture description</h1>
    <p class="lead">Please describe the assigned scene in detail. Try to keep talking toward 60-90 seconds if you can.</p>
    <div data-live-stimulus ${completed ? "" : "hidden"}>${pictureStimulus(pic)}</div>
    <div class="prompt" data-live-stimulus tabindex="-1" ${completed ? "" : "hidden"}>${html(pic.prompt)}</div>
    ${recorderMarkup("ema_picture_speech", `${draft.key}-${pic.id}`, 300, 20, "The picture appears after recording begins. Aim for 60-90 seconds if you can; you may continue for up to 5 minutes.", completed, true)}
    <div class="actions"><button class="button secondary" id="back">Back</button><button class="button" id="next" ${completed ? "" : "disabled"}>Continue</button></div>
  `);
  attachRecorder("ema_picture_speech", `${draft.key}-${pic.id}`, () => {
    draft.recordings.pictureSpeech = pic.id;
    saveLocal();
    document.querySelector("#next").disabled = false;
  });
  document.querySelector("#back").onclick = () => go("emaSpeech");
  document.querySelector("#next").onclick = () => {
    startCognitiveBattery("ema", "emaFinal");
  };
}

function emaFinal() {
  const draft = ensureEmaDraft();
  page(`
    <h1>Session feedback</h1>
    <p class="lead">Final questions for this daily session.</p>
    ${scaleRows([
      ["difficulty", "Overall difficulty"],
      ["frustration", "Frustration or discomfort"],
      ["privacy", "Concern about audio/privacy"],
      ["distraction", "Distraction during the session"]
    ], `ema_final_${draft.key}`, "Low", "High")}
    <div class="field"><label>Was this check-in interrupted?</label><select data-field="ema_final_${draft.key}_interrupted">${selectOptions(["No", "Yes, briefly", "Yes, substantially"], state.forms[`ema_final_${draft.key}_interrupted`])}</select></div>
    <div class="field"><label>Approximate interruption duration</label><select data-field="ema_final_${draft.key}_duration">${selectOptions(["None", "Less than 1 minute", "1-5 minutes", "More than 5 minutes"], state.forms[`ema_final_${draft.key}_duration`])}</select></div>
    <div class="field"><label>Anything unusual about this session?</label><textarea data-field="ema_final_${draft.key}_feedback">${val(`ema_final_${draft.key}_feedback`)}</textarea></div>
    <div class="actions"><button class="button secondary" id="back">Back</button><button class="button" id="save">Save check-in</button></div>
  `);
  bindFields();
  document.querySelector("#back").onclick = () => {
    state.cognitivePhase = "ema";
    state.cognitiveReturn = "emaFinal";
    saveLocal();
    go(lastCognitiveStep());
  };
  document.querySelector("#save").onclick = async () => {
    if (state.ema[draft.key]?.done) {
      go("emaComplete");
      return;
    }
    const saveButton = document.querySelector("#save");
    saveButton.disabled = true;
    saveButton.textContent = "Saving...";
    draft.final = {
      difficulty: state.forms[`ema_final_${draft.key}_difficulty`],
      frustration: state.forms[`ema_final_${draft.key}_frustration`],
      privacy: state.forms[`ema_final_${draft.key}_privacy`],
      distraction: state.forms[`ema_final_${draft.key}_distraction`],
      interrupted: state.forms[`ema_final_${draft.key}_interrupted`],
      duration: state.forms[`ema_final_${draft.key}_duration`],
      feedback: state.forms[`ema_final_${draft.key}_feedback`]
    };
    state.ema[draft.key] = {
      done: true,
      completedAt: new Date().toISOString(),
      ...draft
    };
    state.emaDraft = null;
    state.cognitivePhase = "baseline";
    state.cognitiveReturn = "finalSurvey";
    state.cognitiveOrder = [];
    saveLocal();
    await logEvent("ema_complete", { session: draft.key, ...state.ema[draft.key] });
    go("emaComplete");
  };
}

function emaComplete() {
  page(`
    <h1>Check-in saved</h1>
    <p class="lead">This daily check-in is complete and has been saved on the study server.</p>
    <div class="band">
      <p><strong>You are done for this session.</strong> Please return to Prolific or close this tab, depending on the instructions for this check-in.</p>
      <p>Complete the next EMA session only when you receive the next study link or reminder.</p>
    </div>
    <div class="actions"><a class="button" href="${html(state.config.prolificCompletionUrl)}">Return to Prolific</a></div>
    ${LOCALHOST || DEMO_MODE ? `<div class="actions"><button class="button secondary" id="emaTest">Researcher test: open EMA dashboard</button></div>` : ""}
  `);
  const emaTest = document.querySelector("#emaTest");
  if (emaTest) emaTest.onclick = () => go("emaHome");
}

async function admin() {
  const data = await api("/api/admin/events").catch(() => ({ rows: [] }));
  page(`
    <h1>Researcher view</h1>
    <p class="lead">Local prototype data. In production this becomes a password-protected dashboard and export endpoint.</p>
    <table class="admin-table">
      <thead><tr><th>Time</th><th>Participant</th><th>Event</th><th>Details</th></tr></thead>
      <tbody>
        ${data.rows.slice().reverse().slice(0, 80).map(row => `
          <tr><td>${html(row.receivedAt || "")}</td><td>${html(row.participantId || "")}</td><td>${html(row.type || "")}</td><td>${html(row.file || JSON.stringify(row.payload || {}))}</td></tr>
        `).join("")}
      </tbody>
    </table>
    <div class="actions"><button class="button" id="back">Back</button></div>
  `);
  document.querySelector("#back").onclick = () => go("emaHome");
}

function done() {
  page(`
    <h1>Thank you</h1>
    <p class="lead">Your study session is complete. Baseline and EMA data have been saved locally on this study server.</p>
    <div class="actions"><a class="button" href="${html(state.config.prolificCompletionUrl)}">Return to Prolific</a></div>
  `);
}

function qualificationWelcome() {
  if (!isSmartphone() && !LOCALHOST && !DEMO_MODE) {
    page(`
      <h1>Smartphone required</h1>
      <p class="lead">This qualification task must be completed on an iPhone or Android phone.</p>
      <div class="band"><p>Please reopen your Prolific study link on a phone with a working microphone.</p></div>
    `);
    logEvent("qualification_device_ineligible", { reason: "smartphone_required", userAgent: navigator.userAgent });
    return;
  }
  page(`
    <h1>Voice qualification</h1>
    <p class="lead">This short study asks about your language background and records one spontaneous speech sample.</p>
    <div class="band">
      <p>The task takes about 3 minutes. Use your smartphone in a quiet place. Your speech should be natural and unprepared.</p>
    </div>
    <div class="actions"><button class="button" id="next">Continue</button></div>
  `);
  document.querySelector("#next").onclick = () => go("qConsent");
}

function qualificationConsent() {
  page(`
    <h1>Consent</h1>
    <p class="lead">Your voice recording and language-background answers will be reviewed to determine whether you may be invited to a longer research study.</p>
    <div class="band">
      <p>Voice recordings can be identifiable. Do not say your name, address, employer, passwords, or other private information. Participation is voluntary and this qualification does not guarantee an invitation to the longer study.</p>
    </div>
    <label class="choice">
      <input id="qConsent" type="checkbox" ${state.consent ? "checked" : ""}>
      <span>I understand the information above and consent to provide this short voice recording and language-background information for research recruitment and quality review.</span>
    </label>
    <div class="actions"><button class="button secondary" id="back">Back</button><button class="button" id="next" ${state.consent ? "" : "disabled"}>Continue</button></div>
  `);
  document.querySelector("#qConsent").onchange = event => {
    state.consent = event.target.checked;
    document.querySelector("#next").disabled = !state.consent;
    saveLocal();
  };
  document.querySelector("#back").onclick = () => go("qWelcome");
  document.querySelector("#next").onclick = () => go("qProfile");
}

function qualificationProfile() {
  page(`
    <h1>Language background</h1>
    <p class="lead">Please answer accurately. Different English varieties are legitimate; these questions define the specific population needed for this study.</p>
    <div class="field"><label>When did you begin using English regularly? <span class="required">*</span></label><select data-field="q_english_start_age" required>${selectOptions(["From birth", "Before age 3", "Age 3-5", "Age 6-12", "After age 12"], state.forms.q_english_start_age)}</select></div>
    <div class="field"><label>Where did you spend most of ages 5-18? <span class="required">*</span></label><select data-field="q_childhood_region" required>${selectOptions(["United States", "Mostly United States and partly elsewhere", "Outside the United States"], state.forms.q_childhood_region)}</select></div>
    <div class="field"><label>Where did you complete most primary and secondary schooling? <span class="required">*</span></label><select data-field="q_school_region" required>${selectOptions(["United States", "Mostly United States and partly elsewhere", "Outside the United States"], state.forms.q_school_region)}</select></div>
    <div class="field"><label>How would you describe your everyday English dialect or accent? <span class="required">*</span></label><input class="input" data-field="q_english_dialect" value="${val("q_english_dialect")}" placeholder="For example: American English, Southern US English" required></div>
    <div class="field"><label>Are you bilingual or multilingual? <span class="required">*</span></label><select data-field="q_multilingual" required>${selectOptions(["No, English only", "Yes, bilingual", "Yes, multilingual", "Prefer not to say"], state.forms.q_multilingual)}</select></div>
    <label class="choice">
      <input type="checkbox" data-field="q_authenticity" ${state.forms.q_authenticity ? "checked" : ""}>
      <span>I will answer spontaneously in my own words without notes, a prepared script, a website, an AI tool, or another device.</span>
    </label>
    <div class="actions"><button class="button secondary" id="back">Back</button><button class="button" id="next">Continue</button></div>
  `);
  bindFields();
  document.querySelector("#back").onclick = () => go("qConsent");
  document.querySelector("#next").onclick = async () => {
    if (!requireFields([
      { name: "q_english_start_age", label: "Age English use began" },
      { name: "q_childhood_region", label: "Childhood region" },
      { name: "q_school_region", label: "Schooling region" },
      { name: "q_english_dialect", label: "English dialect or accent" },
      { name: "q_multilingual", label: "Bilingual or multilingual" },
      { name: "q_authenticity", label: "Spontaneous speech agreement" }
    ])) return;
    if (state.forms.q_authenticity !== true) {
      showFormError("Please agree to provide an unaided, spontaneous response.", ["q_authenticity"]);
      return;
    }
    await logEvent("qualification_profile", {
      englishStartAge: state.forms.q_english_start_age,
      childhoodRegion: state.forms.q_childhood_region,
      schoolRegion: state.forms.q_school_region,
      englishDialect: state.forms.q_english_dialect,
      multilingual: state.forms.q_multilingual
    });
    go("qSpeech");
  };
}

function qualificationSpeech() {
  const completed = Boolean(state.recordings.qualificationSpeech);
  const prompt = groundedSpeechPrompt(promptBank()[uidHash(`${state.participantId}:qualification:speech`, promptBank().length)]);
  page(`
    <h1>Spontaneous voice sample</h1>
    <p class="lead">The prompt appears only after recording starts. Begin answering immediately; normal pauses, corrections, and hesitations are welcome.</p>
    <div class="band"><p>Do not use notes, websites, AI tools, or another device. There is no perfect answer.</p></div>
    <div class="prompt" data-live-stimulus tabindex="-1" ${completed ? "" : "hidden"}>${html(prompt)}</div>
    ${recorderMarkup("qualification_open_speech", "qualification", 120, 30, "Please speak naturally for about 45-90 seconds. Recording stops after 2 minutes.", completed, true)}
    <div class="actions"><button class="button secondary" id="back">Back</button><button class="button" id="next" ${completed ? "" : "disabled"}>Finish</button></div>
  `);
  attachRecorder("qualification_open_speech", "qualification", () => {
    state.recordings.qualificationSpeech = true;
    saveLocal();
    document.querySelector("#next").disabled = false;
  });
  document.querySelector("#back").onclick = () => go("qProfile");
  document.querySelector("#next").onclick = async () => {
    await logEvent("qualification_complete", {
      profile: {
        englishStartAge: state.forms.q_english_start_age,
        childhoodRegion: state.forms.q_childhood_region,
        schoolRegion: state.forms.q_school_region,
        englishDialect: state.forms.q_english_dialect,
        multilingual: state.forms.q_multilingual
      }
    });
    go("qComplete");
  };
}

function qualificationComplete() {
  page(`
    <h1>Qualification complete</h1>
    <p class="lead">Your answers and voice sample have been saved.</p>
    <div class="band"><p>This qualification does not guarantee an invitation to the longer study. Please return to Prolific to submit this task.</p></div>
    <div class="actions"><a class="button" href="${html(prolificCompletionUrl())}">Return to Prolific</a></div>
  `);
}

function render() {
  if (STUDY_MODE === "qualification") {
    if (state.step === "qConsent") qualificationConsent();
    else if (state.step === "qProfile") qualificationProfile();
    else if (state.step === "qSpeech") qualificationSpeech();
    else if (state.step === "qComplete") qualificationComplete();
    else qualificationWelcome();
    return;
  }
  if (state.step === "welcome") welcome();
  else if (state.step === "consent") consent();
  else if (state.step === "eligibility") eligibility();
  else if (state.step === "demographics") demographics();
  else if (state.step === "sleep") sleep();
  else if (state.step === "baselineState") baselineState();
  else if (state.step === "deviceCheck") deviceCheck();
  else if (state.step === "speech") speechTask();
  else if (state.step === "picture") pictureTask();
  else if (state.step === "tmbIntro") tmbIntro();
  else if (state.step === "choiceRt") choiceRt();
  else if (state.step === "digitSymbol") digitSymbol();
  else if (state.step === "gradCpt") gradCpt();
  else if (state.step === "mot") mot();
  else if (state.step === "finalSurvey") finalSurvey();
  else if (state.step === "baselineComplete") baselineComplete();
  else if (state.step === "emaHome") emaHome();
  else if (state.step === "emaSurvey") emaSurvey();
  else if (state.step === "emaSpeech") emaSpeech();
  else if (state.step === "emaPicture") emaPicture();
  else if (state.step === "emaFinal") emaFinal();
  else if (state.step === "emaComplete") emaComplete();
  else if (state.step === "admin") admin();
  else done();
}

async function init() {
  try {
    state.config = await api("/api/config");
    restoreLocal();
    if (STUDY_MODE === "qualification" && !String(state.step).startsWith("q")) state.step = "qWelcome";
    render();
    logEvent("app_open", params());
    document.addEventListener("visibilitychange", () => logEvent("visibility_change", { visibilityState: document.visibilityState }));
  } catch (err) {
    app.innerHTML = `
      <section class="view">
        <h1>Study app could not start</h1>
        <p class="lead">Please reload this page. If it still does not load, try opening the link again in Safari or Chrome.</p>
        <div class="form-error">${html(err.message || "Startup failed")}</div>
      </section>
    `;
  }
}

init();
