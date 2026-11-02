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
- **No hub yet:** publish `template.html` (next to this file) as a new artifact with `capabilities: {db: {}}` and icon `quiz`, then seed it as above. Save the URL to Eunomia ("Study Hub", the student's entity) or `<study folder>/STUDY-HUB.md`.
- **Changing the hub page:** edit the template, test it locally with `window.HUB_SEED` set to a seed object (it then runs on localStorage), in a **new** browser-pane tab, never one the student is using. Republish to the same URL with `url`; the db and the student's progress survive.

Keep it as an Artifact. Serving it in the browser pane was tried: links replaced the quiz tab, and Panopto can't be embedded. Don't offer that again.

## 4b. Practice exams (when asked for a practice/mock exam)
- Write an exam-style paper from the notes and any past-exam style the unit uses: a mix of multiple choice, numeric, and written questions, weighted by week. Written questions have no `o`/`num`; give `ans` (model answer HTML, with the marking points) plus `e`, `s`, `link` as usual.
- Questions go in `questions` as normal (ids like `<unit>-pe<N>-q01`). Written questions are exam-only: weak-spot and due sessions skip them automatically.
- Write `exams/<unit>-pe<N>` = `{unit, title, created, minutes, qids, marks: {qid: n}, intro?}` (`marks` defaults to 1 per question; set realistic marks for written ones). `minutes` is the suggested time; Sam can untick the timer.
- Results: `sittings` docs `{exam, started, finished, timed, ans, self, timeUp}`; attempts from an exam have `quiz: "exam:<id>"` and feed the same concept mastery. Read them when asked how an exam went.

## 5. Weak spots and flags
For "quiz my weak spots", "how am I going" or exam revision:
- Read `attempts`, `srs` and `flags` with ArtifactData (`out_dir` if large). Mastery per concept = recency-weighted mean (newest weight 1, then ×0.7) of 1 (right, sure), 0.5 (right, guessed), 0 (wrong). Under 0.5 is weak; untried is unknown.
- The hub's own **Revise weak spots** button already mixes the existing questions; point to that first. When a weak concept has run out of fresh questions (all attempted in the last few days), write 3–5 new ones for it from the slides and add them as a new quiz ("W9 weak spots, <date>").
- Open flags (`resolved: false`): fix the question (re-check the slide text), `update` it, and set the flag `resolved: true` with a short `fix` note.
- Report in two or three lines: weakest concepts, what you added, flags fixed.

## 6. Afterwards
If they tell you their score or misses, offer a follow-up quiz on just the missed topics.
