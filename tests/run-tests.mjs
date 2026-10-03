// Plain Node tests for the Expert Test Round. Run from the sample folder:
//   node tests/run-tests.mjs
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
await import(new URL("../data.js", import.meta.url).href);
await import(new URL("../logic.mjs", import.meta.url).href);

const R = globalThis.ExpertRound;
const DATA = globalThis.EXPERT_ROUND_DATA;
const clone = (x) => JSON.parse(JSON.stringify(x));

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

// ---------- data shape ----------

test("data passes every consistency check", () => {
  assert.deepEqual(R.validate(DATA), []);
});

test("30 questions, 10 per expert, unique ids", () => {
  assert.equal(DATA.questions.length, 30);
  for (const e of DATA.experts) {
    assert.equal(DATA.questions.filter((q) => q.asked_by === e.id).length, 10, e.role);
  }
  assert.equal(new Set(DATA.questions.map((q) => q.id)).size, 30);
});

test("verdict mix matches the spec", () => {
  const count = (v) => DATA.questions.filter((q) => q.verdict === v).length;
  assert.equal(count("pass"), 20);
  assert.equal(count("no_source"), 3);
  assert.equal(count("conflict"), 2);
  assert.equal(count("needs_rule"), 2);
  assert.equal(count("wrong"), 1);
  assert.equal(count("should_escalate"), 1);
  assert.equal(count("engineering"), 1);
});

test("every no-source question waits on the missing charger manual", () => {
  const ns = DATA.questions.filter((q) => q.verdict === "no_source");
  const item = DATA.items.find((i) => i.cause === "no_source");
  assert.deepEqual(ns.map((q) => q.item), [item.id, item.id, item.id]);
  assert.match(item.title, /charger manual/i);
  assert.equal(DATA.missing_sources[0].title, "Battery charger manual");
});

test("each conflict shows two different part numbers, each with a source", () => {
  const conflicts = DATA.items.filter((i) => i.cause === "conflict");
  assert.equal(conflicts.length, 2);
  for (const c of conflicts) {
    assert.notEqual(c.values[0].value, c.values[1].value);
    assert.deepEqual(c.values.map((v) => v.source).sort(), ["parts2023", "price2026"]);
  }
});

test("all six question types are used", () => {
  assert.deepEqual([...new Set(DATA.questions.map((q) => q.type))].sort(), [...R.TYPES].sort());
});

// ---------- rules ----------

test("fixed rules map each miss to the right fix and owner", () => {
  const r = R.RULES;
  assert.equal(r.no_source.action, "Docs ask");
  assert.equal(r.no_source.owner, "Manufacturer champion");
  assert.equal(r.conflict.owner, "Service manager (manufacturer)");
  assert.match(r.conflict.rule, /Never pick one/);
  assert.equal(r.needs_rule.owner, "Applications engineer, then strategist");
  assert.match(r.needs_rule.rule, /calculator input/);
  assert.equal(r.wrong.action, "Configuration fix");
  assert.equal(r.wrong.owner, "Strategist");
  assert.equal(r.should_escalate.owner, "Strategist");
  assert.equal(r.should_escalate.alwaysBlocks, true);
  assert.equal(r.engineering.owner, "Engineering");
  for (const c of ["no_source", "conflict", "needs_rule", "wrong", "engineering"]) {
    assert.equal(r[c].alwaysBlocks, false, c);
  }
});

test("an unknown verdict throws instead of guessing an owner", () => {
  assert.throws(() => R.ruleFor("maybe"));
});

// ---------- round 1 result ----------

test("result sentence matches the spec wording", () => {
  assert.equal(
    R.headline(DATA, []),
    "20 of 30 expert questions pass. Launch is blocked by 10, and 7 of them need a document or a decision from the manufacturer, not a configuration fix."
  );
});

test("summary counts blocked questions by cause and owner group", () => {
  const s = R.summarize(DATA, []);
  assert.equal(s.passed, 20);
  assert.equal(s.blocked, 10);
  assert.deepEqual(s.openByGroup, { Manufacturer: 7, Strategist: 2, Engineering: 1 });
  assert.equal(s.itemsTotal, 8);
});

test("all four gates start not met, with the right counts", () => {
  const g = R.gates(DATA, []);
  assert.deepEqual(g.map((x) => x.met), [false, false, false, false]);
  assert.equal(g[0].detail, "3 of 4 warranty and safety questions pass or hand off correctly");
  assert.equal(g[1].detail, "2 open part-number conflicts");
  assert.deepEqual(g[2].perExpert.map((p) => [p.id, p.passed, p.need]), [["AE", 7, 9], ["SM", 5, 9], ["DS", 8, 9]]);
  assert.match(g[3].detail, /^7 of 8 open items have an owner and a due date/);
  assert.deepEqual(g[3].missing, ["I8"]);
});

test("open items group by owner: manufacturer 5 items (7 questions), strategist 2, engineering 1", () => {
  const groups = R.groupedItems(DATA, []);
  assert.deepEqual(groups.map((g) => [g.group, g.items.length, g.questionCount]), [
    ["Manufacturer", 5, 7],
    ["Strategist", 2, 2],
    ["Engineering", 1, 1]
  ]);
});

// ---------- marking items resolved ----------

test("confirming both part numbers clears the conflict gate only", () => {
  const g = R.gates(DATA, ["I2", "I3"]);
  assert.deepEqual(g.map((x) => x.met), [false, true, false, false]);
});

test("adding the escalation rule clears the warranty and safety gate", () => {
  assert.equal(R.gates(DATA, ["I7"])[0].met, true);
});

test("an engineering due date is the only thing gate 4 waits on", () => {
  assert.equal(R.gates(DATA, ["I8"])[3].met, true);
});

test("resolving everything meets every gate and asks for a rerun", () => {
  const all = DATA.items.map((i) => i.id);
  assert.deepEqual(R.gates(DATA, all).map((x) => x.met), [true, true, true, true]);
  assert.equal(
    R.headline(DATA, all),
    "20 of 30 expert questions passed the test round. Every open item is marked resolved here; rerun the 10 affected questions before launch."
  );
});

test("partial resolution updates the result sentence", () => {
  assert.equal(
    R.headline(DATA, ["I1", "I6"]),
    "20 of 30 expert questions passed the test round. With 2 items marked resolved, 6 still block launch, and 4 of them need a document or a decision from the manufacturer, not a configuration fix."
  );
  assert.equal(
    R.headline(DATA, ["I1", "I2", "I3", "I4", "I5"]),
    "20 of 30 expert questions passed the test round. With 5 items marked resolved, 3 still block launch, and none of them need the manufacturer; they're configuration or engineering fixes."
  );
});

test("the 90% bar is checked per expert, so a good overall rate can still fail", () => {
  // 27 of 30 overall is exactly 90%, but if all 3 misses belong to one expert, that expert is at 70%.
  const d = clone(DATA);
  d.questions.forEach((q) => { q.verdict = "pass"; q.item = null; });
  ["Q11", "Q12", "Q13"].forEach((id) => {
    const q = d.questions.find((x) => x.id === id);
    q.verdict = "engineering";
  });
  const s = R.summarize(d, []);
  assert.equal(s.passed / s.total, 0.9);
  const perExpert = R.gates(d, [])[2];
  assert.equal(perExpert.met, false);
  assert.deepEqual(perExpert.perExpert.find((p) => p.id === "SM").passed, 7);
});

// ---------- docs ask ----------

test("docs ask lists the manual, both part numbers with both sources, and both rules", () => {
  const msg = R.docsAsk(DATA, []);
  assert.match(msg, /Battery charger manual\. Your WB-26 operator manual \(p\. 8\)/);
  assert.match(msg, /Waiting on it: Q13, Q14, Q21\./);
  assert.match(msg, /Parts list, 2023 edition \(p\. 9\) says 56-3310; Dealer price book 2026 \(row 214\) says 56-3318/);
  assert.match(msg, /Parts list, 2023 edition \(p\. 14\) says 71-2040; Dealer price book 2026 \(row 301\) says 71-2046/);
  assert.match(msg, /2\. Confirm two part numbers\. We're holding these answers until you do\./);
  assert.match(msg, /3\. Two rules from your applications engineer/);
  assert.match(msg, /Coverage: /);
  assert.match(msg, /Runtime: /);
  assert.match(msg, /10 of the 30 questions still need something before launch, and 7 of those need something from your side/);
  assert.doesNotMatch(msg, /RO-32 page|escalation|engineering/i);
});

test("docs ask drops items once they're marked resolved", () => {
  const msg = R.docsAsk(DATA, ["I1", "I2"]);
  assert.doesNotMatch(msg, /charger manual/);
  assert.doesNotMatch(msg, /56-3310/);
  assert.match(msg, /1\. Confirm one part number\./);
  assert.match(msg, /2\. Two rules from your applications engineer/);
  assert.match(msg, /71-2046/);
});

test("docs ask says so when nothing is waiting on the manufacturer", () => {
  const msg = R.docsAsk(DATA, ["I1", "I2", "I3", "I4", "I5"]);
  assert.match(msg, /Nothing from the test round is waiting on your side/);
});

// ---------- table filters ----------

test("filters work by expert, type and status, alone and together", () => {
  assert.equal(R.filterQuestions(DATA.questions, { expert: "SM" }).length, 10);
  assert.equal(R.filterQuestions(DATA.questions, { type: "warranty-safety" }).length, 4);
  assert.equal(R.filterQuestions(DATA.questions, { status: "blocked" }).length, 10);
  assert.deepEqual(
    R.filterQuestions(DATA.questions, { expert: "SM", status: "blocked" }).map((q) => q.id),
    ["Q11", "Q12", "Q13", "Q14", "Q15"]
  );
  assert.equal(R.filterQuestions(DATA.questions, { expert: "all", type: "all", status: "all" }).length, 30);
});

test("citations format with the document title, or None", () => {
  const q = DATA.questions.find((x) => x.id === "Q15");
  assert.equal(R.formatCitation(DATA, q.citation), "Operator manual, WB-26 walk-behind, p. 19");
  assert.equal(R.formatCitation(DATA, null), "None");
});

// ---------- calculator rules ----------

test("the round 1 coverage answer is the theoretical number the calculator gives", () => {
  const wb26 = R.modelById(DATA, "WB-26");
  assert.equal(Math.round(R.theoreticalCoverage(wb26) / 10) * 10, 28600);
  assert.match(DATA.questions.find((q) => q.id === "Q04").answer, /28,600/);
});

test("practical coverage applies the efficiency factor", () => {
  const rules = DATA.round2.reply.rules;
  const per = (id) => R.practicalCoverage(R.modelById(DATA, id), rules.coverage_factor);
  assert.deepEqual(["WB-20", "WB-26", "RO-32", "RO-40"].map(per), [14300, 18590, 36610, 51480]);
});

test("usable runtime applies the brush-pressure derate", () => {
  const d = DATA.round2.reply.rules.runtime_derate;
  const ro32 = R.modelById(DATA, "RO-32");
  assert.equal(R.usableRuntime(ro32, "normal", d), 3.0);
  assert.equal(R.usableRuntime(ro32, "heavy", d), 2.5);
  assert.throws(() => R.usableRuntime(ro32, "extreme", d));
});

test("shift plan says when a shift needs a swap or a charge break", () => {
  const rules = DATA.round2.reply.rules;
  const ro32 = R.modelById(DATA, "RO-32");
  const long = R.shiftPlan(ro32, 8, "normal", rules);
  assert.equal(long.coversShift, false);
  assert.match(long.sentence, /needs a battery swap or a charge break/);
  const short = R.shiftPlan(ro32, 2, "normal", rules);
  assert.equal(short.coversShift, true);
});

test("round 2 answers use the same numbers as the calculator", () => {
  const r2 = DATA.round2.questions;
  assert.match(r2.Q04.answer, /18,590/);
  assert.match(r2.Q04.answer, /28,600/);
  assert.match(r2.Q05.answer, /about 3\.0 hours at normal/);
  assert.match(r2.Q05.answer, /about 2\.5 at heavy/);
});

// ---------- round 2 ----------

test("round 2 data is still consistent", () => {
  assert.deepEqual(R.validate(R.applyRound2(DATA)), []);
});

test("round 2: 28 of 30 pass, with the escalation rule and page offset still open", () => {
  const after = R.applyRound2(DATA);
  const s = R.summarize(after, []);
  assert.equal(s.passed, 28);
  assert.deepEqual(after.items.map((i) => i.id), ["I7", "I8"]);
  assert.equal(
    R.round2Headline(DATA),
    "28 of 30 expert questions pass after round 2. Launch is still blocked by 2: the warranty escalation rule and the manual page offset."
  );
});

test("round 2 gates: only the warranty and safety gate is still not met", () => {
  const g = R.gates(R.applyRound2(DATA), []);
  assert.deepEqual(g.map((x) => x.met), [false, true, true, true]);
  assert.deepEqual(g[2].perExpert.map((p) => p.passed), [10, 9, 9]);
});

test("round 2 confirms one part number each way", () => {
  const after = R.applyRound2(DATA);
  const answer = (id) => after.questions.find((q) => q.id === id).answer;
  assert.match(answer("Q11"), /^56-3318/);
  assert.match(answer("Q12"), /^71-2040/);
  const pn = DATA.round2.reply.part_numbers;
  assert.deepEqual(pn.map((p) => p.right_source), ["price2026", "parts2023"]);
});

test("round 2 adds the charger manual and nothing is missing any more", () => {
  const after = R.applyRound2(DATA);
  assert.equal(after.missing_sources.length, 0);
  const q13 = after.questions.find((q) => q.id === "Q13");
  assert.equal(R.formatCitation(after, q13.citation), "Battery charger manual, 2025, p. 9");
});

test("before/after table covers all 30, with 8 changed verdicts and a reason for every round 1 miss", () => {
  const rows = R.compareRounds(DATA);
  assert.equal(rows.length, 30);
  assert.equal(rows.filter((r) => r.changed).length, 8);
  const misses = rows.filter((r) => r.missedInRound1);
  assert.equal(misses.length, 10);
  misses.forEach((r) => assert.notEqual(r.what, "No change. Passed in both rounds.", r.id));
  assert.match(rows.find((r) => r.id === "Q22").what, /^Still open/);
});

test("dealer launch sheet uses only passing questions and keeps warranty and safety out of the examples", () => {
  const after = R.applyRound2(DATA);
  const sheet = R.launchSheet(after);
  const passing = new Set(after.questions.filter((q) => q.verdict === "pass").map((q) => q.question));
  const examples = sheet.examples.flatMap((g) => g.questions);
  assert.ok(examples.length >= 8);
  examples.forEach((text) => assert.ok(passing.has(text), text));
  assert.ok(!sheet.examples.some((g) => g.type === "warranty-safety"));
  sheet.examples.forEach((g) => assert.ok(g.questions.length <= 2));
  assert.equal(sheet.handoffExamples.length, 3);
  assert.match(sheet.status, /^Draft\./);
  assert.match(sheet.status, /the warranty escalation rule and the manual page offset/);
});

// ---------- pages ----------

const read = (f) => readFileSync(join(root, f), "utf8");

test("main page carries the label, the footer and exactly the closing questions", () => {
  const html = read("index.html");
  assert.match(html, /Synthetic data/);
  assert.match(html, /Built by Dakshit Raj with Claude Code and Codex\. Synthetic data; no model runs on this page\./);
  for (const q of [
    "How do a manufacturer's experts send test questions today, and who on their side signs off on launch?",
    "When the parts list and the price book disagree, who decides which is current?",
    "Is the launch bar a pass rate, a set of must-pass questions, or the expert's call?",
    "Which misses get fixed through configuration, and which go to engineering?"
  ]) {
    assert.ok(html.includes(q.replace(/'/g, "&rsquo;")) || html.includes(q), q);
  }
});

test("both pages load the data and logic with plain script tags (works from disk)", () => {
  for (const f of ["index.html", "round-2.html"]) {
    const html = read(f);
    assert.match(html, /<script src="data\.js"><\/script>/, f);
    assert.match(html, /<script src="logic\.mjs"><\/script>/, f);
    assert.doesNotMatch(html, /type="module"/, f);
    assert.doesNotMatch(html, /https?:\/\/(?!www\.w3\.org)/, f + " should make no external calls");
  }
});

// Built from char codes so this file does not contain the characters it looks for.
const DASHES = new RegExp("[" + String.fromCharCode(0x2013) + String.fromCharCode(0x2014) + "]");

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (name.startsWith(".")) return [];
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

test("no dashes or local paths anywhere in the sample", () => {
  for (const p of walk(root)) {
    const text = readFileSync(p, "utf8");
    const rel = relative(root, p);
    assert.ok(!DASHES.test(text), rel + " has an en or em dash");
    assert.ok(!text.includes("/Users" + "/"), rel + " has a local path");
  }
});

// ---------- run ----------

let failed = 0;
for (const t of tests) {
  try {
    await t.fn();
    console.log("ok   " + t.name);
  } catch (err) {
    failed += 1;
    console.log("FAIL " + t.name);
    console.log("     " + String(err && err.message ? err.message : err).split("\n").join("\n     "));
  }
}
console.log("\n" + (tests.length - failed) + " of " + tests.length + " tests passed");
process.exitCode = failed ? 1 : 0;
