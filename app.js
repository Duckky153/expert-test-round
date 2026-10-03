/* Expert Test Round: page code for both pages. All rules and math live in logic.mjs. */
(function () {
  "use strict";

  const R = globalThis.ExpertRound;
  const DATA = globalThis.EXPERT_ROUND_DATA;
  const STORE_KEY = "expert-test-round:resolved:v1";

  // ---------- small DOM helpers ----------

  function h(tag, attrs) {
    const el = document.createElement(tag);
    const props = attrs || {};
    Object.keys(props).forEach((k) => {
      const v = props[k];
      if (v == null || v === false) return;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    });
    for (let i = 2; i < arguments.length; i += 1) {
      const kid = arguments[i];
      if (kid == null || kid === false) continue;
      if (Array.isArray(kid)) kid.forEach((k) => k != null && el.appendChild(typeof k === "string" ? document.createTextNode(k) : k));
      else el.appendChild(typeof kid === "string" ? document.createTextNode(kid) : kid);
    }
    return el;
  }

  function $(id) {
    return document.getElementById(id);
  }

  function clear(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
    return el;
  }

  function verdictClass(verdict) {
    if (verdict === "pass") return "v-pass";
    if (verdict === "resolved") return "v-resolved";
    if (verdict === "should_escalate") return "v-escalate";
    const rule = R.RULES[verdict];
    return rule ? "v-" + rule.group.toLowerCase() : "";
  }

  function chip(verdict, label) {
    const text = label || (verdict === "resolved" ? "Resolved here" : R.VERDICT_LABELS[verdict]);
    return h("span", { class: "chip " + verdictClass(verdict), text });
  }

  function gateMark(met) {
    return h("span", { class: "gate-mark " + (met ? "met" : "not-met"), text: met ? "Met" : "Not met" });
  }

  // Copies each column heading onto its cells, so narrow screens can show the
  // table as stacked cards with a label above each value.
  function labelCells(table) {
    const heads = Array.from(table.querySelectorAll("thead th")).map((th) => th.textContent.trim());
    table.querySelectorAll("tbody tr").forEach((tr) => {
      Array.from(tr.children).forEach((td, i) => {
        if (i > 0 && heads[i]) td.setAttribute("data-label", heads[i]);
      });
    });
  }

  function fitTextarea(area) {
    area.style.height = "auto";
    area.style.height = area.scrollHeight + 2 + "px";
  }

  function dueText(day) {
    return day == null ? "No due date yet" : "Due day " + day;
  }

  // ---------- storage (optional; the page works without it) ----------

  function loadResolved() {
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const valid = new Set(DATA.items.map((i) => i.id));
      return new Set(Array.isArray(list) ? list.filter((id) => valid.has(id)) : []);
    } catch (e) {
      return new Set();
    }
  }

  function saveResolved(set) {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(Array.from(set)));
    } catch (e) {
      /* storage unavailable; marks last for this visit only */
    }
  }

  // ---------- round 1 page ----------

  function initRound1() {
    const resolved = loadResolved();
    const filters = { expert: "all", type: "all", status: "all" };

    function renderHeadline() {
      $("headline").textContent = R.headline(DATA, resolved);
    }

    function renderSummary() {
      const s = R.summarize(DATA, resolved);
      const box = clear($("summary"));
      box.appendChild(h("div", { class: "stat stat-pass" },
        h("span", { class: "stat-num", text: s.passed + " / " + s.total }),
        h("span", { class: "stat-label", text: "passed the round" })));
      box.appendChild(h("div", { class: "stat stat-block" },
        h("span", { class: "stat-num", text: String(s.openBlocked) }),
        h("span", { class: "stat-label", text: s.resolvedQuestions ? "still blocking (" + s.resolvedQuestions + " marked resolved)" : "blocking launch" })));
      const causes = h("div", { class: "stat stat-causes" }, h("span", { class: "stat-label", text: "Round 1 misses by cause" }));
      const list = h("ul", { class: "cause-list" });
      R.CAUSES.forEach((c) => {
        list.appendChild(h("li", null, chip(c), h("span", { class: "cause-n", text: String(s.byCause[c]) })));
      });
      causes.appendChild(list);
      box.appendChild(causes);
      const groups = h("div", { class: "stat stat-groups" }, h("span", { class: "stat-label", text: "Still open, by who fixes it" }));
      const glist = h("ul", { class: "group-list" });
      R.GROUPS.forEach((g) => {
        glist.appendChild(h("li", null, h("span", { class: "dot dot-" + g.toLowerCase() }), g, h("strong", { text: String(s.openByGroup[g]) })));
      });
      groups.appendChild(glist);
      box.appendChild(groups);
    }

    function renderGates() {
      const list = clear($("gates"));
      R.gates(DATA, resolved).forEach((g) => {
        list.appendChild(h("li", { class: "gate " + (g.met ? "is-met" : "is-not-met") },
          h("div", { class: "gate-top" }, h("span", { class: "gate-label", text: g.label }), gateMark(g.met)),
          h("p", { class: "gate-detail", text: g.detail })));
      });
    }

    function renderItems() {
      const box = clear($("items"));
      R.groupedItems(DATA, resolved).forEach((group) => {
        const col = h("div", { class: "owner-col" },
          h("h3", { class: "owner-h" },
            h("span", { class: "dot dot-" + group.group.toLowerCase() }),
            group.group,
            h("span", { class: "owner-count muted small", text: group.openCount + " open of " + group.items.length })));
        group.items.forEach((item) => {
          const id = "resolve-" + item.id;
          const card = h("div", { class: "item" + (item.resolved ? " is-resolved" : "") },
            h("div", { class: "item-top" }, chip(item.cause), item.blocksAlways ? h("span", { class: "tag-block", text: "Always blocks launch" }) : null),
            h("p", { class: "item-title", text: item.title }),
            h("p", { class: "item-detail", text: item.detail }),
            item.fix ? h("p", { class: "item-fix" }, h("strong", { text: "Fix: " }), item.fix) : null,
            h("p", { class: "item-meta" },
              h("span", null, h("strong", { text: item.action }), " · " + item.owner),
              h("span", { class: item.due_day == null ? "warn" : "", text: dueText(item.due_day) })),
            h("p", { class: "item-qs muted small", text: "Blocks " + item.questions.join(", ") }),
            h("label", { class: "toggle", for: id },
              h("input", {
                type: "checkbox", id, checked: item.resolved,
                onchange: (e) => {
                  if (e.target.checked) resolved.add(item.id);
                  else resolved.delete(item.id);
                  saveResolved(resolved);
                  renderLive();
                }
              }),
              h("span", { text: "Mark resolved" })));
          col.appendChild(card);
        });
        box.appendChild(col);
      });
    }

    function renderAsk() {
      const area = $("docs-ask");
      area.value = R.docsAsk(DATA, resolved);
      fitTextarea(area);
    }

    function renderRows() {
      const body = clear($("q-body"));
      const rows = R.filterQuestions(DATA.questions, filters);
      $("f-count").textContent = "Showing " + rows.length + " of " + DATA.questions.length;
      rows.forEach((q) => {
        const status = R.effectiveStatus(DATA, q, resolved);
        const rule = R.ruleFor(q.verdict);
        const detailId = "d-" + q.id;
        const detail = h("tr", { class: "q-detail", id: detailId, hidden: true },
          h("td", { colspan: "5" },
            h("dl", { class: "detail" },
              h("dt", { text: "Draft answer" }), h("dd", { text: q.answer }),
              h("dt", { text: "Citation" }), h("dd", { text: R.formatCitation(DATA, q.citation) }),
              h("dt", { text: "Expert note" }), h("dd", { text: q.note }),
              h("dt", { text: "Rule applied" }),
              h("dd", null, q.verdict === "pass"
                ? rule.rule
                : R.VERDICT_LABELS[q.verdict] + ": " + rule.rule + " Owner: " + rule.owner + "." +
                  (status === "resolved" ? " Marked resolved here; rerun pending." : "")))));
        const toggle = () => {
          const open = detail.hidden;
          detail.hidden = !open;
          row.setAttribute("aria-expanded", String(open));
          row.classList.toggle("is-open", open);
        };
        const row = h("tr", {
          class: "q-row", tabindex: "0", "aria-expanded": "false", "aria-controls": detailId,
          onclick: toggle,
          onkeydown: (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggle();
            }
          }
        },
          h("td", { class: "mono", text: q.id }),
          h("td", { text: R.expertRole(DATA, q.asked_by) }),
          h("td", { text: R.TYPE_LABELS[q.type] }),
          h("td", { class: "q-text", text: q.question }),
          h("td", null, chip(status)));
        body.appendChild(row);
        body.appendChild(detail);
      });
    }

    function renderRules() {
      const body = clear($("rules-body"));
      R.CAUSES.forEach((c) => {
        const r = R.RULES[c];
        body.appendChild(h("tr", null,
          h("td", null, chip(c)),
          h("td", { text: r.when }),
          h("td", null, h("strong", { text: r.action + ". " }), r.rule),
          h("td", { text: r.owner })));
      });
      labelCells(body.closest("table"));
    }

    function renderSources() {
      const list = clear($("sources"));
      DATA.sources.forEach((s) => {
        list.appendChild(h("li", null, h("strong", { text: s.title }), h("span", { class: "muted", text: s.kind + ", " + s.size })));
      });
      DATA.missing_sources.forEach((s) => {
        list.appendChild(h("li", { class: "missing" },
          h("strong", { text: s.title }),
          h("span", { class: "chip v-manufacturer", text: "Never supplied" }),
          h("span", { class: "muted", text: " Referenced in " + s.referenced_in })));
      });
    }

    function fillFilters() {
      const ex = $("f-expert");
      DATA.experts.forEach((e) => ex.appendChild(h("option", { value: e.id, text: e.role })));
      const ty = $("f-type");
      R.TYPES.forEach((t) => ty.appendChild(h("option", { value: t, text: R.TYPE_LABELS[t] })));
      [["f-expert", "expert"], ["f-type", "type"], ["f-status", "status"]].forEach(([id, key]) => {
        $(id).addEventListener("change", (e) => {
          filters[key] = e.target.value;
          renderRows();
        });
      });
    }

    function renderLive() {
      renderHeadline();
      renderSummary();
      renderGates();
      renderItems();
      renderAsk();
      renderRows();
    }

    $("copy-ask").addEventListener("click", () => {
      const area = $("docs-ask");
      const status = $("copy-status");
      const fallback = () => {
        area.focus();
        area.select();
        status.textContent = "Selected. Press Ctrl+C or Cmd+C to copy.";
      };
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(area.value).then(() => {
            status.textContent = "Copied.";
          }, fallback);
        } else {
          fallback();
        }
      } catch (e) {
        fallback();
      }
    });

    $("clear-marks").addEventListener("click", () => {
      resolved.clear();
      saveResolved(resolved);
      renderLive();
    });

    window.addEventListener("resize", () => fitTextarea($("docs-ask")));

    fillFilters();
    renderRules();
    renderSources();
    renderLive();
  }

  // ---------- round 2 page ----------

  function initRound2() {
    const after = R.applyRound2(DATA);
    const r2 = DATA.round2;
    const rules = r2.reply.rules;

    $("headline").textContent = R.round2Headline(DATA);

    $("reply-charger").textContent = r2.reply.charger;
    const parts = clear($("reply-parts"));
    r2.reply.part_numbers.forEach((p) => {
      const item = DATA.items.find((i) => i.id === p.item);
      const wrong = item.values.find((v) => v.value !== p.confirmed);
      parts.appendChild(h("li", null,
        h("strong", { text: item.part + ": " }),
        h("span", { class: "mono ok", text: p.confirmed }),
        " is current (" + R.sourceTitle(DATA, p.right_source) + "), not ",
        h("span", { class: "mono strike", text: wrong.value }),
        ". " + p.note));
    });
    $("rule-coverage").textContent = rules.coverage_text;
    $("rule-runtime").textContent = rules.runtime_text;

    const fixes = clear($("strategist-fixes"));
    r2.strategist_fixes.forEach((f) => {
      const item = DATA.items.find((i) => i.id === f.item);
      fixes.appendChild(h("li", null, h("strong", { text: item.title + ". " }), f.text));
    });

    const open = clear($("still-open"));
    after.items.forEach((i) => {
      const rule = R.ruleFor(i.cause);
      open.appendChild(h("li", null,
        chip(i.cause), " ",
        h("strong", { text: i.title + ". " }),
        i.status_note + " ",
        h("span", { class: "muted", text: rule.owner + ", " + dueText(i.due_day).toLowerCase() + "." }),
        rule.alwaysBlocks ? h("span", { class: "tag-block", text: "Always blocks launch" }) : null));
    });

    const g1 = R.gates(DATA, []);
    const g2 = R.gates(after, []);
    const gbody = clear($("gates-body"));
    g1.forEach((g, i) => {
      gbody.appendChild(h("tr", null,
        h("td", { text: g.label }),
        h("td", null, gateMark(g.met), h("span", { class: "muted small block", text: g.detail })),
        h("td", null, gateMark(g2[i].met), h("span", { class: "muted small block", text: g2[i].detail }))));
    });
    labelCells(gbody.closest("table"));

    const rows = R.compareRounds(DATA);
    let showAll = false;
    function renderCompare() {
      const body = clear($("ba-body"));
      const shown = showAll ? rows : rows.filter((r) => r.missedInRound1);
      shown.forEach((r) => {
        body.appendChild(h("tr", { class: r.changed ? "is-changed" : "" },
          h("td", { class: "q-text" }, h("span", { class: "mono", text: r.id + " " }), r.question),
          h("td", null, chip(r.round1)),
          h("td", null, chip(r.round2)),
          h("td", { text: r.what })));
      });
      labelCells(body.closest("table"));
      $("ba-count").textContent = "Showing " + shown.length + " of " + rows.length + " questions. " +
        rows.filter((r) => r.changed).length + " changed verdicts; " +
        rows.filter((r) => r.missedInRound1 && !r.changed).length + " still open.";
      $("show-all").setAttribute("aria-pressed", String(showAll));
      $("show-misses").setAttribute("aria-pressed", String(!showAll));
    }
    $("show-all").addEventListener("click", () => { showAll = true; renderCompare(); });
    $("show-misses").addEventListener("click", () => { showAll = false; renderCompare(); });
    renderCompare();

    const modelSel = $("c-model");
    DATA.models.forEach((m) => modelSel.appendChild(h("option", { value: m.id, text: m.name })));
    modelSel.value = "RO-32";
    function renderCalc() {
      const model = R.modelById(DATA, modelSel.value);
      let shift = parseFloat($("c-shift").value);
      if (!isFinite(shift) || shift <= 0) shift = 8;
      const plan = R.shiftPlan(model, shift, $("c-pressure").value, rules);
      const out = clear($("c-out"));
      const pair = (k, v) => [h("div", { class: "calc-pair" }, h("dt", { text: k }), h("dd", { text: v }))];
      [
        pair("Theoretical coverage", R.formatNumber(plan.theoretical) + " sq ft per hour"),
        pair("Practical coverage (x " + rules.coverage_factor + ")", R.formatNumber(plan.perHour) + " sq ft per hour"),
        pair("Rated runtime", model.runtime_h.toFixed(1) + " hours"),
        pair("Usable runtime", plan.runtime.toFixed(1) + " hours"),
        pair("Area per charge", R.formatNumber(plan.perCharge) + " sq ft")
      ].forEach((p) => p.forEach((n) => out.appendChild(n)));
      const sentence = $("c-sentence");
      sentence.textContent = plan.sentence;
      sentence.className = "calc-sentence " + (plan.coversShift ? "ok" : "warn");
    }
    ["c-model", "c-pressure"].forEach((id) => $(id).addEventListener("change", renderCalc));
    $("c-shift").addEventListener("input", renderCalc);
    renderCalc();

    const sheet = R.launchSheet(after);
    $("sheet-status").textContent = sheet.status;
    $("sheet-status").classList.toggle("draft", after.items.length > 0);
    const ex = clear($("sheet-examples"));
    sheet.examples.forEach((g) => {
      ex.appendChild(h("div", { class: "sheet-group" },
        h("h4", { text: g.label }),
        h("ul", null, g.questions.map((q) => h("li", { text: q })))));
    });
    const ho = clear($("sheet-handoff"));
    sheet.handoff.forEach((t) => ho.appendChild(h("li", { text: t })));
    $("sheet-handoff-ex").textContent = sheet.handoffExamples.map((q) => "“" + q + "”").join(" ");
    const rep = clear($("sheet-report"));
    sheet.report.forEach((t) => rep.appendChild(h("li", { text: t })));
  }

  const page = document.body.getAttribute("data-page");
  if (page === "round-1") initRound1();
  else if (page === "round-2") initRound2();
})();
