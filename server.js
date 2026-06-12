const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || "0.0.0.0";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";
const NODE_ENV = process.env.NODE_ENV || "development";
const APP_BASE_URL = process.env.APP_BASE_URL || process.env.STUDY_URL || "";
const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || 25);
const MAX_UPLOAD_BYTES = Math.max(1, MAX_UPLOAD_MB) * 1024 * 1024;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const TMB_DIR = process.env.TMB_DIR
  ? path.resolve(process.env.TMB_DIR)
  : path.join(ROOT, "vendor", "tmb");
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(ROOT, "data");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const EVENTS_FILE = path.join(DATA_DIR, "events.jsonl");

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

function parseJsonEnv(name, fallback) {
  const raw = String(process.env[name] || "").trim();
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Invalid ${name}: ${err.message}`);
    return fallback;
  }
}

const WAVE_MAP = parseJsonEnv("PROLIFIC_WAVE_MAP_JSON", {});

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".m4a": "audio/mp4",
  ".mp4": "audio/mp4",
  ".ogg": "audio/ogg",
  ".webm": "audio/webm",
  ".wav": "audio/wav"
};

const CONFIG = {
  studyName: "M-CAMPUS Mobile Cognition Study",
  studyUrl: APP_BASE_URL,
  maxUploadMb: MAX_UPLOAD_MB,
  prolificCompletionUrl: process.env.PROLIFIC_COMPLETION_URL || "https://app.prolific.com/submissions/complete?cc=CRHUWZ7L",
  onboardingStudyId: process.env.ONBOARDING_STUDY_ID || "",
  waveMap: WAVE_MAP,
  emaSchedule: {
    days: 12,
    sessionsPerDay: 3,
    windows: [
      { label: "Morning", start: "08:00", end: "12:00" },
      { label: "Afternoon", start: "13:00", end: "17:00" },
      { label: "Evening", start: "18:00", end: "22:00" }
    ]
  },
  baselineSpeechPrompts: [
    "Please describe a recent routine activity from beginning to end. Speak continuously for about 60 to 90 seconds.",
    "Please describe what happened during the morning or afternoon of a recent day. Speak continuously for about 60 to 90 seconds.",
    "Please describe a place you know well and what it is like to be there. Speak continuously for about 60 to 90 seconds.",
    "Please describe a recent meal, walk, commute, or errand in as much detail as you can. Speak continuously for about 60 to 90 seconds.",
    "Please describe something you recently planned and how you went about it. Speak continuously for about 60 to 90 seconds."
  ],
  picturePrompts: [
    {
      id: "kitchen",
      title: "Kitchen Scene",
      prompt: "Please describe this picture in as much detail as you can. Mention the main people or objects, actions, setting, and anything unusual.",
      svg: "kitchen"
    },
    {
      id: "park",
      title: "Park Scene",
      prompt: "Please describe this picture in as much detail as you can. Mention the main people or objects, actions, setting, and anything unusual.",
      svg: "park"
    },
    {
      id: "market",
      title: "Market Scene",
      prompt: "Please describe this picture in as much detail as you can. Mention the main people or objects, actions, setting, and anything unusual.",
      svg: "market"
    }
  ],
  ema: {
    days: 12,
    sessionsPerDay: 3,
    windows: ["Morning", "Afternoon", "Evening"],
    speechPrompt: "Please say one or two sentences about what you are doing or thinking right now."
  },
  studyFlow: {
    onboardingKind: "onboarding",
    emaKind: "ema",
    days: 12,
    sessionsPerDay: 3,
    windows: ["Morning", "Afternoon", "Evening"]
  }
};

const TWILIO_ACCOUNT_SID = String(process.env.TWILIO_ACCOUNT_SID || "").trim();
const TWILIO_AUTH_TOKEN = String(process.env.TWILIO_AUTH_TOKEN || "").trim();
const TWILIO_FROM_NUMBER = String(process.env.TWILIO_FROM_NUMBER || "").trim();
const SENDGRID_API_KEY = String(process.env.SENDGRID_API_KEY || "").trim();
const SENDGRID_FROM_EMAIL = String(process.env.SENDGRID_FROM_EMAIL || "").trim();

function buildEmaPlan(participantId = "unknown") {
  const days = CONFIG.emaSchedule.days;
  const sessionsPerDay = CONFIG.emaSchedule.sessionsPerDay;
  const windows = CONFIG.emaSchedule.windows;
  const rows = [];
  for (let day = 1; day <= days; day += 1) {
    for (let slot = 1; slot <= sessionsPerDay; slot += 1) {
      const window = windows[slot - 1] || windows[0];
      const key = `d${day}s${slot}`;
      rows.push({
        participantId,
        key,
        day,
        slot,
        label: window.label,
        windowStart: window.start,
        windowEnd: window.end,
        title: `Day ${day} ${window.label}`
      });
    }
  }
  return rows;
}

function reminderWindowLabel(day, slot, label) {
  return `Day ${day} ${label || `Session ${slot}`}`;
}

function reminderText(payload, targetUrl) {
  const title = reminderWindowLabel(payload.day, payload.slot, payload.label);
  const windowText = payload.windowStart && payload.windowEnd
    ? `Your window is ${payload.windowStart} to ${payload.windowEnd}.`
    : "Your window is now open.";
  return `M-CAMPUS reminder: ${title}. ${windowText} Open this link to complete the session: ${targetUrl}`;
}

async function sendTwilioSms(to, body) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    throw new Error("Twilio SMS is not configured.");
  }
  const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(TWILIO_ACCOUNT_SID)}/Messages.json`;
  const form = new URLSearchParams({
    From: TWILIO_FROM_NUMBER,
    To: to,
    Body: body
  });
  const res = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64")}`,
      "content-type": "application/x-www-form-urlencoded"
    },
    body: form
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Twilio SMS failed: ${text}`);
  return JSON.parse(text);
}

async function sendSendGridEmail(to, subject, text, htmlBody = "") {
  if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
    throw new Error("SendGrid email is not configured.");
  }
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      authorization: `Bearer ${SENDGRID_API_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: SENDGRID_FROM_EMAIL, name: "M-CAMPUS Study" },
      subject,
      content: [
        { type: "text/plain", value: text },
        { type: "text/html", value: htmlBody || `<p>${text.replace(/\n/g, "<br>")}</p>` }
      ]
    })
  });
  if (!res.ok) throw new Error(`SendGrid email failed: ${await res.text()}`);
  return true;
}

async function dispatchReminder({ participantId, contact, payload, targetUrl }) {
  const body = reminderText(payload, targetUrl);
  const subject = `M-CAMPUS ${reminderWindowLabel(payload.day, payload.slot, payload.label)}`;
  const channel = String(payload.channel || contact?.contactPreference || "").toLowerCase();
  if ((channel === "sms" || channel === "phone" || channel === "text") && contact?.phone) {
    return { channel: "sms", result: await sendTwilioSms(contact.phone, body) };
  }
  if (contact?.email) {
    return { channel: "email", result: await sendSendGridEmail(contact.email, subject, body) };
  }
  if (contact?.phone && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM_NUMBER) {
    return { channel: "sms", result: await sendTwilioSms(contact.phone, body) };
  }
  if (contact?.email && SENDGRID_API_KEY && SENDGRID_FROM_EMAIL) {
    return { channel: "email", result: await sendSendGridEmail(contact.email, subject, body) };
  }
  throw new Error(`No usable delivery channel configured for ${participantId}.`);
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload)
  });
  res.end(payload);
}

function readBody(req, limit = MAX_UPLOAD_BYTES) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", chunk => {
      size += chunk.length;
      if (size > limit) {
        const err = new Error(`Request body too large. Limit is ${MAX_UPLOAD_MB} MB.`);
        err.statusCode = 413;
        reject(err);
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function appendEvent(event) {
  const row = {
    receivedAt: new Date().toISOString(),
    ...event
  };
  fs.appendFileSync(EVENTS_FILE, JSON.stringify(row) + "\n");
  return row;
}

function readEvents() {
  if (!fs.existsSync(EVENTS_FILE)) return [];
  return fs.readFileSync(EVENTS_FILE, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function summarizeParticipants(rows) {
  const participants = new Map();

  rows.forEach(row => {
    const participantId = row.participantId || "unknown";
    if (!participants.has(participantId)) {
      participants.set(participantId, {
        participantId,
        studyIds: new Set(),
        sessionIds: new Set(),
        firstSeenAt: row.receivedAt,
        lastSeenAt: row.receivedAt,
        baselineComplete: false,
        baselineCompletedAt: null,
        onboardingComplete: false,
        onboardingCompletedAt: null,
        emaCompleted: 0,
        emaSessions: {},
        emaPlan: [],
        contact: null,
        uploads: [],
        recordingEvents: [],
        reminderEvents: [],
        tmbEvents: [],
        device: null,
        eventCount: 0
      });
    }

    const summary = participants.get(participantId);
    summary.eventCount += 1;
    if (row.studyId) summary.studyIds.add(row.studyId);
    if (row.sessionId) summary.sessionIds.add(row.sessionId);
    if (row.receivedAt && (!summary.firstSeenAt || row.receivedAt < summary.firstSeenAt)) summary.firstSeenAt = row.receivedAt;
    if (row.receivedAt && (!summary.lastSeenAt || row.receivedAt > summary.lastSeenAt)) summary.lastSeenAt = row.receivedAt;

    if (row.type === "baseline_complete") {
      summary.baselineComplete = true;
      summary.baselineCompletedAt = row.receivedAt;
      summary.baselineAssignments = row.payload?.assignments || null;
      summary.baselineForms = row.payload?.forms || null;
    }

    if (row.type === "onboarding_complete") {
      summary.onboardingComplete = true;
      summary.onboardingCompletedAt = row.receivedAt;
      summary.onboardingForms = row.payload?.forms || null;
    }

    if (row.type === "onboarding_profile") {
      summary.contact = {
        email: row.payload?.email || null,
        phone: row.payload?.phone || null,
        contactPreference: row.payload?.contactPreference || null,
        timezone: row.payload?.timezone || null
      };
    }

    if (row.type === "device_check") {
      summary.device = row.payload?.device_metadata || row.payload || summary.device;
    }

    if (row.type === "ema_complete") {
      const key = row.payload?.session || row.payload?.key || "unknown";
      summary.emaSessions[key] = {
        completedAt: row.receivedAt,
        day: row.payload?.day || null,
        slot: row.payload?.slot || null,
        slotLabel: row.payload?.label || null,
        picture: row.payload?.picture?.id || row.payload?.picture || null,
        pictureSchedulePosition: row.payload?.pictureSchedulePosition || null
      };
      summary.emaCompleted = Object.keys(summary.emaSessions).length;
    }

    if (row.type === "ema_plan") {
      summary.emaPlan = Array.isArray(row.payload?.plan) ? row.payload.plan : [];
    }

    if (row.type === "reminder_sent" || row.type === "reminder_opened") {
      summary.reminderEvents.push({
        receivedAt: row.receivedAt,
        type: row.type,
        day: row.payload?.day || null,
        slot: row.payload?.slot || null,
        label: row.payload?.label || null,
        channel: row.payload?.channel || null,
        scheduledFor: row.payload?.scheduledFor || null
      });
    }

    if (row.type === "audio_upload") {
      summary.uploads.push({
        receivedAt: row.receivedAt,
        task: row.task,
        session: row.session,
        bytes: row.bytes,
        file: row.file
      });
    }

    if (row.type === "recording_complete") {
      summary.recordingEvents.push({
        receivedAt: row.receivedAt,
        task: row.payload?.task || null,
        session: row.payload?.session || null,
        seconds: row.payload?.seconds || null,
        tooShort: Boolean(row.payload?.tooShort),
        visibilityChanges: row.payload?.visibilityChanges || 0,
        hiddenMs: row.payload?.hiddenMs || 0
      });
    }

    if ([
      "cognitive_battery_start",
      "tmb_task_complete",
      "tmb_official_task_complete",
      "tmb_official_task_result"
    ].includes(row.type)) {
      summary.tmbEvents.push({
        receivedAt: row.receivedAt,
        type: row.type,
        task: row.payload?.task || null,
        phase: row.payload?.phase || null,
        taskPosition: row.payload?.taskPosition || null,
        taskCount: row.payload?.taskCount || null,
        cognitiveOrder: row.payload?.cognitiveOrder || null,
        emaSession: row.payload?.emaSession || null,
        emaDay: row.payload?.emaDay || null,
        emaSlot: row.payload?.emaSlot || null
      });
    }
  });

  return Array.from(participants.values())
    .map(summary => ({
      ...summary,
      studyIds: Array.from(summary.studyIds),
      sessionIds: Array.from(summary.sessionIds)
    }))
    .sort((a, b) => String(b.lastSeenAt || "").localeCompare(String(a.lastSeenAt || "")));
}

function getParticipantStatus(participantId) {
  const rows = readEvents().filter(row => row.participantId === participantId);
  const hasQualificationComplete = rows.some(row => row.type === "qualification_complete");
  const hasBaselineComplete = rows.some(row => row.type === "baseline_complete");
  const hasOnboardingComplete = rows.some(row => row.type === "onboarding_complete" || row.type === "baseline_complete");
  const hasAnyRecording = rows.some(row => row.type === "recording_complete");
  const completedEmaSessions = rows
    .filter(row => row.type === "ema_complete")
    .map(row => row.payload?.session || row.payload?.wave || "")
    .filter(Boolean);
  const plannedEmaSessions = buildEmaPlan(participantId);
  const completedSet = new Set(completedEmaSessions);
  const remainingEmaSessions = plannedEmaSessions.filter(row => !completedSet.has(row.key));

  return {
    participantId,
    found: rows.length > 0,
    eventCount: rows.length,
    hasQualificationComplete,
    hasBaselineComplete,
    hasOnboardingComplete,
    hasAnyRecording,
    completedEmaSessions,
    plannedEmaSessions: plannedEmaSessions.length,
    remainingEmaSessions: remainingEmaSessions.length,
    emaPlan: plannedEmaSessions,
    contact: rows.reduce((latest, row) => {
      if (row.type !== "onboarding_profile") return latest;
      return {
        email: row.payload?.email || null,
        phone: row.payload?.phone || null,
        contactPreference: row.payload?.contactPreference || null,
        timezone: row.payload?.timezone || null
      };
    }, null),
    studyIds: Array.from(new Set(rows.map(row => row.studyId).filter(Boolean))),
    lastSeenAt: rows.reduce((latest, row) => {
      if (!row.receivedAt) return latest;
      return !latest || row.receivedAt > latest ? row.receivedAt : latest;
    }, "")
  };
}

function safeName(value) {
  return String(value || "unknown").replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80);
}

function safeUploadFilename(value) {
  const filename = path.basename(String(value || ""));
  return /^[a-zA-Z0-9._-]+$/.test(filename) ? filename : "";
}

function audioExtension(contentType = "") {
  const type = contentType.toLowerCase();
  if (type.includes("wav")) return "wav";
  if (type.includes("mp4") || type.includes("aac") || type.includes("m4a")) return "m4a";
  if (type.includes("ogg")) return "ogg";
  return "webm";
}

function requireAdmin(req, res, url) {
  if (!ADMIN_TOKEN && NODE_ENV === "production") {
    sendJson(res, 503, { error: "Admin export disabled until ADMIN_TOKEN is configured." });
    return false;
  }
  if (ADMIN_TOKEN && url.searchParams.get("token") !== ADMIN_TOKEN) {
    sendJson(res, 401, { error: "Unauthorized" });
    return false;
  }
  return true;
}

function serveStatic(req, res) {
  const url = new URL(req.url, "http://localhost");
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = path.normalize(path.join(PUBLIC_DIR, pathname));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, {
      "content-type": MIME[path.extname(filePath)] || "application/octet-stream",
      "cache-control": "no-store"
    });
    res.end(data);
  });
}

function serveTmb(req, res) {
  const url = new URL(req.url, "http://localhost");
  const rel = decodeURIComponent(url.pathname.replace(/^\/tmb\/?/, ""));
  const filePath = path.normalize(path.join(TMB_DIR, rel));

  if (!filePath.startsWith(TMB_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, {
      "content-type": MIME[path.extname(filePath)] || "application/octet-stream",
      "cache-control": "no-store"
    });
    res.end(data);
  });
}

async function handleApi(req, res) {
  const url = new URL(req.url, "http://localhost");

  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, {
      ok: true,
      environment: NODE_ENV,
      tmbAvailable: fs.existsSync(TMB_DIR),
      dataDir: DATA_DIR,
      maxUploadMb: MAX_UPLOAD_MB
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/config") {
    sendJson(res, 200, CONFIG);
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/participant-status") {
    const participantId = safeName(url.searchParams.get("participantId"));
    if (!participantId || participantId === "unknown") {
      sendJson(res, 200, {
        participantId,
        found: false,
        eventCount: 0,
        hasQualificationComplete: false,
        hasBaselineComplete: false,
        hasOnboardingComplete: false,
        hasAnyRecording: false,
        completedEmaSessions: [],
        studyIds: [],
        lastSeenAt: ""
      });
      return;
    }
    sendJson(res, 200, getParticipantStatus(participantId));
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/events") {
    const body = await readBody(req, 1024 * 1024);
    const event = JSON.parse(body.toString("utf8") || "{}");
    const row = appendEvent(event);
    sendJson(res, 200, { ok: true, event: row });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/upload") {
    const body = await readBody(req);
    const participantId = safeName(url.searchParams.get("participantId"));
    const task = safeName(url.searchParams.get("task"));
    const session = safeName(url.searchParams.get("session"));
    const ext = audioExtension(req.headers["content-type"] || "");
    const id = crypto.randomUUID();
    const filename = `${participantId}_${task}_${session}_${Date.now()}_${id}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);
    fs.writeFileSync(filePath, body);
    const event = appendEvent({
      type: "audio_upload",
      participantId,
      task,
      session,
      bytes: body.length,
      mimeType: req.headers["content-type"] || "application/octet-stream",
      file: `data/uploads/${filename}`
    });
    sendJson(res, 200, { ok: true, file: event.file, bytes: body.length });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/admin/events") {
    if (!requireAdmin(req, res, url)) return;
    let rows = readEvents();
    const participantId = url.searchParams.get("participantId");
    if (participantId) rows = rows.filter(row => row.participantId === participantId);
    sendJson(res, 200, { rows });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/admin/participants") {
    if (!requireAdmin(req, res, url)) return;
    sendJson(res, 200, { participants: summarizeParticipants(readEvents()) });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/admin/reminders") {
    if (!requireAdmin(req, res, url)) return;
    const body = await readBody(req, 1024 * 1024);
    const payload = JSON.parse(body.toString("utf8") || "{}");
    if (!payload.participantId) {
      sendJson(res, 400, { error: "participantId is required" });
      return;
    }
    const participantId = safeName(payload.participantId);
    const day = Number(payload.day || 0);
    const slot = Number(payload.slot || 0);
    const label = String(payload.label || "").trim();
    const query = new URLSearchParams({
      PROLIFIC_PID: participantId,
      STUDY_ID: safeName(payload.studyId || ""),
      SESSION_ID: safeName(payload.sessionId || ""),
      kind: payload.kind || "ema"
    });
    if (day > 0) query.set("day", String(day));
    if (slot > 0) query.set("slot", String(slot));
    if (label) query.set("label", label);
    if (payload.windowStart) query.set("windowStart", String(payload.windowStart));
    if (payload.windowEnd) query.set("windowEnd", String(payload.windowEnd));
    if (payload.reminderId) query.set("reminderId", String(payload.reminderId));
    const targetUrl = `${APP_BASE_URL || CONFIG.studyUrl || ""}/?${query.toString()}`;
    const participantRows = readEvents().filter(row => row.participantId === participantId);
    const latestContact = participantRows.reverse().find(row => row.type === "onboarding_profile")?.payload || null;
    const contact = {
      email: latestContact?.email || null,
      phone: latestContact?.phone || null,
      contactPreference: latestContact?.contactPreference || null
    };
    const row = appendEvent({
      type: "reminder_sent",
      participantId,
      studyId: safeName(payload.studyId || ""),
      sessionId: safeName(payload.sessionId || ""),
      payload: {
        day: day || null,
        slot: slot || null,
        label: label || null,
        channel: payload.channel || "app",
        scheduledFor: payload.scheduledFor || null,
        note: payload.note || null,
        targetUrl
      }
    });
    let delivery = null;
    let deliveryError = null;
    try {
      delivery = await dispatchReminder({ participantId, contact, payload, targetUrl });
      appendEvent({
        type: "reminder_delivered",
        participantId,
        studyId: safeName(payload.studyId || ""),
        sessionId: safeName(payload.sessionId || ""),
        payload: {
          reminderId: payload.reminderId || null,
          channel: delivery.channel,
          targetUrl
        }
      });
    } catch (err) {
      deliveryError = String(err?.message || err);
      appendEvent({
        type: "reminder_failed",
        participantId,
        studyId: safeName(payload.studyId || ""),
        sessionId: safeName(payload.sessionId || ""),
        payload: {
          reminderId: payload.reminderId || null,
          error: deliveryError,
          targetUrl
        }
      });
    }
    sendJson(res, 200, { ok: true, event: row, targetUrl, delivery, deliveryError });
    return;
  }

  if (req.method === "GET" && url.pathname.startsWith("/api/admin/participants/")) {
    if (!requireAdmin(req, res, url)) return;
    const participantId = decodeURIComponent(url.pathname.replace(/^\/api\/admin\/participants\//, ""));
    const rows = readEvents().filter(row => row.participantId === participantId);
    const summary = summarizeParticipants(rows)[0] || null;
    sendJson(res, 200, { participant: summary, rows });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/admin/uploads") {
    if (!requireAdmin(req, res, url)) return;
    const files = fs.existsSync(UPLOAD_DIR)
      ? fs.readdirSync(UPLOAD_DIR).filter(Boolean).sort().map(filename => {
        const stat = fs.statSync(path.join(UPLOAD_DIR, filename));
        return {
          filename,
          bytes: stat.size,
          modifiedAt: stat.mtime.toISOString(),
          downloadPath: `/api/admin/uploads/${encodeURIComponent(filename)}`
        };
      })
      : [];
    sendJson(res, 200, { uploadDir: UPLOAD_DIR, files });
    return;
  }

  if (req.method === "GET" && url.pathname.startsWith("/api/admin/uploads/")) {
    if (!requireAdmin(req, res, url)) return;
    const filename = safeUploadFilename(decodeURIComponent(url.pathname.replace(/^\/api\/admin\/uploads\//, "")));
    const filePath = path.join(UPLOAD_DIR, filename);
    if (!filename || !filePath.startsWith(UPLOAD_DIR) || !fs.existsSync(filePath)) {
      sendJson(res, 404, { error: "Upload not found" });
      return;
    }
    res.writeHead(200, {
      "content-type": MIME[path.extname(filePath)] || "application/octet-stream",
      "content-disposition": `attachment; filename="${filename}"`
    });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  sendJson(res, 404, { error: "Not found" });
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/")) {
    handleApi(req, res).catch(err => {
      sendJson(res, err.statusCode || 500, { error: err.message });
    });
    return;
  }

  if (req.url.startsWith("/tmb/")) {
    serveTmb(req, res);
    return;
  }

  try {
    serveStatic(req, res);
  } catch (err) {
    res.writeHead(500);
    res.end(err.message);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`M-CAMPUS study app running at http://${HOST}:${PORT}`);
  console.log(`TMB tasks served from ${TMB_DIR}`);
  console.log(`Data written to ${DATA_DIR}`);
});
