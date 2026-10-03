# Expert Test Round

A small static site that shows one pre-launch test round for a product-question agent. The agent has been set up on an invented floor-scrubber manufacturer's documents. Three of the manufacturer's experts asked it 30 questions and marked each draft answer. The page sorts every miss to the person who can fix it, checks four go-live gates, and writes one grouped request to the manufacturer.

All data is synthetic. The answers are pre-written. No model runs on the page.

## What the pages show

**`index.html` (round 1)**

1. One result sentence, computed from the data: "20 of 30 expert questions pass. Launch is blocked by 10, and 7 of them need a document or a decision from the manufacturer, not a configuration fix."
2. A summary strip: passes, misses by cause, misses by who fixes them, and the four go-live gates (all four not met in round 1).
3. Open items grouped by owner (Manufacturer, Strategist, Engineering). Each has a "Mark resolved" box that recomputes the gates and the result sentence.
4. The docs ask: one plain-text message to the manufacturer's champion, rebuilt from whatever is still open on their side, with a Copy button.
5. A table of all 30 questions, filterable by expert, type and status. Select a row to see the draft answer, citation, expert note and the rule applied.
6. The fixed rules, the documents the agent was set up on (including the one that was never supplied), the assumptions, and the questions I'd need answered.

**`round-2.html` (second page)**

- Part A, Round 2: the simulated reply (charger manual arrives, one part number confirmed each way, two rules from the applications engineer), the gates for both rounds side by side, a before-and-after table of the same 30 questions, and a small calculator that applies the two new rules to any model. Result: 28 of 30 pass; the warranty escalation rule and the manual page offset are still open.
- Part B, Dealer launch sheet: a one-page guide built only from questions that passed. What you can ask it, what it hands to a person, and how to report a wrong answer. It stays marked as a draft until every gate is met.

`index.html` carries a link to `round-2.html` (`id="round2-link"`) that starts hidden. Remove its `hidden` attribute to show it.

## How it works, one sentence per rule

**The six kinds of miss**

- **No source (document missing):** the answer needs a document that was never supplied, so it goes on the docs ask to the manufacturer's champion and the agent doesn't guess.
- **Part-number conflict:** two documents give different numbers for the same part, so the answer is held until the manufacturer's service manager says which is current, because a wrong number means a wrong order.
- **Needs a rule:** the documents have the inputs but not the rule experts use (like coverage per hour), so the applications engineer supplies the rule and the strategist builds it in as a calculator input.
- **Wrong citation (good source available):** the agent used the wrong page when the right one exists, so the strategist fixes the configuration and reruns the question.
- **Should escalate:** the agent answered a warranty or safety question it should have handed to a person, so the strategist adds an escalation rule, and this always blocks launch.
- **Engineering:** anything configuration can't fix (here, PDF page numbers that don't match the printed ones) goes to engineering with the failing question as the example.

**The four go-live gates**

1. Every warranty and safety question passes, and for those questions a pass means the agent handed it to a person.
2. Zero open part-number conflicts.
3. Each expert's own questions pass at 90% or better, checked per expert because an overall rate can hide one expert's failures, and that expert is the one who signs off.
4. Every open item has an owner and a due date.

**Other behavior**

- Marking an item resolved counts its questions as passing until the next round reruns them.
- The docs ask groups everything the manufacturer owes into one message: the missing manual, both part numbers with both sources, and both rules.
- The same 30 questions are rerun after every round of fixes, so a fix that breaks another answer shows up.

## Assumptions

- Pass means the expert accepted the answer as written.
- The manufacturer, models, part numbers, prices, documents, questions, answers and notes are invented.
- The 90% bar and the due dates (counted in days after the test round) are assumptions.
- In round 2, the 0.65 efficiency factor and the 0.85 and 0.70 runtime figures are example values standing in for an applications engineer's real rules.

## Files

- `index.html`, `round-2.html`: the two pages.
- `data.js`: all synthetic data, as plain values on one global.
- `logic.mjs`: the rules, gates, result sentences, docs ask, calculators and round-2 comparison. Pure functions with no page code.
- `app.js`: draws both pages from `data.js` and `logic.mjs`.
- `styles.css`: light and dark themes. Works down to 400px wide; on narrow screens the tables turn into stacked cards instead of scrolling sideways.
- `tests/run-tests.mjs`: plain Node tests.

`logic.mjs` has no import or export lines on purpose. Browsers load it as an ordinary script, so the pages also work when opened straight from disk, and Node loads it as a module for the tests.

## How to run

- Open `index.html` in a browser. No build step, server, account or network connection is needed.
- Tests (Node 18 or newer), from this folder:

```
node tests/run-tests.mjs
```

The tests check the data against the rules, the exact verdict mix, the result sentences, every gate before and after marking items resolved, the docs ask, the filters, the calculators, the round-2 numbers, the dealer sheet, and that the pages load their scripts without any external calls.

## Limits

- One test round on synthetic data. Nothing here was run against a real manufacturer, a real agent or real experts.
- The agent's answers are fixed text, so the page shows the review process, not answer quality.
- Resolved marks are kept only in the viewer's own browser, if storage is allowed.
- The calculators apply the two example rules only; real sizing would use the manufacturer's own figures.
- Built with AI assistance (Claude Code and Codex), with the rules written down first and every count checked by the tests.
