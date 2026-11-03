---
name: ma-study-quiz
description: "Part of the ma-study set (Monash Automation study skills). Quiz a student from the lecture slides in one Study Hub artifact: every quiz in one place, MathJax equations, feedback linking to the lecture video moment and slide page, concept-tagged questions, a progress view by week and concept, spaced repetition, weak-spot revision, sure/guessed confidence and question flags. Use when someone says 'quiz me on week N', 'test me on weeks X-Y', 'quiz my weak spots', asks how their revision is going, or asks for practice questions on a unit that has ma-study-notes notes. Never quiz in plain chat."
---

# ma-study-quiz

Every quiz lives in one **Study Hub** artifact; a new quiz is just new rows in its database, never a new artifact. The student's hub URL is in Eunomia ("Study Hub") or `<study folder>/STUDY-HUB.md` (the study folder is `~/University/` if it exists, otherwise the folder this session was opened in); if neither exists, set one up (step 4). Don't put the questions in chat: it floods the conversation. If an Artifact can't be published, fall back to the AskUserQuestion pop-up, one question at a time with the feedback inside the next pop-up, and plain text instead of LaTeX.

## 1. Find the material
- If the built-in browser tools (`mcp__Claude_Browser__*`) aren't available, this is the Chat tab: give the **ma-study** step-0 message (switch to the Code tab) and stop.
- Read `<study folder>/<UNIT>/StudyKB/README.md`, then the requested week files and their raw text in `sources/` (the slide text is the ground truth). If no notes exist, offer to run **ma-study-notes** first.
- If Eunomia is connected, `recall` "<UNIT> Week N" for examinability rulings. Skip anything marked not examinable.

## 2. Write the questions
- About 5–7 per week, most recent week first. Mix concept, "why", equation recognition and short calculations (worksheet style).
- **From the slides.** Every question and answer must come from the slide or worksheet text. Mark anything you add beyond it with "extra" in `s`. Never ask about something the slides don't cover.
- Wrong options should be plausible misconceptions, not obvious jokes. Shuffle where the right answer sits.
- Explanations (`e`) say why the answer is right and why the tempting wrong one is wrong, in the lecturer's notation.
- Use LaTeX inside `\( … \)` inline or `\[ … \]` display, written in `String.raw` literals in the build script (or doubled backslashes in raw JSON).

Each question is a `questions` doc (id `<unit>-w<N>-q<NN>`, unique across the hub):
```js
{ unit: "ECE4179", week: 9, concepts: ["ece4179-w9-lstm"],   // 1–3 concept ids
  w: "W9 · LSTM", q: "question with \\(math\\)",          // JSON: backslashes doubled
  o: ["A", "B", "C", "D"], a: 1,     // multiple choice; or num: 0.73, tol: 0.015
  e: "explanation", s: "slide · <deck/section>", link: {v, d} }   // link: see step 3
```
- **Concepts:** before writing questions, read the unit's existing `concepts` (ArtifactData `list`) and reuse them. Add new ones only for topics not covered: `concepts/<unit>-w<N>-<slug>` = `{unit, week, name, order}`, 4–7 per week, named as the slides name them. Tag every question; that is what the progress view and weak-spot picker run on.

## 3. Link each question back to where it was taught
Each question's feedback links to the exact video moment and slide page, so a wrong answer ties back to a memory of the lecture. Set each question's `link` to:
```js
{ v: { id: "<panopto session id>", t: 415, title: "RNN 1: intro" },   // omit v if no video covers it
  d: { deck: "RNNs", f: "<drive file id>", p: [6] } }                   // slide/worksheet/notes page(s)
```
- **Slide pages:** read each deck with the Drive connector's `read_file_content`. Each page's text ends with the deck footer plus the page number. A Sonnet agent can map all the questions in one pass: give it the quiz file and the deck IDs, and ask for JSON `{i, deck, fileId, pages}`.
- **Video timestamps (Panopto):** on the week's Moodle page, collect the `Embed.aspx?id=<uuid>` ids from the live DOM (the iframes load lazily, so a fetched copy of the page has none). Open `https://monash.au.panopto.com/Panopto/Pages/Viewer.aspx?id=<id>` in the browser pane. If it shows a sign-in page, choose **Monash Okta** and click Sign in; this reuses the Moodle SSO session, so no password is typed. Then, from that tab, `fetch('/Panopto/Pages/Transcription/GenerateSRT.ashx?id=<id>&language=0')` for captions and the Viewer page `<title>` for the video name. Keep the cues in `window` and regex-search them per question, returning only the hits; don't dump whole transcripts into context. Link with `Viewer.aspx?id=<id>&start=<seconds>`.
- Save the video id list to `sources/video-index-w<X>-<Y>.md` so later quizzes can reuse it.
- Drive links can't jump to a page, so show "p.N" in the link label.

## 4. Add the quiz to the hub
- Build the docs with a small node script (see `seed-example.js`: concepts, tags and ids from a `{Q, LINKS}` array), one JSON file per doc, then write them with one ArtifactData `batch` (≤50 writes per batch) using `file_path` entries: the concepts, questions, `quizzes/<unit>-w<X>-<Y>` = `{unit, title, created, qids}` and, for a new unit, `meta/<unit lowercase>` = `{unit, name, examDate}` (exam date from the notes README).
- Check: `node -e` that every `a < o.length` or `num` is set and every concept id exists; then `list` `quizzes` to confirm. Give the hub link in one line; the new quiz is on its home page after a reload.
- **No hub yet:** publish `template.html` (next to this file) as a new artifact with `capabilities: {db: {}, sample: {}}` and icon `quiz`, then seed it as above, and sync the notes (4c). Save the URL to Eunomia ("Study Hub", the student's entity) or `<study folder>/STUDY-HUB.md`.
- **Changing the hub page:** edit the template, test it locally with `window.HUB_SEED` set to a seed object (it then runs on localStorage), in a **new** browser-pane tab, never one the student is using. Republish to the same URL with `url`; the db and the student's progress survive.

Keep it as an Artifact. Serving it in the browser pane was tried: links replaced the quiz tab, and Panopto can't be embedded. Don't offer that again.

## 4b. Practice exams (when asked for a practice/mock exam)
- Write an exam-style paper from the notes and any past-exam style the unit uses: a mix of multiple choice, numeric, and written questions, weighted by week. Written questions have no `o`/`num`; give `ans` (model answer HTML, with the marking points) plus `e`, `s`, `link` as usual.
- Questions go in `questions` as normal (ids like `<unit>-pe<N>-q01`). Written questions are exam-only: weak-spot and due sessions skip them automatically.
- Write `exams/<unit>-pe<N>` = `{unit, title, created, minutes, qids, marks: {qid: n}, intro?}` (`marks` defaults to 1 per question; set realistic marks for written ones). `minutes` is the suggested time; Sam can untick the timer.
- Results: `sittings` docs `{exam, started, finished, timed, ans, self, timeUp}`; attempts from an exam have `quiz: "exam:<id>"` and feed the same concept mastery. Read them when asked how an exam went.

## 4c. In-hub controls (New, Ask Claude, requests)
The hub page can ask Claude itself (`sample` capability), so the student rarely needs chat:
- **New** (unit page): makes a quiz or practice exam from the `notes` collection and writes it straight to the db (ids `<unit>-g<base36 time>`, docs tagged `gen: true`). Every question gets an exact slide page and video time, the same standard as chat-made quizzes: a second Claude pass reads that week's `sources` (slide page text `[pN]` and transcript lines `[seconds]`) and picks them; questions it can't link are dropped. Weeks without sources are greyed out.
- **Ask Claude** (under each answer and in exam review): a short tutoring chat about that question. Nothing is stored.
- **Notes sync:** `notes/<unit>-w<N>` = `{unit, week, title, text, src, synced}`, the full text of each week's notes file. Re-sync with an ArtifactData `batch` after ma-study-notes adds or changes a week; New and Ask only know what is there. Each notes doc also carries `sources: <count>` (enables that week in New).
- **Sources:** `sources/<unit>-w<N>-d-<drive id>` = `{unit, week, kind: 'deck', f, deck, pages: [text per page]}` and `sources/<unit>-w<N>-v-<panopto id>` = `{unit, week, kind: 'video', id, title, dur, segs: [[seconds, text], ...]}` (~30 s segments). The page lazy-loads them per week, so they never bloat startup. To refresh: slide text from the Drive PDFs (one string per page); video ids from the Moodle week sections (Panopto embeds); transcripts from Panopto `/Panopto/Pages/Transcription/GenerateSRT.ashx?id=<id>&language=0` (or `language=15` when empty), fetched inside a signed-in Panopto tab. To get them to disk, submit a top-level `<form method=POST>` to a local `http.server` (fetch, iframes and popups to localhost are blocked from Panopto). Write with ArtifactData `batch` + `file_path` (≤50 docs, ≤1 MiB per batch), then update each notes doc's `sources` count.
- **Requests queue:** "Send to Claude in chat" writes `requests/<id>` = `{unit, kind: quiz|exam, weeks, n, minutes, focus, at, status: queued}`. At the start of any quiz session, `query` requests with `status == queued`. Build each one the normal way (sections 2–4b, with links), then `update` it to `{status: "done", result: "<quiz or exam id>"}`. Mention them in one line.
- **Problem reports:** the hub's Report button writes `reports/<id>` = `{kind: bug|idea, text, route, qid, build, ua, errors, at, status: queued}`. At the start of any quiz session (and on the scheduled check), `query` reports with `status == queued`. Show the user each report (kind, text, page) and ask before filing; never file one without their yes in chat, and a no means `update` it to `{status: "declined"}`. For each approved one: save the doc as JSON and run `python3 file-report.py <id> <file>` from this folder. It files a `feedback` issue on samsamthecodingman/ma-study, where the triage workflow replies with a fix plan. Then `update` the report to `{status: "filed", issue: "<url>"}`. The repo is public: if a report holds personal details, don't file it; update it to `{status: "held"}` and tell the user.
- When you check `gen: true` questions while doing weak-spot work, fix anything wrong and add `link` where the slides make it easy.

## 5. Weak spots and flags
For "quiz my weak spots", "how am I going" or exam revision:
- Read `attempts`, `srs` and `flags` with ArtifactData (`out_dir` if large). Mastery per concept = recency-weighted mean (newest weight 1, then ×0.7) of 1 (right, sure), 0.5 (right, guessed), 0 (wrong). Under 0.5 is weak; untried is unknown.
- The hub's own **Revise weak spots** button already mixes the existing questions; point to that first. When a weak concept has run out of fresh questions (all attempted in the last few days), write 3–5 new ones for it from the slides and add them as a new quiz ("W9 weak spots, <date>").
- Open flags (`resolved: false`): fix the question (re-check the slide text), `update` it, and set the flag `resolved: true` with a short `fix` note.
- Report in two or three lines: weakest concepts, what you added, flags fixed.

## 6. Afterwards
If they tell you their score or misses, offer a follow-up quiz on just the missed topics.
