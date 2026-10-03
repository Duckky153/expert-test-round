/*
  Expert Test Round: synthetic data.
  Everything here is invented: the manufacturer, its models, part numbers, prices,
  documents, the experts' questions, the agent's draft answers and the experts' notes.
  The file only assigns plain data to one global, so it loads as a normal script in the
  browser (including from disk) and can be imported by the Node tests.
*/
globalThis.EXPERT_ROUND_DATA = {
  "manufacturer": "Sample Floorcare Co.",
  "round_label": "Test round 1",
  "pass_bar": 0.9,
  "models": [
    { "id": "WB-20", "name": "WB-20 walk-behind", "kind": "walk-behind", "path_in": 20, "speed_mph": 2.5, "runtime_h": 2.5, "solution_gal": 10, "battery_v": 24 },
    { "id": "WB-26", "name": "WB-26 walk-behind", "kind": "walk-behind", "path_in": 26, "speed_mph": 2.5, "runtime_h": 3.0, "solution_gal": 15, "battery_v": 24 },
    { "id": "RO-32", "name": "RO-32 ride-on", "kind": "ride-on", "path_in": 32, "speed_mph": 4.0, "runtime_h": 3.5, "solution_gal": 30, "battery_v": 36 },
    { "id": "RO-40", "name": "RO-40 ride-on", "kind": "ride-on", "path_in": 40, "speed_mph": 4.5, "runtime_h": 4.0, "solution_gal": 40, "battery_v": 48 }
  ],
  "sources": [
    { "id": "catalog", "title": "Product catalog 2026", "kind": "PDF", "size": "48 pp" },
    { "id": "parts2023", "title": "Parts list, 2023 edition", "kind": "PDF", "size": "22 pp" },
    { "id": "price2026", "title": "Dealer price book 2026", "kind": "Spreadsheet", "size": "1 workbook" },
    { "id": "manual-wb26", "title": "Operator manual, WB-26 walk-behind", "kind": "PDF", "size": "36 pp" }
  ],
  "missing_sources": [
    { "id": "charger", "title": "Battery charger manual", "referenced_in": "Operator manual, WB-26 walk-behind, p. 8" }
  ],
  "experts": [
    { "id": "AE", "role": "Applications engineer" },
    { "id": "SM", "role": "Service manager" },
    { "id": "DS", "role": "Dealer support lead" }
  ],
  "questions": [
    {
      "id": "Q01", "asked_by": "AE", "type": "selection",
      "question": "A customer cleans about 12,000 sq ft of grocery aisles with tight end caps. Walk-behind or ride-on?",
      "answer": "A walk-behind. The selection guide recommends the WB-20 or WB-26 for congested areas under 20,000 sq ft and the ride-ons for open areas.",
      "citation": { "source": "catalog", "loc": "p. 6" },
      "verdict": "pass", "note": "Matches how we'd answer it.", "item": null
    },
    {
      "id": "Q02", "asked_by": "AE", "type": "selection",
      "question": "Which model has the largest solution tank?",
      "answer": "The RO-40, with a 40-gallon solution tank.",
      "citation": { "source": "catalog", "loc": "p. 34" },
      "verdict": "pass", "note": "Correct.", "item": null
    },
    {
      "id": "Q03", "asked_by": "AE", "type": "compatibility",
      "question": "Does the WB-26 take a pad driver, or only brushes?",
      "answer": "Both. The WB-26 options list a 26-inch disc brush and a 26-inch pad driver.",
      "citation": { "source": "catalog", "loc": "p. 18" },
      "verdict": "pass", "note": "Correct, and it named the right page.", "item": null
    },
    {
      "id": "Q04", "asked_by": "AE", "type": "sizing",
      "question": "How many square feet per hour can a WB-26 clean?",
      "answer": "About 28,600 sq ft per hour, from the 26-inch cleaning path and the 2.5 mph speed in the catalog.",
      "citation": { "source": "catalog", "loc": "p. 17" },
      "verdict": "needs_rule",
      "note": "That's the theoretical maximum. Nobody cleans at that rate once you count turns, overlap and emptying tanks. We size with a practical factor, and the agent needs our rule.",
      "item": "I4"
    },
    {
      "id": "Q05", "asked_by": "AE", "type": "sizing",
      "question": "Will one charge cover an 8-hour shift on the RO-32?",
      "answer": "No. The catalog rates the RO-32 at up to 3.5 hours per charge.",
      "citation": { "source": "catalog", "loc": "p. 28" },
      "verdict": "needs_rule",
      "note": "Right direction, but rated runtime isn't what a customer gets; it drops with brush pressure. They'll ask how many hours they really get and what to do for the rest of the shift. We have a rule of thumb for that.",
      "item": "I5"
    },
    {
      "id": "Q06", "asked_by": "AE", "type": "selection",
      "question": "How wide is the squeegee on the RO-40?",
      "answer": "42 inches.",
      "citation": { "source": "catalog", "loc": "p. 28" },
      "verdict": "wrong",
      "note": "That's the RO-32 spec page. The RO-40's squeegee is 50 inches, on page 34.",
      "item": "I6"
    },
    {
      "id": "Q07", "asked_by": "AE", "type": "selection",
      "question": "How wide is the RO-32? The customer has 36-inch doorways.",
      "answer": "34 inches without the squeegee and 42 inches with it. The catalog says the squeegee comes off without tools for doorways and transport.",
      "citation": { "source": "catalog", "loc": "p. 28" },
      "verdict": "pass", "note": "Good. It gave both widths.", "item": null
    },
    {
      "id": "Q08", "asked_by": "AE", "type": "compatibility",
      "question": "Can a customer move a battery pack from an RO-32 to an RO-40?",
      "answer": "No. The RO-32 uses a 36-volt pack and the RO-40 a 48-volt pack.",
      "citation": { "source": "catalog", "loc": "p. 42" },
      "verdict": "pass", "note": "Correct.", "item": null
    },
    {
      "id": "Q09", "asked_by": "AE", "type": "sizing",
      "question": "What aisle width does the RO-40 need to make a U-turn?",
      "answer": "The catalog lists a 74-inch minimum aisle for a U-turn on the RO-40.",
      "citation": { "source": "catalog", "loc": "p. 34" },
      "verdict": "pass", "note": "Correct.", "item": null
    },
    {
      "id": "Q10", "asked_by": "AE", "type": "selection",
      "question": "Which models offer onboard chemical dosing?",
      "answer": "The RO-32 and RO-40, as an option. The walk-behinds don't offer it.",
      "citation": { "source": "catalog", "loc": "p. 5" },
      "verdict": "pass", "note": "Correct.", "item": null
    },
    {
      "id": "Q11", "asked_by": "SM", "type": "parts",
      "question": "What's the part number for the rear squeegee assembly on the WB-26?",
      "answer": "56-3310.",
      "citation": { "source": "parts2023", "loc": "p. 9" },
      "verdict": "conflict",
      "note": "The 2026 price book lists 56-3318 for the same assembly. One of them is outdated, and a wrong number means a wrong order. Hold this until we confirm.",
      "item": "I2"
    },
    {
      "id": "Q12", "asked_by": "SM", "type": "parts",
      "question": "Which pad driver fits the RO-40?",
      "answer": "Part 71-2040, a 20-inch pad driver with the ride-on hub. The RO-40 takes two.",
      "citation": { "source": "parts2023", "loc": "p. 14" },
      "verdict": "conflict",
      "note": "The price book has 71-2046 for it. Don't pick one; ask us which is current.",
      "item": "I3"
    },
    {
      "id": "Q13", "asked_by": "SM", "type": "troubleshooting",
      "question": "The WB-26 charger shows a flashing amber light and won't finish a cycle. What does that mean?",
      "answer": "I can't find charger light codes in the documents I have. The operator manual (p. 8) points to a separate charger manual, which I don't have.",
      "citation": null,
      "verdict": "no_source", "note": "Right not to guess. We need the charger manual loaded.", "item": "I1"
    },
    {
      "id": "Q14", "asked_by": "SM", "type": "compatibility",
      "question": "If a customer switches a WB-26 to the AGM battery option, does the onboard charger need a setting change?",
      "answer": "The operator manual says to set the charger for the battery type, but the steps are in the charger manual, which I don't have.",
      "citation": null,
      "verdict": "no_source", "note": "Same gap, and this one matters: the wrong setting can damage AGM batteries.", "item": "I1"
    },
    {
      "id": "Q15", "asked_by": "SM", "type": "troubleshooting",
      "question": "Where are the steps for replacing the WB-26's rear squeegee blade?",
      "answer": "Release the two tension knobs, slide the blade out, and flip it to a fresh edge or replace it. The steps are in the operator manual.",
      "citation": { "source": "manual-wb26", "loc": "p. 19" },
      "verdict": "engineering",
      "note": "The steps are right, but they're on printed page 18. A tech who opens page 19 lands on the wrong section.",
      "item": "I8"
    },
    {
      "id": "Q16", "asked_by": "SM", "type": "troubleshooting",
      "question": "A WB-26 leaves streaks behind the squeegee. What should a tech check first?",
      "answer": "Check the rear blade for nicks or wear and flip or replace it, then check the vacuum hose for a clog.",
      "citation": { "source": "manual-wb26", "loc": "p. 14" },
      "verdict": "pass", "note": "Right order.", "item": null
    },
    {
      "id": "Q17", "asked_by": "SM", "type": "parts",
      "question": "What's the part number for the standard 26-inch scrub brush?",
      "answer": "56-1260. The 2026 price book and the 2023 parts list agree.",
      "citation": { "source": "price2026", "loc": "row 88" },
      "verdict": "pass", "note": "Correct, and good that it checked both.", "item": null
    },
    {
      "id": "Q18", "asked_by": "SM", "type": "troubleshooting",
      "question": "The WB-26 won't put down solution. What's the first check?",
      "answer": "Make sure the solution tank isn't empty, then check the solution control knob and the filter under the tank.",
      "citation": { "source": "manual-wb26", "loc": "p. 13" },
      "verdict": "pass", "note": "That's our order too.", "item": null
    },
    {
      "id": "Q19", "asked_by": "SM", "type": "parts",
      "question": "How often should the recovery tank's float filter be cleaned on the WB-26?",
      "answer": "After every use. The daily maintenance list says to rinse it before the machine is stored.",
      "citation": { "source": "manual-wb26", "loc": "p. 16" },
      "verdict": "pass", "note": "Correct.", "item": null
    },
    {
      "id": "Q20", "asked_by": "SM", "type": "warranty-safety",
      "question": "Can a tech service the WB-26 brush deck with the batteries connected?",
      "answer": "No. The safety warnings say to turn the key off and disconnect the batteries before any service. I've passed this to a person on the service team in case the repair needs more than that.",
      "citation": { "source": "manual-wb26", "loc": "p. 4" },
      "verdict": "pass", "note": "Right warning, right page, and it handed off.", "item": null
    },
    {
      "id": "Q21", "asked_by": "DS", "type": "selection",
      "question": "How long does a full charge take on the RO-32?",
      "answer": "Charge times are in the charger manual, which I don't have.",
      "citation": null,
      "verdict": "no_source", "note": "Dealers get asked this on every demo. Needs the charger manual.", "item": "I1"
    },
    {
      "id": "Q22", "asked_by": "DS", "type": "warranty-safety",
      "question": "A customer's WB-20 brush motor failed at 14 months. Is that covered?",
      "answer": "Yes. Brush motors are covered for 2 years under the standard warranty.",
      "citation": { "source": "catalog", "loc": "p. 46" },
      "verdict": "should_escalate",
      "note": "It shouldn't decide coverage. The catalog's warranty summary isn't the full policy, and claims depend on hours and use. This goes to our warranty desk.",
      "item": "I7"
    },
    {
      "id": "Q23", "asked_by": "DS", "type": "warranty-safety",
      "question": "Does the warranty transfer if a dealer sells a demo unit?",
      "answer": "I can't confirm warranty terms for a resale. I've passed this to a person on the warranty team.",
      "citation": null,
      "verdict": "pass", "note": "Exactly what we want.", "item": null
    },
    {
      "id": "Q24", "asked_by": "DS", "type": "warranty-safety",
      "question": "What's the steepest ramp the RO-40 can scrub on?",
      "answer": "The catalog lists a 10% maximum grade for scrubbing. Ramp use is a safety question, so I've also passed it to a person to confirm for this site.",
      "citation": { "source": "catalog", "loc": "p. 34" },
      "verdict": "pass", "note": "Good. It gave the spec and handed off.", "item": null
    },
    {
      "id": "Q25", "asked_by": "DS", "type": "selection",
      "question": "For a demo, what's the difference between the WB-20 and the WB-26?",
      "answer": "The WB-26 has a 26-inch path and a 15-gallon solution tank. The WB-20 has a 20-inch path and a 10-gallon tank.",
      "citation": { "source": "catalog", "loc": "p. 4" },
      "verdict": "pass", "note": "Correct.", "item": null
    },
    {
      "id": "Q26", "asked_by": "DS", "type": "parts",
      "question": "What's the dealer net price for the WB-20's pad driver?",
      "answer": "$64.00 for item 56-1205, the 20-inch pad driver for the WB-20.",
      "citation": { "source": "price2026", "loc": "row 41" },
      "verdict": "pass", "note": "Correct.", "item": null
    },
    {
      "id": "Q27", "asked_by": "DS", "type": "compatibility",
      "question": "Will a WB-20 brush fit a WB-26?",
      "answer": "No. The WB-20 takes a 20-inch brush and the WB-26 a 26-inch brush, with separate part numbers.",
      "citation": { "source": "parts2023", "loc": "p. 6" },
      "verdict": "pass", "note": "Correct.", "item": null
    },
    {
      "id": "Q28", "asked_by": "DS", "type": "selection",
      "question": "Which models come with an onboard charger?",
      "answer": "The walk-behinds have an onboard charger as standard. The ride-ons use an off-board charger.",
      "citation": { "source": "catalog", "loc": "p. 42" },
      "verdict": "pass", "note": "Correct.", "item": null
    },
    {
      "id": "Q29", "asked_by": "DS", "type": "parts",
      "question": "Which batteries come standard on the WB-26?",
      "answer": "Two 12-volt wet batteries for a 24-volt system. AGM batteries are an option.",
      "citation": { "source": "catalog", "loc": "p. 17" },
      "verdict": "pass", "note": "Correct.", "item": null
    },
    {
      "id": "Q30", "asked_by": "DS", "type": "selection",
      "question": "Which model should a dealer show a school with carpeted hallways?",
      "answer": "None of these. The catalog lists all four models for hard floors only.",
      "citation": { "source": "catalog", "loc": "p. 6" },
      "verdict": "pass", "note": "Right. Better than forcing a match.", "item": null
    }
  ],
  "items": [
    {
      "id": "I1", "cause": "no_source", "short": "the missing charger manual",
      "title": "Battery charger manual is missing",
      "detail": "The WB-26 operator manual (p. 8) points to a separate battery charger manual. It was never supplied, so three questions have no source.",
      "ask": "Battery charger manual. Your WB-26 operator manual (p. 8) points to it, but we never received it.",
      "questions": ["Q13", "Q14", "Q21"], "due_day": 3
    },
    {
      "id": "I2", "cause": "conflict", "short": "the WB-26 squeegee part number",
      "title": "WB-26 rear squeegee assembly has two part numbers",
      "detail": "The 2023 parts list and the 2026 price book disagree. The answer is held until the manufacturer says which is current.",
      "part": "WB-26 rear squeegee assembly",
      "values": [
        { "value": "56-3310", "source": "parts2023", "loc": "p. 9" },
        { "value": "56-3318", "source": "price2026", "loc": "row 214" }
      ],
      "questions": ["Q11"], "due_day": 2
    },
    {
      "id": "I3", "cause": "conflict", "short": "the RO-40 pad driver part number",
      "title": "RO-40 pad driver has two part numbers",
      "detail": "The 2023 parts list and the 2026 price book disagree. The answer is held until the manufacturer says which is current.",
      "part": "RO-40 pad driver",
      "values": [
        { "value": "71-2040", "source": "parts2023", "loc": "p. 14" },
        { "value": "71-2046", "source": "price2026", "loc": "row 301" }
      ],
      "questions": ["Q12"], "due_day": 2
    },
    {
      "id": "I4", "cause": "needs_rule", "short": "the coverage rule",
      "title": "Practical coverage rate for sizing",
      "detail": "The catalog gives cleaning path and speed, which only produce a theoretical maximum. Sizing needs the practical rate the applications engineer uses.",
      "ask": "Coverage: what practical square feet per hour should we quote for each model? The catalog gives only path width and speed, which overstates it.",
      "questions": ["Q04"], "due_day": 4
    },
    {
      "id": "I5", "cause": "needs_rule", "short": "the runtime rule",
      "title": "Usable battery runtime per shift",
      "detail": "The catalog gives rated runtime only. Customers need usable hours per shift and what to do when a charge runs out.",
      "ask": "Runtime: how many hours of a charge should we count on per shift, and how much does brush pressure change it?",
      "questions": ["Q05"], "due_day": 4
    },
    {
      "id": "I6", "cause": "wrong", "short": "the RO-40 page mix-up",
      "title": "An RO-40 answer cited the RO-32 page",
      "detail": "The right figure is on catalog p. 34, but the answer came from the RO-32 spec page.",
      "fix": "Tag each catalog page with its model, so answers only cite pages for the model asked about. Then rerun Q06.",
      "questions": ["Q06"], "due_day": 1
    },
    {
      "id": "I7", "cause": "should_escalate", "short": "the warranty escalation rule",
      "title": "The agent decided a warranty claim",
      "detail": "It answered a coverage question from the catalog's warranty summary instead of handing it to a person.",
      "fix": "Add an escalation rule: any question about coverage or a claim goes to a person, with the model and the question attached. Then rerun every warranty and safety question.",
      "questions": ["Q22"], "due_day": 1
    },
    {
      "id": "I8", "cause": "engineering", "short": "the manual page offset",
      "title": "Manual citations run one page high after page 17",
      "detail": "The WB-26 manual PDF has an unnumbered fold-out after page 17, so citations past it use the PDF page count instead of the printed page number.",
      "fix": "Read printed page labels instead of counting PDF pages. Configuration can't change how page labels are read, so this goes to engineering with Q15 as the example.",
      "questions": ["Q15"], "due_day": null
    }
  ],
  "round2": {
    "label": "Round 2",
    "added_sources": [
      { "id": "charger", "title": "Battery charger manual, 2025", "kind": "PDF", "size": "14 pp" }
    ],
    "reply": {
      "charger": "The battery charger manual arrived (14 pp). It covers the onboard charger on the walk-behinds and the off-board charger on the ride-ons.",
      "part_numbers": [
        { "item": "I2", "confirmed": "56-3318", "right_source": "price2026", "note": "The price book is current. The assembly was superseded in 2024, so the 2023 parts list was out of date." },
        { "item": "I3", "confirmed": "71-2040", "right_source": "parts2023", "note": "The parts list is correct. Row 301 of the price book had a typo, and the manufacturer is fixing it." }
      ],
      "rules": {
        "coverage_factor": 0.65,
        "coverage_text": "Practical coverage per hour = cleaning path (ft) x speed (ft per hour) x 0.65. The 0.65 efficiency factor covers turns, overlap and stops to empty and refill tanks.",
        "runtime_derate": { "normal": 0.85, "heavy": 0.7 },
        "runtime_text": "Usable runtime = rated runtime x 0.85 at normal brush pressure, or x 0.70 at heavy pressure. If usable runtime is shorter than the shift, the answer says the shift needs a battery swap or a charge break."
      }
    },
    "strategist_fixes": [
      { "item": "I6", "text": "Tagged every catalog page with its model, so answers cite only pages for the model asked about." }
    ],
    "items": {
      "I7": { "due_day": 6, "status_note": "Not added before this rerun. The manufacturer hasn't said whether its warranty desk takes every warranty question or only claims." },
      "I8": { "due_day": 8, "status_note": "Engineering set a date and is switching citations to printed page labels." }
    },
    "questions": {
      "Q04": {
        "verdict": "pass",
        "answer": "About 18,590 sq ft per hour. That's the 26-inch path at 2.5 mph (28,600 sq ft per hour in theory) times the 0.65 efficiency factor.",
        "citation": { "source": "catalog", "loc": "p. 17" },
        "note": "That's the number we'd quote.",
        "change": "The applications engineer supplied the coverage rule, and the answer now uses it."
      },
      "Q05": {
        "verdict": "pass",
        "answer": "No. The RO-32 is rated at 3.5 hours, so you can count on about 3.0 hours at normal brush pressure and about 2.5 at heavy pressure. An 8-hour shift needs a battery swap or a charge break.",
        "citation": { "source": "catalog", "loc": "p. 28" },
        "note": "Right, and it tells them what to do about it.",
        "change": "The applications engineer supplied the runtime rule, and the answer now uses it."
      },
      "Q06": {
        "verdict": "pass",
        "answer": "50 inches.",
        "citation": { "source": "catalog", "loc": "p. 34" },
        "note": "Correct now.",
        "change": "Configuration fix: catalog pages are tagged by model."
      },
      "Q11": {
        "verdict": "pass",
        "answer": "56-3318. The manufacturer confirmed the price book number; the 2023 parts list number was superseded.",
        "citation": { "source": "price2026", "loc": "row 214" },
        "note": "Correct.",
        "change": "The manufacturer confirmed the price book number."
      },
      "Q12": {
        "verdict": "pass",
        "answer": "71-2040, a 20-inch pad driver with the ride-on hub. The RO-40 takes two. The manufacturer confirmed the parts list number.",
        "citation": { "source": "parts2023", "loc": "p. 14" },
        "note": "Correct.",
        "change": "The manufacturer confirmed the parts list number."
      },
      "Q13": {
        "verdict": "pass",
        "answer": "Flashing amber means the battery voltage was too low for the charger to start a normal cycle. Check the battery connections and water level, then restart the charge.",
        "citation": { "source": "charger", "loc": "p. 9" },
        "note": "Correct.",
        "change": "The charger manual was added."
      },
      "Q14": {
        "verdict": "pass",
        "answer": "Yes. Set the charger's battery-type switch to AGM before the first charge. The wet-battery setting can overcharge AGM batteries.",
        "citation": { "source": "charger", "loc": "p. 5" },
        "note": "Correct, and it gave the reason.",
        "change": "The charger manual was added."
      },
      "Q21": {
        "verdict": "pass",
        "answer": "About 8 to 10 hours from fully discharged on the RO-32's off-board charger.",
        "citation": { "source": "charger", "loc": "p. 11" },
        "note": "Correct.",
        "change": "The charger manual was added."
      },
      "Q15": {
        "verdict": "engineering",
        "change": "Still open. Engineering is switching citations to printed page labels (due day 8)."
      },
      "Q22": {
        "verdict": "should_escalate",
        "change": "Still open. The escalation rule wasn't added before this rerun (due day 6)."
      }
    }
  }
};
