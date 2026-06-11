# M-CAMPUS Participant and Speech Quality Protocol

## Target Population

Define the target as US-raised speakers whose everyday spoken dialect is an
American English variety. Do not use race as a proxy for language background,
dialect, accent, or data quality.

Use objective language-history criteria:

- English used regularly before age 6.
- Lived in the United States for most of ages 5-18.
- Completed most primary and secondary schooling in the United States.
- Self-identifies everyday spoken English as an American English variety.
- Current United States residence, smartphone, microphone, and audio consent.

Any material change to eligibility criteria should be reflected in the study
protocol, consent materials, preregistration, and ethics approval as required.

## Two-Stage Recruitment

### Stage 1: Paid Voice Qualification

Run a separate 2-3 minute Prolific study before the expensive baseline.
Recruit more candidates than the final sample requires and pay every candidate
fairly for the qualification task.

Collect:

1. Language-history questions matching the criteria above.
2. A short spontaneous recording whose prompt is revealed only after recording
   starts.
3. A brief standardized reading sample, only if dialect or intelligibility
   assessment is part of the approved protocol.
4. Device metadata, recording duration, and app-visibility events.

Do not reject or withhold qualification payment because a candidate is not
eligible for the main study. Instead, invite only qualified candidates to the
longitudinal project.

### Stage 2: Baseline and EMA

Create a new longitudinal Prolific project using the qualified participant
list. Start with 3-5 qualified participants, review data within 24 hours, and
then expand in controlled batches.

## Speech Authenticity Controls

- Reveal spontaneous prompts only after recording begins.
- Ask for an immediate detail grounded in the participant's surroundings.
- State clearly that scripts, notes, websites, AI tools, and another device are
  not allowed.
- Log app switching during recording with `visibilityChanges` and `hiddenMs`.
- Keep picture-description stimuli hidden until recording begins.
- Do not allow a completed recording to be replaced by navigating backward.

These controls reduce preparation and phone-based AI use, but no browser can
reliably detect a second physical device.

## Review Rubric

Predefine the rubric before recruitment and review recordings without using
race or other protected characteristics.

Flag for human review when one or more apply:

- The answer does not address the assigned prompt or visible picture.
- The participant explicitly reads instructions, a generated answer, or a
  prepared script.
- The speech contains implausibly polished written-style structure throughout.
- App switching occurs during the spontaneous recording.
- Audio is missing, unintelligible, or clearly not produced live.
- Language-history answers conflict materially with recruitment criteria.

Do not automatically exclude a recording because it has few pauses or filler
words. Do not rely on an AI-text detector alone. Use two independent reviewers
for ambiguous cases and record the exclusion reason.

## Cost Control

- Spend a small amount on qualification before paying for the full baseline.
- Pay the full study fairly; improve efficiency through staged eligibility, not
  lower hourly compensation.
- Pilot in small batches and pause recruitment after each batch for review.
- Invite only baseline-quality participants to the EMA waves.
- Use completion bonuses for high EMA adherence, stated in advance.

