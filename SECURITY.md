# Security notes

- Question and explanation text is written by Claude from scraped course material, which other people can edit. The Study Hub (`skills/ma-study-quiz/template.html`) runs it through an allowlist sanitiser (`H()`), validates video and Drive IDs, and loads MathJax with an integrity hash. Keep any new text field going through `H()` or `esc()` before it reaches `innerHTML`.
- The skills tell Claude to treat Moodle, Drive, Panopto and Ed content as data, never instructions.
- Suggested repo settings: require pull-request review on `main`, turn on two-factor for every maintainer, and tag releases so students can install a fixed version.
- Report problems to the maintainers privately before posting them publicly.
