# Guide scenario harness (qa/guide-qa.mjs, S1–S10) — runs of 2026-10-01

## Run `after` — 2026-10-01T05:42:46Z → 2026-10-01T05:44:58Z

Base URL http://127.0.0.1:4174 · Chromium (Playwright) · playbackRate 4× for the AUTO end-to-end scenario · checks: **380 pass / 11 fail** of 391

| UTC | scenario | check | result | detail |
|---|---|---|---|---|
| 2026-10-01T05:42:49Z | S1 AUTO end-to-end | intro skipped, slide 1, guide idle | PASS | n=1 intro=false narrating=false |
| 2026-10-01T05:42:49Z | S1 AUTO end-to-end | start guide on slide 1 · slide on screen | PASS | visible slide 1 (expected 1) hash=#/01 |
| 2026-10-01T05:42:49Z | S1 AUTO end-to-end | start guide on slide 1 · clip == slide mapping | PASS | bar clip NAR-00 vs expected NAR-00 for slide 1 (6 ms) |
| 2026-10-01T05:42:49Z | S1 AUTO end-to-end | start guide on slide 1 · audio playing ≤1 s | PASS | paused=false src=guide-00-welcome-lhbIUXFwLO.mp3 ct=0 playingEvents=1 rejected=none (13 ms) |
| 2026-10-01T05:42:49Z | S1 AUTO end-to-end | start guide on slide 1 · active cue narrates visible slide | PASS | cue #1 (slide 1) vs visible 1; audio 0.01s; expected first cue #1 |
| 2026-10-01T05:42:49Z | S1 AUTO end-to-end | start guide on slide 1 · audio progressing | PASS | currentTime 0.21 → 1.61 |
| 2026-10-01T05:42:49Z | S1 AUTO end-to-end | start guide on slide 1 · CC caption == active cue text | PASS | caption="Welcome to the Athar Open Agentic Pact, a communit" cue="Welcome to the Athar Open Agentic Pact, a communit" |
| 2026-10-01T05:42:49Z | S1 AUTO end-to-end | start guide on slide 1 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=1 cue=#1 (slide 1) visible=1 transcript chars=258 |
| 2026-10-01T05:42:53Z | S1 AUTO end-to-end | AUTO advanced 1→2 · slide on screen | PASS | visible slide 2 (expected 2) hash=#/02 |
| 2026-10-01T05:42:53Z | S1 AUTO end-to-end | AUTO advanced 1→2 · clip == slide mapping | PASS | bar clip NAR-01 vs expected NAR-01 for slide 2 (2 ms) |
| 2026-10-01T05:42:53Z | S1 AUTO end-to-end | AUTO advanced 1→2 · audio playing ≤1 s | PASS | paused=false src=guide-01-the-pact-df1pHtGsVr.mp3 ct=0.04 playingEvents=0 rejected=none (5 ms) |
| 2026-10-01T05:42:54Z | S1 AUTO end-to-end | AUTO advanced 1→2 · active cue narrates visible slide | PASS | cue #1 (slide 2) vs visible 2; audio 0.77s; expected first cue #1 |
| 2026-10-01T05:42:54Z | S1 AUTO end-to-end | AUTO advanced 1→2 · audio progressing | PASS | currentTime 1.26 → 2.68 |
| 2026-10-01T05:42:54Z | S1 AUTO end-to-end | AUTO advanced 1→2 · CC caption == active cue text | PASS | caption="The Athar Open Agentic Pact is an open commitment " cue="The Athar Open Agentic Pact is an open commitment " |
| 2026-10-01T05:42:54Z | S1 AUTO end-to-end | AUTO advanced 1→2 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=2 cue=#2 (slide 2) visible=2 transcript chars=363 |
| 2026-10-01T05:42:57Z | S1 AUTO end-to-end | AUTO advanced 2→3 · slide on screen | PASS | visible slide 3 (expected 3) hash=#/03 |
| 2026-10-01T05:42:57Z | S1 AUTO end-to-end | AUTO advanced 2→3 · clip == slide mapping | PASS | bar clip NAR-01 vs expected NAR-01 for slide 3 (2 ms) |
| 2026-10-01T05:42:57Z | S1 AUTO end-to-end | AUTO advanced 2→3 · audio playing ≤1 s | PASS | paused=false src=guide-01-the-pact-df1pHtGsVr.mp3 ct=12.53 playingEvents=0 rejected=none (5 ms) |
| 2026-10-01T05:42:57Z | S1 AUTO end-to-end | AUTO advanced 2→3 · active cue narrates visible slide | PASS | cue #3 (slide 3) vs visible 3; audio 12.54s; expected first cue #3 |
| 2026-10-01T05:42:57Z | S1 AUTO end-to-end | AUTO advanced 2→3 · audio progressing | PASS | currentTime 13.04 → 14.42 |
| 2026-10-01T05:42:57Z | S1 AUTO end-to-end | AUTO advanced 2→3 · CC caption == active cue text | PASS | caption="It is a community proposal from ODA and AI Rev, de" cue="It is a community proposal from ODA and AI Rev, de" |
| 2026-10-01T05:42:57Z | S1 AUTO end-to-end | AUTO advanced 2→3 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=3 cue=#3 (slide 3) visible=3 transcript chars=363 |
| 2026-10-01T05:43:00Z | S1 AUTO end-to-end | AUTO advanced 3→4 · slide on screen | PASS | visible slide 4 (expected 4) hash=#/04 |
| 2026-10-01T05:43:00Z | S1 AUTO end-to-end | AUTO advanced 3→4 · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 4 (2 ms) |
| 2026-10-01T05:43:00Z | S1 AUTO end-to-end | AUTO advanced 3→4 · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=0.04 playingEvents=0 rejected=none (6 ms) |
| 2026-10-01T05:43:00Z | S1 AUTO end-to-end | AUTO advanced 3→4 · active cue narrates visible slide | PASS | cue #1 (slide 4) vs visible 4; audio 0.76s; expected first cue #1 |
| 2026-10-01T05:43:01Z | S1 AUTO end-to-end | AUTO advanced 3→4 · audio progressing | PASS | currentTime 1.26 → 2.7 |
| 2026-10-01T05:43:01Z | S1 AUTO end-to-end | AUTO advanced 3→4 · CC caption == active cue text | PASS | caption="Section two, the Community Model." cue="Section two, the Community Model." |
| 2026-10-01T05:43:01Z | S1 AUTO end-to-end | AUTO advanced 3→4 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=4 cue=#1 (slide 4) visible=4 transcript chars=409 |
| 2026-10-01T05:43:01Z | S1 AUTO end-to-end | AUTO advanced 4→7 · slide on screen | PASS | visible slide 7 (expected 7) hash=#/07 |
| 2026-10-01T05:43:01Z | S1 AUTO end-to-end | AUTO advanced 4→7 · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 7 (4 ms) |
| 2026-10-01T05:43:01Z | S1 AUTO end-to-end | AUTO advanced 4→7 · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=3.22 playingEvents=0 rejected=none (8 ms) |
| 2026-10-01T05:43:01Z | S1 AUTO end-to-end | AUTO advanced 4→7 · active cue narrates visible slide | PASS | cue #2 (slide 7) vs visible 7; audio 3.26s; expected first cue #2 |
| 2026-10-01T05:43:01Z | S1 AUTO end-to-end | AUTO advanced 4→7 · audio progressing | PASS | currentTime 3.71 → 5.12 |
| 2026-10-01T05:43:01Z | S1 AUTO end-to-end | AUTO advanced 4→7 · CC caption == active cue text | PASS | caption="Every webinar, chapter event and challenge should " cue="Every webinar, chapter event and challenge should " |
| 2026-10-01T05:43:01Z | S1 AUTO end-to-end | AUTO advanced 4→7 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=7 cue=#2 (slide 7) visible=7 transcript chars=409 |
| 2026-10-01T05:43:03Z | S1 AUTO end-to-end | AUTO advanced 7→11 · slide on screen | PASS | visible slide 11 (expected 11) hash=#/11 |
| 2026-10-01T05:43:03Z | S1 AUTO end-to-end | AUTO advanced 7→11 · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 11 (1 ms) |
| 2026-10-01T05:43:03Z | S1 AUTO end-to-end | AUTO advanced 7→11 · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=11.55 playingEvents=0 rejected=none (7 ms) |
| 2026-10-01T05:43:03Z | S1 AUTO end-to-end | AUTO advanced 7→11 · active cue narrates visible slide | PASS | cue #3 (slide 11) vs visible 11; audio 11.56s; expected first cue #3 |
| 2026-10-01T05:43:03Z | S1 AUTO end-to-end | AUTO advanced 7→11 · audio progressing | PASS | currentTime 12.06 → 13.44 |
| 2026-10-01T05:43:03Z | S1 AUTO end-to-end | AUTO advanced 7→11 · CC caption == active cue text | PASS | caption="Learn agentic AI, build a useful agent through the" cue="Learn agentic AI, build a useful agent through the" |
| 2026-10-01T05:43:03Z | S1 AUTO end-to-end | AUTO advanced 7→11 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=11 cue=#3 (slide 11) visible=11 transcript chars=409 |
| 2026-10-01T05:43:07Z | S1 AUTO end-to-end | AUTO advanced 11→13 · slide on screen | PASS | visible slide 13 (expected 13) hash=#/13 |
| 2026-10-01T05:43:07Z | S1 AUTO end-to-end | AUTO advanced 11→13 · clip == slide mapping | PASS | bar clip NAR-03 vs expected NAR-03 for slide 13 (3 ms) |
| 2026-10-01T05:43:07Z | S1 AUTO end-to-end | AUTO advanced 11→13 · audio playing ≤1 s | PASS | paused=false src=guide-03-six-pillars-yxVqZJ2k1a.mp3 ct=0.08 playingEvents=0 rejected=none (8 ms) |
| 2026-10-01T05:43:07Z | S1 AUTO end-to-end | AUTO advanced 11→13 · active cue narrates visible slide | PASS | cue #1 (slide 13) vs visible 13; audio 0.81s; expected first cue #1 |
| 2026-10-01T05:43:07Z | S1 AUTO end-to-end | AUTO advanced 11→13 · audio progressing | PASS | currentTime 1.31 → 2.73 |
| 2026-10-01T05:43:07Z | S1 AUTO end-to-end | AUTO advanced 11→13 · CC caption == active cue text | PASS | caption="Section three, six pillars." cue="Section three, six pillars." |
| 2026-10-01T05:43:07Z | S1 AUTO end-to-end | AUTO advanced 11→13 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=13 cue=#1 (slide 13) visible=13 transcript chars=293 |
| 2026-10-01T05:43:09Z | S1 AUTO end-to-end | AUTO advanced 13→14 · slide on screen | PASS | visible slide 14 (expected 14) hash=#/14 |
| 2026-10-01T05:43:09Z | S1 AUTO end-to-end | AUTO advanced 13→14 · clip == slide mapping | PASS | bar clip NAR-03 vs expected NAR-03 for slide 14 (1 ms) |
| 2026-10-01T05:43:09Z | S1 AUTO end-to-end | AUTO advanced 13→14 · audio playing ≤1 s | PASS | paused=false src=guide-03-six-pillars-yxVqZJ2k1a.mp3 ct=9.65 playingEvents=0 rejected=none (5 ms) |
| 2026-10-01T05:43:09Z | S1 AUTO end-to-end | AUTO advanced 13→14 · active cue narrates visible slide | PASS | cue #3 (slide 14) vs visible 14; audio 9.65s; expected first cue #3 |
| 2026-10-01T05:43:10Z | S1 AUTO end-to-end | AUTO advanced 13→14 · audio progressing | PASS | currentTime 10.15 → 11.54 |
| 2026-10-01T05:43:10Z | S1 AUTO end-to-end | AUTO advanced 13→14 · CC caption == active cue text | PASS | caption="Reusable skills are built once and shared across t" cue="Reusable skills are built once and shared across t" |
| 2026-10-01T05:43:10Z | S1 AUTO end-to-end | AUTO advanced 13→14 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=14 cue=#3 (slide 14) visible=14 transcript chars=293 |
| 2026-10-01T05:43:10Z | S1 AUTO end-to-end | AUTO advanced 14→17 · slide on screen | PASS | visible slide 17 (expected 17) hash=#/17 |
| 2026-10-01T05:43:10Z | S1 AUTO end-to-end | AUTO advanced 14→17 · clip == slide mapping | PASS | bar clip NAR-03 vs expected NAR-03 for slide 17 (2 ms) |
| 2026-10-01T05:43:10Z | S1 AUTO end-to-end | AUTO advanced 14→17 · audio playing ≤1 s | PASS | paused=false src=guide-03-six-pillars-yxVqZJ2k1a.mp3 ct=13.74 playingEvents=0 rejected=none (9 ms) |
| 2026-10-01T05:43:10Z | S1 AUTO end-to-end | AUTO advanced 14→17 · active cue narrates visible slide | PASS | cue #4 (slide 17) vs visible 17; audio 13.75s; expected first cue #4 |
| 2026-10-01T05:43:11Z | S1 AUTO end-to-end | AUTO advanced 14→17 · audio progressing | PASS | currentTime 14.23 → 15.65 |
| 2026-10-01T05:43:11Z | S1 AUTO end-to-end | AUTO advanced 14→17 · CC caption == active cue text | PASS | caption="Universal API licences are managed by Athar, givin" cue="Universal API licences are managed by Athar, givin" |
| 2026-10-01T05:43:11Z | S1 AUTO end-to-end | AUTO advanced 14→17 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=17 cue=#4 (slide 17) visible=17 transcript chars=293 |
| 2026-10-01T05:43:12Z | S1 AUTO end-to-end | AUTO advanced 17→19 · slide on screen | PASS | visible slide 19 (expected 19) hash=#/19 |
| 2026-10-01T05:43:12Z | S1 AUTO end-to-end | AUTO advanced 17→19 · clip == slide mapping | PASS | bar clip NAR-04 vs expected NAR-04 for slide 19 (2 ms) |
| 2026-10-01T05:43:12Z | S1 AUTO end-to-end | AUTO advanced 17→19 · audio playing ≤1 s | PASS | paused=false src=guide-04-pledge-and-signing-PWeXZj1Rgc.mp3 ct=0.03 playingEvents=0 rejected=none (6 ms) |
| 2026-10-01T05:43:12Z | S1 AUTO end-to-end | AUTO advanced 17→19 · active cue narrates visible slide | PASS | cue #1 (slide 19) vs visible 19; audio 0.74s; expected first cue #1 |
| 2026-10-01T05:43:12Z | S1 AUTO end-to-end | AUTO advanced 17→19 · audio progressing | PASS | currentTime 1.25 → 2.69 |
| 2026-10-01T05:43:12Z | S1 AUTO end-to-end | AUTO advanced 17→19 · CC caption == active cue text | PASS | caption="Section four, Pledge and Signing." cue="Section four, Pledge and Signing." |
| 2026-10-01T05:43:12Z | S1 AUTO end-to-end | AUTO advanced 17→19 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=19 cue=#1 (slide 19) visible=19 transcript chars=391 |
| 2026-10-01T05:43:13Z | S1 AUTO end-to-end | AUTO advanced 19→20 · slide on screen | PASS | visible slide 20 (expected 20) hash=#/20 |
| 2026-10-01T05:43:13Z | S1 AUTO end-to-end | AUTO advanced 19→20 · clip == slide mapping | PASS | bar clip NAR-04 vs expected NAR-04 for slide 20 (1 ms) |
| 2026-10-01T05:43:13Z | S1 AUTO end-to-end | AUTO advanced 19→20 · audio playing ≤1 s | PASS | paused=false src=guide-04-pledge-and-signing-PWeXZj1Rgc.mp3 ct=6.18 playingEvents=0 rejected=none (6 ms) |
| 2026-10-01T05:43:13Z | S1 AUTO end-to-end | AUTO advanced 19→20 · active cue narrates visible slide | PASS | cue #3 (slide 20) vs visible 20; audio 6.19s; expected first cue #3 |
| 2026-10-01T05:43:14Z | S1 AUTO end-to-end | AUTO advanced 19→20 · audio progressing | PASS | currentTime 6.69 → 8.13 |
| 2026-10-01T05:43:14Z | S1 AUTO end-to-end | AUTO advanced 19→20 · CC caption == active cue text | PASS | caption="A signatory chooses its roles, sign, govern, build" cue="A signatory chooses its roles, sign, govern, build" |
| 2026-10-01T05:43:14Z | S1 AUTO end-to-end | AUTO advanced 19→20 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=20 cue=#3 (slide 20) visible=20 transcript chars=391 |
| 2026-10-01T05:43:18Z | S1 AUTO end-to-end | AUTO advanced 20→21 · slide on screen | PASS | visible slide 21 (expected 21) hash=#/21 |
| 2026-10-01T05:43:18Z | S1 AUTO end-to-end | AUTO advanced 20→21 · clip == slide mapping | PASS | bar clip NAR-05 vs expected NAR-05 for slide 21 (1 ms) |
| 2026-10-01T05:43:18Z | S1 AUTO end-to-end | AUTO advanced 20→21 · audio playing ≤1 s | PASS | paused=false src=guide-05-actors-and-roles-0PbyoFNYNV.mp3 ct=0.05 playingEvents=0 rejected=none (5 ms) |
| 2026-10-01T05:43:18Z | S1 AUTO end-to-end | AUTO advanced 20→21 · active cue narrates visible slide | PASS | cue #1 (slide 21) vs visible 21; audio 0.71s; expected first cue #1 |
| 2026-10-01T05:43:19Z | S1 AUTO end-to-end | AUTO advanced 20→21 · audio progressing | PASS | currentTime 1.22 → 2.62 |
| 2026-10-01T05:43:19Z | S1 AUTO end-to-end | AUTO advanced 20→21 · CC caption == active cue text | PASS | caption="Section five, Actors and Roles, institutions, part" cue="Section five, Actors and Roles, institutions, part" |
| 2026-10-01T05:43:19Z | S1 AUTO end-to-end | AUTO advanced 20→21 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=21 cue=#1 (slide 21) visible=21 transcript chars=394 |
| 2026-10-01T05:43:23Z | S1 AUTO end-to-end | AUTO advanced 21→23 · slide on screen | PASS | visible slide 23 (expected 23) hash=#/23 |
| 2026-10-01T05:43:23Z | S1 AUTO end-to-end | AUTO advanced 21→23 · clip == slide mapping | PASS | bar clip NAR-05 vs expected NAR-05 for slide 23 (2 ms) |
| 2026-10-01T05:43:23Z | S1 AUTO end-to-end | AUTO advanced 21→23 · audio playing ≤1 s | PASS | paused=false src=guide-05-actors-and-roles-0PbyoFNYNV.mp3 ct=20.04 playingEvents=0 rejected=none (8 ms) |
| 2026-10-01T05:43:23Z | S1 AUTO end-to-end | AUTO advanced 21→23 · active cue narrates visible slide | PASS | cue #2 (slide 23) vs visible 23; audio 20.05s; expected first cue #2 |
| 2026-10-01T05:43:23Z | S1 AUTO end-to-end | AUTO advanced 21→23 · audio progressing | PASS | currentTime 20.58 → 21.94 |
| 2026-10-01T05:43:23Z | S1 AUTO end-to-end | AUTO advanced 21→23 · CC caption == active cue text | PASS | caption="The UAE Ministry of Foreign Trade signs and govern" cue="The UAE Ministry of Foreign Trade signs and govern" |
| 2026-10-01T05:43:23Z | S1 AUTO end-to-end | AUTO advanced 21→23 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=23 cue=#2 (slide 23) visible=23 transcript chars=394 |
| 2026-10-01T05:43:26Z | S1 AUTO end-to-end | AUTO advanced 23→26 · slide on screen | PASS | visible slide 26 (expected 26) hash=#/26 |
| 2026-10-01T05:43:26Z | S1 AUTO end-to-end | AUTO advanced 23→26 · clip == slide mapping | PASS | bar clip NAR-06 vs expected NAR-06 for slide 26 (1 ms) |
| 2026-10-01T05:43:26Z | S1 AUTO end-to-end | AUTO advanced 23→26 · audio playing ≤1 s | PASS | paused=false src=guide-06-governance-and-roadmap-kyzmCSHcw8.mp3 ct=0.06 playingEvents=0 rejected=none (4 ms) |
| 2026-10-01T05:43:26Z | S1 AUTO end-to-end | AUTO advanced 23→26 · active cue narrates visible slide | PASS | cue #1 (slide 26) vs visible 26; audio 0.61s; expected first cue #1 |
| 2026-10-01T05:43:26Z | S1 AUTO end-to-end | AUTO advanced 23→26 · audio progressing | PASS | currentTime 1.09 → 2.53 |
| 2026-10-01T05:43:26Z | S1 AUTO end-to-end | AUTO advanced 23→26 · CC caption == active cue text | PASS | caption="Section six, governance and roadmap." cue="Section six, governance and roadmap." |
| 2026-10-01T05:43:26Z | S1 AUTO end-to-end | AUTO advanced 23→26 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=26 cue=#1 (slide 26) visible=26 transcript chars=263 |
| 2026-10-01T05:43:28Z | S1 AUTO end-to-end | AUTO advanced 26→27 · slide on screen | PASS | visible slide 27 (expected 27) hash=#/27 |
| 2026-10-01T05:43:28Z | S1 AUTO end-to-end | AUTO advanced 26→27 · clip == slide mapping | PASS | bar clip NAR-06 vs expected NAR-06 for slide 27 (2 ms) |
| 2026-10-01T05:43:28Z | S1 AUTO end-to-end | AUTO advanced 26→27 · audio playing ≤1 s | PASS | paused=false src=guide-06-governance-and-roadmap-kyzmCSHcw8.mp3 ct=8.45 playingEvents=0 rejected=none (6 ms) |
| 2026-10-01T05:43:28Z | S1 AUTO end-to-end | AUTO advanced 26→27 · active cue narrates visible slide | PASS | cue #3 (slide 27) vs visible 27; audio 8.46s; expected first cue #3 |
| 2026-10-01T05:43:28Z | S1 AUTO end-to-end | AUTO advanced 26→27 · audio progressing | PASS | currentTime 8.93 → 10.35 |
| 2026-10-01T05:43:28Z | S1 AUTO end-to-end | AUTO advanced 26→27 · CC caption == active cue text | PASS | caption="Decisions, releases, and outcome reports are publi" cue="Decisions, releases, and outcome reports are publi" |
| 2026-10-01T05:43:28Z | S1 AUTO end-to-end | AUTO advanced 26→27 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=27 cue=#3 (slide 27) visible=27 transcript chars=263 |
| 2026-10-01T05:43:30Z | S1 AUTO end-to-end | AUTO advanced 27→28 · slide on screen | PASS | visible slide 28 (expected 28) hash=#/27/new-1 |
| 2026-10-01T05:43:30Z | S1 AUTO end-to-end | AUTO advanced 27→28 · clip == slide mapping | PASS | bar clip NAR-07 vs expected NAR-07 for slide 28 (2 ms) |
| 2026-10-01T05:43:30Z | S1 AUTO end-to-end | AUTO advanced 27→28 · audio playing ≤1 s | PASS | paused=false src=guide-07-impact-and-funding-vWkiINp1IS.mp3 ct=0 playingEvents=0 rejected=none (6 ms) |
| 2026-10-01T05:43:30Z | S1 AUTO end-to-end | AUTO advanced 27→28 · active cue narrates visible slide | PASS | cue #1 (slide 28) vs visible 28; audio 0.71s; expected first cue #1 |
| 2026-10-01T05:43:31Z | S1 AUTO end-to-end | AUTO advanced 27→28 · audio progressing | PASS | currentTime 1.21 → 2.65 |
| 2026-10-01T05:43:31Z | S1 AUTO end-to-end | AUTO advanced 27→28 · CC caption == active cue text | PASS | caption="Section seven, Impact and Funding." cue="Section seven, Impact and Funding." |
| 2026-10-01T05:43:31Z | S1 AUTO end-to-end | AUTO advanced 27→28 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=28 cue=#1 (slide 28) visible=28 transcript chars=447 |
| 2026-10-01T05:43:31Z | S1 AUTO end-to-end | AUTO advanced 28→29 · slide on screen | PASS | visible slide 29 (expected 29) hash=#/27/new-2 |
| 2026-10-01T05:43:31Z | S1 AUTO end-to-end | AUTO advanced 28→29 · clip == slide mapping | PASS | bar clip NAR-07 vs expected NAR-07 for slide 29 (1 ms) |
| 2026-10-01T05:43:31Z | S1 AUTO end-to-end | AUTO advanced 28→29 · audio playing ≤1 s | PASS | paused=false src=guide-07-impact-and-funding-vWkiINp1IS.mp3 ct=3.14 playingEvents=0 rejected=none (5 ms) |
| 2026-10-01T05:43:31Z | S1 AUTO end-to-end | AUTO advanced 28→29 · active cue narrates visible slide | PASS | cue #2 (slide 29) vs visible 29; audio 3.14s; expected first cue #2 |
| 2026-10-01T05:43:31Z | S1 AUTO end-to-end | AUTO advanced 28→29 · audio progressing | PASS | currentTime 3.64 → 5.07 |
| 2026-10-01T05:43:31Z | S1 AUTO end-to-end | AUTO advanced 28→29 · CC caption == active cue text | PASS | caption="Three impact tiers, one delivery model, access, ow" cue="Three impact tiers, one delivery model, access, ow" |
| 2026-10-01T05:43:31Z | S1 AUTO end-to-end | AUTO advanced 28→29 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=29 cue=#2 (slide 29) visible=29 transcript chars=447 |
| 2026-10-01T05:43:32Z | S1 AUTO end-to-end | AUTO advanced 29→30 · slide on screen | PASS | visible slide 30 (expected 30) hash=#/27/new-3 |
| 2026-10-01T05:43:32Z | S1 AUTO end-to-end | AUTO advanced 29→30 · clip == slide mapping | PASS | bar clip NAR-07 vs expected NAR-07 for slide 30 (1 ms) |
| 2026-10-01T05:43:33Z | S1 AUTO end-to-end | AUTO advanced 29→30 · audio playing ≤1 s | PASS | paused=false src=guide-07-impact-and-funding-vWkiINp1IS.mp3 ct=10.48 playingEvents=0 rejected=none (5 ms) |
| 2026-10-01T05:43:33Z | S1 AUTO end-to-end | AUTO advanced 29→30 · active cue narrates visible slide | PASS | cue #4 (slide 30) vs visible 30; audio 10.49s; expected first cue #4 |
| 2026-10-01T05:43:33Z | S1 AUTO end-to-end | AUTO advanced 29→30 · audio progressing | PASS | currentTime 10.96 → 12.38 |
| 2026-10-01T05:43:33Z | S1 AUTO end-to-end | AUTO advanced 29→30 · CC caption == active cue text | PASS | caption="Every agreement includes named cohorts and activat" cue="Every agreement includes named cohorts and activat" |
| 2026-10-01T05:43:33Z | S1 AUTO end-to-end | AUTO advanced 29→30 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=30 cue=#4 (slide 30) visible=30 transcript chars=447 |
| 2026-10-01T05:43:35Z | S1 AUTO end-to-end | AUTO advanced 30→31 · slide on screen | PASS | visible slide 31 (expected 31) hash=#/27/new-4 |
| 2026-10-01T05:43:35Z | S1 AUTO end-to-end | AUTO advanced 30→31 · clip == slide mapping | PASS | bar clip NAR-07 vs expected NAR-07 for slide 31 (2 ms) |
| 2026-10-01T05:43:35Z | S1 AUTO end-to-end | AUTO advanced 30→31 · audio playing ≤1 s | PASS | paused=false src=guide-07-impact-and-funding-vWkiINp1IS.mp3 ct=22.22 playingEvents=0 rejected=none (5 ms) |
| 2026-10-01T05:43:35Z | S1 AUTO end-to-end | AUTO advanced 30→31 · active cue narrates visible slide | PASS | cue #5 (slide 31) vs visible 31; audio 22.23s; expected first cue #5 |
| 2026-10-01T05:43:36Z | S1 AUTO end-to-end | AUTO advanced 30→31 · audio progressing | PASS | currentTime 22.72 → 24.13 |
| 2026-10-01T05:43:36Z | S1 AUTO end-to-end | AUTO advanced 30→31 · CC caption == active cue text | PASS | caption="Universal API licenses, marketplace revenue share " cue="Universal API licenses, marketplace revenue share " |
| 2026-10-01T05:43:36Z | S1 AUTO end-to-end | AUTO advanced 30→31 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=31 cue=#5 (slide 31) visible=31 transcript chars=447 |
| 2026-10-01T05:43:38Z | S1 AUTO end-to-end | AUTO advanced 31→34 · slide on screen | PASS | visible slide 34 (expected 34) hash=#/27/new-7 |
| 2026-10-01T05:43:38Z | S1 AUTO end-to-end | AUTO advanced 31→34 · clip == slide mapping | PASS | bar clip NAR-08 vs expected NAR-08 for slide 34 (14 ms) |
| 2026-10-01T05:43:38Z | S1 AUTO end-to-end | AUTO advanced 31→34 · audio playing ≤1 s | PASS | paused=false src=guide-08-athar-os-Ib4oKe91OD.mp3 ct=0.07 playingEvents=0 rejected=none (43 ms) |
| 2026-10-01T05:43:38Z | S1 AUTO end-to-end | AUTO advanced 31→34 · active cue narrates visible slide | PASS | cue #1 (slide 34) vs visible 34; audio 0.57s; expected first cue #1 |
| 2026-10-01T05:43:38Z | S1 AUTO end-to-end | AUTO advanced 31→34 · audio progressing | PASS | currentTime 1.08 → 2.48 |
| 2026-10-01T05:43:38Z | S1 AUTO end-to-end | AUTO advanced 31→34 · CC caption == active cue text | PASS | caption="Section eight, Athar OS." cue="Section eight, Athar OS." |
| 2026-10-01T05:43:38Z | S1 AUTO end-to-end | AUTO advanced 31→34 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=34 cue=#1 (slide 34) visible=34 transcript chars=375 |
| 2026-10-01T05:43:38Z | S1 AUTO end-to-end | AUTO advanced 34→36 · slide on screen | PASS | visible slide 36 (expected 36) hash=#/27/new-9 |
| 2026-10-01T05:43:38Z | S1 AUTO end-to-end | AUTO advanced 34→36 · clip == slide mapping | PASS | bar clip NAR-08 vs expected NAR-08 for slide 36 (1 ms) |
| 2026-10-01T05:43:38Z | S1 AUTO end-to-end | AUTO advanced 34→36 · audio playing ≤1 s | PASS | paused=false src=guide-08-athar-os-Ib4oKe91OD.mp3 ct=3.05 playingEvents=0 rejected=none (9 ms) |
| 2026-10-01T05:43:38Z | S1 AUTO end-to-end | AUTO advanced 34→36 · active cue narrates visible slide | PASS | cue #2 (slide 36) vs visible 36; audio 3.06s; expected first cue #2 |
| 2026-10-01T05:43:39Z | S1 AUTO end-to-end | AUTO advanced 34→36 · audio progressing | PASS | currentTime 3.55 → 4.96 |
| 2026-10-01T05:43:39Z | S1 AUTO end-to-end | AUTO advanced 34→36 · CC caption == active cue text | PASS | caption="The roadmap runs now in Q4, 2026, next in 2027 and" cue="The roadmap runs now in Q4, 2026, next in 2027 and" |
| 2026-10-01T05:43:39Z | S1 AUTO end-to-end | AUTO advanced 34→36 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=36 cue=#2 (slide 36) visible=36 transcript chars=375 |
| 2026-10-01T05:43:40Z | S1 AUTO end-to-end | AUTO advanced 36→38 · slide on screen | PASS | visible slide 38 (expected 38) hash=#/27/new-11 |
| 2026-10-01T05:43:40Z | S1 AUTO end-to-end | AUTO advanced 36→38 · clip == slide mapping | PASS | bar clip NAR-08 vs expected NAR-08 for slide 38 (1 ms) |
| 2026-10-01T05:43:40Z | S1 AUTO end-to-end | AUTO advanced 36→38 · audio playing ≤1 s | PASS | paused=false src=guide-08-athar-os-Ib4oKe91OD.mp3 ct=8.44 playingEvents=0 rejected=none (7 ms) |
| 2026-10-01T05:43:40Z | S1 AUTO end-to-end | AUTO advanced 36→38 · active cue narrates visible slide | PASS | cue #3 (slide 38) vs visible 38; audio 8.45s; expected first cue #3 |
| 2026-10-01T05:43:40Z | S1 AUTO end-to-end | AUTO advanced 36→38 · audio progressing | PASS | currentTime 8.92 → 10.34 |
| 2026-10-01T05:43:40Z | S1 AUTO end-to-end | AUTO advanced 36→38 · CC caption == active cue text | PASS | caption="Lebanon, Access, 1 million Lebanese AI experts at " cue="Lebanon, Access, 1 million Lebanese AI experts at " |
| 2026-10-01T05:43:40Z | S1 AUTO end-to-end | AUTO advanced 36→38 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=38 cue=#4 (slide 38) visible=38 transcript chars=375 |
| 2026-10-01T05:43:46Z | S1 AUTO end-to-end | AUTO advanced 38→39 · slide on screen | PASS | visible slide 39 (expected 39) hash=#/28 |
| 2026-10-01T05:43:46Z | S1 AUTO end-to-end | AUTO advanced 38→39 · clip == slide mapping | PASS | bar clip NAR-09 vs expected NAR-09 for slide 39 (1 ms) |
| 2026-10-01T05:43:46Z | S1 AUTO end-to-end | AUTO advanced 38→39 · audio playing ≤1 s | PASS | paused=false src=guide-09-join-the-pact-Hx4Ywy843S.mp3 ct=0.08 playingEvents=0 rejected=none (4 ms) |
| 2026-10-01T05:43:46Z | S1 AUTO end-to-end | AUTO advanced 38→39 · active cue narrates visible slide | PASS | cue #1 (slide 39) vs visible 39; audio 0.72s; expected first cue #1 |
| 2026-10-01T05:43:47Z | S1 AUTO end-to-end | AUTO advanced 38→39 · audio progressing | PASS | currentTime 1.23 → 2.65 |
| 2026-10-01T05:43:47Z | S1 AUTO end-to-end | AUTO advanced 38→39 · CC caption == active cue text | PASS | caption="You have seen the agreement, the community model, " cue="You have seen the agreement, the community model, " |
| 2026-10-01T05:43:47Z | S1 AUTO end-to-end | AUTO advanced 38→39 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=39 cue=#2 (slide 39) visible=39 transcript chars=384 |
| 2026-10-01T05:43:53Z | S1 AUTO end-to-end | reached slide 39 and the last clip ended | PASS | n=39 ended=true changes=22 in 63 s (playbackRate 4×) |
| 2026-10-01T05:43:53Z | S1 AUTO end-to-end | every section hand-over waited for the clip to end | PASS | 1→2 NAR-00→NAR-01 endedBefore=true; 3→4 NAR-01→NAR-02 endedBefore=true; 11→13 NAR-02→NAR-03 endedBefore=true; 17→19 NAR-03→NAR-04 endedBefore=true; 20→21 NAR-04→NAR-05 endedBefore=true; 23→26 NAR-05→NAR-06 endedBefore=tr |
| 2026-10-01T05:43:56Z | S2 keyboard mid-play + rapid skip | guide on slide 1 · slide on screen | PASS | visible slide 1 (expected 1) hash=#/01 |
| 2026-10-01T05:43:56Z | S2 keyboard mid-play + rapid skip | guide on slide 1 · clip == slide mapping | PASS | bar clip NAR-00 vs expected NAR-00 for slide 1 (4 ms) |
| 2026-10-01T05:43:56Z | S2 keyboard mid-play + rapid skip | guide on slide 1 · audio playing ≤1 s | PASS | paused=false src=guide-00-welcome-lhbIUXFwLO.mp3 ct=0.02 playingEvents=1 rejected=none (12 ms) |
| 2026-10-01T05:43:56Z | S2 keyboard mid-play + rapid skip | guide on slide 1 · active cue narrates visible slide | PASS | cue #1 (slide 1) vs visible 1; audio 0.03s; expected first cue #1 |
| 2026-10-01T05:43:56Z | S2 keyboard mid-play + rapid skip | guide on slide 1 · audio progressing | PASS | currentTime 0.24 → 1.64 |
| 2026-10-01T05:43:56Z | S2 keyboard mid-play + rapid skip | guide on slide 1 · CC caption == active cue text | PASS | caption="Welcome to the Athar Open Agentic Pact, a communit" cue="Welcome to the Athar Open Agentic Pact, a communit" |
| 2026-10-01T05:43:56Z | S2 keyboard mid-play + rapid skip | guide on slide 1 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=1 cue=#1 (slide 1) visible=1 transcript chars=258 |
| 2026-10-01T05:43:56Z | S2 keyboard mid-play + rapid skip | ArrowRight 1→2 (new clip) · slide on screen | PASS | visible slide 2 (expected 2) hash=#/02 |
| 2026-10-01T05:43:56Z | S2 keyboard mid-play + rapid skip | ArrowRight 1→2 (new clip) · clip == slide mapping | PASS | bar clip NAR-01 vs expected NAR-01 for slide 2 (69 ms) |
| 2026-10-01T05:43:56Z | S2 keyboard mid-play + rapid skip | ArrowRight 1→2 (new clip) · audio playing ≤1 s | PASS | paused=false src=guide-01-the-pact-df1pHtGsVr.mp3 ct=0.05 playingEvents=1 rejected=none (76 ms) |
| 2026-10-01T05:43:56Z | S2 keyboard mid-play + rapid skip | ArrowRight 1→2 (new clip) · active cue narrates visible slide | PASS | cue #1 (slide 2) vs visible 2; audio 0.07s; expected first cue #1 |
| 2026-10-01T05:43:57Z | S2 keyboard mid-play + rapid skip | ArrowRight 1→2 (new clip) · audio progressing | PASS | currentTime 0.23 → 1.65 |
| 2026-10-01T05:43:57Z | S2 keyboard mid-play + rapid skip | ArrowRight 1→2 (new clip) · CC caption == active cue text | PASS | caption="Section one, the Pact." cue="Section one, the Pact." |
| 2026-10-01T05:43:57Z | S2 keyboard mid-play + rapid skip | ArrowRight 1→2 (new clip) · transcript highlight == on-screen slide | PASS | highlighted sentence slide=2 cue=#1 (slide 2) visible=2 transcript chars=363 |
| 2026-10-01T05:43:57Z | S2 keyboard mid-play + rapid skip | ArrowRight 2→3 (same clip, other sentence) · slide on screen | PASS | visible slide 3 (expected 3) hash=#/03 |
| 2026-10-01T05:43:57Z | S2 keyboard mid-play + rapid skip | ArrowRight 2→3 (same clip, other sentence) · clip == slide mapping | PASS | bar clip NAR-01 vs expected NAR-01 for slide 3 (2 ms) |
| 2026-10-01T05:43:57Z | S2 keyboard mid-play + rapid skip | ArrowRight 2→3 (same clip, other sentence) · audio playing ≤1 s | PASS | paused=false src=guide-01-the-pact-df1pHtGsVr.mp3 ct=1.88 playingEvents=0 rejected=none (7 ms) |
| 2026-10-01T05:43:57Z | S2 keyboard mid-play + rapid skip | ArrowRight 2→3 (same clip, other sentence) · active cue narrates visible slide | PASS | cue #3 (slide 3) vs visible 3; audio 12.17s; expected first cue #3 |
| 2026-10-01T05:43:57Z | S2 keyboard mid-play + rapid skip | ArrowRight 2→3 (same clip, other sentence) · audio progressing | PASS | currentTime 12.44 → 13.86 |
| 2026-10-01T05:43:57Z | S2 keyboard mid-play + rapid skip | ArrowRight 2→3 (same clip, other sentence) · CC caption == active cue text | PASS | caption="It is a community proposal from ODA and AI Rev, de" cue="It is a community proposal from ODA and AI Rev, de" |
| 2026-10-01T05:43:57Z | S2 keyboard mid-play + rapid skip | ArrowRight 2→3 (same clip, other sentence) · transcript highlight == on-screen slide | PASS | highlighted sentence slide=3 cue=#3 (slide 3) visible=3 transcript chars=363 |
| 2026-10-01T05:43:58Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×5 → 8 · slide on screen | PASS | visible slide 8 (expected 8) hash=#/08 |
| 2026-10-01T05:43:58Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×5 → 8 · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 8 (2 ms) |
| 2026-10-01T05:43:58Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×5 → 8 · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=2.36 playingEvents=0 rejected=none (6 ms) |
| 2026-10-01T05:43:58Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×5 → 8 · active cue narrates visible slide | PASS | cue #2 (slide 7) vs visible 8; audio 2.36s; expected first cue #2 |
| 2026-10-01T05:43:58Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×5 → 8 · audio progressing | PASS | currentTime 2.84 → 4.27 |
| 2026-10-01T05:43:58Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×5 → 8 · CC caption == active cue text | PASS | caption="Every webinar, chapter event and challenge should " cue="Every webinar, chapter event and challenge should " |
| 2026-10-01T05:43:58Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×5 → 8 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=7 cue=#2 (slide 7) visible=8 transcript chars=409 |
| 2026-10-01T05:43:58Z | S2 keyboard mid-play + rapid skip | ArrowLeft ×2 → 6 · slide on screen | PASS | visible slide 6 (expected 6) hash=#/06 |
| 2026-10-01T05:43:58Z | S2 keyboard mid-play + rapid skip | ArrowLeft ×2 → 6 · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 6 (2 ms) |
| 2026-10-01T05:43:58Z | S2 keyboard mid-play + rapid skip | ArrowLeft ×2 → 6 · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=0.01 playingEvents=0 rejected=none (6 ms) |
| 2026-10-01T05:43:58Z | S2 keyboard mid-play + rapid skip | ArrowLeft ×2 → 6 · active cue narrates visible slide | PASS | cue #1 (slide 4) vs visible 6; audio 0.01s; expected first cue #1 |
| 2026-10-01T05:43:59Z | S2 keyboard mid-play + rapid skip | ArrowLeft ×2 → 6 · audio progressing | PASS | currentTime 0.18 → 1.59 |
| 2026-10-01T05:43:59Z | S2 keyboard mid-play + rapid skip | ArrowLeft ×2 → 6 · CC caption == active cue text | PASS | caption="Section two, the Community Model." cue="Section two, the Community Model." |
| 2026-10-01T05:43:59Z | S2 keyboard mid-play + rapid skip | ArrowLeft ×2 → 6 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=4 cue=#1 (slide 4) visible=6 transcript chars=409 |
| 2026-10-01T05:43:59Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×7 across sections → 13 · slide on screen | PASS | visible slide 13 (expected 13) hash=#/13 |
| 2026-10-01T05:43:59Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×7 across sections → 13 · clip == slide mapping | PASS | bar clip NAR-03 vs expected NAR-03 for slide 13 (1 ms) |
| 2026-10-01T05:43:59Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×7 across sections → 13 · audio playing ≤1 s | PASS | paused=false src=guide-03-six-pillars-yxVqZJ2k1a.mp3 ct=0 playingEvents=0 rejected=none (11 ms) |
| 2026-10-01T05:43:59Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×7 across sections → 13 · active cue narrates visible slide | PASS | cue #1 (slide 13) vs visible 13; audio 0s; expected first cue #1 |
| 2026-10-01T05:44:00Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×7 across sections → 13 · audio progressing | PASS | currentTime 0.18 → 1.55 |
| 2026-10-01T05:44:00Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×7 across sections → 13 · CC caption == active cue text | PASS | caption="Section three, six pillars." cue="Section three, six pillars." |
| 2026-10-01T05:44:00Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×7 across sections → 13 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=13 cue=#1 (slide 13) visible=13 transcript chars=293 |
| 2026-10-01T05:44:00Z | S2 keyboard mid-play + rapid skip | End → 39 · slide on screen | PASS | visible slide 39 (expected 39) hash=#/28 |
| 2026-10-01T05:44:00Z | S2 keyboard mid-play + rapid skip | End → 39 · clip == slide mapping | PASS | bar clip NAR-09 vs expected NAR-09 for slide 39 (68 ms) |
| 2026-10-01T05:44:00Z | S2 keyboard mid-play + rapid skip | End → 39 · audio playing ≤1 s | PASS | paused=false src=guide-09-join-the-pact-Hx4Ywy843S.mp3 ct=0 playingEvents=1 rejected=none (79 ms) |
| 2026-10-01T05:44:00Z | S2 keyboard mid-play + rapid skip | End → 39 · active cue narrates visible slide | PASS | cue #1 (slide 39) vs visible 39; audio 0.03s; expected first cue #1 |
| 2026-10-01T05:44:00Z | S2 keyboard mid-play + rapid skip | End → 39 · audio progressing | PASS | currentTime 0.23 → 1.62 |
| 2026-10-01T05:44:00Z | S2 keyboard mid-play + rapid skip | End → 39 · CC caption == active cue text | PASS | caption="Join the Pact." cue="Join the Pact." |
| 2026-10-01T05:44:00Z | S2 keyboard mid-play + rapid skip | End → 39 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=39 cue=#1 (slide 39) visible=39 transcript chars=384 |
| 2026-10-01T05:44:00Z | S2 keyboard mid-play + rapid skip | Home → 1 · slide on screen | PASS | visible slide 1 (expected 1) hash=#/01 |
| 2026-10-01T05:44:00Z | S2 keyboard mid-play + rapid skip | Home → 1 · clip == slide mapping | PASS | bar clip NAR-00 vs expected NAR-00 for slide 1 (63 ms) |
| 2026-10-01T05:44:00Z | S2 keyboard mid-play + rapid skip | Home → 1 · audio playing ≤1 s | PASS | paused=false src=guide-00-welcome-lhbIUXFwLO.mp3 ct=0.05 playingEvents=1 rejected=none (68 ms) |
| 2026-10-01T05:44:00Z | S2 keyboard mid-play + rapid skip | Home → 1 · active cue narrates visible slide | PASS | cue #1 (slide 1) vs visible 1; audio 0.06s; expected first cue #1 |
| 2026-10-01T05:44:01Z | S2 keyboard mid-play + rapid skip | Home → 1 · audio progressing | PASS | currentTime 0.25 → 1.65 |
| 2026-10-01T05:44:01Z | S2 keyboard mid-play + rapid skip | Home → 1 · CC caption == active cue text | PASS | caption="Welcome to the Athar Open Agentic Pact, a communit" cue="Welcome to the Athar Open Agentic Pact, a communit" |
| 2026-10-01T05:44:01Z | S2 keyboard mid-play + rapid skip | Home → 1 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=1 cue=#1 (slide 1) visible=1 transcript chars=258 |
| 2026-10-01T05:44:03Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×27 → 28 (virtual slides) · slide on screen | PASS | visible slide 28 (expected 28) hash=#/27/new-1 |
| 2026-10-01T05:44:03Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×27 → 28 (virtual slides) · clip == slide mapping | PASS | bar clip NAR-07 vs expected NAR-07 for slide 28 (18 ms) |
| 2026-10-01T05:44:03Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×27 → 28 (virtual slides) · audio playing ≤1 s | PASS | paused=false src=guide-07-impact-and-funding-vWkiINp1IS.mp3 ct=0.06 playingEvents=1 rejected=none (49 ms) |
| 2026-10-01T05:44:03Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×27 → 28 (virtual slides) · active cue narrates visible slide | PASS | cue #1 (slide 28) vs visible 28; audio 0.08s; expected first cue #1 |
| 2026-10-01T05:44:03Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×27 → 28 (virtual slides) · audio progressing | PASS | currentTime 0.38 → 1.8 |
| 2026-10-01T05:44:03Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×27 → 28 (virtual slides) · CC caption == active cue text | PASS | caption="Section seven, Impact and Funding." cue="Section seven, Impact and Funding." |
| 2026-10-01T05:44:03Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×27 → 28 (virtual slides) · transcript highlight == on-screen slide | PASS | highlighted sentence slide=28 cue=#1 (slide 28) visible=28 transcript chars=447 |
| 2026-10-01T05:44:05Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×10 → 38 · slide on screen | PASS | visible slide 38 (expected 38) hash=#/27/new-11 |
| 2026-10-01T05:44:05Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×10 → 38 · clip == slide mapping | PASS | bar clip NAR-08 vs expected NAR-08 for slide 38 (2 ms) |
| 2026-10-01T05:44:05Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×10 → 38 · audio playing ≤1 s | PASS | paused=false src=guide-08-athar-os-Ib4oKe91OD.mp3 ct=8.02 playingEvents=0 rejected=none (21 ms) |
| 2026-10-01T05:44:05Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×10 → 38 · active cue narrates visible slide | PASS | cue #3 (slide 38) vs visible 38; audio 8.03s; expected first cue #3 |
| 2026-10-01T05:44:05Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×10 → 38 · audio progressing | PASS | currentTime 8.3 → 9.73 |
| 2026-10-01T05:44:05Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×10 → 38 · CC caption == active cue text | PASS | caption="Lebanon, Access, 1 million Lebanese AI experts at " cue="Lebanon, Access, 1 million Lebanese AI experts at " |
| 2026-10-01T05:44:05Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×10 → 38 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=38 cue=#4 (slide 38) visible=38 transcript chars=375 |
| 2026-10-01T05:44:08Z | S3 N shortcut | N starts narration on slide 5 · slide on screen | PASS | visible slide 5 (expected 5) hash=#/05 |
| 2026-10-01T05:44:08Z | S3 N shortcut | N starts narration on slide 5 · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 5 (5 ms) |
| 2026-10-01T05:44:09Z | S3 N shortcut | N starts narration on slide 5 · audio playing ≤1 s | **FAIL** | paused=true src=guide-02-community-model-9gUnFBtxrM.mp3 ct=0 playingEvents=0 rejected=none (1114 ms) |
| 2026-10-01T05:44:09Z | S3 N shortcut | N starts narration on slide 5 · active cue narrates visible slide | PASS | cue #1 (slide 4) vs visible 5; audio 0s; expected first cue #1 |
| 2026-10-01T05:44:09Z | S3 N shortcut | N starts narration on slide 5 · CC caption == active cue text | PASS | caption="Section two, the Community Model." cue="Section two, the Community Model." |
| 2026-10-01T05:44:09Z | S3 N shortcut | N starts narration on slide 5 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=4 cue=#1 (slide 4) visible=5 transcript chars=409 |
| 2026-10-01T05:44:10Z | S3 N shortcut | N pauses narration | **FAIL** | paused=false narrating=true (was on slide 5) |
| 2026-10-01T05:44:11Z | S3 N shortcut | paused + ArrowRight: caption/transcript follow the slide without audio | **FAIL** | n=8 (expected 8) clip=NAR-02 paused=false cue=#2 (slide 7) highlight slide=7 |
| 2026-10-01T05:44:11Z | S3 N shortcut | N resumes at the sentence of the slide on screen (8) · slide on screen | PASS | visible slide 8 (expected 8) hash=#/08 |
| 2026-10-01T05:44:11Z | S3 N shortcut | N resumes at the sentence of the slide on screen (8) · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 8 (19 ms) |
| 2026-10-01T05:44:12Z | S3 N shortcut | N resumes at the sentence of the slide on screen (8) · audio playing ≤1 s | **FAIL** | paused=true src=guide-02-community-model-9gUnFBtxrM.mp3 ct=6.77 playingEvents=0 rejected=none (1088 ms) |
| 2026-10-01T05:44:12Z | S3 N shortcut | N resumes at the sentence of the slide on screen (8) · active cue narrates visible slide | PASS | cue #2 (slide 7) vs visible 8; audio 6.77s; expected first cue #2 |
| 2026-10-01T05:44:12Z | S3 N shortcut | N resumes at the sentence of the slide on screen (8) · CC caption == active cue text | PASS | caption="Every webinar, chapter event and challenge should " cue="Every webinar, chapter event and challenge should " |
| 2026-10-01T05:44:12Z | S3 N shortcut | N resumes at the sentence of the slide on screen (8) · transcript highlight == on-screen slide | PASS | highlighted sentence slide=7 cue=#2 (slide 7) visible=8 transcript chars=409 |
| 2026-10-01T05:44:14Z | S4 Esc overview + deep links + ?intro=1 | guide on slide 2 · slide on screen | PASS | visible slide 2 (expected 2) hash=#/02 |
| 2026-10-01T05:44:14Z | S4 Esc overview + deep links + ?intro=1 | guide on slide 2 · clip == slide mapping | PASS | bar clip NAR-01 vs expected NAR-01 for slide 2 (1 ms) |
| 2026-10-01T05:44:14Z | S4 Esc overview + deep links + ?intro=1 | guide on slide 2 · audio playing ≤1 s | PASS | paused=false src=guide-01-the-pact-df1pHtGsVr.mp3 ct=0 playingEvents=0 rejected=none (6 ms) |
| 2026-10-01T05:44:14Z | S4 Esc overview + deep links + ?intro=1 | guide on slide 2 · active cue narrates visible slide | PASS | cue #1 (slide 2) vs visible 2; audio 0.02s; expected first cue #1 |
| 2026-10-01T05:44:14Z | S4 Esc overview + deep links + ?intro=1 | guide on slide 2 · audio progressing | PASS | currentTime 0.2 → 1.62 |
| 2026-10-01T05:44:14Z | S4 Esc overview + deep links + ?intro=1 | guide on slide 2 · CC caption == active cue text | PASS | caption="Section one, the Pact." cue="Section one, the Pact." |
| 2026-10-01T05:44:14Z | S4 Esc overview + deep links + ?intro=1 | guide on slide 2 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=2 cue=#1 (slide 2) visible=2 transcript chars=363 |
| 2026-10-01T05:44:14Z | S4 Esc overview + deep links + ?intro=1 | Esc opens the overview | PASS | overview dialog visible |
| 2026-10-01T05:44:14Z | S4 Esc overview + deep links + ?intro=1 | overview grid has tiles | PASS | 39 tiles |
| 2026-10-01T05:44:14Z | S4 Esc overview + deep links + ?intro=1 | overview tile → slide 7 · slide on screen | PASS | visible slide 7 (expected 7) hash=#/07 |
| 2026-10-01T05:44:14Z | S4 Esc overview + deep links + ?intro=1 | overview tile → slide 7 · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 7 (67 ms) |
| 2026-10-01T05:44:14Z | S4 Esc overview + deep links + ?intro=1 | overview tile → slide 7 · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=2.24 playingEvents=1 rejected=none (86 ms) |
| 2026-10-01T05:44:14Z | S4 Esc overview + deep links + ?intro=1 | overview tile → slide 7 · active cue narrates visible slide | PASS | cue #2 (slide 7) vs visible 7; audio 2.24s; expected first cue #2 |
| 2026-10-01T05:44:15Z | S4 Esc overview + deep links + ?intro=1 | overview tile → slide 7 · audio progressing | PASS | currentTime 2.47 → 3.88 |
| 2026-10-01T05:44:15Z | S4 Esc overview + deep links + ?intro=1 | overview tile → slide 7 · CC caption == active cue text | PASS | caption="Every webinar, chapter event and challenge should " cue="Every webinar, chapter event and challenge should " |
| 2026-10-01T05:44:15Z | S4 Esc overview + deep links + ?intro=1 | overview tile → slide 7 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=7 cue=#2 (slide 7) visible=7 transcript chars=409 |
| 2026-10-01T05:44:15Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/20 · slide on screen | PASS | visible slide 20 (expected 20) hash=#/20 |
| 2026-10-01T05:44:15Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/20 · clip == slide mapping | PASS | bar clip NAR-04 vs expected NAR-04 for slide 20 (63 ms) |
| 2026-10-01T05:44:15Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/20 · audio playing ≤1 s | PASS | paused=false src=guide-04-pledge-and-signing-PWeXZj1Rgc.mp3 ct=5.15 playingEvents=1 rejected=none (79 ms) |
| 2026-10-01T05:44:15Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/20 · active cue narrates visible slide | PASS | cue #3 (slide 20) vs visible 20; audio 5.15s; expected first cue #3 |
| 2026-10-01T05:44:15Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/20 · audio progressing | PASS | currentTime 5.36 → 6.77 |
| 2026-10-01T05:44:15Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/20 · CC caption == active cue text | PASS | caption="A signatory chooses its roles, sign, govern, build" cue="A signatory chooses its roles, sign, govern, build" |
| 2026-10-01T05:44:15Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/20 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=20 cue=#3 (slide 20) visible=20 transcript chars=391 |
| 2026-10-01T05:44:16Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/27/new-4 → 31 · slide on screen | PASS | visible slide 31 (expected 31) hash=#/27/new-4 |
| 2026-10-01T05:44:16Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/27/new-4 → 31 · clip == slide mapping | PASS | bar clip NAR-07 vs expected NAR-07 for slide 31 (6 ms) |
| 2026-10-01T05:44:16Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/27/new-4 → 31 · audio playing ≤1 s | PASS | paused=false src=guide-07-impact-and-funding-vWkiINp1IS.mp3 ct=21.46 playingEvents=0 rejected=none (108 ms) |
| 2026-10-01T05:44:16Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/27/new-4 → 31 · active cue narrates visible slide | PASS | cue #5 (slide 31) vs visible 31; audio 21.46s; expected first cue #5 |
| 2026-10-01T05:44:16Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/27/new-4 → 31 · audio progressing | PASS | currentTime 21.72 → 23.14 |
| 2026-10-01T05:44:16Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/27/new-4 → 31 · CC caption == active cue text | PASS | caption="Universal API licenses, marketplace revenue share " cue="Universal API licenses, marketplace revenue share " |
| 2026-10-01T05:44:16Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/27/new-4 → 31 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=31 cue=#5 (slide 31) visible=31 transcript chars=447 |
| 2026-10-01T05:44:17Z | S4 Esc overview + deep links + ?intro=1 | #slide-07 alias deep link → slide 7 | PASS | n=7 clip=NAR-02 hash=#/07 |
| 2026-10-01T05:44:18Z | S4 Esc overview + deep links + ?intro=1 | full reload on #/25 bypasses the intro and maps clip | PASS | n=25 intro=false clip=NAR-05 |
| 2026-10-01T05:44:19Z | S4 Esc overview + deep links + ?intro=1 | ?intro=1 forces the intro film | PASS | intro=true |
| 2026-10-01T05:44:19Z | S4 Esc overview + deep links + ?intro=1 | no guide narration plays during the intro film | PASS | guide play() calls during intro: 0 |
| 2026-10-01T05:44:20Z | S4 Esc overview + deep links + ?intro=1 | after the intro the deck is on slide 1 with NAR-00 mapped | PASS | n=1 clip=NAR-00 |
| 2026-10-01T05:44:22Z | S5 slide-38 country tabs | guide on slide 38 · slide on screen | PASS | visible slide 38 (expected 38) hash=#/27/new-11 |
| 2026-10-01T05:44:22Z | S5 slide-38 country tabs | guide on slide 38 · clip == slide mapping | PASS | bar clip NAR-08 vs expected NAR-08 for slide 38 (2 ms) |
| 2026-10-01T05:44:23Z | S5 slide-38 country tabs | guide on slide 38 · audio playing ≤1 s | **FAIL** | paused=true src=guide-08-athar-os-Ib4oKe91OD.mp3 ct=7.96 playingEvents=0 rejected=none (1079 ms) |
| 2026-10-01T05:44:23Z | S5 slide-38 country tabs | guide on slide 38 · active cue narrates visible slide | PASS | cue #3 (slide 38) vs visible 38; audio 7.96s; expected first cue #3 |
| 2026-10-01T05:44:23Z | S5 slide-38 country tabs | guide on slide 38 · CC caption == active cue text | PASS | caption="Nations empowered." cue="Nations empowered." |
| 2026-10-01T05:44:23Z | S5 slide-38 country tabs | guide on slide 38 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=38 cue=#3 (slide 38) visible=38 transcript chars=375 |
| 2026-10-01T05:44:23Z | S5 slide-38 country tabs | tab in → narration seeks to its sentence (cue #5) | PASS | cue=#5 audio=15.13s tab aria-selected=true paused=true |
| 2026-10-01T05:44:23Z | S5 slide-38 country tabs | tab ke → narration seeks to its sentence (cue #6) | PASS | cue=#6 audio=21.84s tab aria-selected=true paused=true |
| 2026-10-01T05:44:24Z | S5 slide-38 country tabs | tab lb → narration seeks to its sentence (cue #4) | PASS | cue=#4 audio=9.58s tab aria-selected=true paused=true |
| 2026-10-01T05:44:26Z | S6 Replay intro and return | guide on slide 4 · slide on screen | PASS | visible slide 4 (expected 4) hash=#/04 |
| 2026-10-01T05:44:26Z | S6 Replay intro and return | guide on slide 4 · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 4 (1 ms) |
| 2026-10-01T05:44:26Z | S6 Replay intro and return | guide on slide 4 · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=0 playingEvents=0 rejected=none (5 ms) |
| 2026-10-01T05:44:26Z | S6 Replay intro and return | guide on slide 4 · active cue narrates visible slide | PASS | cue #1 (slide 4) vs visible 4; audio 0s; expected first cue #1 |
| 2026-10-01T05:44:27Z | S6 Replay intro and return | guide on slide 4 · audio progressing | PASS | currentTime 0.16 → 1.58 |
| 2026-10-01T05:44:27Z | S6 Replay intro and return | guide on slide 4 · CC caption == active cue text | PASS | caption="Section two, the Community Model." cue="Section two, the Community Model." |
| 2026-10-01T05:44:27Z | S6 Replay intro and return | guide on slide 4 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=4 cue=#1 (slide 4) visible=4 transcript chars=409 |
| 2026-10-01T05:44:27Z | S6 Replay intro and return | Replay intro opens the intro film | PASS | intro-gate shown |
| 2026-10-01T05:44:28Z | S6 Replay intro and return | guide/narration is silent while the intro film plays | PASS | audio=guide-02-community-model-9gUnFBtxrM.mp3 paused=true play() calls= |
| 2026-10-01T05:44:31Z | S6 Replay intro and return | after the replayed intro the guide narrates the slide it returned to (4) · slide on screen | **FAIL** | visible slide 7 (expected 4) hash=#/07 |
| 2026-10-01T05:44:31Z | S6 Replay intro and return | after the replayed intro the guide narrates the slide it returned to (4) · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 4 (1549 ms) |
| 2026-10-01T05:44:31Z | S6 Replay intro and return | after the replayed intro the guide narrates the slide it returned to (4) · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=9.42 playingEvents=0 rejected=none (1585 ms) |
| 2026-10-01T05:44:32Z | S6 Replay intro and return | after the replayed intro the guide narrates the slide it returned to (4) · active cue narrates visible slide | **FAIL** | cue #3 (slide 11) vs visible 4; audio 13.99s; expected first cue #1 |
| 2026-10-01T05:44:32Z | S6 Replay intro and return | after the replayed intro the guide narrates the slide it returned to (4) · audio progressing | PASS | currentTime 14.72 → 16.18 |
| 2026-10-01T05:44:32Z | S6 Replay intro and return | after the replayed intro the guide narrates the slide it returned to (4) · CC caption == active cue text | PASS | caption="Learn agentic AI, build a useful agent through the" cue="Learn agentic AI, build a useful agent through the" |
| 2026-10-01T05:44:32Z | S6 Replay intro and return | after the replayed intro the guide narrates the slide it returned to (4) · transcript highlight == on-screen slide | **FAIL** | highlighted sentence slide=11 cue=#3 (slide 11) visible=4 transcript chars=409 |
| 2026-10-01T05:44:35Z | S7 tab hidden/visible + audio-focus loss | guide on slide 13 · slide on screen | PASS | visible slide 13 (expected 13) hash=#/13 |
| 2026-10-01T05:44:35Z | S7 tab hidden/visible + audio-focus loss | guide on slide 13 · clip == slide mapping | PASS | bar clip NAR-03 vs expected NAR-03 for slide 13 (8 ms) |
| 2026-10-01T05:44:36Z | S7 tab hidden/visible + audio-focus loss | guide on slide 13 · audio playing ≤1 s | **FAIL** | paused=true src=guide-03-six-pillars-yxVqZJ2k1a.mp3 ct=0 playingEvents=0 rejected=none (1100 ms) |
| 2026-10-01T05:44:36Z | S7 tab hidden/visible + audio-focus loss | guide on slide 13 · active cue narrates visible slide | PASS | cue #1 (slide 13) vs visible 13; audio 0s; expected first cue #1 |
| 2026-10-01T05:44:36Z | S7 tab hidden/visible + audio-focus loss | guide on slide 13 · CC caption == active cue text | PASS | caption="Section three, six pillars." cue="Section three, six pillars." |
| 2026-10-01T05:44:36Z | S7 tab hidden/visible + audio-focus loss | guide on slide 13 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=13 cue=#1 (slide 13) visible=13 transcript chars=293 |
| 2026-10-01T05:44:37Z | S7 tab hidden/visible + audio-focus loss | visible again after 2 hidden slide changes → narrates slide 15 · slide on screen | PASS | visible slide 15 (expected 15) hash=#/15 |
| 2026-10-01T05:44:37Z | S7 tab hidden/visible + audio-focus loss | visible again after 2 hidden slide changes → narrates slide 15 · clip == slide mapping | PASS | bar clip NAR-03 vs expected NAR-03 for slide 15 (2 ms) |
| 2026-10-01T05:44:38Z | S7 tab hidden/visible + audio-focus loss | visible again after 2 hidden slide changes → narrates slide 15 · audio playing ≤1 s | **FAIL** | paused=true src=guide-03-six-pillars-yxVqZJ2k1a.mp3 ct=8.61 playingEvents=0 rejected=none (1096 ms) |
| 2026-10-01T05:44:38Z | S7 tab hidden/visible + audio-focus loss | visible again after 2 hidden slide changes → narrates slide 15 · active cue narrates visible slide | PASS | cue #3 (slide 14) vs visible 15; audio 8.61s; expected first cue #3 |
| 2026-10-01T05:44:38Z | S7 tab hidden/visible + audio-focus loss | visible again after 2 hidden slide changes → narrates slide 15 · CC caption == active cue text | PASS | caption="Reusable skills are built once and shared across t" cue="Reusable skills are built once and shared across t" |
| 2026-10-01T05:44:38Z | S7 tab hidden/visible + audio-focus loss | visible again after 2 hidden slide changes → narrates slide 15 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=14 cue=#3 (slide 14) visible=15 transcript chars=293 |
| 2026-10-01T05:44:39Z | S7 tab hidden/visible + audio-focus loss | external pause recorded | PASS | paused=true |
| 2026-10-01T05:44:40Z | S7 tab hidden/visible + audio-focus loss | narration resumes after focus regain (audio-focus loss) | **FAIL** | paused=true after 1522 ms |
| 2026-10-01T05:44:43Z | S8 phone 390×844 | phone: guide on slide 2 · slide on screen | PASS | visible slide 2 (expected 2) hash=#/02 |
| 2026-10-01T05:44:43Z | S8 phone 390×844 | phone: guide on slide 2 · clip == slide mapping | PASS | bar clip NAR-01 vs expected NAR-01 for slide 2 (6 ms) |
| 2026-10-01T05:44:43Z | S8 phone 390×844 | phone: guide on slide 2 · audio playing ≤1 s | PASS | paused=false src=guide-01-the-pact-df1pHtGsVr.mp3 ct=0.09 playingEvents=0 rejected=none (17 ms) |
| 2026-10-01T05:44:43Z | S8 phone 390×844 | phone: guide on slide 2 · active cue narrates visible slide | PASS | cue #1 (slide 2) vs visible 2; audio 0.09s; expected first cue #1 |
| 2026-10-01T05:44:43Z | S8 phone 390×844 | phone: guide on slide 2 · audio progressing | PASS | currentTime 0.3 → 1.78 |
| 2026-10-01T05:44:43Z | S8 phone 390×844 | phone: guide on slide 2 · CC caption == active cue text | PASS | caption="Section one, the Pact." cue="Section one, the Pact." |
| 2026-10-01T05:44:43Z | S8 phone 390×844 | phone: guide on slide 2 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=2 cue=#1 (slide 2) visible=2 transcript chars=363 |
| 2026-10-01T05:44:43Z | S8 phone 390×844 | phone: bar next button visible and ≥44 px | PASS | 44×44 |
| 2026-10-01T05:44:44Z | S8 phone 390×844 | phone: bar next → 3 · slide on screen | PASS | visible slide 3 (expected 3) hash=#/03 |
| 2026-10-01T05:44:44Z | S8 phone 390×844 | phone: bar next → 3 · clip == slide mapping | PASS | bar clip NAR-01 vs expected NAR-01 for slide 3 (11 ms) |
| 2026-10-01T05:44:44Z | S8 phone 390×844 | phone: bar next → 3 · audio playing ≤1 s | PASS | paused=false src=guide-01-the-pact-df1pHtGsVr.mp3 ct=12.21 playingEvents=0 rejected=none (34 ms) |
| 2026-10-01T05:44:44Z | S8 phone 390×844 | phone: bar next → 3 · active cue narrates visible slide | PASS | cue #3 (slide 3) vs visible 3; audio 12.22s; expected first cue #3 |
| 2026-10-01T05:44:44Z | S8 phone 390×844 | phone: bar next → 3 · audio progressing | PASS | currentTime 12.62 → 14.09 |
| 2026-10-01T05:44:44Z | S8 phone 390×844 | phone: bar next → 3 · CC caption == active cue text | PASS | caption="It is a community proposal from ODA and AI Rev, de" cue="It is a community proposal from ODA and AI Rev, de" |
| 2026-10-01T05:44:44Z | S8 phone 390×844 | phone: bar next → 3 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=3 cue=#3 (slide 3) visible=3 transcript chars=363 |
| 2026-10-01T05:44:44Z | S8 phone 390×844 | phone: bar next → 4 (new clip) · slide on screen | PASS | visible slide 4 (expected 4) hash=#/04 |
| 2026-10-01T05:44:44Z | S8 phone 390×844 | phone: bar next → 4 (new clip) · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 4 (2 ms) |
| 2026-10-01T05:44:44Z | S8 phone 390×844 | phone: bar next → 4 (new clip) · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=0 playingEvents=0 rejected=none (12 ms) |
| 2026-10-01T05:44:44Z | S8 phone 390×844 | phone: bar next → 4 (new clip) · active cue narrates visible slide | PASS | cue #1 (slide 4) vs visible 4; audio 0.02s; expected first cue #1 |
| 2026-10-01T05:44:45Z | S8 phone 390×844 | phone: bar next → 4 (new clip) · audio progressing | PASS | currentTime 0.2 → 1.63 |
| 2026-10-01T05:44:45Z | S8 phone 390×844 | phone: bar next → 4 (new clip) · CC caption == active cue text | PASS | caption="Section two, the Community Model." cue="Section two, the Community Model." |
| 2026-10-01T05:44:45Z | S8 phone 390×844 | phone: bar next → 4 (new clip) · transcript highlight == on-screen slide | PASS | highlighted sentence slide=4 cue=#1 (slide 4) visible=4 transcript chars=409 |
| 2026-10-01T05:44:45Z | S8 phone 390×844 | phone: bar prev → 3 · slide on screen | PASS | visible slide 3 (expected 3) hash=#/03 |
| 2026-10-01T05:44:45Z | S8 phone 390×844 | phone: bar prev → 3 · clip == slide mapping | PASS | bar clip NAR-01 vs expected NAR-01 for slide 3 (15 ms) |
| 2026-10-01T05:44:45Z | S8 phone 390×844 | phone: bar prev → 3 · audio playing ≤1 s | PASS | paused=false src=guide-01-the-pact-df1pHtGsVr.mp3 ct=12.22 playingEvents=0 rejected=none (37 ms) |
| 2026-10-01T05:44:45Z | S8 phone 390×844 | phone: bar prev → 3 · active cue narrates visible slide | PASS | cue #3 (slide 3) vs visible 3; audio 12.22s; expected first cue #3 |
| 2026-10-01T05:44:45Z | S8 phone 390×844 | phone: bar prev → 3 · audio progressing | PASS | currentTime 12.58 → 14.02 |
| 2026-10-01T05:44:46Z | S8 phone 390×844 | phone: bar prev → 3 · CC caption == active cue text | PASS | caption="It is a community proposal from ODA and AI Rev, de" cue="It is a community proposal from ODA and AI Rev, de" |
| 2026-10-01T05:44:46Z | S8 phone 390×844 | phone: bar prev → 3 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=3 cue=#3 (slide 3) visible=3 transcript chars=363 |
| 2026-10-01T05:44:46Z | S8 phone 390×844 | phone: bar fits the viewport (no horizontal overflow) | PASS | {"right":390,"w":390,"sw":390} |
| 2026-10-01T05:44:50Z | S9 Arabic / RTL | lang toggle → ar/rtl | PASS | lang=ar dir=rtl |
| 2026-10-01T05:44:50Z | S9 Arabic / RTL | RTL: guide on slide 2 · slide on screen | PASS | visible slide 2 (expected 2) hash=#/02 |
| 2026-10-01T05:44:50Z | S9 Arabic / RTL | RTL: guide on slide 2 · clip == slide mapping | PASS | bar clip NAR-01 vs expected NAR-01 for slide 2 (8 ms) |
| 2026-10-01T05:44:50Z | S9 Arabic / RTL | RTL: guide on slide 2 · audio playing ≤1 s | PASS | paused=false src=guide-01-the-pact-df1pHtGsVr.mp3 ct=0.08 playingEvents=0 rejected=none (16 ms) |
| 2026-10-01T05:44:50Z | S9 Arabic / RTL | RTL: guide on slide 2 · active cue narrates visible slide | PASS | cue #1 (slide 2) vs visible 2; audio 0.08s; expected first cue #1 |
| 2026-10-01T05:44:51Z | S9 Arabic / RTL | RTL: guide on slide 2 · audio progressing | PASS | currentTime 0.26 → 1.68 |
| 2026-10-01T05:44:51Z | S9 Arabic / RTL | RTL: guide on slide 2 · CC caption == active cue text | PASS | caption="Section one, the Pact." cue="Section one, the Pact." |
| 2026-10-01T05:44:51Z | S9 Arabic / RTL | RTL: guide on slide 2 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=2 cue=#1 (slide 2) visible=2 transcript chars=363 |
| 2026-10-01T05:44:51Z | S9 Arabic / RTL | RTL: ArrowLeft = next → 3 · slide on screen | PASS | visible slide 3 (expected 3) hash=#/03 |
| 2026-10-01T05:44:51Z | S9 Arabic / RTL | RTL: ArrowLeft = next → 3 · clip == slide mapping | PASS | bar clip NAR-01 vs expected NAR-01 for slide 3 (3 ms) |
| 2026-10-01T05:44:51Z | S9 Arabic / RTL | RTL: ArrowLeft = next → 3 · audio playing ≤1 s | PASS | paused=false src=guide-01-the-pact-df1pHtGsVr.mp3 ct=12.14 playingEvents=0 rejected=none (18 ms) |
| 2026-10-01T05:44:51Z | S9 Arabic / RTL | RTL: ArrowLeft = next → 3 · active cue narrates visible slide | PASS | cue #3 (slide 3) vs visible 3; audio 12.14s; expected first cue #3 |
| 2026-10-01T05:44:51Z | S9 Arabic / RTL | RTL: ArrowLeft = next → 3 · audio progressing | PASS | currentTime 12.3 → 13.72 |
| 2026-10-01T05:44:51Z | S9 Arabic / RTL | RTL: ArrowLeft = next → 3 · CC caption == active cue text | PASS | caption="It is a community proposal from ODA and AI Rev, de" cue="It is a community proposal from ODA and AI Rev, de" |
| 2026-10-01T05:44:51Z | S9 Arabic / RTL | RTL: ArrowLeft = next → 3 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=3 cue=#3 (slide 3) visible=3 transcript chars=363 |
| 2026-10-01T05:44:52Z | S9 Arabic / RTL | RTL: rapid ArrowLeft ×4 → 7 · slide on screen | PASS | visible slide 7 (expected 7) hash=#/07 |
| 2026-10-01T05:44:52Z | S9 Arabic / RTL | RTL: rapid ArrowLeft ×4 → 7 · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 7 (6 ms) |
| 2026-10-01T05:44:52Z | S9 Arabic / RTL | RTL: rapid ArrowLeft ×4 → 7 · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=2.26 playingEvents=0 rejected=none (21 ms) |
| 2026-10-01T05:44:52Z | S9 Arabic / RTL | RTL: rapid ArrowLeft ×4 → 7 · active cue narrates visible slide | PASS | cue #2 (slide 7) vs visible 7; audio 2.26s; expected first cue #2 |
| 2026-10-01T05:44:52Z | S9 Arabic / RTL | RTL: rapid ArrowLeft ×4 → 7 · audio progressing | PASS | currentTime 2.6 → 4.04 |
| 2026-10-01T05:44:52Z | S9 Arabic / RTL | RTL: rapid ArrowLeft ×4 → 7 · CC caption == active cue text | PASS | caption="Every webinar, chapter event and challenge should " cue="Every webinar, chapter event and challenge should " |
| 2026-10-01T05:44:52Z | S9 Arabic / RTL | RTL: rapid ArrowLeft ×4 → 7 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=7 cue=#2 (slide 7) visible=7 transcript chars=409 |
| 2026-10-01T05:44:52Z | S9 Arabic / RTL | RTL: ArrowRight = previous → 6 · slide on screen | PASS | visible slide 6 (expected 6) hash=#/06 |
| 2026-10-01T05:44:52Z | S9 Arabic / RTL | RTL: ArrowRight = previous → 6 · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 6 (6 ms) |
| 2026-10-01T05:44:52Z | S9 Arabic / RTL | RTL: ArrowRight = previous → 6 · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=4.29 playingEvents=0 rejected=none (14 ms) |
| 2026-10-01T05:44:52Z | S9 Arabic / RTL | RTL: ArrowRight = previous → 6 · active cue narrates visible slide | PASS | cue #1 (slide 4) vs visible 6; audio 0.08s; expected first cue #1 |
| 2026-10-01T05:44:53Z | S9 Arabic / RTL | RTL: ArrowRight = previous → 6 · audio progressing | PASS | currentTime 0.26 → 1.7 |
| 2026-10-01T05:44:53Z | S9 Arabic / RTL | RTL: ArrowRight = previous → 6 · CC caption == active cue text | PASS | caption="Section two, the Community Model." cue="Section two, the Community Model." |
| 2026-10-01T05:44:53Z | S9 Arabic / RTL | RTL: ArrowRight = previous → 6 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=4 cue=#1 (slide 4) visible=6 transcript chars=409 |
| 2026-10-01T05:44:53Z | S9 Arabic / RTL | RTL: bar is dir=rtl and shows the Arabic status text | PASS | {"dir":"rtl","title":"يروي الدليل الشريحة 6 من 39 · 02 نموذج المجتمع","live":true} |
| 2026-10-01T05:44:58Z | S10 autoplay policy / persisted narration-on | reload with narration-on persisted: no audio before a gesture (autoplay policy respected) | PASS | paused=true play-rejected=none |
| 2026-10-01T05:44:58Z | S10 autoplay policy / persisted narration-on | blocked state is surfaced in the Guide bar ("tap to start") | PASS | data-blocked=true title="Blocked by the browser — tap or press a key to start the guide · slide 5 of 39 ·" |
| 2026-10-01T05:44:58Z | S10 autoplay policy / persisted narration-on | first click unlocks and narration starts on the visible slide (5) · slide on screen | PASS | visible slide 5 (expected 5) hash=#/05 |
| 2026-10-01T05:44:58Z | S10 autoplay policy / persisted narration-on | first click unlocks and narration starts on the visible slide (5) · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 5 (10 ms) |
| 2026-10-01T05:44:58Z | S10 autoplay policy / persisted narration-on | first click unlocks and narration starts on the visible slide (5) · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=0.04 playingEvents=1 rejected=none (34 ms) |
| 2026-10-01T05:44:58Z | S10 autoplay policy / persisted narration-on | first click unlocks and narration starts on the visible slide (5) · active cue narrates visible slide | PASS | cue #1 (slide 4) vs visible 5; audio 0.08s; expected first cue #1 |
| 2026-10-01T05:44:58Z | S10 autoplay policy / persisted narration-on | first click unlocks and narration starts on the visible slide (5) · audio progressing | PASS | currentTime 0.28 → 1.71 |
| 2026-10-01T05:44:58Z | S10 autoplay policy / persisted narration-on | first click unlocks and narration starts on the visible slide (5) · CC caption == active cue text | PASS | caption="Section two, the Community Model." cue="Section two, the Community Model." |
| 2026-10-01T05:44:58Z | S10 autoplay policy / persisted narration-on | first click unlocks and narration starts on the visible slide (5) · transcript highlight == on-screen slide | PASS | highlighted sentence slide=4 cue=#1 (slide 4) visible=5 transcript chars=409 |

### Mismatches recorded in run `after` (11)

1. **S3 N shortcut — N starts narration on slide 5 · audio playing ≤1 s** (2026-10-01T05:44:09Z)  
   repro: load /#/5, press N  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: paused=true src=guide-02-community-model-9gUnFBtxrM.mp3 ct=0 playingEvents=0 rejected=none (1114 ms)
2. **S3 N shortcut — N pauses narration** (2026-10-01T05:44:10Z)  
   repro: press N while narrating  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: paused=false narrating=true (was on slide 5)
3. **S3 N shortcut — paused + ArrowRight: caption/transcript follow the slide without audio** (2026-10-01T05:44:11Z)  
   repro: press N (pause), then ArrowRight: the transcript highlight/CC must move to the new slide while paused  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: n=8 (expected 8) clip=NAR-02 paused=false cue=#2 (slide 7) highlight slide=7
4. **S3 N shortcut — N resumes at the sentence of the slide on screen (8) · audio playing ≤1 s** (2026-10-01T05:44:12Z)  
   repro: press N again  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: paused=true src=guide-02-community-model-9gUnFBtxrM.mp3 ct=6.77 playingEvents=0 rejected=none (1088 ms)
5. **S5 slide-38 country tabs — guide on slide 38 · audio playing ≤1 s** (2026-10-01T05:44:23Z)  
   repro: see scenario  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: paused=true src=guide-08-athar-os-Ib4oKe91OD.mp3 ct=7.96 playingEvents=0 rejected=none (1079 ms)
6. **S6 Replay intro and return — after the replayed intro the guide narrates the slide it returned to (4) · slide on screen** (2026-10-01T05:44:31Z)  
   repro: Replay intro → Esc (the deck returns to the slide it was on)  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: visible slide 7 (expected 4) hash=#/07
7. **S6 Replay intro and return — after the replayed intro the guide narrates the slide it returned to (4) · active cue narrates visible slide** (2026-10-01T05:44:32Z)  
   repro: Replay intro → Esc (the deck returns to the slide it was on)  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: cue #3 (slide 11) vs visible 4; audio 13.99s; expected first cue #1
8. **S6 Replay intro and return — after the replayed intro the guide narrates the slide it returned to (4) · transcript highlight == on-screen slide** (2026-10-01T05:44:32Z)  
   repro: Replay intro → Esc (the deck returns to the slide it was on)  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: highlighted sentence slide=11 cue=#3 (slide 11) visible=4 transcript chars=409
9. **S7 tab hidden/visible + audio-focus loss — guide on slide 13 · audio playing ≤1 s** (2026-10-01T05:44:36Z)  
   repro: see scenario  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: paused=true src=guide-03-six-pillars-yxVqZJ2k1a.mp3 ct=0 playingEvents=0 rejected=none (1100 ms)
10. **S7 tab hidden/visible + audio-focus loss — visible again after 2 hidden slide changes → narrates slide 15 · audio playing ≤1 s** (2026-10-01T05:44:38Z)  
   repro: hide the tab (visibilitychange), press ArrowRight ×2, show the tab  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: paused=true src=guide-03-six-pillars-yxVqZJ2k1a.mp3 ct=8.61 playingEvents=0 rejected=none (1096 ms)
11. **S7 tab hidden/visible + audio-focus loss — narration resumes after focus regain (audio-focus loss)** (2026-10-01T05:44:40Z)  
   repro: pause the <audio> element externally, then dispatch focus/visibilitychange  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: paused=true after 1522 ms


## Run `after-fix` — 2026-10-01T05:48:57Z → 2026-10-01T05:50:59Z

Base URL http://127.0.0.1:4174 · Chromium (Playwright) · playbackRate 4× for the AUTO end-to-end scenario · checks: **384 pass / 8 fail** of 392

| UTC | scenario | check | result | detail |
|---|---|---|---|---|
| 2026-10-01T05:49:01Z | S1 AUTO end-to-end | intro skipped, slide 1, guide idle | PASS | n=1 intro=false narrating=false |
| 2026-10-01T05:49:01Z | S1 AUTO end-to-end | start guide on slide 1 · slide on screen | PASS | visible slide 1 (expected 1) hash=#/01 |
| 2026-10-01T05:49:01Z | S1 AUTO end-to-end | start guide on slide 1 · clip == slide mapping | PASS | bar clip NAR-00 vs expected NAR-00 for slide 1 (4 ms) |
| 2026-10-01T05:49:01Z | S1 AUTO end-to-end | start guide on slide 1 · audio playing ≤1 s | PASS | paused=false src=guide-00-welcome-lhbIUXFwLO.mp3 ct=0.02 playingEvents=0 rejected=none (14 ms) |
| 2026-10-01T05:49:01Z | S1 AUTO end-to-end | start guide on slide 1 · active cue narrates visible slide | PASS | cue #1 (slide 1) vs visible 1; audio 0.03s; expected first cue #1 |
| 2026-10-01T05:49:02Z | S1 AUTO end-to-end | start guide on slide 1 · audio progressing | PASS | currentTime 0.23 → 1.62 |
| 2026-10-01T05:49:02Z | S1 AUTO end-to-end | start guide on slide 1 · CC caption == active cue text | PASS | caption="Welcome to the Athar Open Agentic Pact, a communit" cue="Welcome to the Athar Open Agentic Pact, a communit" |
| 2026-10-01T05:49:02Z | S1 AUTO end-to-end | start guide on slide 1 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=1 cue=#1 (slide 1) visible=1 transcript chars=258 |
| 2026-10-01T05:49:06Z | S1 AUTO end-to-end | AUTO advanced 1→2 · slide on screen | PASS | visible slide 2 (expected 2) hash=#/02 |
| 2026-10-01T05:49:06Z | S1 AUTO end-to-end | AUTO advanced 1→2 · clip == slide mapping | PASS | bar clip NAR-01 vs expected NAR-01 for slide 2 (2 ms) |
| 2026-10-01T05:49:06Z | S1 AUTO end-to-end | AUTO advanced 1→2 · audio playing ≤1 s | PASS | paused=false src=guide-01-the-pact-df1pHtGsVr.mp3 ct=0.06 playingEvents=0 rejected=none (5 ms) |
| 2026-10-01T05:49:06Z | S1 AUTO end-to-end | AUTO advanced 1→2 · active cue narrates visible slide | PASS | cue #1 (slide 2) vs visible 2; audio 0.78s; expected first cue #1 |
| 2026-10-01T05:49:06Z | S1 AUTO end-to-end | AUTO advanced 1→2 · audio progressing | PASS | currentTime 1.28 → 2.69 |
| 2026-10-01T05:49:06Z | S1 AUTO end-to-end | AUTO advanced 1→2 · CC caption == active cue text | PASS | caption="The Athar Open Agentic Pact is an open commitment " cue="The Athar Open Agentic Pact is an open commitment " |
| 2026-10-01T05:49:06Z | S1 AUTO end-to-end | AUTO advanced 1→2 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=2 cue=#2 (slide 2) visible=2 transcript chars=363 |
| 2026-10-01T05:49:09Z | S1 AUTO end-to-end | AUTO advanced 2→3 · slide on screen | PASS | visible slide 3 (expected 3) hash=#/03 |
| 2026-10-01T05:49:09Z | S1 AUTO end-to-end | AUTO advanced 2→3 · clip == slide mapping | PASS | bar clip NAR-01 vs expected NAR-01 for slide 3 (2 ms) |
| 2026-10-01T05:49:09Z | S1 AUTO end-to-end | AUTO advanced 2→3 · audio playing ≤1 s | PASS | paused=false src=guide-01-the-pact-df1pHtGsVr.mp3 ct=12.58 playingEvents=0 rejected=none (11 ms) |
| 2026-10-01T05:49:09Z | S1 AUTO end-to-end | AUTO advanced 2→3 · active cue narrates visible slide | PASS | cue #3 (slide 3) vs visible 3; audio 12.59s; expected first cue #3 |
| 2026-10-01T05:49:09Z | S1 AUTO end-to-end | AUTO advanced 2→3 · audio progressing | PASS | currentTime 13.08 → 14.53 |
| 2026-10-01T05:49:09Z | S1 AUTO end-to-end | AUTO advanced 2→3 · CC caption == active cue text | PASS | caption="It is a community proposal from ODA and AI Rev, de" cue="It is a community proposal from ODA and AI Rev, de" |
| 2026-10-01T05:49:09Z | S1 AUTO end-to-end | AUTO advanced 2→3 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=3 cue=#3 (slide 3) visible=3 transcript chars=363 |
| 2026-10-01T05:49:12Z | S1 AUTO end-to-end | AUTO advanced 3→4 · slide on screen | PASS | visible slide 4 (expected 4) hash=#/04 |
| 2026-10-01T05:49:12Z | S1 AUTO end-to-end | AUTO advanced 3→4 · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 4 (2 ms) |
| 2026-10-01T05:49:12Z | S1 AUTO end-to-end | AUTO advanced 3→4 · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=0.08 playingEvents=0 rejected=none (6 ms) |
| 2026-10-01T05:49:12Z | S1 AUTO end-to-end | AUTO advanced 3→4 · active cue narrates visible slide | PASS | cue #1 (slide 4) vs visible 4; audio 0.78s; expected first cue #1 |
| 2026-10-01T05:49:13Z | S1 AUTO end-to-end | AUTO advanced 3→4 · audio progressing | PASS | currentTime 1.29 → 2.68 |
| 2026-10-01T05:49:13Z | S1 AUTO end-to-end | AUTO advanced 3→4 · CC caption == active cue text | PASS | caption="Section two, the Community Model." cue="Section two, the Community Model." |
| 2026-10-01T05:49:13Z | S1 AUTO end-to-end | AUTO advanced 3→4 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=4 cue=#1 (slide 4) visible=4 transcript chars=409 |
| 2026-10-01T05:49:13Z | S1 AUTO end-to-end | AUTO advanced 4→7 · slide on screen | PASS | visible slide 7 (expected 7) hash=#/07 |
| 2026-10-01T05:49:13Z | S1 AUTO end-to-end | AUTO advanced 4→7 · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 7 (1 ms) |
| 2026-10-01T05:49:13Z | S1 AUTO end-to-end | AUTO advanced 4→7 · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=3.22 playingEvents=0 rejected=none (6 ms) |
| 2026-10-01T05:49:13Z | S1 AUTO end-to-end | AUTO advanced 4→7 · active cue narrates visible slide | PASS | cue #2 (slide 7) vs visible 7; audio 3.26s; expected first cue #2 |
| 2026-10-01T05:49:13Z | S1 AUTO end-to-end | AUTO advanced 4→7 · audio progressing | PASS | currentTime 3.71 → 5.11 |
| 2026-10-01T05:49:13Z | S1 AUTO end-to-end | AUTO advanced 4→7 · CC caption == active cue text | PASS | caption="Every webinar, chapter event and challenge should " cue="Every webinar, chapter event and challenge should " |
| 2026-10-01T05:49:13Z | S1 AUTO end-to-end | AUTO advanced 4→7 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=7 cue=#2 (slide 7) visible=7 transcript chars=409 |
| 2026-10-01T05:49:15Z | S1 AUTO end-to-end | AUTO advanced 7→11 · slide on screen | PASS | visible slide 11 (expected 11) hash=#/11 |
| 2026-10-01T05:49:15Z | S1 AUTO end-to-end | AUTO advanced 7→11 · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 11 (4 ms) |
| 2026-10-01T05:49:15Z | S1 AUTO end-to-end | AUTO advanced 7→11 · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=11.56 playingEvents=0 rejected=none (9 ms) |
| 2026-10-01T05:49:15Z | S1 AUTO end-to-end | AUTO advanced 7→11 · active cue narrates visible slide | PASS | cue #3 (slide 11) vs visible 11; audio 11.57s; expected first cue #3 |
| 2026-10-01T05:49:15Z | S1 AUTO end-to-end | AUTO advanced 7→11 · audio progressing | PASS | currentTime 12.04 → 13.46 |
| 2026-10-01T05:49:15Z | S1 AUTO end-to-end | AUTO advanced 7→11 · CC caption == active cue text | PASS | caption="Learn agentic AI, build a useful agent through the" cue="Learn agentic AI, build a useful agent through the" |
| 2026-10-01T05:49:15Z | S1 AUTO end-to-end | AUTO advanced 7→11 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=11 cue=#3 (slide 11) visible=11 transcript chars=409 |
| 2026-10-01T05:49:19Z | S1 AUTO end-to-end | AUTO advanced 11→13 · slide on screen | PASS | visible slide 13 (expected 13) hash=#/13 |
| 2026-10-01T05:49:19Z | S1 AUTO end-to-end | AUTO advanced 11→13 · clip == slide mapping | PASS | bar clip NAR-03 vs expected NAR-03 for slide 13 (6 ms) |
| 2026-10-01T05:49:19Z | S1 AUTO end-to-end | AUTO advanced 11→13 · audio playing ≤1 s | PASS | paused=false src=guide-03-six-pillars-yxVqZJ2k1a.mp3 ct=0 playingEvents=1 rejected=none (22 ms) |
| 2026-10-01T05:49:19Z | S1 AUTO end-to-end | AUTO advanced 11→13 · active cue narrates visible slide | PASS | cue #1 (slide 13) vs visible 13; audio 0.74s; expected first cue #1 |
| 2026-10-01T05:49:19Z | S1 AUTO end-to-end | AUTO advanced 11→13 · audio progressing | PASS | currentTime 1.23 → 2.66 |
| 2026-10-01T05:49:19Z | S1 AUTO end-to-end | AUTO advanced 11→13 · CC caption == active cue text | PASS | caption="Section three, six pillars." cue="Section three, six pillars." |
| 2026-10-01T05:49:19Z | S1 AUTO end-to-end | AUTO advanced 11→13 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=13 cue=#1 (slide 13) visible=13 transcript chars=293 |
| 2026-10-01T05:49:21Z | S1 AUTO end-to-end | AUTO advanced 13→14 · slide on screen | PASS | visible slide 14 (expected 14) hash=#/14 |
| 2026-10-01T05:49:21Z | S1 AUTO end-to-end | AUTO advanced 13→14 · clip == slide mapping | PASS | bar clip NAR-03 vs expected NAR-03 for slide 14 (1 ms) |
| 2026-10-01T05:49:21Z | S1 AUTO end-to-end | AUTO advanced 13→14 · audio playing ≤1 s | PASS | paused=false src=guide-03-six-pillars-yxVqZJ2k1a.mp3 ct=9.5 playingEvents=0 rejected=none (6 ms) |
| 2026-10-01T05:49:21Z | S1 AUTO end-to-end | AUTO advanced 13→14 · active cue narrates visible slide | PASS | cue #3 (slide 14) vs visible 14; audio 9.51s; expected first cue #3 |
| 2026-10-01T05:49:22Z | S1 AUTO end-to-end | AUTO advanced 13→14 · audio progressing | PASS | currentTime 10 → 11.41 |
| 2026-10-01T05:49:22Z | S1 AUTO end-to-end | AUTO advanced 13→14 · CC caption == active cue text | PASS | caption="Reusable skills are built once and shared across t" cue="Reusable skills are built once and shared across t" |
| 2026-10-01T05:49:22Z | S1 AUTO end-to-end | AUTO advanced 13→14 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=14 cue=#3 (slide 14) visible=14 transcript chars=293 |
| 2026-10-01T05:49:22Z | S1 AUTO end-to-end | AUTO advanced 14→17 · slide on screen | PASS | visible slide 17 (expected 17) hash=#/17 |
| 2026-10-01T05:49:22Z | S1 AUTO end-to-end | AUTO advanced 14→17 · clip == slide mapping | PASS | bar clip NAR-03 vs expected NAR-03 for slide 17 (1 ms) |
| 2026-10-01T05:49:22Z | S1 AUTO end-to-end | AUTO advanced 14→17 · audio playing ≤1 s | PASS | paused=false src=guide-03-six-pillars-yxVqZJ2k1a.mp3 ct=13.93 playingEvents=0 rejected=none (6 ms) |
| 2026-10-01T05:49:22Z | S1 AUTO end-to-end | AUTO advanced 14→17 · active cue narrates visible slide | PASS | cue #4 (slide 17) vs visible 17; audio 13.93s; expected first cue #4 |
| 2026-10-01T05:49:23Z | S1 AUTO end-to-end | AUTO advanced 14→17 · audio progressing | PASS | currentTime 14.4 → 15.82 |
| 2026-10-01T05:49:23Z | S1 AUTO end-to-end | AUTO advanced 14→17 · CC caption == active cue text | PASS | caption="Universal API licences are managed by Athar, givin" cue="Universal API licences are managed by Athar, givin" |
| 2026-10-01T05:49:23Z | S1 AUTO end-to-end | AUTO advanced 14→17 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=17 cue=#4 (slide 17) visible=17 transcript chars=293 |
| 2026-10-01T05:49:24Z | S1 AUTO end-to-end | AUTO advanced 17→19 · slide on screen | PASS | visible slide 19 (expected 19) hash=#/19 |
| 2026-10-01T05:49:24Z | S1 AUTO end-to-end | AUTO advanced 17→19 · clip == slide mapping | PASS | bar clip NAR-04 vs expected NAR-04 for slide 19 (1 ms) |
| 2026-10-01T05:49:24Z | S1 AUTO end-to-end | AUTO advanced 17→19 · audio playing ≤1 s | PASS | paused=false src=guide-04-pledge-and-signing-PWeXZj1Rgc.mp3 ct=0.08 playingEvents=0 rejected=none (9 ms) |
| 2026-10-01T05:49:24Z | S1 AUTO end-to-end | AUTO advanced 17→19 · active cue narrates visible slide | PASS | cue #1 (slide 19) vs visible 19; audio 0.71s; expected first cue #1 |
| 2026-10-01T05:49:24Z | S1 AUTO end-to-end | AUTO advanced 17→19 · audio progressing | PASS | currentTime 1.21 → 2.65 |
| 2026-10-01T05:49:24Z | S1 AUTO end-to-end | AUTO advanced 17→19 · CC caption == active cue text | PASS | caption="Section four, Pledge and Signing." cue="Section four, Pledge and Signing." |
| 2026-10-01T05:49:24Z | S1 AUTO end-to-end | AUTO advanced 17→19 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=19 cue=#1 (slide 19) visible=19 transcript chars=391 |
| 2026-10-01T05:49:25Z | S1 AUTO end-to-end | AUTO advanced 19→20 · slide on screen | PASS | visible slide 20 (expected 20) hash=#/20 |
| 2026-10-01T05:49:25Z | S1 AUTO end-to-end | AUTO advanced 19→20 · clip == slide mapping | PASS | bar clip NAR-04 vs expected NAR-04 for slide 20 (1 ms) |
| 2026-10-01T05:49:25Z | S1 AUTO end-to-end | AUTO advanced 19→20 · audio playing ≤1 s | PASS | paused=false src=guide-04-pledge-and-signing-PWeXZj1Rgc.mp3 ct=6.13 playingEvents=0 rejected=none (5 ms) |
| 2026-10-01T05:49:25Z | S1 AUTO end-to-end | AUTO advanced 19→20 · active cue narrates visible slide | PASS | cue #3 (slide 20) vs visible 20; audio 6.14s; expected first cue #3 |
| 2026-10-01T05:49:26Z | S1 AUTO end-to-end | AUTO advanced 19→20 · audio progressing | PASS | currentTime 6.6 → 8.02 |
| 2026-10-01T05:49:26Z | S1 AUTO end-to-end | AUTO advanced 19→20 · CC caption == active cue text | PASS | caption="A signatory chooses its roles, sign, govern, build" cue="A signatory chooses its roles, sign, govern, build" |
| 2026-10-01T05:49:26Z | S1 AUTO end-to-end | AUTO advanced 19→20 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=20 cue=#3 (slide 20) visible=20 transcript chars=391 |
| 2026-10-01T05:49:30Z | S1 AUTO end-to-end | AUTO advanced 20→21 · slide on screen | PASS | visible slide 21 (expected 21) hash=#/21 |
| 2026-10-01T05:49:30Z | S1 AUTO end-to-end | AUTO advanced 20→21 · clip == slide mapping | PASS | bar clip NAR-05 vs expected NAR-05 for slide 21 (2 ms) |
| 2026-10-01T05:49:30Z | S1 AUTO end-to-end | AUTO advanced 20→21 · audio playing ≤1 s | PASS | paused=false src=guide-05-actors-and-roles-0PbyoFNYNV.mp3 ct=0.09 playingEvents=0 rejected=none (11 ms) |
| 2026-10-01T05:49:30Z | S1 AUTO end-to-end | AUTO advanced 20→21 · active cue narrates visible slide | PASS | cue #1 (slide 21) vs visible 21; audio 0.68s; expected first cue #1 |
| 2026-10-01T05:49:31Z | S1 AUTO end-to-end | AUTO advanced 20→21 · audio progressing | PASS | currentTime 1.13 → 2.58 |
| 2026-10-01T05:49:31Z | S1 AUTO end-to-end | AUTO advanced 20→21 · CC caption == active cue text | PASS | caption="Section five, Actors and Roles, institutions, part" cue="Section five, Actors and Roles, institutions, part" |
| 2026-10-01T05:49:31Z | S1 AUTO end-to-end | AUTO advanced 20→21 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=21 cue=#1 (slide 21) visible=21 transcript chars=394 |
| 2026-10-01T05:49:35Z | S1 AUTO end-to-end | AUTO advanced 21→23 · slide on screen | PASS | visible slide 23 (expected 23) hash=#/23 |
| 2026-10-01T05:49:35Z | S1 AUTO end-to-end | AUTO advanced 21→23 · clip == slide mapping | PASS | bar clip NAR-05 vs expected NAR-05 for slide 23 (4 ms) |
| 2026-10-01T05:49:35Z | S1 AUTO end-to-end | AUTO advanced 21→23 · audio playing ≤1 s | PASS | paused=false src=guide-05-actors-and-roles-0PbyoFNYNV.mp3 ct=20.2 playingEvents=0 rejected=none (8 ms) |
| 2026-10-01T05:49:35Z | S1 AUTO end-to-end | AUTO advanced 21→23 · active cue narrates visible slide | PASS | cue #2 (slide 23) vs visible 23; audio 20.24s; expected first cue #2 |
| 2026-10-01T05:49:36Z | S1 AUTO end-to-end | AUTO advanced 21→23 · audio progressing | PASS | currentTime 20.73 → 22.12 |
| 2026-10-01T05:49:36Z | S1 AUTO end-to-end | AUTO advanced 21→23 · CC caption == active cue text | PASS | caption="The UAE Ministry of Foreign Trade signs and govern" cue="The UAE Ministry of Foreign Trade signs and govern" |
| 2026-10-01T05:49:36Z | S1 AUTO end-to-end | AUTO advanced 21→23 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=23 cue=#2 (slide 23) visible=23 transcript chars=394 |
| 2026-10-01T05:49:38Z | S1 AUTO end-to-end | AUTO advanced 23→26 · slide on screen | PASS | visible slide 26 (expected 26) hash=#/26 |
| 2026-10-01T05:49:38Z | S1 AUTO end-to-end | AUTO advanced 23→26 · clip == slide mapping | PASS | bar clip NAR-06 vs expected NAR-06 for slide 26 (2 ms) |
| 2026-10-01T05:49:38Z | S1 AUTO end-to-end | AUTO advanced 23→26 · audio playing ≤1 s | PASS | paused=false src=guide-06-governance-and-roadmap-kyzmCSHcw8.mp3 ct=0.09 playingEvents=0 rejected=none (5 ms) |
| 2026-10-01T05:49:38Z | S1 AUTO end-to-end | AUTO advanced 23→26 · active cue narrates visible slide | PASS | cue #1 (slide 26) vs visible 26; audio 0.77s; expected first cue #1 |
| 2026-10-01T05:49:39Z | S1 AUTO end-to-end | AUTO advanced 23→26 · audio progressing | PASS | currentTime 1.3 → 2.68 |
| 2026-10-01T05:49:39Z | S1 AUTO end-to-end | AUTO advanced 23→26 · CC caption == active cue text | PASS | caption="Section six, governance and roadmap." cue="Section six, governance and roadmap." |
| 2026-10-01T05:49:39Z | S1 AUTO end-to-end | AUTO advanced 23→26 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=26 cue=#1 (slide 26) visible=26 transcript chars=263 |
| 2026-10-01T05:49:40Z | S1 AUTO end-to-end | AUTO advanced 26→27 · slide on screen | PASS | visible slide 27 (expected 27) hash=#/27 |
| 2026-10-01T05:49:40Z | S1 AUTO end-to-end | AUTO advanced 26→27 · clip == slide mapping | PASS | bar clip NAR-06 vs expected NAR-06 for slide 27 (1 ms) |
| 2026-10-01T05:49:40Z | S1 AUTO end-to-end | AUTO advanced 26→27 · audio playing ≤1 s | PASS | paused=false src=guide-06-governance-and-roadmap-kyzmCSHcw8.mp3 ct=8.17 playingEvents=0 rejected=none (5 ms) |
| 2026-10-01T05:49:40Z | S1 AUTO end-to-end | AUTO advanced 26→27 · active cue narrates visible slide | PASS | cue #3 (slide 27) vs visible 27; audio 8.18s; expected first cue #3 |
| 2026-10-01T05:49:41Z | S1 AUTO end-to-end | AUTO advanced 26→27 · audio progressing | PASS | currentTime 8.66 → 10.06 |
| 2026-10-01T05:49:41Z | S1 AUTO end-to-end | AUTO advanced 26→27 · CC caption == active cue text | PASS | caption="Decisions, releases, and outcome reports are publi" cue="Decisions, releases, and outcome reports are publi" |
| 2026-10-01T05:49:41Z | S1 AUTO end-to-end | AUTO advanced 26→27 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=27 cue=#3 (slide 27) visible=27 transcript chars=263 |
| 2026-10-01T05:49:42Z | S1 AUTO end-to-end | AUTO advanced 27→28 · slide on screen | PASS | visible slide 28 (expected 28) hash=#/27/new-1 |
| 2026-10-01T05:49:42Z | S1 AUTO end-to-end | AUTO advanced 27→28 · clip == slide mapping | PASS | bar clip NAR-07 vs expected NAR-07 for slide 28 (2 ms) |
| 2026-10-01T05:49:42Z | S1 AUTO end-to-end | AUTO advanced 27→28 · audio playing ≤1 s | PASS | paused=false src=guide-07-impact-and-funding-vWkiINp1IS.mp3 ct=0.06 playingEvents=0 rejected=none (9 ms) |
| 2026-10-01T05:49:42Z | S1 AUTO end-to-end | AUTO advanced 27→28 · active cue narrates visible slide | PASS | cue #1 (slide 28) vs visible 28; audio 0.6s; expected first cue #1 |
| 2026-10-01T05:49:43Z | S1 AUTO end-to-end | AUTO advanced 27→28 · audio progressing | PASS | currentTime 1.1 → 2.52 |
| 2026-10-01T05:49:43Z | S1 AUTO end-to-end | AUTO advanced 27→28 · CC caption == active cue text | PASS | caption="Section seven, Impact and Funding." cue="Section seven, Impact and Funding." |
| 2026-10-01T05:49:43Z | S1 AUTO end-to-end | AUTO advanced 27→28 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=28 cue=#1 (slide 28) visible=28 transcript chars=447 |
| 2026-10-01T05:49:43Z | S1 AUTO end-to-end | AUTO advanced 28→29 · slide on screen | PASS | visible slide 29 (expected 29) hash=#/27/new-2 |
| 2026-10-01T05:49:43Z | S1 AUTO end-to-end | AUTO advanced 28→29 · clip == slide mapping | PASS | bar clip NAR-07 vs expected NAR-07 for slide 29 (1 ms) |
| 2026-10-01T05:49:43Z | S1 AUTO end-to-end | AUTO advanced 28→29 · audio playing ≤1 s | PASS | paused=false src=guide-07-impact-and-funding-vWkiINp1IS.mp3 ct=3.05 playingEvents=0 rejected=none (6 ms) |
| 2026-10-01T05:49:43Z | S1 AUTO end-to-end | AUTO advanced 28→29 · active cue narrates visible slide | PASS | cue #2 (slide 29) vs visible 29; audio 3.06s; expected first cue #2 |
| 2026-10-01T05:49:43Z | S1 AUTO end-to-end | AUTO advanced 28→29 · audio progressing | PASS | currentTime 3.54 → 4.96 |
| 2026-10-01T05:49:43Z | S1 AUTO end-to-end | AUTO advanced 28→29 · CC caption == active cue text | PASS | caption="Three impact tiers, one delivery model, access, ow" cue="Three impact tiers, one delivery model, access, ow" |
| 2026-10-01T05:49:43Z | S1 AUTO end-to-end | AUTO advanced 28→29 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=29 cue=#2 (slide 29) visible=29 transcript chars=447 |
| 2026-10-01T05:49:45Z | S1 AUTO end-to-end | AUTO advanced 29→30 · slide on screen | PASS | visible slide 30 (expected 30) hash=#/27/new-3 |
| 2026-10-01T05:49:45Z | S1 AUTO end-to-end | AUTO advanced 29→30 · clip == slide mapping | PASS | bar clip NAR-07 vs expected NAR-07 for slide 30 (1 ms) |
| 2026-10-01T05:49:45Z | S1 AUTO end-to-end | AUTO advanced 29→30 · audio playing ≤1 s | PASS | paused=false src=guide-07-impact-and-funding-vWkiINp1IS.mp3 ct=10.41 playingEvents=0 rejected=none (5 ms) |
| 2026-10-01T05:49:45Z | S1 AUTO end-to-end | AUTO advanced 29→30 · active cue narrates visible slide | PASS | cue #4 (slide 30) vs visible 30; audio 10.42s; expected first cue #4 |
| 2026-10-01T05:49:45Z | S1 AUTO end-to-end | AUTO advanced 29→30 · audio progressing | PASS | currentTime 10.89 → 12.29 |
| 2026-10-01T05:49:45Z | S1 AUTO end-to-end | AUTO advanced 29→30 · CC caption == active cue text | PASS | caption="Every agreement includes named cohorts and activat" cue="Every agreement includes named cohorts and activat" |
| 2026-10-01T05:49:45Z | S1 AUTO end-to-end | AUTO advanced 29→30 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=30 cue=#4 (slide 30) visible=30 transcript chars=447 |
| 2026-10-01T05:49:48Z | S1 AUTO end-to-end | AUTO advanced 30→31 · slide on screen | PASS | visible slide 31 (expected 31) hash=#/27/new-4 |
| 2026-10-01T05:49:48Z | S1 AUTO end-to-end | AUTO advanced 30→31 · clip == slide mapping | PASS | bar clip NAR-07 vs expected NAR-07 for slide 31 (2 ms) |
| 2026-10-01T05:49:48Z | S1 AUTO end-to-end | AUTO advanced 30→31 · audio playing ≤1 s | PASS | paused=false src=guide-07-impact-and-funding-vWkiINp1IS.mp3 ct=22.13 playingEvents=0 rejected=none (5 ms) |
| 2026-10-01T05:49:48Z | S1 AUTO end-to-end | AUTO advanced 30→31 · active cue narrates visible slide | PASS | cue #5 (slide 31) vs visible 31; audio 22.14s; expected first cue #5 |
| 2026-10-01T05:49:48Z | S1 AUTO end-to-end | AUTO advanced 30→31 · audio progressing | PASS | currentTime 22.63 → 24.05 |
| 2026-10-01T05:49:48Z | S1 AUTO end-to-end | AUTO advanced 30→31 · CC caption == active cue text | PASS | caption="Universal API licenses, marketplace revenue share " cue="Universal API licenses, marketplace revenue share " |
| 2026-10-01T05:49:48Z | S1 AUTO end-to-end | AUTO advanced 30→31 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=31 cue=#5 (slide 31) visible=31 transcript chars=447 |
| 2026-10-01T05:49:50Z | S1 AUTO end-to-end | AUTO advanced 31→34 · slide on screen | PASS | visible slide 34 (expected 34) hash=#/27/new-7 |
| 2026-10-01T05:49:50Z | S1 AUTO end-to-end | AUTO advanced 31→34 · clip == slide mapping | PASS | bar clip NAR-08 vs expected NAR-08 for slide 34 (2 ms) |
| 2026-10-01T05:49:50Z | S1 AUTO end-to-end | AUTO advanced 31→34 · audio playing ≤1 s | PASS | paused=false src=guide-08-athar-os-Ib4oKe91OD.mp3 ct=0.07 playingEvents=0 rejected=none (14 ms) |
| 2026-10-01T05:49:50Z | S1 AUTO end-to-end | AUTO advanced 31→34 · active cue narrates visible slide | PASS | cue #1 (slide 34) vs visible 34; audio 0.79s; expected first cue #1 |
| 2026-10-01T05:49:50Z | S1 AUTO end-to-end | AUTO advanced 31→34 · audio progressing | PASS | currentTime 1.28 → 2.7 |
| 2026-10-01T05:49:50Z | S1 AUTO end-to-end | AUTO advanced 31→34 · CC caption == active cue text | PASS | caption="Section eight, Athar OS." cue="Section eight, Athar OS." |
| 2026-10-01T05:49:50Z | S1 AUTO end-to-end | AUTO advanced 31→34 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=34 cue=#1 (slide 34) visible=34 transcript chars=375 |
| 2026-10-01T05:49:51Z | S1 AUTO end-to-end | AUTO advanced 34→36 · slide on screen | PASS | visible slide 36 (expected 36) hash=#/27/new-9 |
| 2026-10-01T05:49:51Z | S1 AUTO end-to-end | AUTO advanced 34→36 · clip == slide mapping | PASS | bar clip NAR-08 vs expected NAR-08 for slide 36 (1 ms) |
| 2026-10-01T05:49:51Z | S1 AUTO end-to-end | AUTO advanced 34→36 · audio playing ≤1 s | PASS | paused=false src=guide-08-athar-os-Ib4oKe91OD.mp3 ct=3.25 playingEvents=0 rejected=none (5 ms) |
| 2026-10-01T05:49:51Z | S1 AUTO end-to-end | AUTO advanced 34→36 · active cue narrates visible slide | PASS | cue #2 (slide 36) vs visible 36; audio 3.28s; expected first cue #2 |
| 2026-10-01T05:49:51Z | S1 AUTO end-to-end | AUTO advanced 34→36 · audio progressing | PASS | currentTime 3.73 → 5.15 |
| 2026-10-01T05:49:51Z | S1 AUTO end-to-end | AUTO advanced 34→36 · CC caption == active cue text | PASS | caption="The roadmap runs now in Q4, 2026, next in 2027 and" cue="The roadmap runs now in Q4, 2026, next in 2027 and" |
| 2026-10-01T05:49:51Z | S1 AUTO end-to-end | AUTO advanced 34→36 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=36 cue=#2 (slide 36) visible=36 transcript chars=375 |
| 2026-10-01T05:49:52Z | S1 AUTO end-to-end | AUTO advanced 36→38 · slide on screen | PASS | visible slide 38 (expected 38) hash=#/27/new-11 |
| 2026-10-01T05:49:52Z | S1 AUTO end-to-end | AUTO advanced 36→38 · clip == slide mapping | PASS | bar clip NAR-08 vs expected NAR-08 for slide 38 (2 ms) |
| 2026-10-01T05:49:52Z | S1 AUTO end-to-end | AUTO advanced 36→38 · audio playing ≤1 s | PASS | paused=false src=guide-08-athar-os-Ib4oKe91OD.mp3 ct=8.62 playingEvents=0 rejected=none (5 ms) |
| 2026-10-01T05:49:52Z | S1 AUTO end-to-end | AUTO advanced 36→38 · active cue narrates visible slide | PASS | cue #3 (slide 38) vs visible 38; audio 8.63s; expected first cue #3 |
| 2026-10-01T05:49:52Z | S1 AUTO end-to-end | AUTO advanced 36→38 · audio progressing | PASS | currentTime 9.13 → 10.57 |
| 2026-10-01T05:49:52Z | S1 AUTO end-to-end | AUTO advanced 36→38 · CC caption == active cue text | PASS | caption="Lebanon, Access, 1 million Lebanese AI experts at " cue="Lebanon, Access, 1 million Lebanese AI experts at " |
| 2026-10-01T05:49:52Z | S1 AUTO end-to-end | AUTO advanced 36→38 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=38 cue=#4 (slide 38) visible=38 transcript chars=375 |
| 2026-10-01T05:49:58Z | S1 AUTO end-to-end | AUTO advanced 38→39 · slide on screen | PASS | visible slide 39 (expected 39) hash=#/28 |
| 2026-10-01T05:49:58Z | S1 AUTO end-to-end | AUTO advanced 38→39 · clip == slide mapping | PASS | bar clip NAR-09 vs expected NAR-09 for slide 39 (1 ms) |
| 2026-10-01T05:49:58Z | S1 AUTO end-to-end | AUTO advanced 38→39 · audio playing ≤1 s | PASS | paused=false src=guide-09-join-the-pact-Hx4Ywy843S.mp3 ct=0.04 playingEvents=0 rejected=none (4 ms) |
| 2026-10-01T05:49:58Z | S1 AUTO end-to-end | AUTO advanced 38→39 · active cue narrates visible slide | PASS | cue #1 (slide 39) vs visible 39; audio 0.74s; expected first cue #1 |
| 2026-10-01T05:49:59Z | S1 AUTO end-to-end | AUTO advanced 38→39 · audio progressing | PASS | currentTime 1.26 → 2.68 |
| 2026-10-01T05:49:59Z | S1 AUTO end-to-end | AUTO advanced 38→39 · CC caption == active cue text | PASS | caption="You have seen the agreement, the community model, " cue="You have seen the agreement, the community model, " |
| 2026-10-01T05:49:59Z | S1 AUTO end-to-end | AUTO advanced 38→39 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=39 cue=#2 (slide 39) visible=39 transcript chars=384 |
| 2026-10-01T05:50:05Z | S1 AUTO end-to-end | reached slide 39 and the last clip ended | PASS | n=39 ended=true changes=22 in 63 s (playbackRate 4×) |
| 2026-10-01T05:50:05Z | S1 AUTO end-to-end | every section hand-over waited for the clip to end | PASS | 1→2 NAR-00→NAR-01 endedBefore=true; 3→4 NAR-01→NAR-02 endedBefore=true; 11→13 NAR-02→NAR-03 endedBefore=true; 17→19 NAR-03→NAR-04 endedBefore=true; 20→21 NAR-04→NAR-05 endedBefore=true; 23→26 NAR-05→NAR-06 endedBefore=tr |
| 2026-10-01T05:50:08Z | S2 keyboard mid-play + rapid skip | guide on slide 1 · slide on screen | PASS | visible slide 1 (expected 1) hash=#/01 |
| 2026-10-01T05:50:08Z | S2 keyboard mid-play + rapid skip | guide on slide 1 · clip == slide mapping | PASS | bar clip NAR-00 vs expected NAR-00 for slide 1 (3 ms) |
| 2026-10-01T05:50:08Z | S2 keyboard mid-play + rapid skip | guide on slide 1 · audio playing ≤1 s | PASS | paused=false src=guide-00-welcome-lhbIUXFwLO.mp3 ct=0 playingEvents=0 rejected=none (15 ms) |
| 2026-10-01T05:50:08Z | S2 keyboard mid-play + rapid skip | guide on slide 1 · active cue narrates visible slide | PASS | cue #1 (slide 1) vs visible 1; audio 0s; expected first cue #1 |
| 2026-10-01T05:50:08Z | S2 keyboard mid-play + rapid skip | guide on slide 1 · audio progressing | PASS | currentTime 0.2 → 1.6 |
| 2026-10-01T05:50:08Z | S2 keyboard mid-play + rapid skip | guide on slide 1 · CC caption == active cue text | PASS | caption="Welcome to the Athar Open Agentic Pact, a communit" cue="Welcome to the Athar Open Agentic Pact, a communit" |
| 2026-10-01T05:50:08Z | S2 keyboard mid-play + rapid skip | guide on slide 1 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=1 cue=#1 (slide 1) visible=1 transcript chars=258 |
| 2026-10-01T05:50:08Z | S2 keyboard mid-play + rapid skip | ArrowRight 1→2 (new clip) · slide on screen | PASS | visible slide 2 (expected 2) hash=#/02 |
| 2026-10-01T05:50:08Z | S2 keyboard mid-play + rapid skip | ArrowRight 1→2 (new clip) · clip == slide mapping | PASS | bar clip NAR-01 vs expected NAR-01 for slide 2 (73 ms) |
| 2026-10-01T05:50:08Z | S2 keyboard mid-play + rapid skip | ArrowRight 1→2 (new clip) · audio playing ≤1 s | PASS | paused=false src=guide-01-the-pact-df1pHtGsVr.mp3 ct=0.05 playingEvents=1 rejected=none (83 ms) |
| 2026-10-01T05:50:08Z | S2 keyboard mid-play + rapid skip | ArrowRight 1→2 (new clip) · active cue narrates visible slide | PASS | cue #1 (slide 2) vs visible 2; audio 0.07s; expected first cue #1 |
| 2026-10-01T05:50:09Z | S2 keyboard mid-play + rapid skip | ArrowRight 1→2 (new clip) · audio progressing | PASS | currentTime 0.35 → 1.8 |
| 2026-10-01T05:50:09Z | S2 keyboard mid-play + rapid skip | ArrowRight 1→2 (new clip) · CC caption == active cue text | PASS | caption="The Athar Open Agentic Pact is an open commitment " cue="The Athar Open Agentic Pact is an open commitment " |
| 2026-10-01T05:50:09Z | S2 keyboard mid-play + rapid skip | ArrowRight 1→2 (new clip) · transcript highlight == on-screen slide | PASS | highlighted sentence slide=2 cue=#2 (slide 2) visible=2 transcript chars=363 |
| 2026-10-01T05:50:09Z | S2 keyboard mid-play + rapid skip | ArrowRight 2→3 (same clip, other sentence) · slide on screen | PASS | visible slide 3 (expected 3) hash=#/03 |
| 2026-10-01T05:50:09Z | S2 keyboard mid-play + rapid skip | ArrowRight 2→3 (same clip, other sentence) · clip == slide mapping | PASS | bar clip NAR-01 vs expected NAR-01 for slide 3 (4 ms) |
| 2026-10-01T05:50:09Z | S2 keyboard mid-play + rapid skip | ArrowRight 2→3 (same clip, other sentence) · audio playing ≤1 s | PASS | paused=false src=guide-01-the-pact-df1pHtGsVr.mp3 ct=1.98 playingEvents=0 rejected=none (22 ms) |
| 2026-10-01T05:50:09Z | S2 keyboard mid-play + rapid skip | ArrowRight 2→3 (same clip, other sentence) · active cue narrates visible slide | PASS | cue #3 (slide 3) vs visible 3; audio 12.2s; expected first cue #3 |
| 2026-10-01T05:50:09Z | S2 keyboard mid-play + rapid skip | ArrowRight 2→3 (same clip, other sentence) · audio progressing | PASS | currentTime 12.46 → 13.87 |
| 2026-10-01T05:50:09Z | S2 keyboard mid-play + rapid skip | ArrowRight 2→3 (same clip, other sentence) · CC caption == active cue text | PASS | caption="It is a community proposal from ODA and AI Rev, de" cue="It is a community proposal from ODA and AI Rev, de" |
| 2026-10-01T05:50:09Z | S2 keyboard mid-play + rapid skip | ArrowRight 2→3 (same clip, other sentence) · transcript highlight == on-screen slide | PASS | highlighted sentence slide=3 cue=#3 (slide 3) visible=3 transcript chars=363 |
| 2026-10-01T05:50:10Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×5 → 8 · slide on screen | PASS | visible slide 8 (expected 8) hash=#/08 |
| 2026-10-01T05:50:10Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×5 → 8 · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 8 (2 ms) |
| 2026-10-01T05:50:10Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×5 → 8 · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=2.27 playingEvents=0 rejected=none (8 ms) |
| 2026-10-01T05:50:10Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×5 → 8 · active cue narrates visible slide | PASS | cue #2 (slide 7) vs visible 8; audio 2.29s; expected first cue #2 |
| 2026-10-01T05:50:10Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×5 → 8 · audio progressing | PASS | currentTime 2.73 → 4.15 |
| 2026-10-01T05:50:10Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×5 → 8 · CC caption == active cue text | PASS | caption="Every webinar, chapter event and challenge should " cue="Every webinar, chapter event and challenge should " |
| 2026-10-01T05:50:10Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×5 → 8 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=7 cue=#2 (slide 7) visible=8 transcript chars=409 |
| 2026-10-01T05:50:10Z | S2 keyboard mid-play + rapid skip | ArrowLeft ×2 → 6 · slide on screen | PASS | visible slide 6 (expected 6) hash=#/06 |
| 2026-10-01T05:50:10Z | S2 keyboard mid-play + rapid skip | ArrowLeft ×2 → 6 · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 6 (2 ms) |
| 2026-10-01T05:50:10Z | S2 keyboard mid-play + rapid skip | ArrowLeft ×2 → 6 · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=0.01 playingEvents=1 rejected=none (11 ms) |
| 2026-10-01T05:50:10Z | S2 keyboard mid-play + rapid skip | ArrowLeft ×2 → 6 · active cue narrates visible slide | PASS | cue #1 (slide 4) vs visible 6; audio 0.01s; expected first cue #1 |
| 2026-10-01T05:50:11Z | S2 keyboard mid-play + rapid skip | ArrowLeft ×2 → 6 · audio progressing | PASS | currentTime 0.17 → 1.59 |
| 2026-10-01T05:50:11Z | S2 keyboard mid-play + rapid skip | ArrowLeft ×2 → 6 · CC caption == active cue text | PASS | caption="Section two, the Community Model." cue="Section two, the Community Model." |
| 2026-10-01T05:50:11Z | S2 keyboard mid-play + rapid skip | ArrowLeft ×2 → 6 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=4 cue=#1 (slide 4) visible=6 transcript chars=409 |
| 2026-10-01T05:50:11Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×7 across sections → 13 · slide on screen | PASS | visible slide 13 (expected 13) hash=#/13 |
| 2026-10-01T05:50:11Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×7 across sections → 13 · clip == slide mapping | PASS | bar clip NAR-03 vs expected NAR-03 for slide 13 (2 ms) |
| 2026-10-01T05:50:11Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×7 across sections → 13 · audio playing ≤1 s | PASS | paused=false src=guide-03-six-pillars-yxVqZJ2k1a.mp3 ct=0.09 playingEvents=0 rejected=none (9 ms) |
| 2026-10-01T05:50:11Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×7 across sections → 13 · active cue narrates visible slide | PASS | cue #1 (slide 13) vs visible 13; audio 0.09s; expected first cue #1 |
| 2026-10-01T05:50:12Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×7 across sections → 13 · audio progressing | PASS | currentTime 0.3 → 1.7 |
| 2026-10-01T05:50:12Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×7 across sections → 13 · CC caption == active cue text | PASS | caption="Section three, six pillars." cue="Section three, six pillars." |
| 2026-10-01T05:50:12Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×7 across sections → 13 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=13 cue=#1 (slide 13) visible=13 transcript chars=293 |
| 2026-10-01T05:50:12Z | S2 keyboard mid-play + rapid skip | End → 39 · slide on screen | PASS | visible slide 39 (expected 39) hash=#/28 |
| 2026-10-01T05:50:12Z | S2 keyboard mid-play + rapid skip | End → 39 · clip == slide mapping | PASS | bar clip NAR-09 vs expected NAR-09 for slide 39 (68 ms) |
| 2026-10-01T05:50:12Z | S2 keyboard mid-play + rapid skip | End → 39 · audio playing ≤1 s | PASS | paused=false src=guide-09-join-the-pact-Hx4Ywy843S.mp3 ct=0.04 playingEvents=1 rejected=none (85 ms) |
| 2026-10-01T05:50:12Z | S2 keyboard mid-play + rapid skip | End → 39 · active cue narrates visible slide | PASS | cue #1 (slide 39) vs visible 39; audio 0.05s; expected first cue #1 |
| 2026-10-01T05:50:12Z | S2 keyboard mid-play + rapid skip | End → 39 · audio progressing | PASS | currentTime 0.26 → 1.65 |
| 2026-10-01T05:50:12Z | S2 keyboard mid-play + rapid skip | End → 39 · CC caption == active cue text | PASS | caption="Join the Pact." cue="Join the Pact." |
| 2026-10-01T05:50:12Z | S2 keyboard mid-play + rapid skip | End → 39 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=39 cue=#1 (slide 39) visible=39 transcript chars=384 |
| 2026-10-01T05:50:12Z | S2 keyboard mid-play + rapid skip | Home → 1 · slide on screen | PASS | visible slide 1 (expected 1) hash=#/01 |
| 2026-10-01T05:50:12Z | S2 keyboard mid-play + rapid skip | Home → 1 · clip == slide mapping | PASS | bar clip NAR-00 vs expected NAR-00 for slide 1 (63 ms) |
| 2026-10-01T05:50:12Z | S2 keyboard mid-play + rapid skip | Home → 1 · audio playing ≤1 s | PASS | paused=false src=guide-00-welcome-lhbIUXFwLO.mp3 ct=0.07 playingEvents=1 rejected=none (68 ms) |
| 2026-10-01T05:50:12Z | S2 keyboard mid-play + rapid skip | Home → 1 · active cue narrates visible slide | PASS | cue #1 (slide 1) vs visible 1; audio 0.08s; expected first cue #1 |
| 2026-10-01T05:50:13Z | S2 keyboard mid-play + rapid skip | Home → 1 · audio progressing | PASS | currentTime 0.24 → 1.65 |
| 2026-10-01T05:50:13Z | S2 keyboard mid-play + rapid skip | Home → 1 · CC caption == active cue text | PASS | caption="Welcome to the Athar Open Agentic Pact, a communit" cue="Welcome to the Athar Open Agentic Pact, a communit" |
| 2026-10-01T05:50:13Z | S2 keyboard mid-play + rapid skip | Home → 1 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=1 cue=#1 (slide 1) visible=1 transcript chars=258 |
| 2026-10-01T05:50:15Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×27 → 28 (virtual slides) · slide on screen | PASS | visible slide 28 (expected 28) hash=#/27/new-1 |
| 2026-10-01T05:50:15Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×27 → 28 (virtual slides) · clip == slide mapping | PASS | bar clip NAR-07 vs expected NAR-07 for slide 28 (2 ms) |
| 2026-10-01T05:50:15Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×27 → 28 (virtual slides) · audio playing ≤1 s | PASS | paused=false src=guide-07-impact-and-funding-vWkiINp1IS.mp3 ct=0 playingEvents=1 rejected=none (9 ms) |
| 2026-10-01T05:50:15Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×27 → 28 (virtual slides) · active cue narrates visible slide | PASS | cue #1 (slide 28) vs visible 28; audio 0.03s; expected first cue #1 |
| 2026-10-01T05:50:15Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×27 → 28 (virtual slides) · audio progressing | PASS | currentTime 0.21 → 1.63 |
| 2026-10-01T05:50:15Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×27 → 28 (virtual slides) · CC caption == active cue text | PASS | caption="Section seven, Impact and Funding." cue="Section seven, Impact and Funding." |
| 2026-10-01T05:50:15Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×27 → 28 (virtual slides) · transcript highlight == on-screen slide | PASS | highlighted sentence slide=28 cue=#1 (slide 28) visible=28 transcript chars=447 |
| 2026-10-01T05:50:16Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×10 → 38 · slide on screen | PASS | visible slide 38 (expected 38) hash=#/27/new-11 |
| 2026-10-01T05:50:16Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×10 → 38 · clip == slide mapping | PASS | bar clip NAR-08 vs expected NAR-08 for slide 38 (1 ms) |
| 2026-10-01T05:50:16Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×10 → 38 · audio playing ≤1 s | PASS | paused=false src=guide-08-athar-os-Ib4oKe91OD.mp3 ct=8.06 playingEvents=0 rejected=none (8 ms) |
| 2026-10-01T05:50:16Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×10 → 38 · active cue narrates visible slide | PASS | cue #3 (slide 38) vs visible 38; audio 8.06s; expected first cue #3 |
| 2026-10-01T05:50:16Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×10 → 38 · audio progressing | PASS | currentTime 8.36 → 9.78 |
| 2026-10-01T05:50:16Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×10 → 38 · CC caption == active cue text | PASS | caption="Lebanon, Access, 1 million Lebanese AI experts at " cue="Lebanon, Access, 1 million Lebanese AI experts at " |
| 2026-10-01T05:50:16Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×10 → 38 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=38 cue=#4 (slide 38) visible=38 transcript chars=375 |
| 2026-10-01T05:50:18Z | S3 N shortcut | N starts narration on slide 5 · slide on screen | PASS | visible slide 5 (expected 5) hash=#/05 |
| 2026-10-01T05:50:18Z | S3 N shortcut | N starts narration on slide 5 · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 5 (1 ms) |
| 2026-10-01T05:50:18Z | S3 N shortcut | N starts narration on slide 5 · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=0.02 playingEvents=1 rejected=none (11 ms) |
| 2026-10-01T05:50:18Z | S3 N shortcut | N starts narration on slide 5 · active cue narrates visible slide | PASS | cue #1 (slide 4) vs visible 5; audio 0.04s; expected first cue #1 |
| 2026-10-01T05:50:19Z | S3 N shortcut | N starts narration on slide 5 · audio progressing | PASS | currentTime 0.21 → 1.62 |
| 2026-10-01T05:50:19Z | S3 N shortcut | N starts narration on slide 5 · CC caption == active cue text | PASS | caption="Section two, the Community Model." cue="Section two, the Community Model." |
| 2026-10-01T05:50:19Z | S3 N shortcut | N starts narration on slide 5 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=4 cue=#1 (slide 4) visible=5 transcript chars=409 |
| 2026-10-01T05:50:19Z | S3 N shortcut | N pauses narration | PASS | paused=true narrating=false (was on slide 5) |
| 2026-10-01T05:50:19Z | S3 N shortcut | paused + ArrowRight: caption/transcript follow the slide without audio | PASS | n=6 (expected 6) clip=NAR-02 paused=true cue=#1 (slide 4) highlight slide=4 |
| 2026-10-01T05:50:19Z | S3 N shortcut | N resumes at the sentence of the slide on screen (6) · slide on screen | PASS | visible slide 6 (expected 6) hash=#/06 |
| 2026-10-01T05:50:19Z | S3 N shortcut | N resumes at the sentence of the slide on screen (6) · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 6 (2 ms) |
| 2026-10-01T05:50:19Z | S3 N shortcut | N resumes at the sentence of the slide on screen (6) · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=2.03 playingEvents=0 rejected=none (5 ms) |
| 2026-10-01T05:50:19Z | S3 N shortcut | N resumes at the sentence of the slide on screen (6) · active cue narrates visible slide | PASS | cue #1 (slide 4) vs visible 6; audio 2.03s; expected first cue #1 |
| 2026-10-01T05:50:20Z | S3 N shortcut | N resumes at the sentence of the slide on screen (6) · audio progressing | PASS | currentTime 2.2 → 3.59 |
| 2026-10-01T05:50:20Z | S3 N shortcut | N resumes at the sentence of the slide on screen (6) · CC caption == active cue text | PASS | caption="Every webinar, chapter event and challenge should " cue="Every webinar, chapter event and challenge should " |
| 2026-10-01T05:50:20Z | S3 N shortcut | N resumes at the sentence of the slide on screen (6) · transcript highlight == on-screen slide | **FAIL** | highlighted sentence slide=7 cue=#2 (slide 7) visible=6 transcript chars=409 |
| 2026-10-01T05:50:22Z | S4 Esc overview + deep links + ?intro=1 | guide on slide 2 · slide on screen | PASS | visible slide 2 (expected 2) hash=#/02 |
| 2026-10-01T05:50:22Z | S4 Esc overview + deep links + ?intro=1 | guide on slide 2 · clip == slide mapping | PASS | bar clip NAR-01 vs expected NAR-01 for slide 2 (1 ms) |
| 2026-10-01T05:50:22Z | S4 Esc overview + deep links + ?intro=1 | guide on slide 2 · audio playing ≤1 s | PASS | paused=false src=guide-01-the-pact-df1pHtGsVr.mp3 ct=0 playingEvents=0 rejected=none (5 ms) |
| 2026-10-01T05:50:22Z | S4 Esc overview + deep links + ?intro=1 | guide on slide 2 · active cue narrates visible slide | PASS | cue #1 (slide 2) vs visible 2; audio 0s; expected first cue #1 |
| 2026-10-01T05:50:22Z | S4 Esc overview + deep links + ?intro=1 | guide on slide 2 · audio progressing | PASS | currentTime 0.18 → 1.57 |
| 2026-10-01T05:50:22Z | S4 Esc overview + deep links + ?intro=1 | guide on slide 2 · CC caption == active cue text | PASS | caption="Section one, the Pact." cue="Section one, the Pact." |
| 2026-10-01T05:50:22Z | S4 Esc overview + deep links + ?intro=1 | guide on slide 2 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=2 cue=#1 (slide 2) visible=2 transcript chars=363 |
| 2026-10-01T05:50:22Z | S4 Esc overview + deep links + ?intro=1 | Esc opens the overview | PASS | overview dialog visible |
| 2026-10-01T05:50:22Z | S4 Esc overview + deep links + ?intro=1 | overview grid has tiles | PASS | 39 tiles |
| 2026-10-01T05:50:23Z | S4 Esc overview + deep links + ?intro=1 | overview tile → slide 7 · slide on screen | PASS | visible slide 7 (expected 7) hash=#/07 |
| 2026-10-01T05:50:23Z | S4 Esc overview + deep links + ?intro=1 | overview tile → slide 7 · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 7 (65 ms) |
| 2026-10-01T05:50:23Z | S4 Esc overview + deep links + ?intro=1 | overview tile → slide 7 · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=2.18 playingEvents=1 rejected=none (73 ms) |
| 2026-10-01T05:50:23Z | S4 Esc overview + deep links + ?intro=1 | overview tile → slide 7 · active cue narrates visible slide | PASS | cue #2 (slide 7) vs visible 7; audio 2.2s; expected first cue #2 |
| 2026-10-01T05:50:23Z | S4 Esc overview + deep links + ?intro=1 | overview tile → slide 7 · audio progressing | PASS | currentTime 2.39 → 3.79 |
| 2026-10-01T05:50:23Z | S4 Esc overview + deep links + ?intro=1 | overview tile → slide 7 · CC caption == active cue text | PASS | caption="Every webinar, chapter event and challenge should " cue="Every webinar, chapter event and challenge should " |
| 2026-10-01T05:50:23Z | S4 Esc overview + deep links + ?intro=1 | overview tile → slide 7 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=7 cue=#2 (slide 7) visible=7 transcript chars=409 |
| 2026-10-01T05:50:23Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/20 · slide on screen | PASS | visible slide 20 (expected 20) hash=#/20 |
| 2026-10-01T05:50:23Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/20 · clip == slide mapping | PASS | bar clip NAR-04 vs expected NAR-04 for slide 20 (72 ms) |
| 2026-10-01T05:50:23Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/20 · audio playing ≤1 s | PASS | paused=false src=guide-04-pledge-and-signing-PWeXZj1Rgc.mp3 ct=5.14 playingEvents=1 rejected=none (93 ms) |
| 2026-10-01T05:50:23Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/20 · active cue narrates visible slide | PASS | cue #3 (slide 20) vs visible 20; audio 5.15s; expected first cue #3 |
| 2026-10-01T05:50:24Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/20 · audio progressing | PASS | currentTime 5.35 → 6.75 |
| 2026-10-01T05:50:24Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/20 · CC caption == active cue text | PASS | caption="A signatory chooses its roles, sign, govern, build" cue="A signatory chooses its roles, sign, govern, build" |
| 2026-10-01T05:50:24Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/20 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=20 cue=#3 (slide 20) visible=20 transcript chars=391 |
| 2026-10-01T05:50:24Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/27/new-4 → 31 · slide on screen | PASS | visible slide 31 (expected 31) hash=#/27/new-4 |
| 2026-10-01T05:50:24Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/27/new-4 → 31 · clip == slide mapping | PASS | bar clip NAR-07 vs expected NAR-07 for slide 31 (65 ms) |
| 2026-10-01T05:50:24Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/27/new-4 → 31 · audio playing ≤1 s | PASS | paused=false src=guide-07-impact-and-funding-vWkiINp1IS.mp3 ct=21.48 playingEvents=1 rejected=none (121 ms) |
| 2026-10-01T05:50:24Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/27/new-4 → 31 · active cue narrates visible slide | PASS | cue #5 (slide 31) vs visible 31; audio 21.49s; expected first cue #5 |
| 2026-10-01T05:50:24Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/27/new-4 → 31 · audio progressing | PASS | currentTime 21.76 → 23.16 |
| 2026-10-01T05:50:24Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/27/new-4 → 31 · CC caption == active cue text | PASS | caption="Universal API licenses, marketplace revenue share " cue="Universal API licenses, marketplace revenue share " |
| 2026-10-01T05:50:24Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/27/new-4 → 31 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=31 cue=#5 (slide 31) visible=31 transcript chars=447 |
| 2026-10-01T05:50:25Z | S4 Esc overview + deep links + ?intro=1 | #slide-07 alias deep link → slide 7 | PASS | n=7 clip=NAR-02 hash=#/07 |
| 2026-10-01T05:50:26Z | S4 Esc overview + deep links + ?intro=1 | full reload on #/25 bypasses the intro and maps clip | PASS | n=25 intro=false clip=NAR-05 |
| 2026-10-01T05:50:27Z | S4 Esc overview + deep links + ?intro=1 | ?intro=1 forces the intro film | PASS | intro=true |
| 2026-10-01T05:50:27Z | S4 Esc overview + deep links + ?intro=1 | no guide narration plays during the intro film | PASS | guide play() calls during intro: 0 |
| 2026-10-01T05:50:28Z | S4 Esc overview + deep links + ?intro=1 | after the intro the deck is on slide 1 with NAR-00 mapped | PASS | n=1 clip=NAR-00 |
| 2026-10-01T05:50:30Z | S5 slide-38 country tabs | guide on slide 38 · slide on screen | PASS | visible slide 38 (expected 38) hash=#/27/new-11 |
| 2026-10-01T05:50:30Z | S5 slide-38 country tabs | guide on slide 38 · clip == slide mapping | PASS | bar clip NAR-08 vs expected NAR-08 for slide 38 (1 ms) |
| 2026-10-01T05:50:30Z | S5 slide-38 country tabs | guide on slide 38 · audio playing ≤1 s | PASS | paused=false src=guide-08-athar-os-Ib4oKe91OD.mp3 ct=7.96 playingEvents=0 rejected=none (4 ms) |
| 2026-10-01T05:50:30Z | S5 slide-38 country tabs | guide on slide 38 · active cue narrates visible slide | PASS | cue #3 (slide 38) vs visible 38; audio 7.96s; expected first cue #3 |
| 2026-10-01T05:50:30Z | S5 slide-38 country tabs | guide on slide 38 · audio progressing | PASS | currentTime 8.07 → 9.49 |
| 2026-10-01T05:50:30Z | S5 slide-38 country tabs | guide on slide 38 · CC caption == active cue text | PASS | caption="Nations empowered." cue="Nations empowered." |
| 2026-10-01T05:50:30Z | S5 slide-38 country tabs | guide on slide 38 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=38 cue=#3 (slide 38) visible=38 transcript chars=375 |
| 2026-10-01T05:50:30Z | S5 slide-38 country tabs | tab in → narration seeks to its sentence (cue #5) | PASS | cue=#5 audio=15.13s tab aria-selected=true paused=false |
| 2026-10-01T05:50:31Z | S5 slide-38 country tabs | tab ke → narration seeks to its sentence (cue #6) | PASS | cue=#6 audio=21.84s tab aria-selected=true paused=false |
| 2026-10-01T05:50:31Z | S5 slide-38 country tabs | tab lb → narration seeks to its sentence (cue #4) | PASS | cue=#4 audio=9.58s tab aria-selected=true paused=false |
| 2026-10-01T05:50:33Z | S6 Replay intro and return | guide on slide 4 · slide on screen | PASS | visible slide 4 (expected 4) hash=#/04 |
| 2026-10-01T05:50:33Z | S6 Replay intro and return | guide on slide 4 · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 4 (2 ms) |
| 2026-10-01T05:50:33Z | S6 Replay intro and return | guide on slide 4 · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=0 playingEvents=0 rejected=none (6 ms) |
| 2026-10-01T05:50:33Z | S6 Replay intro and return | guide on slide 4 · active cue narrates visible slide | PASS | cue #1 (slide 4) vs visible 4; audio 0s; expected first cue #1 |
| 2026-10-01T05:50:34Z | S6 Replay intro and return | guide on slide 4 · audio progressing | PASS | currentTime 0.16 → 1.57 |
| 2026-10-01T05:50:34Z | S6 Replay intro and return | guide on slide 4 · CC caption == active cue text | PASS | caption="Section two, the Community Model." cue="Section two, the Community Model." |
| 2026-10-01T05:50:34Z | S6 Replay intro and return | guide on slide 4 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=4 cue=#1 (slide 4) visible=4 transcript chars=409 |
| 2026-10-01T05:50:34Z | S6 Replay intro and return | Replay intro opens the intro film | PASS | intro-gate shown |
| 2026-10-01T05:50:35Z | S6 Replay intro and return | guide/narration is silent while the intro film plays | PASS | audio=guide-02-community-model-9gUnFBtxrM.mp3 paused=true play() calls= |
| 2026-10-01T05:50:37Z | S6 Replay intro and return | after the replayed intro the guide narrates the slide it returned to (4) · slide on screen | **FAIL** | visible slide 7 (expected 4) hash=#/07 |
| 2026-10-01T05:50:37Z | S6 Replay intro and return | after the replayed intro the guide narrates the slide it returned to (4) · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 4 (1557 ms) |
| 2026-10-01T05:50:37Z | S6 Replay intro and return | after the replayed intro the guide narrates the slide it returned to (4) · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=9.43 playingEvents=0 rejected=none (1563 ms) |
| 2026-10-01T05:50:39Z | S6 Replay intro and return | after the replayed intro the guide narrates the slide it returned to (4) · active cue narrates visible slide | **FAIL** | cue #3 (slide 11) vs visible 4; audio 14.2s; expected first cue #1 |
| 2026-10-01T05:50:39Z | S6 Replay intro and return | after the replayed intro the guide narrates the slide it returned to (4) · audio progressing | PASS | currentTime 14.91 → 16.32 |
| 2026-10-01T05:50:39Z | S6 Replay intro and return | after the replayed intro the guide narrates the slide it returned to (4) · CC caption == active cue text | PASS | caption="Learn agentic AI, build a useful agent through the" cue="Learn agentic AI, build a useful agent through the" |
| 2026-10-01T05:50:39Z | S6 Replay intro and return | after the replayed intro the guide narrates the slide it returned to (4) · transcript highlight == on-screen slide | **FAIL** | highlighted sentence slide=11 cue=#3 (slide 11) visible=4 transcript chars=409 |
| 2026-10-01T05:50:41Z | S7 tab hidden/visible + audio-focus loss | guide on slide 13 · slide on screen | PASS | visible slide 13 (expected 13) hash=#/13 |
| 2026-10-01T05:50:41Z | S7 tab hidden/visible + audio-focus loss | guide on slide 13 · clip == slide mapping | PASS | bar clip NAR-03 vs expected NAR-03 for slide 13 (2 ms) |
| 2026-10-01T05:50:41Z | S7 tab hidden/visible + audio-focus loss | guide on slide 13 · audio playing ≤1 s | PASS | paused=false src=guide-03-six-pillars-yxVqZJ2k1a.mp3 ct=0 playingEvents=0 rejected=none (6 ms) |
| 2026-10-01T05:50:41Z | S7 tab hidden/visible + audio-focus loss | guide on slide 13 · active cue narrates visible slide | PASS | cue #1 (slide 13) vs visible 13; audio 0s; expected first cue #1 |
| 2026-10-01T05:50:41Z | S7 tab hidden/visible + audio-focus loss | guide on slide 13 · audio progressing | PASS | currentTime 0.17 → 1.58 |
| 2026-10-01T05:50:41Z | S7 tab hidden/visible + audio-focus loss | guide on slide 13 · CC caption == active cue text | PASS | caption="Section three, six pillars." cue="Section three, six pillars." |
| 2026-10-01T05:50:41Z | S7 tab hidden/visible + audio-focus loss | guide on slide 13 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=13 cue=#1 (slide 13) visible=13 transcript chars=293 |
| 2026-10-01T05:50:42Z | S7 tab hidden/visible + audio-focus loss | visible again after 2 hidden slide changes → narrates slide 15 · slide on screen | PASS | visible slide 15 (expected 15) hash=#/15 |
| 2026-10-01T05:50:42Z | S7 tab hidden/visible + audio-focus loss | visible again after 2 hidden slide changes → narrates slide 15 · clip == slide mapping | PASS | bar clip NAR-03 vs expected NAR-03 for slide 15 (1 ms) |
| 2026-10-01T05:50:42Z | S7 tab hidden/visible + audio-focus loss | visible again after 2 hidden slide changes → narrates slide 15 · audio playing ≤1 s | PASS | paused=false src=guide-03-six-pillars-yxVqZJ2k1a.mp3 ct=9.85 playingEvents=0 rejected=none (7 ms) |
| 2026-10-01T05:50:42Z | S7 tab hidden/visible + audio-focus loss | visible again after 2 hidden slide changes → narrates slide 15 · active cue narrates visible slide | PASS | cue #3 (slide 14) vs visible 15; audio 9.87s; expected first cue #3 |
| 2026-10-01T05:50:43Z | S7 tab hidden/visible + audio-focus loss | visible again after 2 hidden slide changes → narrates slide 15 · audio progressing | PASS | currentTime 10.36 → 11.74 |
| 2026-10-01T05:50:43Z | S7 tab hidden/visible + audio-focus loss | visible again after 2 hidden slide changes → narrates slide 15 · CC caption == active cue text | PASS | caption="Reusable skills are built once and shared across t" cue="Reusable skills are built once and shared across t" |
| 2026-10-01T05:50:43Z | S7 tab hidden/visible + audio-focus loss | visible again after 2 hidden slide changes → narrates slide 15 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=14 cue=#3 (slide 14) visible=15 transcript chars=293 |
| 2026-10-01T05:50:43Z | S7 tab hidden/visible + audio-focus loss | external pause recorded | PASS | paused=true |
| 2026-10-01T05:50:43Z | S7 tab hidden/visible + audio-focus loss | narration resumes after focus regain (audio-focus loss) | PASS | paused=false after 1 ms |
| 2026-10-01T05:50:45Z | S8 phone 390×844 | phone: guide on slide 2 · slide on screen | PASS | visible slide 2 (expected 2) hash=#/02 |
| 2026-10-01T05:50:45Z | S8 phone 390×844 | phone: guide on slide 2 · clip == slide mapping | PASS | bar clip NAR-01 vs expected NAR-01 for slide 2 (1 ms) |
| 2026-10-01T05:50:45Z | S8 phone 390×844 | phone: guide on slide 2 · audio playing ≤1 s | PASS | paused=false src=guide-01-the-pact-df1pHtGsVr.mp3 ct=0.02 playingEvents=0 rejected=none (5 ms) |
| 2026-10-01T05:50:45Z | S8 phone 390×844 | phone: guide on slide 2 · active cue narrates visible slide | PASS | cue #1 (slide 2) vs visible 2; audio 0.02s; expected first cue #1 |
| 2026-10-01T05:50:45Z | S8 phone 390×844 | phone: guide on slide 2 · audio progressing | PASS | currentTime 0.2 → 1.61 |
| 2026-10-01T05:50:45Z | S8 phone 390×844 | phone: guide on slide 2 · CC caption == active cue text | PASS | caption="Section one, the Pact." cue="Section one, the Pact." |
| 2026-10-01T05:50:45Z | S8 phone 390×844 | phone: guide on slide 2 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=2 cue=#1 (slide 2) visible=2 transcript chars=363 |
| 2026-10-01T05:50:45Z | S8 phone 390×844 | phone: bar next button visible and ≥44 px | PASS | 44×44 |
| 2026-10-01T05:50:46Z | S8 phone 390×844 | phone: bar next → 3 · slide on screen | PASS | visible slide 3 (expected 3) hash=#/03 |
| 2026-10-01T05:50:46Z | S8 phone 390×844 | phone: bar next → 3 · clip == slide mapping | PASS | bar clip NAR-01 vs expected NAR-01 for slide 3 (1 ms) |
| 2026-10-01T05:50:46Z | S8 phone 390×844 | phone: bar next → 3 · audio playing ≤1 s | PASS | paused=false src=guide-01-the-pact-df1pHtGsVr.mp3 ct=12.15 playingEvents=0 rejected=none (10 ms) |
| 2026-10-01T05:50:46Z | S8 phone 390×844 | phone: bar next → 3 · active cue narrates visible slide | PASS | cue #3 (slide 3) vs visible 3; audio 12.15s; expected first cue #3 |
| 2026-10-01T05:50:46Z | S8 phone 390×844 | phone: bar next → 3 · audio progressing | PASS | currentTime 12.32 → 13.72 |
| 2026-10-01T05:50:46Z | S8 phone 390×844 | phone: bar next → 3 · CC caption == active cue text | PASS | caption="It is a community proposal from ODA and AI Rev, de" cue="It is a community proposal from ODA and AI Rev, de" |
| 2026-10-01T05:50:46Z | S8 phone 390×844 | phone: bar next → 3 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=3 cue=#3 (slide 3) visible=3 transcript chars=363 |
| 2026-10-01T05:50:46Z | S8 phone 390×844 | phone: bar next → 4 (new clip) · slide on screen | PASS | visible slide 4 (expected 4) hash=#/04 |
| 2026-10-01T05:50:46Z | S8 phone 390×844 | phone: bar next → 4 (new clip) · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 4 (2 ms) |
| 2026-10-01T05:50:46Z | S8 phone 390×844 | phone: bar next → 4 (new clip) · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=0.02 playingEvents=0 rejected=none (8 ms) |
| 2026-10-01T05:50:46Z | S8 phone 390×844 | phone: bar next → 4 (new clip) · active cue narrates visible slide | PASS | cue #1 (slide 4) vs visible 4; audio 0.03s; expected first cue #1 |
| 2026-10-01T05:50:47Z | S8 phone 390×844 | phone: bar next → 4 (new clip) · audio progressing | PASS | currentTime 0.2 → 1.62 |
| 2026-10-01T05:50:47Z | S8 phone 390×844 | phone: bar next → 4 (new clip) · CC caption == active cue text | PASS | caption="Section two, the Community Model." cue="Section two, the Community Model." |
| 2026-10-01T05:50:47Z | S8 phone 390×844 | phone: bar next → 4 (new clip) · transcript highlight == on-screen slide | PASS | highlighted sentence slide=4 cue=#1 (slide 4) visible=4 transcript chars=409 |
| 2026-10-01T05:50:47Z | S8 phone 390×844 | phone: bar prev → 3 · slide on screen | PASS | visible slide 3 (expected 3) hash=#/03 |
| 2026-10-01T05:50:47Z | S8 phone 390×844 | phone: bar prev → 3 · clip == slide mapping | PASS | bar clip NAR-01 vs expected NAR-01 for slide 3 (1 ms) |
| 2026-10-01T05:50:47Z | S8 phone 390×844 | phone: bar prev → 3 · audio playing ≤1 s | PASS | paused=false src=guide-01-the-pact-df1pHtGsVr.mp3 ct=12.17 playingEvents=0 rejected=none (6 ms) |
| 2026-10-01T05:50:47Z | S8 phone 390×844 | phone: bar prev → 3 · active cue narrates visible slide | PASS | cue #3 (slide 3) vs visible 3; audio 12.17s; expected first cue #3 |
| 2026-10-01T05:50:47Z | S8 phone 390×844 | phone: bar prev → 3 · audio progressing | PASS | currentTime 12.37 → 13.78 |
| 2026-10-01T05:50:47Z | S8 phone 390×844 | phone: bar prev → 3 · CC caption == active cue text | PASS | caption="It is a community proposal from ODA and AI Rev, de" cue="It is a community proposal from ODA and AI Rev, de" |
| 2026-10-01T05:50:47Z | S8 phone 390×844 | phone: bar prev → 3 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=3 cue=#3 (slide 3) visible=3 transcript chars=363 |
| 2026-10-01T05:50:47Z | S8 phone 390×844 | phone: bar fits the viewport (no horizontal overflow) | PASS | {"right":390,"w":390,"sw":390} |
| 2026-10-01T05:50:50Z | S9 Arabic / RTL | lang toggle → ar/rtl | PASS | lang=ar dir=rtl |
| 2026-10-01T05:50:50Z | S9 Arabic / RTL | RTL: guide on slide 2 · slide on screen | PASS | visible slide 2 (expected 2) hash=#/02 |
| 2026-10-01T05:50:50Z | S9 Arabic / RTL | RTL: guide on slide 2 · clip == slide mapping | PASS | bar clip NAR-01 vs expected NAR-01 for slide 2 (1 ms) |
| 2026-10-01T05:50:51Z | S9 Arabic / RTL | RTL: guide on slide 2 · audio playing ≤1 s | **FAIL** | paused=true src=guide-01-the-pact-df1pHtGsVr.mp3 ct=2.74 playingEvents=0 rejected=none (1061 ms) |
| 2026-10-01T05:50:51Z | S9 Arabic / RTL | RTL: guide on slide 2 · active cue narrates visible slide | PASS | cue #2 (slide 2) vs visible 2; audio 2.74s; expected first cue #1 |
| 2026-10-01T05:50:51Z | S9 Arabic / RTL | RTL: guide on slide 2 · CC caption == active cue text | PASS | caption="The Athar Open Agentic Pact is an open commitment " cue="The Athar Open Agentic Pact is an open commitment " |
| 2026-10-01T05:50:51Z | S9 Arabic / RTL | RTL: guide on slide 2 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=2 cue=#2 (slide 2) visible=2 transcript chars=363 |
| 2026-10-01T05:50:52Z | S9 Arabic / RTL | RTL: ArrowLeft = next → 3 · slide on screen | PASS | visible slide 3 (expected 3) hash=#/03 |
| 2026-10-01T05:50:52Z | S9 Arabic / RTL | RTL: ArrowLeft = next → 3 · clip == slide mapping | PASS | bar clip NAR-01 vs expected NAR-01 for slide 3 (5 ms) |
| 2026-10-01T05:50:53Z | S9 Arabic / RTL | RTL: ArrowLeft = next → 3 · audio playing ≤1 s | **FAIL** | paused=true src=guide-01-the-pact-df1pHtGsVr.mp3 ct=12.14 playingEvents=0 rejected=none (1084 ms) |
| 2026-10-01T05:50:53Z | S9 Arabic / RTL | RTL: ArrowLeft = next → 3 · active cue narrates visible slide | PASS | cue #3 (slide 3) vs visible 3; audio 12.14s; expected first cue #3 |
| 2026-10-01T05:50:53Z | S9 Arabic / RTL | RTL: ArrowLeft = next → 3 · CC caption == active cue text | PASS | caption="It is a community proposal from ODA and AI Rev, de" cue="It is a community proposal from ODA and AI Rev, de" |
| 2026-10-01T05:50:53Z | S9 Arabic / RTL | RTL: ArrowLeft = next → 3 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=3 cue=#3 (slide 3) visible=3 transcript chars=363 |
| 2026-10-01T05:50:53Z | S9 Arabic / RTL | RTL: rapid ArrowLeft ×4 → 7 · slide on screen | PASS | visible slide 7 (expected 7) hash=#/07 |
| 2026-10-01T05:50:53Z | S9 Arabic / RTL | RTL: rapid ArrowLeft ×4 → 7 · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 7 (1 ms) |
| 2026-10-01T05:50:54Z | S9 Arabic / RTL | RTL: rapid ArrowLeft ×4 → 7 · audio playing ≤1 s | **FAIL** | paused=true src=guide-02-community-model-9gUnFBtxrM.mp3 ct=2.18 playingEvents=0 rejected=none (1063 ms) |
| 2026-10-01T05:50:54Z | S9 Arabic / RTL | RTL: rapid ArrowLeft ×4 → 7 · active cue narrates visible slide | PASS | cue #2 (slide 7) vs visible 7; audio 2.18s; expected first cue #2 |
| 2026-10-01T05:50:54Z | S9 Arabic / RTL | RTL: rapid ArrowLeft ×4 → 7 · CC caption == active cue text | PASS | caption="Every webinar, chapter event and challenge should " cue="Every webinar, chapter event and challenge should " |
| 2026-10-01T05:50:54Z | S9 Arabic / RTL | RTL: rapid ArrowLeft ×4 → 7 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=7 cue=#2 (slide 7) visible=7 transcript chars=409 |
| 2026-10-01T05:50:54Z | S9 Arabic / RTL | RTL: ArrowRight = previous → 6 · slide on screen | PASS | visible slide 6 (expected 6) hash=#/06 |
| 2026-10-01T05:50:54Z | S9 Arabic / RTL | RTL: ArrowRight = previous → 6 · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 6 (1 ms) |
| 2026-10-01T05:50:55Z | S9 Arabic / RTL | RTL: ArrowRight = previous → 6 · audio playing ≤1 s | **FAIL** | paused=true src=guide-02-community-model-9gUnFBtxrM.mp3 ct=0.01 playingEvents=0 rejected=none (1067 ms) |
| 2026-10-01T05:50:55Z | S9 Arabic / RTL | RTL: ArrowRight = previous → 6 · active cue narrates visible slide | PASS | cue #1 (slide 4) vs visible 6; audio 0.01s; expected first cue #1 |
| 2026-10-01T05:50:55Z | S9 Arabic / RTL | RTL: ArrowRight = previous → 6 · CC caption == active cue text | PASS | caption="Section two, the Community Model." cue="Section two, the Community Model." |
| 2026-10-01T05:50:55Z | S9 Arabic / RTL | RTL: ArrowRight = previous → 6 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=4 cue=#1 (slide 4) visible=6 transcript chars=409 |
| 2026-10-01T05:50:55Z | S9 Arabic / RTL | RTL: bar is dir=rtl and shows the Arabic status text | PASS | {"dir":"rtl","title":"الدليل جاهز · الشريحة 6 من 39 · 02 نموذج المجتمع","live":true} |
| 2026-10-01T05:50:59Z | S10 autoplay policy / persisted narration-on | reload with narration-on persisted: no audio before a gesture (autoplay policy respected) | PASS | paused=true play-rejected=none |
| 2026-10-01T05:50:59Z | S10 autoplay policy / persisted narration-on | blocked state is surfaced in the Guide bar ("tap to start") | PASS | data-blocked=true title="Blocked by the browser — tap or press a key to start the guide · slide 5 of 39 ·" |
| 2026-10-01T05:50:59Z | S10 autoplay policy / persisted narration-on | first click unlocks and narration starts on the visible slide (5) · slide on screen | PASS | visible slide 5 (expected 5) hash=#/05 |
| 2026-10-01T05:50:59Z | S10 autoplay policy / persisted narration-on | first click unlocks and narration starts on the visible slide (5) · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 5 (2 ms) |
| 2026-10-01T05:50:59Z | S10 autoplay policy / persisted narration-on | first click unlocks and narration starts on the visible slide (5) · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=0.09 playingEvents=1 rejected=none (67 ms) |
| 2026-10-01T05:50:59Z | S10 autoplay policy / persisted narration-on | first click unlocks and narration starts on the visible slide (5) · active cue narrates visible slide | PASS | cue #1 (slide 4) vs visible 5; audio 0.09s; expected first cue #1 |
| 2026-10-01T05:50:59Z | S10 autoplay policy / persisted narration-on | first click unlocks and narration starts on the visible slide (5) · audio progressing | PASS | currentTime 0.41 → 1.84 |
| 2026-10-01T05:50:59Z | S10 autoplay policy / persisted narration-on | first click unlocks and narration starts on the visible slide (5) · CC caption == active cue text | PASS | caption="Section two, the Community Model." cue="Section two, the Community Model." |
| 2026-10-01T05:50:59Z | S10 autoplay policy / persisted narration-on | first click unlocks and narration starts on the visible slide (5) · transcript highlight == on-screen slide | PASS | highlighted sentence slide=4 cue=#1 (slide 4) visible=5 transcript chars=409 |

### Mismatches recorded in run `after-fix` (8)

1. **S3 N shortcut — N resumes at the sentence of the slide on screen (6) · transcript highlight == on-screen slide** (2026-10-01T05:50:20Z)  
   repro: press N again  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: highlighted sentence slide=7 cue=#2 (slide 7) visible=6 transcript chars=409
2. **S6 Replay intro and return — after the replayed intro the guide narrates the slide it returned to (4) · slide on screen** (2026-10-01T05:50:37Z)  
   repro: Replay intro → Esc (the deck returns to the slide it was on)  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: visible slide 7 (expected 4) hash=#/07
3. **S6 Replay intro and return — after the replayed intro the guide narrates the slide it returned to (4) · active cue narrates visible slide** (2026-10-01T05:50:39Z)  
   repro: Replay intro → Esc (the deck returns to the slide it was on)  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: cue #3 (slide 11) vs visible 4; audio 14.2s; expected first cue #1
4. **S6 Replay intro and return — after the replayed intro the guide narrates the slide it returned to (4) · transcript highlight == on-screen slide** (2026-10-01T05:50:39Z)  
   repro: Replay intro → Esc (the deck returns to the slide it was on)  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: highlighted sentence slide=11 cue=#3 (slide 11) visible=4 transcript chars=409
5. **S9 Arabic / RTL — RTL: guide on slide 2 · audio playing ≤1 s** (2026-10-01T05:50:51Z)  
   repro: switch to Arabic, click the Guide button  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: paused=true src=guide-01-the-pact-df1pHtGsVr.mp3 ct=2.74 playingEvents=0 rejected=none (1061 ms)
6. **S9 Arabic / RTL — RTL: ArrowLeft = next → 3 · audio playing ≤1 s** (2026-10-01T05:50:53Z)  
   repro: in Arabic press ArrowLeft  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: paused=true src=guide-01-the-pact-df1pHtGsVr.mp3 ct=12.14 playingEvents=0 rejected=none (1084 ms)
7. **S9 Arabic / RTL — RTL: rapid ArrowLeft ×4 → 7 · audio playing ≤1 s** (2026-10-01T05:50:54Z)  
   repro: see scenario  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: paused=true src=guide-02-community-model-9gUnFBtxrM.mp3 ct=2.18 playingEvents=0 rejected=none (1063 ms)
8. **S9 Arabic / RTL — RTL: ArrowRight = previous → 6 · audio playing ≤1 s** (2026-10-01T05:50:55Z)  
   repro: see scenario  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: paused=true src=guide-02-community-model-9gUnFBtxrM.mp3 ct=0.01 playingEvents=0 rejected=none (1067 ms)


## Run `final` — 2026-10-01T05:52:36Z → 2026-10-01T05:54:37Z

Base URL http://127.0.0.1:4174 · Chromium (Playwright) · playbackRate 4× for the AUTO end-to-end scenario · checks: **392 pass / 4 fail** of 396

| UTC | scenario | check | result | detail |
|---|---|---|---|---|
| 2026-10-01T05:52:40Z | S1 AUTO end-to-end | intro skipped, slide 1, guide idle | PASS | n=1 intro=false narrating=false |
| 2026-10-01T05:52:40Z | S1 AUTO end-to-end | start guide on slide 1 · slide on screen | PASS | visible slide 1 (expected 1) hash=#/01 |
| 2026-10-01T05:52:40Z | S1 AUTO end-to-end | start guide on slide 1 · clip == slide mapping | PASS | bar clip NAR-00 vs expected NAR-00 for slide 1 (4 ms) |
| 2026-10-01T05:52:40Z | S1 AUTO end-to-end | start guide on slide 1 · audio playing ≤1 s | PASS | paused=false src=guide-00-welcome-lhbIUXFwLO.mp3 ct=0.07 playingEvents=0 rejected=none (12 ms) |
| 2026-10-01T05:52:40Z | S1 AUTO end-to-end | start guide on slide 1 · active cue narrates visible slide | PASS | cue #1 (slide 1) vs visible 1; audio 0.08s; expected first cue #1 |
| 2026-10-01T05:52:40Z | S1 AUTO end-to-end | start guide on slide 1 · audio progressing | PASS | currentTime 0.25 → 1.67 |
| 2026-10-01T05:52:40Z | S1 AUTO end-to-end | start guide on slide 1 · CC caption == active cue text | PASS | caption="Welcome to the Athar Open Agentic Pact, a communit" cue="Welcome to the Athar Open Agentic Pact, a communit" |
| 2026-10-01T05:52:40Z | S1 AUTO end-to-end | start guide on slide 1 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=1 cue=#1 (slide 1) visible=1 transcript chars=258 |
| 2026-10-01T05:52:44Z | S1 AUTO end-to-end | AUTO advanced 1→2 · slide on screen | PASS | visible slide 2 (expected 2) hash=#/02 |
| 2026-10-01T05:52:44Z | S1 AUTO end-to-end | AUTO advanced 1→2 · clip == slide mapping | PASS | bar clip NAR-01 vs expected NAR-01 for slide 2 (3 ms) |
| 2026-10-01T05:52:44Z | S1 AUTO end-to-end | AUTO advanced 1→2 · audio playing ≤1 s | PASS | paused=false src=guide-01-the-pact-df1pHtGsVr.mp3 ct=0.09 playingEvents=0 rejected=none (9 ms) |
| 2026-10-01T05:52:45Z | S1 AUTO end-to-end | AUTO advanced 1→2 · active cue narrates visible slide | PASS | cue #1 (slide 2) vs visible 2; audio 0.67s; expected first cue #1 |
| 2026-10-01T05:52:45Z | S1 AUTO end-to-end | AUTO advanced 1→2 · audio progressing | PASS | currentTime 1.14 → 2.55 |
| 2026-10-01T05:52:45Z | S1 AUTO end-to-end | AUTO advanced 1→2 · CC caption == active cue text | PASS | caption="The Athar Open Agentic Pact is an open commitment " cue="The Athar Open Agentic Pact is an open commitment " |
| 2026-10-01T05:52:45Z | S1 AUTO end-to-end | AUTO advanced 1→2 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=2 cue=#2 (slide 2) visible=2 transcript chars=363 |
| 2026-10-01T05:52:48Z | S1 AUTO end-to-end | AUTO advanced 2→3 · slide on screen | PASS | visible slide 3 (expected 3) hash=#/03 |
| 2026-10-01T05:52:48Z | S1 AUTO end-to-end | AUTO advanced 2→3 · clip == slide mapping | PASS | bar clip NAR-01 vs expected NAR-01 for slide 3 (1 ms) |
| 2026-10-01T05:52:48Z | S1 AUTO end-to-end | AUTO advanced 2→3 · audio playing ≤1 s | PASS | paused=false src=guide-01-the-pact-df1pHtGsVr.mp3 ct=12.72 playingEvents=0 rejected=none (10 ms) |
| 2026-10-01T05:52:48Z | S1 AUTO end-to-end | AUTO advanced 2→3 · active cue narrates visible slide | PASS | cue #3 (slide 3) vs visible 3; audio 12.74s; expected first cue #3 |
| 2026-10-01T05:52:48Z | S1 AUTO end-to-end | AUTO advanced 2→3 · audio progressing | PASS | currentTime 13.21 → 14.63 |
| 2026-10-01T05:52:48Z | S1 AUTO end-to-end | AUTO advanced 2→3 · CC caption == active cue text | PASS | caption="It is a community proposal from ODA and AI Rev, de" cue="It is a community proposal from ODA and AI Rev, de" |
| 2026-10-01T05:52:48Z | S1 AUTO end-to-end | AUTO advanced 2→3 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=3 cue=#3 (slide 3) visible=3 transcript chars=363 |
| 2026-10-01T05:52:51Z | S1 AUTO end-to-end | AUTO advanced 3→4 · slide on screen | PASS | visible slide 4 (expected 4) hash=#/04 |
| 2026-10-01T05:52:51Z | S1 AUTO end-to-end | AUTO advanced 3→4 · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 4 (3 ms) |
| 2026-10-01T05:52:51Z | S1 AUTO end-to-end | AUTO advanced 3→4 · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=0.07 playingEvents=0 rejected=none (8 ms) |
| 2026-10-01T05:52:51Z | S1 AUTO end-to-end | AUTO advanced 3→4 · active cue narrates visible slide | PASS | cue #1 (slide 4) vs visible 4; audio 0.72s; expected first cue #1 |
| 2026-10-01T05:52:51Z | S1 AUTO end-to-end | AUTO advanced 3→4 · audio progressing | PASS | currentTime 1.22 → 2.66 |
| 2026-10-01T05:52:51Z | S1 AUTO end-to-end | AUTO advanced 3→4 · CC caption == active cue text | PASS | caption="Section two, the Community Model." cue="Section two, the Community Model." |
| 2026-10-01T05:52:51Z | S1 AUTO end-to-end | AUTO advanced 3→4 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=4 cue=#1 (slide 4) visible=4 transcript chars=409 |
| 2026-10-01T05:52:52Z | S1 AUTO end-to-end | AUTO advanced 4→7 · slide on screen | PASS | visible slide 7 (expected 7) hash=#/07 |
| 2026-10-01T05:52:52Z | S1 AUTO end-to-end | AUTO advanced 4→7 · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 7 (2 ms) |
| 2026-10-01T05:52:52Z | S1 AUTO end-to-end | AUTO advanced 4→7 · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=3.16 playingEvents=0 rejected=none (7 ms) |
| 2026-10-01T05:52:52Z | S1 AUTO end-to-end | AUTO advanced 4→7 · active cue narrates visible slide | PASS | cue #2 (slide 7) vs visible 7; audio 3.17s; expected first cue #2 |
| 2026-10-01T05:52:52Z | S1 AUTO end-to-end | AUTO advanced 4→7 · audio progressing | PASS | currentTime 3.68 → 5.07 |
| 2026-10-01T05:52:52Z | S1 AUTO end-to-end | AUTO advanced 4→7 · CC caption == active cue text | PASS | caption="Every webinar, chapter event and challenge should " cue="Every webinar, chapter event and challenge should " |
| 2026-10-01T05:52:52Z | S1 AUTO end-to-end | AUTO advanced 4→7 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=7 cue=#2 (slide 7) visible=7 transcript chars=409 |
| 2026-10-01T05:52:54Z | S1 AUTO end-to-end | AUTO advanced 7→11 · slide on screen | PASS | visible slide 11 (expected 11) hash=#/11 |
| 2026-10-01T05:52:54Z | S1 AUTO end-to-end | AUTO advanced 7→11 · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 11 (2 ms) |
| 2026-10-01T05:52:54Z | S1 AUTO end-to-end | AUTO advanced 7→11 · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=11.56 playingEvents=0 rejected=none (9 ms) |
| 2026-10-01T05:52:54Z | S1 AUTO end-to-end | AUTO advanced 7→11 · active cue narrates visible slide | PASS | cue #3 (slide 11) vs visible 11; audio 11.58s; expected first cue #3 |
| 2026-10-01T05:52:54Z | S1 AUTO end-to-end | AUTO advanced 7→11 · audio progressing | PASS | currentTime 12.06 → 13.48 |
| 2026-10-01T05:52:54Z | S1 AUTO end-to-end | AUTO advanced 7→11 · CC caption == active cue text | PASS | caption="Learn agentic AI, build a useful agent through the" cue="Learn agentic AI, build a useful agent through the" |
| 2026-10-01T05:52:54Z | S1 AUTO end-to-end | AUTO advanced 7→11 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=11 cue=#3 (slide 11) visible=11 transcript chars=409 |
| 2026-10-01T05:52:58Z | S1 AUTO end-to-end | AUTO advanced 11→13 · slide on screen | PASS | visible slide 13 (expected 13) hash=#/13 |
| 2026-10-01T05:52:58Z | S1 AUTO end-to-end | AUTO advanced 11→13 · clip == slide mapping | PASS | bar clip NAR-03 vs expected NAR-03 for slide 13 (2 ms) |
| 2026-10-01T05:52:58Z | S1 AUTO end-to-end | AUTO advanced 11→13 · audio playing ≤1 s | PASS | paused=false src=guide-03-six-pillars-yxVqZJ2k1a.mp3 ct=0.07 playingEvents=1 rejected=none (17 ms) |
| 2026-10-01T05:52:58Z | S1 AUTO end-to-end | AUTO advanced 11→13 · active cue narrates visible slide | PASS | cue #1 (slide 13) vs visible 13; audio 0.82s; expected first cue #1 |
| 2026-10-01T05:52:58Z | S1 AUTO end-to-end | AUTO advanced 11→13 · audio progressing | PASS | currentTime 1.29 → 2.71 |
| 2026-10-01T05:52:58Z | S1 AUTO end-to-end | AUTO advanced 11→13 · CC caption == active cue text | PASS | caption="Plugins are the connective tissue: one shared plug" cue="Plugins are the connective tissue: one shared plug" |
| 2026-10-01T05:52:58Z | S1 AUTO end-to-end | AUTO advanced 11→13 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=13 cue=#2 (slide 13) visible=13 transcript chars=293 |
| 2026-10-01T05:53:00Z | S1 AUTO end-to-end | AUTO advanced 13→14 · slide on screen | PASS | visible slide 14 (expected 14) hash=#/14 |
| 2026-10-01T05:53:00Z | S1 AUTO end-to-end | AUTO advanced 13→14 · clip == slide mapping | PASS | bar clip NAR-03 vs expected NAR-03 for slide 14 (2 ms) |
| 2026-10-01T05:53:00Z | S1 AUTO end-to-end | AUTO advanced 13→14 · audio playing ≤1 s | PASS | paused=false src=guide-03-six-pillars-yxVqZJ2k1a.mp3 ct=9.65 playingEvents=0 rejected=none (9 ms) |
| 2026-10-01T05:53:00Z | S1 AUTO end-to-end | AUTO advanced 13→14 · active cue narrates visible slide | PASS | cue #3 (slide 14) vs visible 14; audio 9.66s; expected first cue #3 |
| 2026-10-01T05:53:01Z | S1 AUTO end-to-end | AUTO advanced 13→14 · audio progressing | PASS | currentTime 10.17 → 11.55 |
| 2026-10-01T05:53:01Z | S1 AUTO end-to-end | AUTO advanced 13→14 · CC caption == active cue text | PASS | caption="Reusable skills are built once and shared across t" cue="Reusable skills are built once and shared across t" |
| 2026-10-01T05:53:01Z | S1 AUTO end-to-end | AUTO advanced 13→14 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=14 cue=#3 (slide 14) visible=14 transcript chars=293 |
| 2026-10-01T05:53:01Z | S1 AUTO end-to-end | AUTO advanced 14→17 · slide on screen | PASS | visible slide 17 (expected 17) hash=#/17 |
| 2026-10-01T05:53:01Z | S1 AUTO end-to-end | AUTO advanced 14→17 · clip == slide mapping | PASS | bar clip NAR-03 vs expected NAR-03 for slide 17 (2 ms) |
| 2026-10-01T05:53:01Z | S1 AUTO end-to-end | AUTO advanced 14→17 · audio playing ≤1 s | PASS | paused=false src=guide-03-six-pillars-yxVqZJ2k1a.mp3 ct=13.69 playingEvents=0 rejected=none (8 ms) |
| 2026-10-01T05:53:01Z | S1 AUTO end-to-end | AUTO advanced 14→17 · active cue narrates visible slide | PASS | cue #4 (slide 17) vs visible 17; audio 13.7s; expected first cue #4 |
| 2026-10-01T05:53:02Z | S1 AUTO end-to-end | AUTO advanced 14→17 · audio progressing | PASS | currentTime 14.2 → 15.62 |
| 2026-10-01T05:53:02Z | S1 AUTO end-to-end | AUTO advanced 14→17 · CC caption == active cue text | PASS | caption="Universal API licences are managed by Athar, givin" cue="Universal API licences are managed by Athar, givin" |
| 2026-10-01T05:53:02Z | S1 AUTO end-to-end | AUTO advanced 14→17 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=17 cue=#4 (slide 17) visible=17 transcript chars=293 |
| 2026-10-01T05:53:03Z | S1 AUTO end-to-end | AUTO advanced 17→19 · slide on screen | PASS | visible slide 19 (expected 19) hash=#/19 |
| 2026-10-01T05:53:03Z | S1 AUTO end-to-end | AUTO advanced 17→19 · clip == slide mapping | PASS | bar clip NAR-04 vs expected NAR-04 for slide 19 (2 ms) |
| 2026-10-01T05:53:03Z | S1 AUTO end-to-end | AUTO advanced 17→19 · audio playing ≤1 s | PASS | paused=false src=guide-04-pledge-and-signing-PWeXZj1Rgc.mp3 ct=0 playingEvents=0 rejected=none (10 ms) |
| 2026-10-01T05:53:03Z | S1 AUTO end-to-end | AUTO advanced 17→19 · active cue narrates visible slide | PASS | cue #1 (slide 19) vs visible 19; audio 0.71s; expected first cue #1 |
| 2026-10-01T05:53:03Z | S1 AUTO end-to-end | AUTO advanced 17→19 · audio progressing | PASS | currentTime 1.22 → 2.66 |
| 2026-10-01T05:53:03Z | S1 AUTO end-to-end | AUTO advanced 17→19 · CC caption == active cue text | PASS | caption="Section four, Pledge and Signing." cue="Section four, Pledge and Signing." |
| 2026-10-01T05:53:03Z | S1 AUTO end-to-end | AUTO advanced 17→19 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=19 cue=#1 (slide 19) visible=19 transcript chars=391 |
| 2026-10-01T05:53:04Z | S1 AUTO end-to-end | AUTO advanced 19→20 · slide on screen | PASS | visible slide 20 (expected 20) hash=#/20 |
| 2026-10-01T05:53:04Z | S1 AUTO end-to-end | AUTO advanced 19→20 · clip == slide mapping | PASS | bar clip NAR-04 vs expected NAR-04 for slide 20 (1 ms) |
| 2026-10-01T05:53:04Z | S1 AUTO end-to-end | AUTO advanced 19→20 · audio playing ≤1 s | PASS | paused=false src=guide-04-pledge-and-signing-PWeXZj1Rgc.mp3 ct=6.17 playingEvents=0 rejected=none (6 ms) |
| 2026-10-01T05:53:04Z | S1 AUTO end-to-end | AUTO advanced 19→20 · active cue narrates visible slide | PASS | cue #3 (slide 20) vs visible 20; audio 6.19s; expected first cue #3 |
| 2026-10-01T05:53:05Z | S1 AUTO end-to-end | AUTO advanced 19→20 · audio progressing | PASS | currentTime 6.68 → 8.12 |
| 2026-10-01T05:53:05Z | S1 AUTO end-to-end | AUTO advanced 19→20 · CC caption == active cue text | PASS | caption="A signatory chooses its roles, sign, govern, build" cue="A signatory chooses its roles, sign, govern, build" |
| 2026-10-01T05:53:05Z | S1 AUTO end-to-end | AUTO advanced 19→20 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=20 cue=#3 (slide 20) visible=20 transcript chars=391 |
| 2026-10-01T05:53:09Z | S1 AUTO end-to-end | AUTO advanced 20→21 · slide on screen | PASS | visible slide 21 (expected 21) hash=#/21 |
| 2026-10-01T05:53:09Z | S1 AUTO end-to-end | AUTO advanced 20→21 · clip == slide mapping | PASS | bar clip NAR-05 vs expected NAR-05 for slide 21 (2 ms) |
| 2026-10-01T05:53:09Z | S1 AUTO end-to-end | AUTO advanced 20→21 · audio playing ≤1 s | PASS | paused=false src=guide-05-actors-and-roles-0PbyoFNYNV.mp3 ct=0.09 playingEvents=0 rejected=none (11 ms) |
| 2026-10-01T05:53:09Z | S1 AUTO end-to-end | AUTO advanced 20→21 · active cue narrates visible slide | PASS | cue #1 (slide 21) vs visible 21; audio 0.77s; expected first cue #1 |
| 2026-10-01T05:53:10Z | S1 AUTO end-to-end | AUTO advanced 20→21 · audio progressing | PASS | currentTime 1.29 → 2.69 |
| 2026-10-01T05:53:10Z | S1 AUTO end-to-end | AUTO advanced 20→21 · CC caption == active cue text | PASS | caption="Section five, Actors and Roles, institutions, part" cue="Section five, Actors and Roles, institutions, part" |
| 2026-10-01T05:53:10Z | S1 AUTO end-to-end | AUTO advanced 20→21 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=21 cue=#1 (slide 21) visible=21 transcript chars=394 |
| 2026-10-01T05:53:14Z | S1 AUTO end-to-end | AUTO advanced 21→23 · slide on screen | PASS | visible slide 23 (expected 23) hash=#/23 |
| 2026-10-01T05:53:14Z | S1 AUTO end-to-end | AUTO advanced 21→23 · clip == slide mapping | PASS | bar clip NAR-05 vs expected NAR-05 for slide 23 (1 ms) |
| 2026-10-01T05:53:14Z | S1 AUTO end-to-end | AUTO advanced 21→23 · audio playing ≤1 s | PASS | paused=false src=guide-05-actors-and-roles-0PbyoFNYNV.mp3 ct=19.99 playingEvents=0 rejected=none (10 ms) |
| 2026-10-01T05:53:14Z | S1 AUTO end-to-end | AUTO advanced 21→23 · active cue narrates visible slide | PASS | cue #2 (slide 23) vs visible 23; audio 20.01s; expected first cue #2 |
| 2026-10-01T05:53:14Z | S1 AUTO end-to-end | AUTO advanced 21→23 · audio progressing | PASS | currentTime 20.48 → 21.89 |
| 2026-10-01T05:53:14Z | S1 AUTO end-to-end | AUTO advanced 21→23 · CC caption == active cue text | PASS | caption="The UAE Ministry of Foreign Trade signs and govern" cue="The UAE Ministry of Foreign Trade signs and govern" |
| 2026-10-01T05:53:14Z | S1 AUTO end-to-end | AUTO advanced 21→23 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=23 cue=#2 (slide 23) visible=23 transcript chars=394 |
| 2026-10-01T05:53:17Z | S1 AUTO end-to-end | AUTO advanced 23→26 · slide on screen | PASS | visible slide 26 (expected 26) hash=#/26 |
| 2026-10-01T05:53:17Z | S1 AUTO end-to-end | AUTO advanced 23→26 · clip == slide mapping | PASS | bar clip NAR-06 vs expected NAR-06 for slide 26 (1 ms) |
| 2026-10-01T05:53:17Z | S1 AUTO end-to-end | AUTO advanced 23→26 · audio playing ≤1 s | PASS | paused=false src=guide-06-governance-and-roadmap-kyzmCSHcw8.mp3 ct=0.07 playingEvents=0 rejected=none (5 ms) |
| 2026-10-01T05:53:17Z | S1 AUTO end-to-end | AUTO advanced 23→26 · active cue narrates visible slide | PASS | cue #1 (slide 26) vs visible 26; audio 0.83s; expected first cue #1 |
| 2026-10-01T05:53:18Z | S1 AUTO end-to-end | AUTO advanced 23→26 · audio progressing | PASS | currentTime 1.33 → 2.75 |
| 2026-10-01T05:53:18Z | S1 AUTO end-to-end | AUTO advanced 23→26 · CC caption == active cue text | PASS | caption="Section six, governance and roadmap." cue="Section six, governance and roadmap." |
| 2026-10-01T05:53:18Z | S1 AUTO end-to-end | AUTO advanced 23→26 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=26 cue=#1 (slide 26) visible=26 transcript chars=263 |
| 2026-10-01T05:53:19Z | S1 AUTO end-to-end | AUTO advanced 26→27 · slide on screen | PASS | visible slide 27 (expected 27) hash=#/27 |
| 2026-10-01T05:53:19Z | S1 AUTO end-to-end | AUTO advanced 26→27 · clip == slide mapping | PASS | bar clip NAR-06 vs expected NAR-06 for slide 27 (2 ms) |
| 2026-10-01T05:53:19Z | S1 AUTO end-to-end | AUTO advanced 26→27 · audio playing ≤1 s | PASS | paused=false src=guide-06-governance-and-roadmap-kyzmCSHcw8.mp3 ct=8.27 playingEvents=0 rejected=none (9 ms) |
| 2026-10-01T05:53:19Z | S1 AUTO end-to-end | AUTO advanced 26→27 · active cue narrates visible slide | PASS | cue #3 (slide 27) vs visible 27; audio 8.3s; expected first cue #3 |
| 2026-10-01T05:53:19Z | S1 AUTO end-to-end | AUTO advanced 26→27 · audio progressing | PASS | currentTime 8.8 → 10.24 |
| 2026-10-01T05:53:19Z | S1 AUTO end-to-end | AUTO advanced 26→27 · CC caption == active cue text | PASS | caption="Decisions, releases, and outcome reports are publi" cue="Decisions, releases, and outcome reports are publi" |
| 2026-10-01T05:53:19Z | S1 AUTO end-to-end | AUTO advanced 26→27 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=27 cue=#3 (slide 27) visible=27 transcript chars=263 |
| 2026-10-01T05:53:21Z | S1 AUTO end-to-end | AUTO advanced 27→28 · slide on screen | PASS | visible slide 28 (expected 28) hash=#/27/new-1 |
| 2026-10-01T05:53:21Z | S1 AUTO end-to-end | AUTO advanced 27→28 · clip == slide mapping | PASS | bar clip NAR-07 vs expected NAR-07 for slide 28 (2 ms) |
| 2026-10-01T05:53:21Z | S1 AUTO end-to-end | AUTO advanced 27→28 · audio playing ≤1 s | PASS | paused=false src=guide-07-impact-and-funding-vWkiINp1IS.mp3 ct=0.08 playingEvents=0 rejected=none (10 ms) |
| 2026-10-01T05:53:21Z | S1 AUTO end-to-end | AUTO advanced 27→28 · active cue narrates visible slide | PASS | cue #1 (slide 28) vs visible 28; audio 0.72s; expected first cue #1 |
| 2026-10-01T05:53:22Z | S1 AUTO end-to-end | AUTO advanced 27→28 · audio progressing | PASS | currentTime 1.23 → 2.67 |
| 2026-10-01T05:53:22Z | S1 AUTO end-to-end | AUTO advanced 27→28 · CC caption == active cue text | PASS | caption="Section seven, Impact and Funding." cue="Section seven, Impact and Funding." |
| 2026-10-01T05:53:22Z | S1 AUTO end-to-end | AUTO advanced 27→28 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=28 cue=#1 (slide 28) visible=28 transcript chars=447 |
| 2026-10-01T05:53:22Z | S1 AUTO end-to-end | AUTO advanced 28→29 · slide on screen | PASS | visible slide 29 (expected 29) hash=#/27/new-2 |
| 2026-10-01T05:53:22Z | S1 AUTO end-to-end | AUTO advanced 28→29 · clip == slide mapping | PASS | bar clip NAR-07 vs expected NAR-07 for slide 29 (5 ms) |
| 2026-10-01T05:53:22Z | S1 AUTO end-to-end | AUTO advanced 28→29 · audio playing ≤1 s | PASS | paused=false src=guide-07-impact-and-funding-vWkiINp1IS.mp3 ct=3.19 playingEvents=0 rejected=none (10 ms) |
| 2026-10-01T05:53:22Z | S1 AUTO end-to-end | AUTO advanced 28→29 · active cue narrates visible slide | PASS | cue #2 (slide 29) vs visible 29; audio 3.2s; expected first cue #2 |
| 2026-10-01T05:53:22Z | S1 AUTO end-to-end | AUTO advanced 28→29 · audio progressing | PASS | currentTime 3.71 → 5.13 |
| 2026-10-01T05:53:22Z | S1 AUTO end-to-end | AUTO advanced 28→29 · CC caption == active cue text | PASS | caption="Three impact tiers, one delivery model, access, ow" cue="Three impact tiers, one delivery model, access, ow" |
| 2026-10-01T05:53:22Z | S1 AUTO end-to-end | AUTO advanced 28→29 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=29 cue=#2 (slide 29) visible=29 transcript chars=447 |
| 2026-10-01T05:53:24Z | S1 AUTO end-to-end | AUTO advanced 29→30 · slide on screen | PASS | visible slide 30 (expected 30) hash=#/27/new-3 |
| 2026-10-01T05:53:24Z | S1 AUTO end-to-end | AUTO advanced 29→30 · clip == slide mapping | PASS | bar clip NAR-07 vs expected NAR-07 for slide 30 (2 ms) |
| 2026-10-01T05:53:24Z | S1 AUTO end-to-end | AUTO advanced 29→30 · audio playing ≤1 s | PASS | paused=false src=guide-07-impact-and-funding-vWkiINp1IS.mp3 ct=10.62 playingEvents=0 rejected=none (9 ms) |
| 2026-10-01T05:53:24Z | S1 AUTO end-to-end | AUTO advanced 29→30 · active cue narrates visible slide | PASS | cue #4 (slide 30) vs visible 30; audio 10.63s; expected first cue #4 |
| 2026-10-01T05:53:24Z | S1 AUTO end-to-end | AUTO advanced 29→30 · audio progressing | PASS | currentTime 11.12 → 12.54 |
| 2026-10-01T05:53:24Z | S1 AUTO end-to-end | AUTO advanced 29→30 · CC caption == active cue text | PASS | caption="Every agreement includes named cohorts and activat" cue="Every agreement includes named cohorts and activat" |
| 2026-10-01T05:53:24Z | S1 AUTO end-to-end | AUTO advanced 29→30 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=30 cue=#4 (slide 30) visible=30 transcript chars=447 |
| 2026-10-01T05:53:27Z | S1 AUTO end-to-end | AUTO advanced 30→31 · slide on screen | PASS | visible slide 31 (expected 31) hash=#/27/new-4 |
| 2026-10-01T05:53:27Z | S1 AUTO end-to-end | AUTO advanced 30→31 · clip == slide mapping | PASS | bar clip NAR-07 vs expected NAR-07 for slide 31 (2 ms) |
| 2026-10-01T05:53:27Z | S1 AUTO end-to-end | AUTO advanced 30→31 · audio playing ≤1 s | PASS | paused=false src=guide-07-impact-and-funding-vWkiINp1IS.mp3 ct=22.4 playingEvents=0 rejected=none (7 ms) |
| 2026-10-01T05:53:27Z | S1 AUTO end-to-end | AUTO advanced 30→31 · active cue narrates visible slide | PASS | cue #5 (slide 31) vs visible 31; audio 22.42s; expected first cue #5 |
| 2026-10-01T05:53:27Z | S1 AUTO end-to-end | AUTO advanced 30→31 · audio progressing | PASS | currentTime 22.92 → 24.34 |
| 2026-10-01T05:53:27Z | S1 AUTO end-to-end | AUTO advanced 30→31 · CC caption == active cue text | PASS | caption="Universal API licenses, marketplace revenue share " cue="Universal API licenses, marketplace revenue share " |
| 2026-10-01T05:53:27Z | S1 AUTO end-to-end | AUTO advanced 30→31 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=31 cue=#5 (slide 31) visible=31 transcript chars=447 |
| 2026-10-01T05:53:29Z | S1 AUTO end-to-end | AUTO advanced 31→34 · slide on screen | PASS | visible slide 34 (expected 34) hash=#/27/new-7 |
| 2026-10-01T05:53:29Z | S1 AUTO end-to-end | AUTO advanced 31→34 · clip == slide mapping | PASS | bar clip NAR-08 vs expected NAR-08 for slide 34 (3 ms) |
| 2026-10-01T05:53:29Z | S1 AUTO end-to-end | AUTO advanced 31→34 · audio playing ≤1 s | PASS | paused=false src=guide-08-athar-os-Ib4oKe91OD.mp3 ct=0.09 playingEvents=0 rejected=none (40 ms) |
| 2026-10-01T05:53:29Z | S1 AUTO end-to-end | AUTO advanced 31→34 · active cue narrates visible slide | PASS | cue #1 (slide 34) vs visible 34; audio 0.66s; expected first cue #1 |
| 2026-10-01T05:53:29Z | S1 AUTO end-to-end | AUTO advanced 31→34 · audio progressing | PASS | currentTime 1.13 → 2.54 |
| 2026-10-01T05:53:29Z | S1 AUTO end-to-end | AUTO advanced 31→34 · CC caption == active cue text | PASS | caption="Section eight, Athar OS." cue="Section eight, Athar OS." |
| 2026-10-01T05:53:29Z | S1 AUTO end-to-end | AUTO advanced 31→34 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=34 cue=#1 (slide 34) visible=34 transcript chars=375 |
| 2026-10-01T05:53:29Z | S1 AUTO end-to-end | AUTO advanced 34→36 · slide on screen | PASS | visible slide 36 (expected 36) hash=#/27/new-9 |
| 2026-10-01T05:53:29Z | S1 AUTO end-to-end | AUTO advanced 34→36 · clip == slide mapping | PASS | bar clip NAR-08 vs expected NAR-08 for slide 36 (1 ms) |
| 2026-10-01T05:53:29Z | S1 AUTO end-to-end | AUTO advanced 34→36 · audio playing ≤1 s | PASS | paused=false src=guide-08-athar-os-Ib4oKe91OD.mp3 ct=3.13 playingEvents=0 rejected=none (7 ms) |
| 2026-10-01T05:53:29Z | S1 AUTO end-to-end | AUTO advanced 34→36 · active cue narrates visible slide | PASS | cue #2 (slide 36) vs visible 36; audio 3.13s; expected first cue #2 |
| 2026-10-01T05:53:30Z | S1 AUTO end-to-end | AUTO advanced 34→36 · audio progressing | PASS | currentTime 3.62 → 5.04 |
| 2026-10-01T05:53:30Z | S1 AUTO end-to-end | AUTO advanced 34→36 · CC caption == active cue text | PASS | caption="The roadmap runs now in Q4, 2026, next in 2027 and" cue="The roadmap runs now in Q4, 2026, next in 2027 and" |
| 2026-10-01T05:53:30Z | S1 AUTO end-to-end | AUTO advanced 34→36 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=36 cue=#2 (slide 36) visible=36 transcript chars=375 |
| 2026-10-01T05:53:31Z | S1 AUTO end-to-end | AUTO advanced 36→38 · slide on screen | PASS | visible slide 38 (expected 38) hash=#/27/new-11 |
| 2026-10-01T05:53:31Z | S1 AUTO end-to-end | AUTO advanced 36→38 · clip == slide mapping | PASS | bar clip NAR-08 vs expected NAR-08 for slide 38 (5 ms) |
| 2026-10-01T05:53:31Z | S1 AUTO end-to-end | AUTO advanced 36→38 · audio playing ≤1 s | PASS | paused=false src=guide-08-athar-os-Ib4oKe91OD.mp3 ct=8.18 playingEvents=0 rejected=none (9 ms) |
| 2026-10-01T05:53:31Z | S1 AUTO end-to-end | AUTO advanced 36→38 · active cue narrates visible slide | PASS | cue #3 (slide 38) vs visible 38; audio 8.19s; expected first cue #3 |
| 2026-10-01T05:53:31Z | S1 AUTO end-to-end | AUTO advanced 36→38 · audio progressing | PASS | currentTime 8.65 → 10.13 |
| 2026-10-01T05:53:31Z | S1 AUTO end-to-end | AUTO advanced 36→38 · CC caption == active cue text | PASS | caption="Lebanon, Access, 1 million Lebanese AI experts at " cue="Lebanon, Access, 1 million Lebanese AI experts at " |
| 2026-10-01T05:53:31Z | S1 AUTO end-to-end | AUTO advanced 36→38 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=38 cue=#4 (slide 38) visible=38 transcript chars=375 |
| 2026-10-01T05:53:37Z | S1 AUTO end-to-end | AUTO advanced 38→39 · slide on screen | PASS | visible slide 39 (expected 39) hash=#/28 |
| 2026-10-01T05:53:37Z | S1 AUTO end-to-end | AUTO advanced 38→39 · clip == slide mapping | PASS | bar clip NAR-09 vs expected NAR-09 for slide 39 (2 ms) |
| 2026-10-01T05:53:37Z | S1 AUTO end-to-end | AUTO advanced 38→39 · audio playing ≤1 s | PASS | paused=false src=guide-09-join-the-pact-Hx4Ywy843S.mp3 ct=0.07 playingEvents=0 rejected=none (7 ms) |
| 2026-10-01T05:53:37Z | S1 AUTO end-to-end | AUTO advanced 38→39 · active cue narrates visible slide | PASS | cue #1 (slide 39) vs visible 39; audio 0.82s; expected first cue #1 |
| 2026-10-01T05:53:38Z | S1 AUTO end-to-end | AUTO advanced 38→39 · audio progressing | PASS | currentTime 1.3 → 2.73 |
| 2026-10-01T05:53:38Z | S1 AUTO end-to-end | AUTO advanced 38→39 · CC caption == active cue text | PASS | caption="You have seen the agreement, the community model, " cue="You have seen the agreement, the community model, " |
| 2026-10-01T05:53:38Z | S1 AUTO end-to-end | AUTO advanced 38→39 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=39 cue=#2 (slide 39) visible=39 transcript chars=384 |
| 2026-10-01T05:53:44Z | S1 AUTO end-to-end | reached slide 39 and the last clip ended | PASS | n=39 ended=true changes=22 in 63 s (playbackRate 4×) |
| 2026-10-01T05:53:44Z | S1 AUTO end-to-end | every section hand-over waited for the clip to end | PASS | 1→2 NAR-00→NAR-01 endedBefore=true; 3→4 NAR-01→NAR-02 endedBefore=true; 11→13 NAR-02→NAR-03 endedBefore=true; 17→19 NAR-03→NAR-04 endedBefore=true; 20→21 NAR-04→NAR-05 endedBefore=true; 23→26 NAR-05→NAR-06 endedBefore=tr |
| 2026-10-01T05:53:47Z | S2 keyboard mid-play + rapid skip | guide on slide 1 · slide on screen | PASS | visible slide 1 (expected 1) hash=#/01 |
| 2026-10-01T05:53:47Z | S2 keyboard mid-play + rapid skip | guide on slide 1 · clip == slide mapping | PASS | bar clip NAR-00 vs expected NAR-00 for slide 1 (7 ms) |
| 2026-10-01T05:53:47Z | S2 keyboard mid-play + rapid skip | guide on slide 1 · audio playing ≤1 s | PASS | paused=false src=guide-00-welcome-lhbIUXFwLO.mp3 ct=0 playingEvents=1 rejected=none (13 ms) |
| 2026-10-01T05:53:47Z | S2 keyboard mid-play + rapid skip | guide on slide 1 · active cue narrates visible slide | PASS | cue #1 (slide 1) vs visible 1; audio 0s; expected first cue #1 |
| 2026-10-01T05:53:47Z | S2 keyboard mid-play + rapid skip | guide on slide 1 · audio progressing | PASS | currentTime 0.19 → 1.59 |
| 2026-10-01T05:53:47Z | S2 keyboard mid-play + rapid skip | guide on slide 1 · CC caption == active cue text | PASS | caption="Welcome to the Athar Open Agentic Pact, a communit" cue="Welcome to the Athar Open Agentic Pact, a communit" |
| 2026-10-01T05:53:47Z | S2 keyboard mid-play + rapid skip | guide on slide 1 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=1 cue=#1 (slide 1) visible=1 transcript chars=258 |
| 2026-10-01T05:53:47Z | S2 keyboard mid-play + rapid skip | ArrowRight 1→2 (new clip) · slide on screen | PASS | visible slide 2 (expected 2) hash=#/02 |
| 2026-10-01T05:53:47Z | S2 keyboard mid-play + rapid skip | ArrowRight 1→2 (new clip) · clip == slide mapping | PASS | bar clip NAR-01 vs expected NAR-01 for slide 2 (68 ms) |
| 2026-10-01T05:53:47Z | S2 keyboard mid-play + rapid skip | ArrowRight 1→2 (new clip) · audio playing ≤1 s | PASS | paused=false src=guide-01-the-pact-df1pHtGsVr.mp3 ct=0.08 playingEvents=1 rejected=none (82 ms) |
| 2026-10-01T05:53:47Z | S2 keyboard mid-play + rapid skip | ArrowRight 1→2 (new clip) · active cue narrates visible slide | PASS | cue #1 (slide 2) vs visible 2; audio 0.08s; expected first cue #1 |
| 2026-10-01T05:53:48Z | S2 keyboard mid-play + rapid skip | ArrowRight 1→2 (new clip) · audio progressing | PASS | currentTime 0.37 → 1.82 |
| 2026-10-01T05:53:48Z | S2 keyboard mid-play + rapid skip | ArrowRight 1→2 (new clip) · CC caption == active cue text | PASS | caption="The Athar Open Agentic Pact is an open commitment " cue="The Athar Open Agentic Pact is an open commitment " |
| 2026-10-01T05:53:48Z | S2 keyboard mid-play + rapid skip | ArrowRight 1→2 (new clip) · transcript highlight == on-screen slide | PASS | highlighted sentence slide=2 cue=#2 (slide 2) visible=2 transcript chars=363 |
| 2026-10-01T05:53:48Z | S2 keyboard mid-play + rapid skip | ArrowRight 2→3 (same clip, other sentence) · slide on screen | PASS | visible slide 3 (expected 3) hash=#/03 |
| 2026-10-01T05:53:48Z | S2 keyboard mid-play + rapid skip | ArrowRight 2→3 (same clip, other sentence) · clip == slide mapping | PASS | bar clip NAR-01 vs expected NAR-01 for slide 3 (2 ms) |
| 2026-10-01T05:53:48Z | S2 keyboard mid-play + rapid skip | ArrowRight 2→3 (same clip, other sentence) · audio playing ≤1 s | PASS | paused=false src=guide-01-the-pact-df1pHtGsVr.mp3 ct=1.98 playingEvents=0 rejected=none (12 ms) |
| 2026-10-01T05:53:48Z | S2 keyboard mid-play + rapid skip | ArrowRight 2→3 (same clip, other sentence) · active cue narrates visible slide | PASS | cue #3 (slide 3) vs visible 3; audio 12.2s; expected first cue #3 |
| 2026-10-01T05:53:48Z | S2 keyboard mid-play + rapid skip | ArrowRight 2→3 (same clip, other sentence) · audio progressing | PASS | currentTime 12.46 → 13.87 |
| 2026-10-01T05:53:48Z | S2 keyboard mid-play + rapid skip | ArrowRight 2→3 (same clip, other sentence) · CC caption == active cue text | PASS | caption="It is a community proposal from ODA and AI Rev, de" cue="It is a community proposal from ODA and AI Rev, de" |
| 2026-10-01T05:53:48Z | S2 keyboard mid-play + rapid skip | ArrowRight 2→3 (same clip, other sentence) · transcript highlight == on-screen slide | PASS | highlighted sentence slide=3 cue=#3 (slide 3) visible=3 transcript chars=363 |
| 2026-10-01T05:53:49Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×5 → 8 · slide on screen | PASS | visible slide 8 (expected 8) hash=#/08 |
| 2026-10-01T05:53:49Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×5 → 8 · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 8 (2 ms) |
| 2026-10-01T05:53:49Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×5 → 8 · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=2.35 playingEvents=0 rejected=none (8 ms) |
| 2026-10-01T05:53:49Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×5 → 8 · active cue narrates visible slide | PASS | cue #2 (slide 7) vs visible 8; audio 2.36s; expected first cue #2 |
| 2026-10-01T05:53:49Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×5 → 8 · audio progressing | PASS | currentTime 2.83 → 4.25 |
| 2026-10-01T05:53:49Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×5 → 8 · CC caption == active cue text | PASS | caption="Every webinar, chapter event and challenge should " cue="Every webinar, chapter event and challenge should " |
| 2026-10-01T05:53:49Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×5 → 8 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=7 cue=#2 (slide 7) visible=8 transcript chars=409 |
| 2026-10-01T05:53:50Z | S2 keyboard mid-play + rapid skip | ArrowLeft ×2 → 6 · slide on screen | PASS | visible slide 6 (expected 6) hash=#/06 |
| 2026-10-01T05:53:50Z | S2 keyboard mid-play + rapid skip | ArrowLeft ×2 → 6 · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 6 (3 ms) |
| 2026-10-01T05:53:50Z | S2 keyboard mid-play + rapid skip | ArrowLeft ×2 → 6 · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=0.01 playingEvents=1 rejected=none (12 ms) |
| 2026-10-01T05:53:50Z | S2 keyboard mid-play + rapid skip | ArrowLeft ×2 → 6 · active cue narrates visible slide | PASS | cue #1 (slide 4) vs visible 6; audio 0.01s; expected first cue #1 |
| 2026-10-01T05:53:50Z | S2 keyboard mid-play + rapid skip | ArrowLeft ×2 → 6 · audio progressing | PASS | currentTime 0.15 → 1.55 |
| 2026-10-01T05:53:50Z | S2 keyboard mid-play + rapid skip | ArrowLeft ×2 → 6 · CC caption == active cue text | PASS | caption="Section two, the Community Model." cue="Section two, the Community Model." |
| 2026-10-01T05:53:50Z | S2 keyboard mid-play + rapid skip | ArrowLeft ×2 → 6 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=4 cue=#1 (slide 4) visible=6 transcript chars=409 |
| 2026-10-01T05:53:51Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×7 across sections → 13 · slide on screen | PASS | visible slide 13 (expected 13) hash=#/13 |
| 2026-10-01T05:53:51Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×7 across sections → 13 · clip == slide mapping | PASS | bar clip NAR-03 vs expected NAR-03 for slide 13 (65 ms) |
| 2026-10-01T05:53:51Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×7 across sections → 13 · audio playing ≤1 s | PASS | paused=false src=guide-03-six-pillars-yxVqZJ2k1a.mp3 ct=0.06 playingEvents=1 rejected=none (71 ms) |
| 2026-10-01T05:53:51Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×7 across sections → 13 · active cue narrates visible slide | PASS | cue #1 (slide 13) vs visible 13; audio 0.06s; expected first cue #1 |
| 2026-10-01T05:53:51Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×7 across sections → 13 · audio progressing | PASS | currentTime 0.44 → 1.85 |
| 2026-10-01T05:53:51Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×7 across sections → 13 · CC caption == active cue text | PASS | caption="Section three, six pillars." cue="Section three, six pillars." |
| 2026-10-01T05:53:51Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×7 across sections → 13 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=13 cue=#1 (slide 13) visible=13 transcript chars=293 |
| 2026-10-01T05:53:51Z | S2 keyboard mid-play + rapid skip | End → 39 · slide on screen | PASS | visible slide 39 (expected 39) hash=#/28 |
| 2026-10-01T05:53:51Z | S2 keyboard mid-play + rapid skip | End → 39 · clip == slide mapping | PASS | bar clip NAR-09 vs expected NAR-09 for slide 39 (68 ms) |
| 2026-10-01T05:53:51Z | S2 keyboard mid-play + rapid skip | End → 39 · audio playing ≤1 s | PASS | paused=false src=guide-09-join-the-pact-Hx4Ywy843S.mp3 ct=0.01 playingEvents=1 rejected=none (94 ms) |
| 2026-10-01T05:53:51Z | S2 keyboard mid-play + rapid skip | End → 39 · active cue narrates visible slide | PASS | cue #1 (slide 39) vs visible 39; audio 0.03s; expected first cue #1 |
| 2026-10-01T05:53:52Z | S2 keyboard mid-play + rapid skip | End → 39 · audio progressing | PASS | currentTime 0.23 → 1.63 |
| 2026-10-01T05:53:52Z | S2 keyboard mid-play + rapid skip | End → 39 · CC caption == active cue text | PASS | caption="Join the Pact." cue="Join the Pact." |
| 2026-10-01T05:53:52Z | S2 keyboard mid-play + rapid skip | End → 39 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=39 cue=#1 (slide 39) visible=39 transcript chars=384 |
| 2026-10-01T05:53:52Z | S2 keyboard mid-play + rapid skip | Home → 1 · slide on screen | PASS | visible slide 1 (expected 1) hash=#/01 |
| 2026-10-01T05:53:52Z | S2 keyboard mid-play + rapid skip | Home → 1 · clip == slide mapping | PASS | bar clip NAR-00 vs expected NAR-00 for slide 1 (65 ms) |
| 2026-10-01T05:53:52Z | S2 keyboard mid-play + rapid skip | Home → 1 · audio playing ≤1 s | PASS | paused=false src=guide-00-welcome-lhbIUXFwLO.mp3 ct=0.05 playingEvents=1 rejected=none (75 ms) |
| 2026-10-01T05:53:52Z | S2 keyboard mid-play + rapid skip | Home → 1 · active cue narrates visible slide | PASS | cue #1 (slide 1) vs visible 1; audio 0.06s; expected first cue #1 |
| 2026-10-01T05:53:52Z | S2 keyboard mid-play + rapid skip | Home → 1 · audio progressing | PASS | currentTime 0.26 → 1.65 |
| 2026-10-01T05:53:52Z | S2 keyboard mid-play + rapid skip | Home → 1 · CC caption == active cue text | PASS | caption="Welcome to the Athar Open Agentic Pact, a communit" cue="Welcome to the Athar Open Agentic Pact, a communit" |
| 2026-10-01T05:53:52Z | S2 keyboard mid-play + rapid skip | Home → 1 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=1 cue=#1 (slide 1) visible=1 transcript chars=258 |
| 2026-10-01T05:53:54Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×27 → 28 (virtual slides) · slide on screen | PASS | visible slide 28 (expected 28) hash=#/27/new-1 |
| 2026-10-01T05:53:54Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×27 → 28 (virtual slides) · clip == slide mapping | PASS | bar clip NAR-07 vs expected NAR-07 for slide 28 (2 ms) |
| 2026-10-01T05:53:54Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×27 → 28 (virtual slides) · audio playing ≤1 s | PASS | paused=false src=guide-07-impact-and-funding-vWkiINp1IS.mp3 ct=0.05 playingEvents=0 rejected=none (11 ms) |
| 2026-10-01T05:53:54Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×27 → 28 (virtual slides) · active cue narrates visible slide | PASS | cue #1 (slide 28) vs visible 28; audio 0.07s; expected first cue #1 |
| 2026-10-01T05:53:55Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×27 → 28 (virtual slides) · audio progressing | PASS | currentTime 0.32 → 1.77 |
| 2026-10-01T05:53:55Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×27 → 28 (virtual slides) · CC caption == active cue text | PASS | caption="Section seven, Impact and Funding." cue="Section seven, Impact and Funding." |
| 2026-10-01T05:53:55Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×27 → 28 (virtual slides) · transcript highlight == on-screen slide | PASS | highlighted sentence slide=28 cue=#1 (slide 28) visible=28 transcript chars=447 |
| 2026-10-01T05:53:56Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×10 → 38 · slide on screen | PASS | visible slide 38 (expected 38) hash=#/27/new-11 |
| 2026-10-01T05:53:56Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×10 → 38 · clip == slide mapping | PASS | bar clip NAR-08 vs expected NAR-08 for slide 38 (11 ms) |
| 2026-10-01T05:53:56Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×10 → 38 · audio playing ≤1 s | PASS | paused=false src=guide-08-athar-os-Ib4oKe91OD.mp3 ct=8.01 playingEvents=0 rejected=none (19 ms) |
| 2026-10-01T05:53:56Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×10 → 38 · active cue narrates visible slide | PASS | cue #3 (slide 38) vs visible 38; audio 8.03s; expected first cue #3 |
| 2026-10-01T05:53:56Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×10 → 38 · audio progressing | PASS | currentTime 8.21 → 9.63 |
| 2026-10-01T05:53:56Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×10 → 38 · CC caption == active cue text | PASS | caption="Nations empowered." cue="Nations empowered." |
| 2026-10-01T05:53:56Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×10 → 38 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=38 cue=#3 (slide 38) visible=38 transcript chars=375 |
| 2026-10-01T05:53:58Z | S3 N shortcut | N starts narration on slide 5 · slide on screen | PASS | visible slide 5 (expected 5) hash=#/05 |
| 2026-10-01T05:53:58Z | S3 N shortcut | N starts narration on slide 5 · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 5 (4 ms) |
| 2026-10-01T05:53:58Z | S3 N shortcut | N starts narration on slide 5 · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=0.03 playingEvents=1 rejected=none (13 ms) |
| 2026-10-01T05:53:58Z | S3 N shortcut | N starts narration on slide 5 · active cue narrates visible slide | PASS | cue #1 (slide 4) vs visible 5; audio 0.05s; expected first cue #1 |
| 2026-10-01T05:53:59Z | S3 N shortcut | N starts narration on slide 5 · audio progressing | PASS | currentTime 0.22 → 1.64 |
| 2026-10-01T05:53:59Z | S3 N shortcut | N starts narration on slide 5 · CC caption == active cue text | PASS | caption="Section two, the Community Model." cue="Section two, the Community Model." |
| 2026-10-01T05:53:59Z | S3 N shortcut | N starts narration on slide 5 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=4 cue=#1 (slide 4) visible=5 transcript chars=409 |
| 2026-10-01T05:53:59Z | S3 N shortcut | N pauses narration | PASS | paused=true narrating=false (was on slide 5) |
| 2026-10-01T05:53:59Z | S3 N shortcut | paused + ArrowRight: caption/transcript follow the slide without audio | PASS | n=6 (expected 6) clip=NAR-02 paused=true cue=#1 (slide 4) highlight slide=4 |
| 2026-10-01T05:53:59Z | S3 N shortcut | N resumes at the sentence of the slide on screen (6) · slide on screen | PASS | visible slide 6 (expected 6) hash=#/06 |
| 2026-10-01T05:53:59Z | S3 N shortcut | N resumes at the sentence of the slide on screen (6) · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 6 (11 ms) |
| 2026-10-01T05:53:59Z | S3 N shortcut | N resumes at the sentence of the slide on screen (6) · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=2.07 playingEvents=1 rejected=none (19 ms) |
| 2026-10-01T05:53:59Z | S3 N shortcut | N resumes at the sentence of the slide on screen (6) · active cue narrates visible slide | PASS | cue #1 (slide 4) vs visible 6; audio 2.09s; expected first cue #1 |
| 2026-10-01T05:54:00Z | S3 N shortcut | N resumes at the sentence of the slide on screen (6) · audio progressing | PASS | currentTime 2.33 → 3.72 |
| 2026-10-01T05:54:00Z | S3 N shortcut | N resumes at the sentence of the slide on screen (6) · CC caption == active cue text | PASS | caption="Every webinar, chapter event and challenge should " cue="Every webinar, chapter event and challenge should " |
| 2026-10-01T05:54:00Z | S3 N shortcut | N resumes at the sentence of the slide on screen (6) · transcript highlight == on-screen slide | **FAIL** | highlighted sentence slide=7 cue=#2 (slide 7) visible=6 transcript chars=409 |
| 2026-10-01T05:54:02Z | S4 Esc overview + deep links + ?intro=1 | guide on slide 2 · slide on screen | PASS | visible slide 2 (expected 2) hash=#/02 |
| 2026-10-01T05:54:02Z | S4 Esc overview + deep links + ?intro=1 | guide on slide 2 · clip == slide mapping | PASS | bar clip NAR-01 vs expected NAR-01 for slide 2 (1 ms) |
| 2026-10-01T05:54:02Z | S4 Esc overview + deep links + ?intro=1 | guide on slide 2 · audio playing ≤1 s | PASS | paused=false src=guide-01-the-pact-df1pHtGsVr.mp3 ct=0 playingEvents=0 rejected=none (5 ms) |
| 2026-10-01T05:54:02Z | S4 Esc overview + deep links + ?intro=1 | guide on slide 2 · active cue narrates visible slide | PASS | cue #1 (slide 2) vs visible 2; audio 0s; expected first cue #1 |
| 2026-10-01T05:54:02Z | S4 Esc overview + deep links + ?intro=1 | guide on slide 2 · audio progressing | PASS | currentTime 0.16 → 1.56 |
| 2026-10-01T05:54:02Z | S4 Esc overview + deep links + ?intro=1 | guide on slide 2 · CC caption == active cue text | PASS | caption="Section one, the Pact." cue="Section one, the Pact." |
| 2026-10-01T05:54:02Z | S4 Esc overview + deep links + ?intro=1 | guide on slide 2 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=2 cue=#1 (slide 2) visible=2 transcript chars=363 |
| 2026-10-01T05:54:02Z | S4 Esc overview + deep links + ?intro=1 | Esc opens the overview | PASS | overview dialog visible |
| 2026-10-01T05:54:02Z | S4 Esc overview + deep links + ?intro=1 | overview grid has tiles | PASS | 39 tiles |
| 2026-10-01T05:54:02Z | S4 Esc overview + deep links + ?intro=1 | overview tile → slide 7 · slide on screen | PASS | visible slide 7 (expected 7) hash=#/07 |
| 2026-10-01T05:54:02Z | S4 Esc overview + deep links + ?intro=1 | overview tile → slide 7 · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 7 (65 ms) |
| 2026-10-01T05:54:02Z | S4 Esc overview + deep links + ?intro=1 | overview tile → slide 7 · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=2.24 playingEvents=1 rejected=none (74 ms) |
| 2026-10-01T05:54:02Z | S4 Esc overview + deep links + ?intro=1 | overview tile → slide 7 · active cue narrates visible slide | PASS | cue #2 (slide 7) vs visible 7; audio 2.24s; expected first cue #2 |
| 2026-10-01T05:54:03Z | S4 Esc overview + deep links + ?intro=1 | overview tile → slide 7 · audio progressing | PASS | currentTime 2.43 → 3.84 |
| 2026-10-01T05:54:03Z | S4 Esc overview + deep links + ?intro=1 | overview tile → slide 7 · CC caption == active cue text | PASS | caption="Every webinar, chapter event and challenge should " cue="Every webinar, chapter event and challenge should " |
| 2026-10-01T05:54:03Z | S4 Esc overview + deep links + ?intro=1 | overview tile → slide 7 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=7 cue=#2 (slide 7) visible=7 transcript chars=409 |
| 2026-10-01T05:54:03Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/20 · slide on screen | PASS | visible slide 20 (expected 20) hash=#/20 |
| 2026-10-01T05:54:03Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/20 · clip == slide mapping | PASS | bar clip NAR-04 vs expected NAR-04 for slide 20 (65 ms) |
| 2026-10-01T05:54:03Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/20 · audio playing ≤1 s | PASS | paused=false src=guide-04-pledge-and-signing-PWeXZj1Rgc.mp3 ct=5.09 playingEvents=1 rejected=none (73 ms) |
| 2026-10-01T05:54:03Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/20 · active cue narrates visible slide | PASS | cue #3 (slide 20) vs visible 20; audio 5.1s; expected first cue #3 |
| 2026-10-01T05:54:04Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/20 · audio progressing | PASS | currentTime 5.29 → 6.71 |
| 2026-10-01T05:54:04Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/20 · CC caption == active cue text | PASS | caption="A signatory chooses its roles, sign, govern, build" cue="A signatory chooses its roles, sign, govern, build" |
| 2026-10-01T05:54:04Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/20 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=20 cue=#3 (slide 20) visible=20 transcript chars=391 |
| 2026-10-01T05:54:04Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/27/new-4 → 31 · slide on screen | PASS | visible slide 31 (expected 31) hash=#/27/new-4 |
| 2026-10-01T05:54:04Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/27/new-4 → 31 · clip == slide mapping | PASS | bar clip NAR-07 vs expected NAR-07 for slide 31 (4 ms) |
| 2026-10-01T05:54:04Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/27/new-4 → 31 · audio playing ≤1 s | PASS | paused=false src=guide-07-impact-and-funding-vWkiINp1IS.mp3 ct=21.43 playingEvents=0 rejected=none (66 ms) |
| 2026-10-01T05:54:04Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/27/new-4 → 31 · active cue narrates visible slide | PASS | cue #5 (slide 31) vs visible 31; audio 21.44s; expected first cue #5 |
| 2026-10-01T05:54:04Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/27/new-4 → 31 · audio progressing | PASS | currentTime 21.6 → 23.02 |
| 2026-10-01T05:54:04Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/27/new-4 → 31 · CC caption == active cue text | PASS | caption="Universal API licenses, marketplace revenue share " cue="Universal API licenses, marketplace revenue share " |
| 2026-10-01T05:54:04Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/27/new-4 → 31 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=31 cue=#5 (slide 31) visible=31 transcript chars=447 |
| 2026-10-01T05:54:05Z | S4 Esc overview + deep links + ?intro=1 | #slide-07 alias deep link → slide 7 | PASS | n=7 clip=NAR-02 hash=#/07 |
| 2026-10-01T05:54:06Z | S4 Esc overview + deep links + ?intro=1 | full reload on #/25 bypasses the intro and maps clip | PASS | n=25 intro=false clip=NAR-05 |
| 2026-10-01T05:54:07Z | S4 Esc overview + deep links + ?intro=1 | ?intro=1 forces the intro film | PASS | intro=true |
| 2026-10-01T05:54:07Z | S4 Esc overview + deep links + ?intro=1 | no guide narration plays during the intro film | PASS | guide play() calls during intro: 0 |
| 2026-10-01T05:54:08Z | S4 Esc overview + deep links + ?intro=1 | after the intro the deck is on slide 1 with NAR-00 mapped | PASS | n=1 clip=NAR-00 |
| 2026-10-01T05:54:10Z | S5 slide-38 country tabs | guide on slide 38 · slide on screen | PASS | visible slide 38 (expected 38) hash=#/27/new-11 |
| 2026-10-01T05:54:10Z | S5 slide-38 country tabs | guide on slide 38 · clip == slide mapping | PASS | bar clip NAR-08 vs expected NAR-08 for slide 38 (2 ms) |
| 2026-10-01T05:54:10Z | S5 slide-38 country tabs | guide on slide 38 · audio playing ≤1 s | PASS | paused=false src=guide-08-athar-os-Ib4oKe91OD.mp3 ct=7.96 playingEvents=0 rejected=none (7 ms) |
| 2026-10-01T05:54:10Z | S5 slide-38 country tabs | guide on slide 38 · active cue narrates visible slide | PASS | cue #3 (slide 38) vs visible 38; audio 7.96s; expected first cue #3 |
| 2026-10-01T05:54:10Z | S5 slide-38 country tabs | guide on slide 38 · audio progressing | PASS | currentTime 8.09 → 9.5 |
| 2026-10-01T05:54:10Z | S5 slide-38 country tabs | guide on slide 38 · CC caption == active cue text | PASS | caption="Nations empowered." cue="Nations empowered." |
| 2026-10-01T05:54:10Z | S5 slide-38 country tabs | guide on slide 38 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=38 cue=#3 (slide 38) visible=38 transcript chars=375 |
| 2026-10-01T05:54:10Z | S5 slide-38 country tabs | tab in → narration seeks to its sentence (cue #5) | PASS | cue=#5 audio=15.13s tab aria-selected=true paused=false |
| 2026-10-01T05:54:11Z | S5 slide-38 country tabs | tab ke → narration seeks to its sentence (cue #6) | PASS | cue=#6 audio=21.84s tab aria-selected=true paused=false |
| 2026-10-01T05:54:11Z | S5 slide-38 country tabs | tab lb → narration seeks to its sentence (cue #4) | PASS | cue=#4 audio=9.62s tab aria-selected=true paused=false |
| 2026-10-01T05:54:14Z | S6 Replay intro and return | guide on slide 4 · slide on screen | PASS | visible slide 4 (expected 4) hash=#/04 |
| 2026-10-01T05:54:14Z | S6 Replay intro and return | guide on slide 4 · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 4 (8 ms) |
| 2026-10-01T05:54:14Z | S6 Replay intro and return | guide on slide 4 · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=0.01 playingEvents=1 rejected=none (14 ms) |
| 2026-10-01T05:54:14Z | S6 Replay intro and return | guide on slide 4 · active cue narrates visible slide | PASS | cue #1 (slide 4) vs visible 4; audio 0.02s; expected first cue #1 |
| 2026-10-01T05:54:14Z | S6 Replay intro and return | guide on slide 4 · audio progressing | PASS | currentTime 0.21 → 1.62 |
| 2026-10-01T05:54:14Z | S6 Replay intro and return | guide on slide 4 · CC caption == active cue text | PASS | caption="Section two, the Community Model." cue="Section two, the Community Model." |
| 2026-10-01T05:54:14Z | S6 Replay intro and return | guide on slide 4 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=4 cue=#1 (slide 4) visible=4 transcript chars=409 |
| 2026-10-01T05:54:14Z | S6 Replay intro and return | Replay intro opens the intro film | PASS | intro-gate shown |
| 2026-10-01T05:54:15Z | S6 Replay intro and return | guide/narration is silent while the intro film plays | PASS | audio=guide-02-community-model-9gUnFBtxrM.mp3 paused=true play() calls= |
| 2026-10-01T05:54:18Z | S6 Replay intro and return | after the replayed intro the guide narrates the slide it returned to (4) · slide on screen | **FAIL** | visible slide 7 (expected 4) hash=#/07 |
| 2026-10-01T05:54:18Z | S6 Replay intro and return | after the replayed intro the guide narrates the slide it returned to (4) · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 4 (1504 ms) |
| 2026-10-01T05:54:18Z | S6 Replay intro and return | after the replayed intro the guide narrates the slide it returned to (4) · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=9.3 playingEvents=0 rejected=none (1514 ms) |
| 2026-10-01T05:54:19Z | S6 Replay intro and return | after the replayed intro the guide narrates the slide it returned to (4) · active cue narrates visible slide | **FAIL** | cue #3 (slide 11) vs visible 4; audio 13.97s; expected first cue #1 |
| 2026-10-01T05:54:19Z | S6 Replay intro and return | after the replayed intro the guide narrates the slide it returned to (4) · audio progressing | PASS | currentTime 14.68 → 16.09 |
| 2026-10-01T05:54:19Z | S6 Replay intro and return | after the replayed intro the guide narrates the slide it returned to (4) · CC caption == active cue text | PASS | caption="Learn agentic AI, build a useful agent through the" cue="Learn agentic AI, build a useful agent through the" |
| 2026-10-01T05:54:19Z | S6 Replay intro and return | after the replayed intro the guide narrates the slide it returned to (4) · transcript highlight == on-screen slide | **FAIL** | highlighted sentence slide=11 cue=#3 (slide 11) visible=4 transcript chars=409 |
| 2026-10-01T05:54:21Z | S7 tab hidden/visible + audio-focus loss | guide on slide 13 · slide on screen | PASS | visible slide 13 (expected 13) hash=#/13 |
| 2026-10-01T05:54:21Z | S7 tab hidden/visible + audio-focus loss | guide on slide 13 · clip == slide mapping | PASS | bar clip NAR-03 vs expected NAR-03 for slide 13 (1 ms) |
| 2026-10-01T05:54:21Z | S7 tab hidden/visible + audio-focus loss | guide on slide 13 · audio playing ≤1 s | PASS | paused=false src=guide-03-six-pillars-yxVqZJ2k1a.mp3 ct=0.01 playingEvents=0 rejected=none (5 ms) |
| 2026-10-01T05:54:21Z | S7 tab hidden/visible + audio-focus loss | guide on slide 13 · active cue narrates visible slide | PASS | cue #1 (slide 13) vs visible 13; audio 0.02s; expected first cue #1 |
| 2026-10-01T05:54:22Z | S7 tab hidden/visible + audio-focus loss | guide on slide 13 · audio progressing | PASS | currentTime 0.2 → 1.61 |
| 2026-10-01T05:54:22Z | S7 tab hidden/visible + audio-focus loss | guide on slide 13 · CC caption == active cue text | PASS | caption="Section three, six pillars." cue="Section three, six pillars." |
| 2026-10-01T05:54:22Z | S7 tab hidden/visible + audio-focus loss | guide on slide 13 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=13 cue=#1 (slide 13) visible=13 transcript chars=293 |
| 2026-10-01T05:54:23Z | S7 tab hidden/visible + audio-focus loss | visible again after 2 hidden slide changes → narrates slide 15 · slide on screen | PASS | visible slide 15 (expected 15) hash=#/15 |
| 2026-10-01T05:54:23Z | S7 tab hidden/visible + audio-focus loss | visible again after 2 hidden slide changes → narrates slide 15 · clip == slide mapping | PASS | bar clip NAR-03 vs expected NAR-03 for slide 15 (2 ms) |
| 2026-10-01T05:54:23Z | S7 tab hidden/visible + audio-focus loss | visible again after 2 hidden slide changes → narrates slide 15 · audio playing ≤1 s | PASS | paused=false src=guide-03-six-pillars-yxVqZJ2k1a.mp3 ct=9.85 playingEvents=0 rejected=none (9 ms) |
| 2026-10-01T05:54:23Z | S7 tab hidden/visible + audio-focus loss | visible again after 2 hidden slide changes → narrates slide 15 · active cue narrates visible slide | PASS | cue #3 (slide 14) vs visible 15; audio 9.87s; expected first cue #3 |
| 2026-10-01T05:54:23Z | S7 tab hidden/visible + audio-focus loss | visible again after 2 hidden slide changes → narrates slide 15 · audio progressing | PASS | currentTime 10.36 → 11.75 |
| 2026-10-01T05:54:23Z | S7 tab hidden/visible + audio-focus loss | visible again after 2 hidden slide changes → narrates slide 15 · CC caption == active cue text | PASS | caption="Reusable skills are built once and shared across t" cue="Reusable skills are built once and shared across t" |
| 2026-10-01T05:54:23Z | S7 tab hidden/visible + audio-focus loss | visible again after 2 hidden slide changes → narrates slide 15 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=14 cue=#3 (slide 14) visible=15 transcript chars=293 |
| 2026-10-01T05:54:23Z | S7 tab hidden/visible + audio-focus loss | external pause recorded | PASS | paused=true |
| 2026-10-01T05:54:23Z | S7 tab hidden/visible + audio-focus loss | narration resumes after focus regain (audio-focus loss) | PASS | paused=false after 2 ms |
| 2026-10-01T05:54:25Z | S8 phone 390×844 | phone: guide on slide 2 · slide on screen | PASS | visible slide 2 (expected 2) hash=#/02 |
| 2026-10-01T05:54:25Z | S8 phone 390×844 | phone: guide on slide 2 · clip == slide mapping | PASS | bar clip NAR-01 vs expected NAR-01 for slide 2 (1 ms) |
| 2026-10-01T05:54:25Z | S8 phone 390×844 | phone: guide on slide 2 · audio playing ≤1 s | PASS | paused=false src=guide-01-the-pact-df1pHtGsVr.mp3 ct=0 playingEvents=0 rejected=none (4 ms) |
| 2026-10-01T05:54:25Z | S8 phone 390×844 | phone: guide on slide 2 · active cue narrates visible slide | PASS | cue #1 (slide 2) vs visible 2; audio 0s; expected first cue #1 |
| 2026-10-01T05:54:26Z | S8 phone 390×844 | phone: guide on slide 2 · audio progressing | PASS | currentTime 0.18 → 1.57 |
| 2026-10-01T05:54:26Z | S8 phone 390×844 | phone: guide on slide 2 · CC caption == active cue text | PASS | caption="Section one, the Pact." cue="Section one, the Pact." |
| 2026-10-01T05:54:26Z | S8 phone 390×844 | phone: guide on slide 2 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=2 cue=#1 (slide 2) visible=2 transcript chars=363 |
| 2026-10-01T05:54:26Z | S8 phone 390×844 | phone: bar next button visible and ≥44 px | PASS | 44×44 |
| 2026-10-01T05:54:26Z | S8 phone 390×844 | phone: bar next → 3 · slide on screen | PASS | visible slide 3 (expected 3) hash=#/03 |
| 2026-10-01T05:54:26Z | S8 phone 390×844 | phone: bar next → 3 · clip == slide mapping | PASS | bar clip NAR-01 vs expected NAR-01 for slide 3 (1 ms) |
| 2026-10-01T05:54:26Z | S8 phone 390×844 | phone: bar next → 3 · audio playing ≤1 s | PASS | paused=false src=guide-01-the-pact-df1pHtGsVr.mp3 ct=12.14 playingEvents=0 rejected=none (5 ms) |
| 2026-10-01T05:54:26Z | S8 phone 390×844 | phone: bar next → 3 · active cue narrates visible slide | PASS | cue #3 (slide 3) vs visible 3; audio 12.14s; expected first cue #3 |
| 2026-10-01T05:54:26Z | S8 phone 390×844 | phone: bar next → 3 · audio progressing | PASS | currentTime 12.26 → 13.67 |
| 2026-10-01T05:54:26Z | S8 phone 390×844 | phone: bar next → 3 · CC caption == active cue text | PASS | caption="It is a community proposal from ODA and AI Rev, de" cue="It is a community proposal from ODA and AI Rev, de" |
| 2026-10-01T05:54:26Z | S8 phone 390×844 | phone: bar next → 3 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=3 cue=#3 (slide 3) visible=3 transcript chars=363 |
| 2026-10-01T05:54:26Z | S8 phone 390×844 | phone: bar next → 4 (new clip) · slide on screen | PASS | visible slide 4 (expected 4) hash=#/04 |
| 2026-10-01T05:54:26Z | S8 phone 390×844 | phone: bar next → 4 (new clip) · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 4 (1 ms) |
| 2026-10-01T05:54:26Z | S8 phone 390×844 | phone: bar next → 4 (new clip) · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=0.03 playingEvents=0 rejected=none (11 ms) |
| 2026-10-01T05:54:27Z | S8 phone 390×844 | phone: bar next → 4 (new clip) · active cue narrates visible slide | PASS | cue #1 (slide 4) vs visible 4; audio 0.06s; expected first cue #1 |
| 2026-10-01T05:54:27Z | S8 phone 390×844 | phone: bar next → 4 (new clip) · audio progressing | PASS | currentTime 0.23 → 1.63 |
| 2026-10-01T05:54:27Z | S8 phone 390×844 | phone: bar next → 4 (new clip) · CC caption == active cue text | PASS | caption="Section two, the Community Model." cue="Section two, the Community Model." |
| 2026-10-01T05:54:27Z | S8 phone 390×844 | phone: bar next → 4 (new clip) · transcript highlight == on-screen slide | PASS | highlighted sentence slide=4 cue=#1 (slide 4) visible=4 transcript chars=409 |
| 2026-10-01T05:54:27Z | S8 phone 390×844 | phone: bar prev → 3 · slide on screen | PASS | visible slide 3 (expected 3) hash=#/03 |
| 2026-10-01T05:54:27Z | S8 phone 390×844 | phone: bar prev → 3 · clip == slide mapping | PASS | bar clip NAR-01 vs expected NAR-01 for slide 3 (1 ms) |
| 2026-10-01T05:54:27Z | S8 phone 390×844 | phone: bar prev → 3 · audio playing ≤1 s | PASS | paused=false src=guide-01-the-pact-df1pHtGsVr.mp3 ct=12.16 playingEvents=0 rejected=none (5 ms) |
| 2026-10-01T05:54:27Z | S8 phone 390×844 | phone: bar prev → 3 · active cue narrates visible slide | PASS | cue #3 (slide 3) vs visible 3; audio 12.16s; expected first cue #3 |
| 2026-10-01T05:54:28Z | S8 phone 390×844 | phone: bar prev → 3 · audio progressing | PASS | currentTime 12.28 → 13.7 |
| 2026-10-01T05:54:28Z | S8 phone 390×844 | phone: bar prev → 3 · CC caption == active cue text | PASS | caption="It is a community proposal from ODA and AI Rev, de" cue="It is a community proposal from ODA and AI Rev, de" |
| 2026-10-01T05:54:28Z | S8 phone 390×844 | phone: bar prev → 3 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=3 cue=#3 (slide 3) visible=3 transcript chars=363 |
| 2026-10-01T05:54:28Z | S8 phone 390×844 | phone: bar fits the viewport (no horizontal overflow) | PASS | {"right":390,"w":390,"sw":390} |
| 2026-10-01T05:54:31Z | S9 Arabic / RTL | lang toggle → ar/rtl | PASS | lang=ar dir=rtl |
| 2026-10-01T05:54:31Z | S9 Arabic / RTL | RTL: guide on slide 2 · slide on screen | PASS | visible slide 2 (expected 2) hash=#/02 |
| 2026-10-01T05:54:31Z | S9 Arabic / RTL | RTL: guide on slide 2 · clip == slide mapping | PASS | bar clip NAR-01 vs expected NAR-01 for slide 2 (1 ms) |
| 2026-10-01T05:54:31Z | S9 Arabic / RTL | RTL: guide on slide 2 · audio playing ≤1 s | PASS | paused=false src=guide-01-the-pact-df1pHtGsVr.mp3 ct=0 playingEvents=0 rejected=none (4 ms) |
| 2026-10-01T05:54:31Z | S9 Arabic / RTL | RTL: guide on slide 2 · active cue narrates visible slide | PASS | cue #1 (slide 2) vs visible 2; audio 0s; expected first cue #1 |
| 2026-10-01T05:54:31Z | S9 Arabic / RTL | RTL: guide on slide 2 · audio progressing | PASS | currentTime 0.18 → 1.56 |
| 2026-10-01T05:54:31Z | S9 Arabic / RTL | RTL: guide on slide 2 · CC caption == active cue text | PASS | caption="Section one, the Pact." cue="Section one, the Pact." |
| 2026-10-01T05:54:31Z | S9 Arabic / RTL | RTL: guide on slide 2 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=2 cue=#1 (slide 2) visible=2 transcript chars=363 |
| 2026-10-01T05:54:31Z | S9 Arabic / RTL | RTL: ArrowLeft = next → 3 · slide on screen | PASS | visible slide 3 (expected 3) hash=#/03 |
| 2026-10-01T05:54:31Z | S9 Arabic / RTL | RTL: ArrowLeft = next → 3 · clip == slide mapping | PASS | bar clip NAR-01 vs expected NAR-01 for slide 3 (2 ms) |
| 2026-10-01T05:54:31Z | S9 Arabic / RTL | RTL: ArrowLeft = next → 3 · audio playing ≤1 s | PASS | paused=false src=guide-01-the-pact-df1pHtGsVr.mp3 ct=1.7 playingEvents=0 rejected=none (8 ms) |
| 2026-10-01T05:54:31Z | S9 Arabic / RTL | RTL: ArrowLeft = next → 3 · active cue narrates visible slide | PASS | cue #3 (slide 3) vs visible 3; audio 12.19s; expected first cue #3 |
| 2026-10-01T05:54:32Z | S9 Arabic / RTL | RTL: ArrowLeft = next → 3 · audio progressing | PASS | currentTime 12.46 → 13.87 |
| 2026-10-01T05:54:32Z | S9 Arabic / RTL | RTL: ArrowLeft = next → 3 · CC caption == active cue text | PASS | caption="It is a community proposal from ODA and AI Rev, de" cue="It is a community proposal from ODA and AI Rev, de" |
| 2026-10-01T05:54:32Z | S9 Arabic / RTL | RTL: ArrowLeft = next → 3 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=3 cue=#3 (slide 3) visible=3 transcript chars=363 |
| 2026-10-01T05:54:32Z | S9 Arabic / RTL | RTL: rapid ArrowLeft ×4 → 7 · slide on screen | PASS | visible slide 7 (expected 7) hash=#/07 |
| 2026-10-01T05:54:32Z | S9 Arabic / RTL | RTL: rapid ArrowLeft ×4 → 7 · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 7 (1 ms) |
| 2026-10-01T05:54:32Z | S9 Arabic / RTL | RTL: rapid ArrowLeft ×4 → 7 · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=2.18 playingEvents=0 rejected=none (10 ms) |
| 2026-10-01T05:54:32Z | S9 Arabic / RTL | RTL: rapid ArrowLeft ×4 → 7 · active cue narrates visible slide | PASS | cue #2 (slide 7) vs visible 7; audio 2.21s; expected first cue #2 |
| 2026-10-01T05:54:33Z | S9 Arabic / RTL | RTL: rapid ArrowLeft ×4 → 7 · audio progressing | PASS | currentTime 2.39 → 3.82 |
| 2026-10-01T05:54:33Z | S9 Arabic / RTL | RTL: rapid ArrowLeft ×4 → 7 · CC caption == active cue text | PASS | caption="Every webinar, chapter event and challenge should " cue="Every webinar, chapter event and challenge should " |
| 2026-10-01T05:54:33Z | S9 Arabic / RTL | RTL: rapid ArrowLeft ×4 → 7 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=7 cue=#2 (slide 7) visible=7 transcript chars=409 |
| 2026-10-01T05:54:33Z | S9 Arabic / RTL | RTL: ArrowRight = previous → 6 · slide on screen | PASS | visible slide 6 (expected 6) hash=#/06 |
| 2026-10-01T05:54:33Z | S9 Arabic / RTL | RTL: ArrowRight = previous → 6 · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 6 (2 ms) |
| 2026-10-01T05:54:33Z | S9 Arabic / RTL | RTL: ArrowRight = previous → 6 · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=3.99 playingEvents=0 rejected=none (8 ms) |
| 2026-10-01T05:54:33Z | S9 Arabic / RTL | RTL: ArrowRight = previous → 6 · active cue narrates visible slide | PASS | cue #1 (slide 4) vs visible 6; audio 0.06s; expected first cue #1 |
| 2026-10-01T05:54:33Z | S9 Arabic / RTL | RTL: ArrowRight = previous → 6 · audio progressing | PASS | currentTime 0.3 → 1.73 |
| 2026-10-01T05:54:33Z | S9 Arabic / RTL | RTL: ArrowRight = previous → 6 · CC caption == active cue text | PASS | caption="Section two, the Community Model." cue="Section two, the Community Model." |
| 2026-10-01T05:54:33Z | S9 Arabic / RTL | RTL: ArrowRight = previous → 6 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=4 cue=#1 (slide 4) visible=6 transcript chars=409 |
| 2026-10-01T05:54:33Z | S9 Arabic / RTL | RTL: bar is dir=rtl and shows the Arabic status text | PASS | {"dir":"rtl","title":"يروي الدليل الشريحة 6 من 39 · 02 نموذج المجتمع","live":true} |
| 2026-10-01T05:54:37Z | S10 autoplay policy / persisted narration-on | reload with narration-on persisted: no audio before a gesture (autoplay policy respected) | PASS | paused=true play-rejected=none |
| 2026-10-01T05:54:37Z | S10 autoplay policy / persisted narration-on | blocked state is surfaced in the Guide bar ("tap to start") | PASS | data-blocked=true title="Blocked by the browser — tap or press a key to start the guide · slide 5 of 39 ·" |
| 2026-10-01T05:54:37Z | S10 autoplay policy / persisted narration-on | first click unlocks and narration starts on the visible slide (5) · slide on screen | PASS | visible slide 5 (expected 5) hash=#/05 |
| 2026-10-01T05:54:37Z | S10 autoplay policy / persisted narration-on | first click unlocks and narration starts on the visible slide (5) · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 5 (1 ms) |
| 2026-10-01T05:54:37Z | S10 autoplay policy / persisted narration-on | first click unlocks and narration starts on the visible slide (5) · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=0.08 playingEvents=1 rejected=none (66 ms) |
| 2026-10-01T05:54:37Z | S10 autoplay policy / persisted narration-on | first click unlocks and narration starts on the visible slide (5) · active cue narrates visible slide | PASS | cue #1 (slide 4) vs visible 5; audio 0.08s; expected first cue #1 |
| 2026-10-01T05:54:37Z | S10 autoplay policy / persisted narration-on | first click unlocks and narration starts on the visible slide (5) · audio progressing | PASS | currentTime 0.4 → 1.82 |
| 2026-10-01T05:54:37Z | S10 autoplay policy / persisted narration-on | first click unlocks and narration starts on the visible slide (5) · CC caption == active cue text | PASS | caption="Section two, the Community Model." cue="Section two, the Community Model." |
| 2026-10-01T05:54:37Z | S10 autoplay policy / persisted narration-on | first click unlocks and narration starts on the visible slide (5) · transcript highlight == on-screen slide | PASS | highlighted sentence slide=4 cue=#1 (slide 4) visible=5 transcript chars=409 |

### Mismatches recorded in run `final` (4)

1. **S3 N shortcut — N resumes at the sentence of the slide on screen (6) · transcript highlight == on-screen slide** (2026-10-01T05:54:00Z)  
   repro: press N again  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: highlighted sentence slide=7 cue=#2 (slide 7) visible=6 transcript chars=409
2. **S6 Replay intro and return — after the replayed intro the guide narrates the slide it returned to (4) · slide on screen** (2026-10-01T05:54:18Z)  
   repro: Replay intro → Esc (the deck returns to the slide it was on)  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: visible slide 7 (expected 4) hash=#/07
3. **S6 Replay intro and return — after the replayed intro the guide narrates the slide it returned to (4) · active cue narrates visible slide** (2026-10-01T05:54:19Z)  
   repro: Replay intro → Esc (the deck returns to the slide it was on)  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: cue #3 (slide 11) vs visible 4; audio 13.97s; expected first cue #1
4. **S6 Replay intro and return — after the replayed intro the guide narrates the slide it returned to (4) · transcript highlight == on-screen slide** (2026-10-01T05:54:19Z)  
   repro: Replay intro → Esc (the deck returns to the slide it was on)  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: highlighted sentence slide=11 cue=#3 (slide 11) visible=4 transcript chars=409


## Run `final-1x-S3-S6` — 2026-10-01T05:55:01Z → 2026-10-01T05:55:10Z

Base URL http://127.0.0.1:4174 · Chromium (Playwright) · playbackRate 1× for the AUTO end-to-end scenario · checks: **32 pass / 0 fail** of 32

| UTC | scenario | check | result | detail |
|---|---|---|---|---|
| 2026-10-01T05:55:04Z | S3 N shortcut | N starts narration on slide 5 · slide on screen | PASS | visible slide 5 (expected 5) hash=#/05 |
| 2026-10-01T05:55:04Z | S3 N shortcut | N starts narration on slide 5 · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 5 (4 ms) |
| 2026-10-01T05:55:04Z | S3 N shortcut | N starts narration on slide 5 · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=0 playingEvents=1 rejected=none (15 ms) |
| 2026-10-01T05:55:04Z | S3 N shortcut | N starts narration on slide 5 · active cue narrates visible slide | PASS | cue #1 (slide 4) vs visible 5; audio 0.01s; expected first cue #1 |
| 2026-10-01T05:55:04Z | S3 N shortcut | N starts narration on slide 5 · audio progressing | PASS | currentTime 0.06 → 0.42 |
| 2026-10-01T05:55:04Z | S3 N shortcut | N starts narration on slide 5 · CC caption == active cue text | PASS | caption="Section two, the Community Model." cue="Section two, the Community Model." |
| 2026-10-01T05:55:04Z | S3 N shortcut | N starts narration on slide 5 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=4 cue=#1 (slide 4) visible=5 transcript chars=409 |
| 2026-10-01T05:55:04Z | S3 N shortcut | N pauses narration | PASS | paused=true narrating=false (was on slide 5) |
| 2026-10-01T05:55:05Z | S3 N shortcut | paused + ArrowRight: caption/transcript follow the slide without audio | PASS | n=6 (expected 6) clip=NAR-02 paused=true cue=#1 (slide 4) highlight slide=4 |
| 2026-10-01T05:55:05Z | S3 N shortcut | N resumes at the sentence of the slide on screen (6) · slide on screen | PASS | visible slide 6 (expected 6) hash=#/06 |
| 2026-10-01T05:55:05Z | S3 N shortcut | N resumes at the sentence of the slide on screen (6) · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 6 (2 ms) |
| 2026-10-01T05:55:05Z | S3 N shortcut | N resumes at the sentence of the slide on screen (6) · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=0.51 playingEvents=0 rejected=none (8 ms) |
| 2026-10-01T05:55:05Z | S3 N shortcut | N resumes at the sentence of the slide on screen (6) · active cue narrates visible slide | PASS | cue #1 (slide 4) vs visible 6; audio 0.51s; expected first cue #1 |
| 2026-10-01T05:55:05Z | S3 N shortcut | N resumes at the sentence of the slide on screen (6) · audio progressing | PASS | currentTime 0.56 → 0.92 |
| 2026-10-01T05:55:05Z | S3 N shortcut | N resumes at the sentence of the slide on screen (6) · CC caption == active cue text | PASS | caption="Section two, the Community Model." cue="Section two, the Community Model." |
| 2026-10-01T05:55:05Z | S3 N shortcut | N resumes at the sentence of the slide on screen (6) · transcript highlight == on-screen slide | PASS | highlighted sentence slide=4 cue=#1 (slide 4) visible=6 transcript chars=409 |
| 2026-10-01T05:55:07Z | S6 Replay intro and return | guide on slide 4 · slide on screen | PASS | visible slide 4 (expected 4) hash=#/04 |
| 2026-10-01T05:55:07Z | S6 Replay intro and return | guide on slide 4 · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 4 (1 ms) |
| 2026-10-01T05:55:07Z | S6 Replay intro and return | guide on slide 4 · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=0 playingEvents=0 rejected=none (5 ms) |
| 2026-10-01T05:55:07Z | S6 Replay intro and return | guide on slide 4 · active cue narrates visible slide | PASS | cue #1 (slide 4) vs visible 4; audio 0.01s; expected first cue #1 |
| 2026-10-01T05:55:08Z | S6 Replay intro and return | guide on slide 4 · audio progressing | PASS | currentTime 0.06 → 0.42 |
| 2026-10-01T05:55:08Z | S6 Replay intro and return | guide on slide 4 · CC caption == active cue text | PASS | caption="Section two, the Community Model." cue="Section two, the Community Model." |
| 2026-10-01T05:55:08Z | S6 Replay intro and return | guide on slide 4 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=4 cue=#1 (slide 4) visible=4 transcript chars=409 |
| 2026-10-01T05:55:08Z | S6 Replay intro and return | Replay intro opens the intro film | PASS | intro-gate shown |
| 2026-10-01T05:55:09Z | S6 Replay intro and return | guide/narration is silent while the intro film plays | PASS | audio=guide-02-community-model-9gUnFBtxrM.mp3 paused=true play() calls= |
| 2026-10-01T05:55:10Z | S6 Replay intro and return | after the replayed intro the guide narrates the slide it returned to (4) · slide on screen | PASS | visible slide 4 (expected 4) hash=#/04 |
| 2026-10-01T05:55:10Z | S6 Replay intro and return | after the replayed intro the guide narrates the slide it returned to (4) · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 4 (2 ms) |
| 2026-10-01T05:55:10Z | S6 Replay intro and return | after the replayed intro the guide narrates the slide it returned to (4) · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=0.84 playingEvents=0 rejected=none (8 ms) |
| 2026-10-01T05:55:10Z | S6 Replay intro and return | after the replayed intro the guide narrates the slide it returned to (4) · active cue narrates visible slide | PASS | cue #1 (slide 4) vs visible 4; audio 0.84s; expected first cue #1 |
| 2026-10-01T05:55:10Z | S6 Replay intro and return | after the replayed intro the guide narrates the slide it returned to (4) · audio progressing | PASS | currentTime 0.96 → 1.31 |
| 2026-10-01T05:55:10Z | S6 Replay intro and return | after the replayed intro the guide narrates the slide it returned to (4) · CC caption == active cue text | PASS | caption="Section two, the Community Model." cue="Section two, the Community Model." |
| 2026-10-01T05:55:10Z | S6 Replay intro and return | after the replayed intro the guide narrates the slide it returned to (4) · transcript highlight == on-screen slide | PASS | highlighted sentence slide=4 cue=#1 (slide 4) visible=4 transcript chars=409 |
