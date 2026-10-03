# Kayaan K. Unwalla — card + letter (section 09, slide 43 in v1.5.7; was 44): sources, verification status, conflicts

Deck: Athar Open Agentic Pact v1.5.6 · slide 43 since v1.5.7 — was slide 44 (`s-exec-unwalla`, `dist/js/exec-team.js`) · EN + AR · written 2026-10-02.
Rule applied: **invent nothing.** Every statement on the card/letter is one of the details listed in the Athar brief of 2 Oct 2026 (itself
taken from the Athar research run: a web-search plugin dossier plus the four URLs below). This file records, per statement, where it comes
from and whether the source could be opened and re-read when the deck was built.

Status legend — **RE-VERIFIED** = the page was opened/fetched on 2026-10-02 and says this · **BRIEF-ONLY** = comes from the Athar brief/research
dossier; the cited page could not be retrieved on 2026-10-02, so it was **not** independently re-checked.

## Sources

| # | Source | URL | Retrieval on 2026-10-02 |
|---|---|---|---|
| S1 | DWF press release, 27 June 2018 — "DWF Middle East appoints Head of Corporate and Defence and Security" | https://dwfgroup.com/en/news-and-insights/press-releases/2018/6/dwf-middle-east-appoints-head-of-corporate-and-defence-and-security | **HTTP 200**, text read |
| S2 | Norton Rose Fulbright people profile (id 139322) | https://www.nortonrosefulbright.com/en-br/people/139322 | **404 "Page Not Found"** (real browser and curl; also with a name slug and the `en`, `en-ae` locales) |
| S3 | Norton Rose Fulbright news "New partner hire for Dubai corporate team" (534761c5) | https://www.nortonrosefulbright.com/en-ke/news/534761c5/new-partner-hire-for-dubai-corporate-team | **404 "Page Not Found"** (`/en/news/534761c5/…` redirects to the generic news search) |
| S4 | SRA register, person 430771 | https://www.sra.org.uk/consumers/register/person/?sraNumber=430771 | **Blocked** — Cloudflare managed challenge (HTTP 403 to curl; challenge page never cleared in a browser) |
| S5 | The GPU, Issue #42 (AIREV; existing source on the slide) | https://thegpu.ai/p/issue-42-building-real-world-ai-deployment-layer-airev | not re-fetched (unchanged from v1.5.5) |
| S6 | "Former roles confirmed by Athar, 1 Oct 2026" (existing, user-confirmed) | — | — |

## Statement → source → status

| Statement on the card / letter | Source | Status |
|---|---|---|
| Co-founder and Chief Strategy Officer of AIREV; leads strategy, market expansion, ecosystem partnerships | S5 (unchanged) | existing |
| Corporate Partner at Norton Rose Fulbright (Dubai) | S2/S3 via brief; S6 | BRIEF-ONLY (S2/S3 404) |
| Joined Norton Rose Fulbright as Partner, November 2020 | S3 via brief | BRIEF-ONLY (S3 404) |
| Partner and Head of Corporate (Middle East), DWF Middle East | S1 headline/body ("corporate partner … will head the business's Corporate and Defence and Security Practice"); the "(Middle East)" qualifier is from DWF's "Meet the Team" post cited in the research | RE-VERIFIED for the appointment and the Corporate / Defence & Security headship; the "(Middle East)" wording is BRIEF-ONLY |
| Head of Defence & Security, DWF Middle East; appointed June 2018 | S1 (dated 27 June 2018) | **RE-VERIFIED** |
| Two years in-house with a US government contractor in Afghanistan, the Middle East and Africa | S2 via brief | BRIEF-ONLY (S2 404). S1 independently confirms work in London, Afghanistan (LOGCAP IV), Central Asia, Africa and the Middle East |
| Early legal roles at the US Department of Defense, the UK Ministry of Defence and a NATO prime contractor | S1 ("served in the Legal Department with the US DoD, UK MoD and NATO prime contractor") | **RE-VERIFIED** |
| Practice: M&A, joint ventures, commercial/transactional agreements, government contracts, cross-border transactions, regulatory advice | S3 via brief. S1 independently names acquisitions, joint ventures, strategic PPPs, investigations and regulatory compliance for government contractors | BRIEF-ONLY (S3 404); partly corroborated by S1 |
| Sectors: technology; defence, national security and aerospace; manufacturing; life sciences and healthcare; transport | S2 via brief. S1 independently names defence, security and aerospace | BRIEF-ONLY (S2 404); defence/security/aerospace corroborated by S1 |
| AI / technology mandates, including ProtectedBy.AI | S2 via brief | BRIEF-ONLY (S2 404) |
| Publications listed on the NRF profile: AI in financial services; Global Outer Space Guide (UAE) | S2 via brief | BRIEF-ONLY (S2 404) |
| LLB (Hons), University of Warwick, 2006 · B.Comm (Hons), University of Bombay, 2003 · LPC, BPP Law School London, 2007 | S2 via brief | BRIEF-ONLY (S2 404) |
| Solicitor, England and Wales, SRA no. 430771 | S4 via brief | BRIEF-ONLY (S4 blocked) — **year deliberately omitted, see conflict C3** |
| Languages: English, Hindi, Gujarati | S2 via brief | BRIEF-ONLY (S2 404) |

On the slide the Norton Rose Fulbright sources are shown as **unlinked** labels ("links pending") because both URLs return 404 today; DWF, SRA
and The GPU are linked. Replace the two labels with working links when Athar supplies them.

## Conflicts and open items (flagged, not resolved by guessing)

* **C1 — Norton Rose Fulbright title / status.** The dossier reads the NRF profile as "Consultant, Corporate Finance Partner Lawyer" (Dubai),
  while the brief says "Corporate Partner, Norton Rose Fulbright (Dubai)". Whether he is still affiliated with the firm is unclear. The letter
  keeps the framing the user already confirmed on 1 Oct 2026 — *before AIREV he was a Corporate Partner at NRF Dubai* — and does not claim a current NRF title.
* **C2 — Oct 2021 "Senior Advisor to the UAE Minister of State for Foreign Trade".** Appears in the dossier; status unclear. **Not used.**
* **C3 — SRA admission date.** Dossier: register says admitted **15 June 2010**; NRF profile (per dossier) says qualified in **2007**. The card
  therefore states "Solicitor, England and Wales (SRA no. 430771)" **without any year**. LPC (BPP, 2007) is kept as supplied.
* **C4 — Rankings.** No individual Chambers / Legal 500 ranking was found, so none is shown. The NRF Corporate/M&A *team* is Chambers Global 2025
  Band 5 — team-level only, **not used** (it would read as a personal recognition).
* **C5 — Wrong person.** The LinkedIn lookup returned a different person (Darwin Huang, "Real Estate Partner"); it was ignored and nothing from it is on the slide.
* **C6 — Dead / blocked sources.** S2 and S3 return 404 and S4 is behind a Cloudflare challenge (see table). The dossier was produced by a
  search model whose citations are not independent evidence; every BRIEF-ONLY row above should be re-checked against the live NRF profile once a
  working URL exists.
* **C7 — DWF title wording.** S1 says he "will head the business's Corporate and Defence and Security Practice" at DWF Middle East; "Head of Corporate
  (Middle East)" is the wording used in DWF's own "Meet the Team" post (LinkedIn, cited by the dossier). Both are used as supplied.
* **C8 — Narration.** The George clip NAR-s44 (existing) says "…Before AIREV, he was a corporate partner at Norton Rose Fulbright in Dubai and head of
  Corporate Middle East at DWF…". It matches the letter and was **kept, not regenerated**; it does not voice the new card details.

## Found but intentionally not used

* S1 also mentions drafting laws and policies on national and border security, defence offset structuring, military logistics, cyber-security and
  dual-purpose technologies. Not in the brief's detail list → not added.
* Notable-deal list from the dossier (sovereign wealth fund tourism JVs, management buy-out of a technology integrator, a US$42m outsourcing contract,
  etc.): not in the brief → not added (only ProtectedBy.AI was requested).

## Portrait

No headshot was supplied; the existing monogram roundel "KU / ك أ" stays (no generated face).

## Arabic

The Arabic text was drafted for this deck from the English facts. Latin firm names stay in Latin script (as elsewhere in the deck). Please have a native
reviewer confirm the renderings of: "Solicitor" (kept as "سوليسيتر (Solicitor)"), the university and school names, and the practice/sector terms.
