# H.E. Fahad Mohamed Al Ameri — card + letter (section 09, slide 41 in v1.5.7 and v1.5.8; was 42 in v1.5.6): sources, verification status, open items

Deck: Athar Open Agentic Pact v1.5.6 · slide 41 since v1.5.7 (`s-exec-al-ameri`; slide 42 and Letter 2 of 4 in v1.5.6) · EN + AR · written 2026-10-02.
Spelling: **Fahad** (official: "Fahad Mohamed AlAmeri" / "Fahad Al Ameri", uaenep.ae); Arabic **فهد محمد العامري**. The letter body says "H.E." / «سعادة».
**v1.5.8 — honorific restored on the label (Fahad only):** EN **"H.E. Fahad Mohamed Al Ameri"**, AR **«سعادة فهد محمد العامري»** — the exact forms his label carried before the v1.5.6
removal (`git show c989d86^:pact-deck/dist/js/exec-team.js`, line `name: { en: 'H.E. Fahad Mohamed Al Ameri', ar: 'سعادة فهد محمد العامري' }`) and the form his letter body uses.
The brief suggested «معالي» as an option; the repository history shows «سعادة» (the Gulf form for director-level officials; «معالي» is the ministerial form), so «سعادة» was restored.
It applies wherever the name label is rendered (letter header, profile-card aria-label, intro index, overview tile, slide titles, monogram aria-label); the narration clip already says
"His Excellency". No other label got an honorific back (the v1.5.6 rule stays for Muhammed, Kayaan and Ary).

## What this slide replaced

The brief asked to replace the hidden "Presidential Court" pending card with H.E. Fahad Mohamed Al Ameri and to publish it. In v1.5.5 Fahad's letter was
**already published** as Letter 2 (slide 42, no feature flag); the hidden, flag-off card was a *different* Presidential Court official. So there is exactly one
Fahad card: the published one, rewritten from the verified facts below. The hidden card was deleted outright (data, source link, narration note, tests, changelog
and progress-log mentions). Letter order in v1.5.6 was H.E. Dr Thani → H.E. Fahad → Muhammed → Kayaan; **v1.5.7 removed the former Letter 1**, so the order is now H.E. Fahad (Letter 1 of 3, slide 41) → Muhammed → Kayaan and the deck total is **43**. Lorenzo stays hidden behind `FLAGS.pendingCards`.

## Sources

| # | Source | URL | Retrieval on 2026-10-02 |
|---|---|---|---|
| F1 | UAE National Experts Program — "Fahad Al Ameri" (EN) | https://uaenep.ae/en/participant/fahad-al-ameri | **HTTP 200**, text read |
| F2 | برنامج خبراء الإمارات — "فهد العامري" (AR) | https://uaenep.ae/ar/participant/fahad-al-ameri | **HTTP 200**, text read (source of the official Arabic names below) |
| F3 | Career timeline and programme status "as supplied by Athar, 2 Oct 2026" | — | brief only (no URL supplied) |

## Statement → source → status

| Statement | Source | Status |
|---|---|---|
| Executive Director, Development and Humanitarian Affairs, (UAE) Presidential Court | F1, F2 | **RE-VERIFIED** |
| Helped create Erth Zayed Philanthropies, the UAE International Aid Agency and the International Humanitarian and Philanthropic Council (IHPC) | F1 ("played a defining role in the creation of …"), F2 | **RE-VERIFIED** |
| General Secretary of the IHPC; Managing Director of the Erth Zayed Fund | F1 ("General Secretary of the IHPC … Managing Director of the ErthZayed Fund"), F2 («مُقرِّر مجلس الشؤون الإنسانية والدولية», «مدير صندوق إرث زايد الإنساني») | **RE-VERIFIED** |
| Boards: Zayed Charitable and Humanitarian Foundation; Clean Rivers; Zoud Foundation (for Financial Literacy) | F1, F2 | **RE-VERIFIED** (F1 gives the long names "Clean Rivers Organization" and "Zoud Foundation for Financial Literacy") |
| MSE Mechanical Engineering and BS Bioengineering (summa cum laude), University of Pennsylvania; CFA charterholder | F1 ("both from the University of Pennsylvania, where he graduated summa cum laude … Chartered Financial Analyst"), F2 | **RE-VERIFIED** |
| Abu Dhabi Executive Council 2011–14 · Abu Dhabi Executive Office 2014–18 · Department of Transport 2018–20 · President's Office 2020–22 · Director of Strategic Affairs from 2022 | F3 (brief) | BRIEF-ONLY — F1/F2 confirm only that he held senior roles at the Abu Dhabi Crown Prince Court, the Department of Transport and the General Secretariat of the Executive Council, **without dates** |
| Emirates Experts Program graduate | F3 (brief); F1/F2 list him as an "NEP 2.0" participant in the programme (Arabic name «برنامج خبراء الإمارات») | partly RE-VERIFIED (participation); "graduate" is BRIEF-ONLY |

## Open items / differences (flagged, not resolved by guessing)

* **F-1 Career entity names.** The supplied timeline says "Abu Dhabi **Executive Office** 2014–18" and "**President's Office** 2020–22"; the NEP profile instead names the "Abu Dhabi
  **Crown Prince Court**" and the "**General Secretariat of the Executive Council**" (no dates) and does not mention a President's Office. The timeline is shown exactly as supplied and
  attributed to Athar ("as supplied by Athar, 2 Oct 2026"), not to NEP. Please confirm the entity names/dates.
* **F-2 "Director of Strategic Affairs from 2022"** — the brief does not say at which entity; the card does not add one.
* **F-3 Extra NEP detail not used:** "Member of the National Multiple Sclerosis Society" (not in the brief).
* **F-4 Narration.** The George clip NAR-s42 ("His Excellency Fahad Mohamed Al Ameri, Executive Director … IHPC") was kept, not regenerated. It voices only the first two facts and says
  "Mohammed" for "Mohamed" (existing note). The caption text under the guide mirrors the clip, so it still says "His Excellency" — spoken text, not a name label.
* **F-5 Portrait.** None exists. The existing monogram roundel "FA / ف ع" stays (no generated face).
* **F-6 Arabic** was drafted for the deck; entity names follow the Arabic NEP page (F2) where it names them. Native review recommended for «المكتب التنفيذي لإمارة أبوظبي»,
  «مكتب رئيس الدولة» and «مدير الشؤون الاستراتيجية», which have no Arabic source in the brief.
