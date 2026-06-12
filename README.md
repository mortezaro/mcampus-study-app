# M-CAMPUS Study App

Phone-first onboarding and EMA app for the M-CAMPUS Mobile Cognition Study.

## What It Does

- Captures Prolific IDs from `PROLIFIC_PID`, `pid`, or manual entry.
- Runs one-time onboarding with consent, unique demographics/sleep/setup questions, and study instructions.
- Runs EMA check-ins with state/context questionnaires, randomized open speech, randomized picture description, cognitive tasks, and final interruption/feedback questions.
- Includes 24 Appendix A narrative prompts and 12 picture-description scene slots from the protocol.
- Uses the standard open-source TestMyBrain task pages for Choice RT, Digit Symbol Matching, GradCPT, and MOT from `manybrainsproject/TestMyBrainCodeRepo`.
- Each EMA session now includes state/context survey, spontaneous speech, structured picture-description speech, Choice RT, Digit Symbol Matching, GradCPT, MOT, and interruption/feedback questions.
- Records audio in the browser with `MediaRecorder`.
- Uploads audio to `data/uploads`.
- Captures official TMB outcomes and trial rows back into `data/events.jsonl`.
- Logs all events to `data/events.jsonl`.
- Includes a simple researcher view at the EMA dashboard.

## Run Locally

```bash
npm start
```

Then open:

```text
http://localhost:4173/?PROLIFIC_PID=test-participant
```

Participant mode hides local demo shortcuts. For local dry-runs with skip buttons:

```text
http://localhost:4173/?PROLIFIC_PID=test-participant&demo=1
```

Optional production-like env vars:

```bash
PROLIFIC_COMPLETION_URL="https://app.prolific.co/submissions/complete?cc=REAL_CODE" \
ADMIN_TOKEN="change-me" \
MAX_UPLOAD_MB=25 \
npm start
```

## Production Config

Set these environment variables on the hosting service:

- `NODE_ENV=production`
- `HOST=0.0.0.0`
- `PORT` from the host, or `4173` for Docker
- `APP_BASE_URL=https://your-public-study-url`
- `PROLIFIC_COMPLETION_URL=https://app.prolific.co/submissions/complete?cc=REAL_CODE`
- `ADMIN_TOKEN=<long random secret>`
- `MAX_UPLOAD_MB=25`
- `DATA_DIR=/data` or the path to the service's persistent disk/volume
In production, `/api/admin/events` is disabled unless `ADMIN_TOKEN` is set.

## Suggested Prolific Setup

Use Prolific as the scheduler and participant tracker:

1. One onboarding wave that uses `kind=onboarding`.
2. EMA waves that use `kind=ema` and include the mapped day/slot labels.

Set `PROLIFIC_WAVE_MAP_JSON` so the onboarding study ID maps to `kind=onboarding`, and each EMA study ID maps to `kind=ema` with its day, slot, and label.

Example:

```json
{
  "project_a_onboarding_id": { "kind": "onboarding", "title": "Onboarding" },
  "project_a_main_id": { "kind": "main", "title": "Main longitudinal study" },
  "project_b_day1_morning": { "kind": "ema", "day": 1, "slot": 1, "label": "Morning" }
}
```

If a participant opens an EMA link outside the window, the app blocks entry and tells them to wait for the next scheduled window. The Prolific submission should then be handled according to your study policy.

## Data Access

Structured event data are stored as JSON lines in `DATA_DIR/events.jsonl`. Audio files are stored in `DATA_DIR/uploads`.

With `ADMIN_TOKEN` set, use these protected endpoints:

- `/api/admin/events?token=ADMIN_TOKEN` exports all logged study events, including questionnaires, cognitive task order/position, TMB outcomes/trial rows, recording metadata, and upload events.
- `/api/admin/uploads?token=ADMIN_TOKEN` lists uploaded audio files from the persistent disk.
- `/api/admin/uploads/FILENAME?token=ADMIN_TOKEN` downloads a single uploaded audio file.
## Deployment Shape

For a real study, deploy this as a HTTPS web app. Mobile participants should use the normal browser on their phone, usually Safari on iPhone/iOS and Chrome on Android. No App Store or Google Play app is needed.

Good hosting options:

- Render/Fly/Railway for the Node server.
- S3/R2/Supabase Storage for audio files.
- Postgres/Supabase for structured events.
Microphone recording requires HTTPS in production. Localhost is allowed for testing.

## Deploy To Render

This repo includes `render.yaml` for a Render Blueprint. It defines a Node web service in Virginia with:

- `npm install` as the build command
- `npm start` as the start command
- `/api/health` as the health check
- a persistent disk mounted at `/data`
- `DATA_DIR=/data` so recordings and event logs survive deploys/restarts
- generated `ADMIN_TOKEN`
- dashboard prompts for `APP_BASE_URL` and `PROLIFIC_COMPLETION_URL`

In Render:

1. Create a new Blueprint from `mortezaro/mcampus-study-app`.
2. Enter `APP_BASE_URL` after Render assigns the service URL, e.g. `https://mcampus-study-app.onrender.com`.
3. Enter the real `PROLIFIC_COMPLETION_URL`.
4. Keep the service on a paid plan if using the persistent disk for participant recordings.
5. After deploy, open `/api/health` and then test the participant URL on a real phone.

## TestMyBrain Source

The open-source task code is vendored under `vendor/tmb` so the deployed app is self-contained. Matching source folders served under `/tmb/...`:

- `vendor/tmb/TMB_ChoiceRT`
- `vendor/tmb/TMB_DigitSymbolMatching`
- `vendor/tmb/TMB_GradCPT`
- `vendor/tmb/TMB_MOT`

The M-CAMPUS wrapper launches these pages in an embedded frame and captures official TMB outcomes and trial rows via `postMessage`. The served copies are lightly mobile-adapted so `chooseinput=false` forces tap mode and accepts both phone taps and desktop clicks during testing, avoiding keyboard/SPACEBAR instructions in the phone-first study flow.

## Before Launch

- Review the consent and questionnaire wording against the final approved ethics pack.
- Replace SVG picture-description placeholders with approved stimuli if needed.
- Set `PROLIFIC_COMPLETION_URL` to the real Prolific completion URL.
- Set `ADMIN_TOKEN` or disable the admin view in production.
- Add encrypted object storage for recordings.
- Confirm retention, deletion, and participant withdrawal procedures.
- Run the phone pilot checklist in `LAUNCH_CHECKLIST.md`.
