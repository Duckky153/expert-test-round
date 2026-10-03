/*
  Expert Test Round: the rules and the math. Pure functions, no page code.

  This file has no import or export lines on purpose. Browsers load it as a plain
  script, so the page still works when it is opened straight from disk, and Node
  loads it as a module for the tests. Either way it sets one global: ExpertRound.
*/
(function () {
  "use strict";

  const CAUSES = ["no_source", "conflict", "needs_rule", "wrong", "should_escalate", "engineering"];
  const GROUPS = ["Manufacturer", "Strategist", "Engineering"];
  const TYPES = ["selection", "compatibility", "parts", "troubleshooting", "sizing", "warranty-safety"];

  const VERDICT_LABELS = {
    pass: "Pass",
    no_source: "No source",
    conflict: "Part-number conflict",
    needs_rule: "Needs a rule",
    wrong: "Wrong citation",
    should_escalate: "Should escalate",
    engineering: "Engineering"
  };

  const TYPE_LABELS = {
    selection: "Selection",
    compatibility: "Compatibility",
    parts: "Parts",
    troubleshooting: "Troubleshooting",
    sizing: "Sizing",
    "warranty-safety": "Warranty and safety"
  };

  // The fixed rules. Every miss maps to exactly one fix and one owner.
  const RULES = {
    no_source: {
      action: "Docs ask",
      owner: "Manufacturer champion",
      group: "Manufacturer",
      when: "No source, and the document it needs is missing.",
      rule: "Ask the manufacturer's champion for the missing document. The agent doesn't guess in the meantime.",
      alwaysBlocks: false
    },
    conflict: {
      action: "Hold and confirm",
      owner: "Service manager (manufacturer)",
      group: "Manufacturer",
      when: "Two documents give different part numbers for the same item.",
      rule: "Hold the answer until the manufacturer confirms which number is current. Never pick one.",
      alwaysBlocks: false
    },
    needs_rule: {
      action: "Rule ask",
      owner: "Applications engineer, then strategist",
      group: "Manufacturer",
      when: "The documents have the inputs but not the rule experts use, like coverage per hour or runtime per shift.",
      rule: "Get the rule from the applications engineer, then build it in as a calculator input.",
      alwaysBlocks: false
    },
    wrong: {
      action: "Configuration fix",
      owner: "Strategist",
      group: "Strategist",
      when: "The answer is wrong, but a good source is available.",
      rule: "Fix the configuration so the agent uses the right source, then rerun the question.",
      alwaysBlocks: false
    },
    should_escalate: {
      action: "Escalation rule",
      owner: "Strategist",
      group: "Strategist",
      when: "The agent answered a warranty or safety question instead of handing it to a person.",
      rule: "Add an escalation rule. This always blocks launch, whatever the pass rate.",
      alwaysBlocks: true
    },
    engineering: {
      action: "Engineering ticket",
      owner: "Engineering",
      group: "Engineering",
      when: "Anything configuration can't fix.",
      rule: "Send it to engineering with the failing question as the example.",
      alwaysBlocks: false
    }
  };

  const PASS_RULE = {
    action: "None",
    owner: "None",
    group: null,
    when: "The expert accepted the answer as written.",
    rule: "Nothing to fix. A warranty or safety question only passes when the agent hands it to a person.",
    alwaysBlocks: false
  };

  function ruleFor(verdict) {
    if (verdict === "pass") return PASS_RULE;
    const rule = RULES[verdict];
    if (!rule) throw new Error("No rule for verdict: " + verdict);
    return rule;
  }

  function plural(n, one, many) {
    return n === 1 ? one : many;
  }

  // Small counts read better as words in a message ("two rules", not "2 rules").
  function countWord(n) {
    const words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
    return n >= 0 && n < words.length ? words[n] : String(n);
  }

  function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function formatNumber(n) {
    return Math.round(n).toLocaleString("en-US");
  }

  // One decimal place, nudged so that 2.45 rounds to 2.5 instead of 2.4.
  function round1(x) {
    return Math.round((x + 1e-9) * 10) / 10;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function allSources(data) {
    const extra = (data.round2 && data.round2.added_sources) || [];
    return data.sources.concat(extra);
  }

  function sourceTitle(data, id) {
    const s = allSources(data).find((x) => x.id === id);
    return s ? s.title : id;
  }

  function formatCitation(data, citation) {
    if (!citation) return "None";
    return sourceTitle(data, citation.source) + ", " + citation.loc;
  }

  function expertRole(data, id) {
    const e = data.experts.find((x) => x.id === id);
    return e ? e.role : id;
  }

  function toSet(resolved) {
    if (resolved instanceof Set) return resolved;
    return new Set(resolved || []);
  }

  function itemFor(data, question) {
    if (!question.item) return null;
    return data.items.find((i) => i.id === question.item) || null;
  }

  // "pass" when the expert accepted it, "resolved" when its open item is marked
  // resolved (counts as passing until the next round reruns it), otherwise the miss.
  function effectiveStatus(data, question, resolved) {
    if (question.verdict === "pass") return "pass";
    const item = itemFor(data, question);
    if (item && toSet(resolved).has(item.id)) return "resolved";
    return question.verdict;
  }

  function countsAsPass(status) {
    return status === "pass" || status === "resolved";
  }

  function summarize(data, resolvedInput) {
    const resolved = toSet(resolvedInput);
    const qs = data.questions;
    const byCause = {};
    CAUSES.forEach((c) => (byCause[c] = 0));
    const openByGroup = {};
    GROUPS.forEach((g) => (openByGroup[g] = 0));
    let passed = 0;
    let openBlocked = 0;
    let resolvedQuestions = 0;
    qs.forEach((q) => {
      if (q.verdict === "pass") {
        passed += 1;
        return;
      }
      byCause[q.verdict] += 1;
      const status = effectiveStatus(data, q, resolved);
      if (status === "resolved") {
        resolvedQuestions += 1;
      } else {
        openBlocked += 1;
        openByGroup[ruleFor(q.verdict).group] += 1;
      }
    });
    const resolvedItems = data.items.filter((i) => resolved.has(i.id)).length;
    return {
      total: qs.length,
      passed,
      blocked: qs.length - passed,
      byCause,
      openBlocked,
      openByGroup,
      resolvedQuestions,
      resolvedItems,
      itemsTotal: data.items.length,
      itemsOpen: data.items.length - resolvedItems
    };
  }

  function needForBar(total, bar) {
    // Smallest whole number of passes that reaches the bar.
    return Math.ceil(total * bar - 1e-9);
  }

  function gates(data, resolvedInput) {
    const resolved = toSet(resolvedInput);
    const bar = data.pass_bar;
    const status = (q) => effectiveStatus(data, q, resolved);

    const ws = data.questions.filter((q) => q.type === "warranty-safety");
    const wsOk = ws.filter((q) => countsAsPass(status(q))).length;

    const openConflicts = data.questions.filter((q) => status(q) === "conflict").length;

    const perExpert = data.experts.map((e) => {
      const mine = data.questions.filter((q) => q.asked_by === e.id);
      const ok = mine.filter((q) => countsAsPass(status(q))).length;
      const need = needForBar(mine.length, bar);
      return { id: e.id, role: e.role, passed: ok, total: mine.length, need, met: ok >= need };
    });

    const open = data.items.filter((i) => !resolved.has(i.id));
    const complete = open.filter((i) => Boolean(RULES[i.cause] && RULES[i.cause].owner) && i.due_day != null);
    const missing = open.filter((i) => !complete.includes(i));

    return [
      {
        id: "warranty-safety",
        label: "Every warranty and safety question passes or is handed to a person",
        met: wsOk === ws.length,
        detail: wsOk + " of " + ws.length + " warranty and safety questions pass or hand off correctly"
      },
      {
        id: "conflicts",
        label: "Zero open part-number conflicts",
        met: openConflicts === 0,
        detail: openConflicts + " open part-number " + plural(openConflicts, "conflict", "conflicts")
      },
      {
        id: "per-expert",
        label: "At least " + Math.round(bar * 100) + "% pass for each expert's own questions (assumed bar)",
        met: perExpert.every((p) => p.met),
        detail: perExpert.map((p) => p.role + " " + p.passed + " of " + p.total).join(", ") +
          " (need " + perExpert[0].need + " of " + perExpert[0].total + " each)",
        perExpert
      },
      {
        id: "owners",
        label: "Every open item has an owner and a due date",
        met: missing.length === 0,
        detail: open.length === 0
          ? "No open items"
          : complete.length + " of " + open.length + " open " + plural(open.length, "item has", "items have") +
            " an owner and a due date" +
            (missing.length ? "; no due date yet for " + missing.map((i) => i.short).join(", ") : ""),
        missing: missing.map((i) => i.id)
      }
    ];
  }

  function manufacturerClause(m, n) {
    if (m === 0) return "none of them need the manufacturer; they're configuration or engineering fixes";
    if (m === n) {
      return n === 1
        ? "it needs a document or a decision from the manufacturer"
        : "all of them need a document or a decision from the manufacturer";
    }
    return m + " of them need a document or a decision from the manufacturer, not a configuration fix";
  }

  function headline(data, resolvedInput) {
    const s = summarize(data, resolvedInput);
    const m = s.openByGroup.Manufacturer;
    if (s.resolvedItems === 0) {
      const first = s.passed + " of " + s.total + " expert questions pass.";
      if (s.blocked === 0) return first + " Nothing blocks launch.";
      return first + " Launch is blocked by " + s.blocked + ", and " + manufacturerClause(m, s.blocked) + ".";
    }
    const first = s.passed + " of " + s.total + " expert questions passed the test round.";
    if (s.openBlocked === 0) {
      return first + " Every open item is marked resolved here; rerun the " + s.resolvedQuestions +
        " affected " + plural(s.resolvedQuestions, "question", "questions") + " before launch.";
    }
    return first + " With " + s.resolvedItems + " " + plural(s.resolvedItems, "item", "items") +
      " marked resolved, " + s.openBlocked + " still " + plural(s.openBlocked, "blocks", "block") +
      " launch, and " + manufacturerClause(m, s.openBlocked) + ".";
  }

  function decorateItem(data, item, resolved) {
    const rule = ruleFor(item.cause);
    return Object.assign({}, item, {
      rule,
      owner: rule.owner,
      group: rule.group,
      action: rule.action,
      resolved: resolved.has(item.id),
      blocksAlways: rule.alwaysBlocks,
      questionTexts: item.questions.map((id) => {
        const q = data.questions.find((x) => x.id === id);
        return { id, text: q ? q.question : "" };
      })
    });
  }

  function groupedItems(data, resolvedInput) {
    const resolved = toSet(resolvedInput);
    return GROUPS.map((group) => {
      const items = data.items
        .map((i) => decorateItem(data, i, resolved))
        .filter((i) => i.group === group);
      const questionCount = items.reduce((n, i) => n + i.questions.length, 0);
      return { group, items, questionCount, openCount: items.filter((i) => !i.resolved).length };
    });
  }

  // One grouped message to the manufacturer's champion, built from what is still open.
  function docsAsk(data, resolvedInput) {
    const resolved = toSet(resolvedInput);
    const s = summarize(data, resolved);
    const open = data.items.filter((i) => !resolved.has(i.id) && ruleFor(i.cause).group === "Manufacturer");
    const docs = open.filter((i) => i.cause === "no_source");
    const conflicts = open.filter((i) => i.cause === "conflict");
    const rules = open.filter((i) => i.cause === "needs_rule");
    const qlist = (ids) => ids.join(", ");

    const lines = ["Hi [champion name],", ""];
    if (open.length === 0) {
      lines.push("Nothing from the test round is waiting on your side right now. We're fixing the rest and will rerun all " +
        s.total + " questions before launch.");
      lines.push("", "Thanks,", "[strategist name]");
      return lines.join("\n");
    }
    lines.push(
      "Thanks to your team for the test round. " + s.openBlocked + " of the " + s.total +
      " questions still need something before launch, and " + s.openByGroup.Manufacturer + " of those need something from your side. " +
      "Here it is in one list, so you don't get a string of separate emails."
    );
    let n = 0;
    if (docs.length) {
      n += 1;
      lines.push("", n + ". " + (docs.length === 1 ? "A missing document" : "Missing documents"));
      docs.forEach((i) => {
        lines.push("   - " + i.ask + " Waiting on it: " + qlist(i.questions) + ".");
      });
    }
    if (conflicts.length) {
      n += 1;
      lines.push("", n + ". Confirm " + countWord(conflicts.length) + " " + plural(conflicts.length, "part number", "part numbers") +
        ". We're holding these answers until you do.");
      conflicts.forEach((i) => {
        const a = i.values[0];
        const b = i.values[1];
        lines.push("   - " + i.part + ": " + sourceTitle(data, a.source) + " (" + a.loc + ") says " + a.value + "; " +
          sourceTitle(data, b.source) + " (" + b.loc + ") says " + b.value + ". Which one is current? (" + qlist(i.questions) + ")");
      });
    }
    if (rules.length) {
      n += 1;
      lines.push("", n + ". " + capitalize(countWord(rules.length)) + " " + plural(rules.length, "rule", "rules") + " from your applications engineer");
      rules.forEach((i) => {
        lines.push("   - " + i.ask + " (" + qlist(i.questions) + ")");
      });
      lines.push("   If it's easier, 15 minutes on a call with them would cover this part.");
    }
    lines.push("", "Thanks,", "[strategist name]");
    return lines.join("\n");
  }

  function filterQuestions(questions, filters) {
    const f = filters || {};
    return questions.filter((q) => {
      if (f.expert && f.expert !== "all" && q.asked_by !== f.expert) return false;
      if (f.type && f.type !== "all" && q.type !== f.type) return false;
      if (f.status === "pass" && q.verdict !== "pass") return false;
      if (f.status === "blocked" && q.verdict === "pass") return false;
      return true;
    });
  }

  // Checks the data against the rules, so a typo can't quietly change a count.
  function validate(data) {
    const problems = [];
    const ids = new Set();
    data.questions.forEach((q) => {
      if (ids.has(q.id)) problems.push("Duplicate question id " + q.id);
      ids.add(q.id);
      if (!data.experts.some((e) => e.id === q.asked_by)) problems.push(q.id + ": unknown expert " + q.asked_by);
      if (!TYPES.includes(q.type)) problems.push(q.id + ": unknown type " + q.type);
      if (q.verdict !== "pass" && !RULES[q.verdict]) problems.push(q.id + ": unknown verdict " + q.verdict);
      if (q.citation && !allSources(data).some((s) => s.id === q.citation.source)) {
        problems.push(q.id + ": cites unknown source " + q.citation.source);
      }
      if (q.verdict === "pass" && q.item) problems.push(q.id + ": a passing question should not have an open item");
      if (q.verdict !== "pass") {
        const item = itemFor(data, q);
        if (!item) problems.push(q.id + ": a miss needs an open item");
        else {
          if (item.cause !== q.verdict) problems.push(q.id + ": verdict " + q.verdict + " but item " + item.id + " is " + item.cause);
          if (!item.questions.includes(q.id)) problems.push(q.id + ": item " + item.id + " does not list it");
        }
      }
    });
    data.items.forEach((i) => {
      if (!RULES[i.cause]) problems.push(i.id + ": unknown cause " + i.cause);
      i.questions.forEach((qid) => {
        const q = data.questions.find((x) => x.id === qid);
        if (!q) problems.push(i.id + ": lists unknown question " + qid);
        else if (q.item !== i.id) problems.push(i.id + ": " + qid + " points to " + q.item);
      });
      if (i.cause === "conflict") {
        if (!i.values || i.values.length !== 2) problems.push(i.id + ": a conflict needs exactly two values");
        else if (i.values[0].value === i.values[1].value) problems.push(i.id + ": conflict values are the same");
        else if (i.values.some((v) => !v.source || !v.loc)) problems.push(i.id + ": every conflict value needs a source and location");
      }
      if (i.cause === "no_source") {
        const missing = data.missing_sources.map((m) => m.title.toLowerCase());
        if (!missing.some((t) => i.title.toLowerCase().includes(t))) problems.push(i.id + ": no_source item must name a missing document");
      }
      if ((i.cause === "no_source" || i.cause === "needs_rule") && !i.ask) problems.push(i.id + ": needs ask text");
    });
    return problems;
  }

  // ---- Rules from round 2, encoded as calculator inputs ----

  function modelById(data, id) {
    const m = data.models.find((x) => x.id === id);
    if (!m) throw new Error("Unknown model " + id);
    return m;
  }

  function theoreticalCoverage(model) {
    // path in feet x speed in feet per hour
    return (model.path_in / 12) * model.speed_mph * 5280;
  }

  function practicalCoverage(model, factor) {
    return Math.round((theoreticalCoverage(model) * factor) / 10) * 10;
  }

  function usableRuntime(model, pressure, derates) {
    const d = derates[pressure];
    if (d == null) throw new Error("Unknown brush pressure " + pressure);
    return round1(model.runtime_h * d);
  }

  function shiftPlan(model, shiftHours, pressure, rules) {
    const runtime = usableRuntime(model, pressure, rules.runtime_derate);
    const perHour = practicalCoverage(model, rules.coverage_factor);
    const coversShift = runtime >= shiftHours;
    const cleanHours = Math.min(runtime, shiftHours);
    return {
      perHour,
      theoretical: Math.round(theoreticalCoverage(model) / 10) * 10,
      runtime,
      coversShift,
      perCharge: Math.round((perHour * runtime) / 10) * 10,
      perShiftOneCharge: Math.round((perHour * cleanHours) / 10) * 10,
      sentence: coversShift
        ? "One charge covers the " + shiftHours + "-hour shift (about " + runtime.toFixed(1) + " usable hours)."
        : "One charge gives about " + runtime.toFixed(1) + " usable hours, short of the " + shiftHours +
          "-hour shift, so it needs a battery swap or a charge break."
    };
  }

  // ---- Round 2 ----

  function applyRound2(data) {
    const r2 = data.round2;
    const questions = data.questions.map((q) => {
      const change = r2.questions[q.id];
      if (!change) return Object.assign({}, q);
      const next = Object.assign({}, q, {
        verdict: change.verdict,
        answer: change.answer || q.answer,
        citation: change.citation !== undefined ? change.citation : q.citation,
        note: change.note || q.note
      });
      if (next.verdict === "pass") next.item = null;
      return next;
    });
    const stillOpen = new Set(questions.filter((q) => q.item).map((q) => q.item));
    const items = data.items
      .filter((i) => stillOpen.has(i.id))
      .map((i) => Object.assign({}, i, r2.items[i.id] || {}));
    return Object.assign({}, data, {
      round_label: r2.label,
      sources: data.sources.concat(r2.added_sources),
      missing_sources: data.missing_sources.filter((m) => !r2.added_sources.some((a) => a.id === m.id)),
      questions,
      items
    });
  }

  function compareRounds(data) {
    const after = applyRound2(data);
    return data.questions.map((q) => {
      const q2 = after.questions.find((x) => x.id === q.id);
      const change = data.round2.questions[q.id];
      return {
        id: q.id,
        question: q.question,
        asked_by: q.asked_by,
        round1: q.verdict,
        round2: q2.verdict,
        changed: q.verdict !== q2.verdict,
        missedInRound1: q.verdict !== "pass",
        what: change ? change.change : "No change. Passed in both rounds."
      };
    });
  }

  function round2Headline(data) {
    const after = applyRound2(data);
    const s = summarize(after);
    const first = s.passed + " of " + s.total + " expert questions pass after round 2.";
    if (after.items.length === 0) return first + " Nothing blocks launch.";
    const names = after.items.map((i) => i.short);
    const list = names.length === 1 ? names[0] : names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
    return first + " Launch is still blocked by " + s.openBlocked + ": " + list + ".";
  }

  // A dealer-facing sheet built only from questions that passed.
  function launchSheet(dataAfter, perType) {
    const limit = perType || 2;
    const passing = dataAfter.questions.filter((q) => q.verdict === "pass");
    const examples = TYPES.filter((t) => t !== "warranty-safety").map((t) => ({
      type: t,
      label: TYPE_LABELS[t],
      questions: passing.filter((q) => q.type === t).slice(0, limit).map((q) => q.question)
    })).filter((g) => g.questions.length > 0);
    const handoffExamples = passing.filter((q) => q.type === "warranty-safety").map((q) => q.question);
    const open = dataAfter.items.map((i) => i.short);
    return {
      examples,
      handoff: [
        "Warranty coverage and claims. It won't say whether something is covered.",
        "Safety questions, like ramps, servicing or anything with a warning in the manual.",
        "Anything it can't find in the manufacturer's documents. It says so instead of guessing."
      ],
      handoffExamples,
      report: [
        "Copy the question you asked and the answer you got.",
        "Note the document and page it cited.",
        "Send both to your dealer support lead the same day.",
        "The answer is checked against the source, fixed, and your question joins the test set that runs before every update."
      ],
      status: open.length === 0
        ? "Ready to hand out: all four go-live gates are met."
        : "Draft. Hand this out once all four go-live gates are met. Still open: " + open.join(" and ") + "."
    };
  }

  const api = {
    CAUSES, GROUPS, TYPES, RULES, PASS_RULE, VERDICT_LABELS, TYPE_LABELS,
    ruleFor, plural, countWord, formatNumber, round1, escapeHtml,
    sourceTitle, formatCitation, expertRole, effectiveStatus, countsAsPass,
    summarize, gates, headline, groupedItems, docsAsk, filterQuestions, validate,
    modelById, theoreticalCoverage, practicalCoverage, usableRuntime, shiftPlan,
    applyRound2, compareRounds, round2Headline, launchSheet
  };

  globalThis.ExpertRound = api;
})();
