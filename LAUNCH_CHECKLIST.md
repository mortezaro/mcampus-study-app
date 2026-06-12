# M-CAMPUS Launch Checklist

Use this before inviting real participants.

## Local Phone Pilot

- Open the app on iPhone Safari and Android Chrome over HTTPS or an approved tunnel.
- Complete baseline without `demo=1`.
- Record baseline spontaneous speech for at least 30 seconds.
- Record baseline picture-description speech for at least 30 seconds.
- Confirm two uploaded audio files appear in `data/uploads`.
- Confirm `audio_upload` and `recording_complete` events appear in `data/events.jsonl`.
- Complete all four baseline TMB tasks.
- Confirm `tmb_official_task_result` events include `outcomes`, `results`, and `trialCount`.
- Complete one EMA session without `demo=1`.
- Confirm EMA includes survey, spontaneous speech, picture description, Choice RT, Digit Symbol, GradCPT, MOT, and final feedback.
- Confirm `ema_window_opened` and `ema_complete` events appear for at least one pilot session.
- Confirm an expired EMA link is blocked outside its window.
- Confirm onboarding collects an email or phone number for reminders.
- Confirm EMA GradCPT URL does not include `picsInput_300imgs_32nogo.txt`.

## Study Configuration

- Run a separate 2-3 minute paid voice-qualification study before the baseline.
- Pay all qualification participants fairly, then invite only eligible, natural-speech participants to the longitudinal project.
- In the new Prolific project, use United States residence, English first language, United States childhood/upbringing criteria where available, mobile, and microphone screeners.
- Do not use race as a proxy for language background or accent.
- Set real `PROLIFIC_COMPLETION_URL`.
- Set `ADMIN_TOKEN` before exposing `/api/admin/events`.
- Confirm consent wording matches final ethics-approved language.
- Confirm compensation and withdrawal language match the approved protocol.
- Decide whether SVG picture scenes are acceptable, or replace with approved picture stimuli.
- Confirm participant instructions say not to share names, addresses, passwords, or private identifiers in speech.

## Data Quality

- Confirm the spontaneous prompt and picture are hidden until recording starts.
- Confirm participants explicitly agree not to use scripts, websites, AI tools, or another device.
- Flag recordings with app switching during speech using `visibilityChanges` and `hiddenMs`; review rather than automatically rejecting.
- Predefine audio-quality exclusion rules before recruitment and apply them without judging race or protected characteristics.
- Confirm speech recording minimum duration warning works.
- Confirm page visibility events are logged during tab/app switching.
- Confirm TMB result capture is required before Continue is enabled.
- Confirm no demo controls are visible without `demo=1`.
- Confirm local event rows contain participant ID, session key, timestamps, task names, and payloads.

## Production Hosting

- Serve over HTTPS.
- Store recordings in encrypted object storage.
- Store events in a database, not only JSONL.
- Back up data regularly.
- Password-protect or remove the admin view.
- Add EMA reminders through SMS/email/push scheduling.
- Document retention, deletion, and withdrawal handling.
