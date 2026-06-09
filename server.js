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
  ".webm": "audio/webm",
  ".wav": "audio/wav"
};

const CONFIG = {
  studyName: "M-CAMPUS Mobile Cognition Study",
  studyUrl: APP_BASE_URL,
  maxUploadMb: MAX_UPLOAD_MB,
  prolificCompletionUrl: process.env.PROLIFIC_COMPLETION_URL || "https://app.prolific.co/submissions/complete?cc=SET_REAL_CODE",
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
  }
};

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

function safeName(value) {
  return String(value || "unknown").replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80);
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
    const ext = req.headers["content-type"]?.includes("wav") ? "wav" : "webm";
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
    if (!ADMIN_TOKEN && NODE_ENV === "production") {
      sendJson(res, 503, { error: "Admin export disabled until ADMIN_TOKEN is configured." });
      return;
    }
    if (ADMIN_TOKEN && url.searchParams.get("token") !== ADMIN_TOKEN) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }
    const rows = fs.existsSync(EVENTS_FILE)
      ? fs.readFileSync(EVENTS_FILE, "utf8").trim().split("\n").filter(Boolean).map(line => JSON.parse(line))
      : [];
    sendJson(res, 200, { rows });
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
