# Guide narration QA log — Athar Open Agentic Pact deck

Scripted checks (Playwright + headless Chromium) across the intro and all 39 slides. Every slide change asserts: clip/cue == slide per the NAR-xx map; <audio> playing within 1 s after the unlock gesture; CC caption + transcript highlight match the slide on screen; AUTO advances only after the clip for the visible slide ended.

## Run `before` — 2026-10-01T02:50:52Z → 2026-10-01T02:56:00Z

Base URL http://127.0.0.1:4173 · Chromium (Playwright) · playbackRate 4× for the AUTO end-to-end scenario · checks: **86 pass / 9 fail** of 95

| UTC | scenario | check | result | detail |
|---|---|---|---|---|
| 2026-10-01T02:50:55Z | S1 AUTO end-to-end | intro skipped, slide 1, guide idle | PASS | n=1 intro=false narrating=false |
| 2026-10-01T02:50:55Z | S1 AUTO end-to-end | start guide on slide 1 · slide on screen | PASS | visible slide 1 (expected 1) hash=#/01 |
| 2026-10-01T02:50:55Z | S1 AUTO end-to-end | start guide on slide 1 · clip == slide mapping | PASS | bar clip NAR-00 vs expected NAR-00 for slide 1 (1 ms) |
| 2026-10-01T02:50:55Z | S1 AUTO end-to-end | start guide on slide 1 · audio playing ≤1 s | PASS | paused=false src=guide-00-welcome-lhbIUXFwLO.mp3 ct=0 playingEvents=0 rejected=none (6 ms) |
| 2026-10-01T02:50:56Z | S1 AUTO end-to-end | start guide on slide 1 · audio progressing | PASS | currentTime 0 → 1.06 |
| 2026-10-01T02:50:56Z | S1 AUTO end-to-end | start guide on slide 1 · active cue narrates visible slide | PASS | cue #1 (slide 1) vs visible 1; audio 1.07s; expected first cue #1 |
| 2026-10-01T02:50:56Z | S1 AUTO end-to-end | start guide on slide 1 · CC caption == active cue text | PASS | caption="Welcome to the Athar Open Agentic Pact, a communit" cue="Welcome to the Athar Open Agentic Pact, a communit" |
| 2026-10-01T02:50:56Z | S1 AUTO end-to-end | start guide on slide 1 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=1 cue=#1 (slide 1) visible=1 transcript chars=258 |
| 2026-10-01T02:51:00Z | S1 AUTO end-to-end | AUTO advanced 1→2 · slide on screen | PASS | visible slide 2 (expected 2) hash=#/02 |
| 2026-10-01T02:51:00Z | S1 AUTO end-to-end | AUTO advanced 1→2 · clip == slide mapping | PASS | bar clip NAR-01 vs expected NAR-01 for slide 2 (2 ms) |
| 2026-10-01T02:51:00Z | S1 AUTO end-to-end | AUTO advanced 1→2 · audio playing ≤1 s | PASS | paused=false src=guide-01-the-pact-df1pHtGsVr.mp3 ct=0.11 playingEvents=0 rejected=none (5 ms) |
| 2026-10-01T02:51:00Z | S1 AUTO end-to-end | AUTO advanced 1→2 · audio progressing | PASS | currentTime 0.13 → 1.54 |
| 2026-10-01T02:51:00Z | S1 AUTO end-to-end | AUTO advanced 1→2 · active cue narrates visible slide | PASS | cue #1 (slide 2) vs visible 2; audio 1.55s; expected first cue #1 |
| 2026-10-01T02:51:00Z | S1 AUTO end-to-end | AUTO advanced 1→2 · CC caption == active cue text | PASS | caption="Section one, the Pact." cue="Section one, the Pact." |
| 2026-10-01T02:51:00Z | S1 AUTO end-to-end | AUTO advanced 1→2 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=2 cue=#1 (slide 2) visible=2 transcript chars=363 |
| 2026-10-01T02:53:46Z | S1 AUTO end-to-end | reached slide 39 and the last clip ended | **FAIL** | n=2 ended=false changes=1 in 170 s (playbackRate 4×) |
| 2026-10-01T02:53:46Z | S1 AUTO end-to-end | every section hand-over waited for the clip to end | PASS | 1→2 NAR-00→NAR-01 endedBefore=true |
| 2026-10-01T02:53:48Z | S2 keyboard mid-play + rapid skip | guide on slide 1 · slide on screen | PASS | visible slide 1 (expected 1) hash=#/01 |
| 2026-10-01T02:53:48Z | S2 keyboard mid-play + rapid skip | guide on slide 1 · clip == slide mapping | PASS | bar clip NAR-00 vs expected NAR-00 for slide 1 (1 ms) |
| 2026-10-01T02:53:48Z | S2 keyboard mid-play + rapid skip | guide on slide 1 · audio playing ≤1 s | PASS | paused=false src=guide-00-welcome-lhbIUXFwLO.mp3 ct=0 playingEvents=0 rejected=none (5 ms) |
| 2026-10-01T02:53:49Z | S2 keyboard mid-play + rapid skip | guide on slide 1 · audio progressing | PASS | currentTime 0 → 1.07 |
| 2026-10-01T02:53:49Z | S2 keyboard mid-play + rapid skip | guide on slide 1 · active cue narrates visible slide | PASS | cue #1 (slide 1) vs visible 1; audio 1.08s; expected first cue #1 |
| 2026-10-01T02:53:49Z | S2 keyboard mid-play + rapid skip | guide on slide 1 · CC caption == active cue text | PASS | caption="Welcome to the Athar Open Agentic Pact, a communit" cue="Welcome to the Athar Open Agentic Pact, a communit" |
| 2026-10-01T02:53:49Z | S2 keyboard mid-play + rapid skip | guide on slide 1 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=1 cue=#1 (slide 1) visible=1 transcript chars=258 |
| 2026-10-01T02:53:49Z | S2 keyboard mid-play + rapid skip | ArrowRight 1→2 (new clip) · slide on screen | PASS | visible slide 2 (expected 2) hash=#/02 |
| 2026-10-01T02:53:49Z | S2 keyboard mid-play + rapid skip | ArrowRight 1→2 (new clip) · clip == slide mapping | PASS | bar clip NAR-01 vs expected NAR-01 for slide 2 (64 ms) |
| 2026-10-01T02:53:49Z | S2 keyboard mid-play + rapid skip | ArrowRight 1→2 (new clip) · audio playing ≤1 s | PASS | paused=false src=guide-01-the-pact-df1pHtGsVr.mp3 ct=0.04 playingEvents=1 rejected=none (67 ms) |
| 2026-10-01T02:53:49Z | S2 keyboard mid-play + rapid skip | ArrowRight 1→2 (new clip) · audio progressing | PASS | currentTime 0.05 → 1.25 |
| 2026-10-01T02:53:49Z | S2 keyboard mid-play + rapid skip | ArrowRight 1→2 (new clip) · active cue narrates visible slide | PASS | cue #1 (slide 2) vs visible 2; audio 1.26s; expected first cue #1 |
| 2026-10-01T02:53:49Z | S2 keyboard mid-play + rapid skip | ArrowRight 1→2 (new clip) · CC caption == active cue text | PASS | caption="Section one, the Pact." cue="Section one, the Pact." |
| 2026-10-01T02:53:49Z | S2 keyboard mid-play + rapid skip | ArrowRight 1→2 (new clip) · transcript highlight == on-screen slide | PASS | highlighted sentence slide=2 cue=#1 (slide 2) visible=2 transcript chars=363 |
| 2026-10-01T02:53:49Z | S2 keyboard mid-play + rapid skip | ArrowRight 2→3 (same clip, other sentence) · slide on screen | PASS | visible slide 3 (expected 3) hash=#/03 |
| 2026-10-01T02:53:49Z | S2 keyboard mid-play + rapid skip | ArrowRight 2→3 (same clip, other sentence) · clip == slide mapping | PASS | bar clip NAR-01 vs expected NAR-01 for slide 3 (2 ms) |
| 2026-10-01T02:53:49Z | S2 keyboard mid-play + rapid skip | ArrowRight 2→3 (same clip, other sentence) · audio playing ≤1 s | PASS | paused=false src=guide-01-the-pact-df1pHtGsVr.mp3 ct=1.29 playingEvents=0 rejected=none (5 ms) |
| 2026-10-01T02:53:49Z | S2 keyboard mid-play + rapid skip | ArrowRight 2→3 (same clip, other sentence) · audio progressing | PASS | currentTime 1.3 → 13.17 |
| 2026-10-01T02:53:49Z | S2 keyboard mid-play + rapid skip | ArrowRight 2→3 (same clip, other sentence) · active cue narrates visible slide | PASS | cue #3 (slide 3) vs visible 3; audio 13.18s; expected first cue #3 |
| 2026-10-01T02:53:49Z | S2 keyboard mid-play + rapid skip | ArrowRight 2→3 (same clip, other sentence) · CC caption == active cue text | PASS | caption="It is a community proposal from ODA and AI Rev, de" cue="It is a community proposal from ODA and AI Rev, de" |
| 2026-10-01T02:53:49Z | S2 keyboard mid-play + rapid skip | ArrowRight 2→3 (same clip, other sentence) · transcript highlight == on-screen slide | PASS | highlighted sentence slide=3 cue=#3 (slide 3) visible=3 transcript chars=363 |
| 2026-10-01T02:53:50Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×5 → 8 · slide on screen | PASS | visible slide 8 (expected 8) hash=#/08 |
| 2026-10-01T02:53:50Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×5 → 8 · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 8 (1 ms) |
| 2026-10-01T02:53:50Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×5 → 8 · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=2.36 playingEvents=0 rejected=none (8 ms) |
| 2026-10-01T02:53:50Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×5 → 8 · audio progressing | PASS | currentTime 2.37 → 3.79 |
| 2026-10-01T02:53:50Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×5 → 8 · active cue narrates visible slide | PASS | cue #2 (slide 7) vs visible 8; audio 3.79s; expected first cue #2 |
| 2026-10-01T02:53:50Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×5 → 8 · CC caption == active cue text | PASS | caption="Every webinar, chapter event and challenge should " cue="Every webinar, chapter event and challenge should " |
| 2026-10-01T02:53:50Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×5 → 8 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=7 cue=#2 (slide 7) visible=8 transcript chars=409 |
| 2026-10-01T02:53:50Z | S2 keyboard mid-play + rapid skip | ArrowLeft ×2 → 6 · slide on screen | PASS | visible slide 6 (expected 6) hash=#/06 |
| 2026-10-01T02:53:50Z | S2 keyboard mid-play + rapid skip | ArrowLeft ×2 → 6 · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 6 (2 ms) |
| 2026-10-01T02:53:50Z | S2 keyboard mid-play + rapid skip | ArrowLeft ×2 → 6 · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=0.01 playingEvents=1 rejected=none (13 ms) |
| 2026-10-01T02:53:51Z | S2 keyboard mid-play + rapid skip | ArrowLeft ×2 → 6 · audio progressing | PASS | currentTime 0.02 → 1.1 |
| 2026-10-01T02:53:51Z | S2 keyboard mid-play + rapid skip | ArrowLeft ×2 → 6 · active cue narrates visible slide | PASS | cue #1 (slide 4) vs visible 6; audio 1.11s; expected first cue #1 |
| 2026-10-01T02:53:51Z | S2 keyboard mid-play + rapid skip | ArrowLeft ×2 → 6 · CC caption == active cue text | PASS | caption="Section two, the Community Model." cue="Section two, the Community Model." |
| 2026-10-01T02:53:51Z | S2 keyboard mid-play + rapid skip | ArrowLeft ×2 → 6 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=4 cue=#1 (slide 4) visible=6 transcript chars=409 |
| 2026-10-01T02:53:51Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×7 across sections → 13 · slide on screen | PASS | visible slide 13 (expected 13) hash=#/13 |
| 2026-10-01T02:53:51Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×7 across sections → 13 · clip == slide mapping | PASS | bar clip NAR-03 vs expected NAR-03 for slide 13 (1 ms) |
| 2026-10-01T02:53:51Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×7 across sections → 13 · audio playing ≤1 s | PASS | paused=false src=guide-03-six-pillars-yxVqZJ2k1a.mp3 ct=0.09 playingEvents=0 rejected=none (5 ms) |
| 2026-10-01T02:53:51Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×7 across sections → 13 · audio progressing | PASS | currentTime 0.09 → 1.25 |
| 2026-10-01T02:53:51Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×7 across sections → 13 · active cue narrates visible slide | PASS | cue #1 (slide 13) vs visible 13; audio 1.26s; expected first cue #1 |
| 2026-10-01T02:53:51Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×7 across sections → 13 · CC caption == active cue text | PASS | caption="Section three, six pillars." cue="Section three, six pillars." |
| 2026-10-01T02:53:51Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×7 across sections → 13 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=13 cue=#1 (slide 13) visible=13 transcript chars=293 |
| 2026-10-01T02:53:51Z | S2 keyboard mid-play + rapid skip | End → 39 · slide on screen | PASS | visible slide 39 (expected 39) hash=#/28 |
| 2026-10-01T02:53:51Z | S2 keyboard mid-play + rapid skip | End → 39 · clip == slide mapping | PASS | bar clip NAR-09 vs expected NAR-09 for slide 39 (63 ms) |
| 2026-10-01T02:53:51Z | S2 keyboard mid-play + rapid skip | End → 39 · audio playing ≤1 s | PASS | paused=false src=guide-09-join-the-pact-Hx4Ywy843S.mp3 ct=0 playingEvents=1 rejected=none (69 ms) |
| 2026-10-01T02:53:52Z | S2 keyboard mid-play + rapid skip | End → 39 · audio progressing | PASS | currentTime 0.01 → 1.11 |
| 2026-10-01T02:53:52Z | S2 keyboard mid-play + rapid skip | End → 39 · active cue narrates visible slide | PASS | cue #1 (slide 39) vs visible 39; audio 1.12s; expected first cue #1 |
| 2026-10-01T02:53:52Z | S2 keyboard mid-play + rapid skip | End → 39 · CC caption == active cue text | PASS | caption="Join the Pact." cue="Join the Pact." |
| 2026-10-01T02:53:52Z | S2 keyboard mid-play + rapid skip | End → 39 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=39 cue=#1 (slide 39) visible=39 transcript chars=384 |
| 2026-10-01T02:53:52Z | S2 keyboard mid-play + rapid skip | Home → 1 · slide on screen | PASS | visible slide 1 (expected 1) hash=#/01 |
| 2026-10-01T02:53:52Z | S2 keyboard mid-play + rapid skip | Home → 1 · clip == slide mapping | PASS | bar clip NAR-00 vs expected NAR-00 for slide 1 (3 ms) |
| 2026-10-01T02:53:52Z | S2 keyboard mid-play + rapid skip | Home → 1 · audio playing ≤1 s | PASS | paused=false src=guide-00-welcome-lhbIUXFwLO.mp3 ct=0 playingEvents=1 rejected=none (20 ms) |
| 2026-10-01T02:53:52Z | S2 keyboard mid-play + rapid skip | Home → 1 · audio progressing | PASS | currentTime 0.02 → 1.22 |
| 2026-10-01T02:53:52Z | S2 keyboard mid-play + rapid skip | Home → 1 · active cue narrates visible slide | PASS | cue #1 (slide 1) vs visible 1; audio 1.23s; expected first cue #1 |
| 2026-10-01T02:53:52Z | S2 keyboard mid-play + rapid skip | Home → 1 · CC caption == active cue text | PASS | caption="Welcome to the Athar Open Agentic Pact, a communit" cue="Welcome to the Athar Open Agentic Pact, a communit" |
| 2026-10-01T02:53:52Z | S2 keyboard mid-play + rapid skip | Home → 1 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=1 cue=#1 (slide 1) visible=1 transcript chars=258 |
| 2026-10-01T02:53:53Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×27 → 28 (virtual slides) · slide on screen | PASS | visible slide 28 (expected 28) hash=#/27/new-1 |
| 2026-10-01T02:53:53Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×27 → 28 (virtual slides) · clip == slide mapping | PASS | bar clip NAR-07 vs expected NAR-07 for slide 28 (1 ms) |
| 2026-10-01T02:53:53Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×27 → 28 (virtual slides) · audio playing ≤1 s | PASS | paused=false src=guide-07-impact-and-funding-vWkiINp1IS.mp3 ct=0.02 playingEvents=0 rejected=none (6 ms) |
| 2026-10-01T02:53:53Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×27 → 28 (virtual slides) · audio progressing | PASS | currentTime 0.03 → 1.23 |
| 2026-10-01T02:53:53Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×27 → 28 (virtual slides) · active cue narrates visible slide | PASS | cue #1 (slide 28) vs visible 28; audio 1.24s; expected first cue #1 |
| 2026-10-01T02:53:53Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×27 → 28 (virtual slides) · CC caption == active cue text | PASS | caption="Section seven, Impact and Funding." cue="Section seven, Impact and Funding." |
| 2026-10-01T02:53:53Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×27 → 28 (virtual slides) · transcript highlight == on-screen slide | PASS | highlighted sentence slide=28 cue=#1 (slide 28) visible=28 transcript chars=447 |
| 2026-10-01T02:53:54Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×10 → 38 · slide on screen | PASS | visible slide 38 (expected 38) hash=#/27/new-11 |
| 2026-10-01T02:53:54Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×10 → 38 · clip == slide mapping | PASS | bar clip NAR-08 vs expected NAR-08 for slide 38 (1 ms) |
| 2026-10-01T02:53:54Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×10 → 38 · audio playing ≤1 s | PASS | paused=false src=guide-08-athar-os-Ib4oKe91OD.mp3 ct=8 playingEvents=0 rejected=none (5 ms) |
| 2026-10-01T02:53:54Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×10 → 38 · audio progressing | PASS | currentTime 8 → 9.13 |
| 2026-10-01T02:53:54Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×10 → 38 · active cue narrates visible slide | PASS | cue #3 (slide 38) vs visible 38; audio 9.13s; expected first cue #3 |
| 2026-10-01T02:53:54Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×10 → 38 · CC caption == active cue text | PASS | caption="Nations empowered." cue="Nations empowered." |
| 2026-10-01T02:53:54Z | S2 keyboard mid-play + rapid skip | rapid ArrowRight ×10 → 38 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=38 cue=#3 (slide 38) visible=38 transcript chars=375 |
| 2026-10-01T02:54:10Z | S3 N shortcut | scenario crashed | **FAIL** | TimeoutError: page.waitForSelector: Timeout 15000ms exceeded. |
| 2026-10-01T02:54:26Z | S4 Esc overview + deep links + ?intro=1 | scenario crashed | **FAIL** | TimeoutError: page.waitForSelector: Timeout 15000ms exceeded. |
| 2026-10-01T02:54:41Z | S5 slide-38 country tabs | scenario crashed | **FAIL** | TimeoutError: page.waitForSelector: Timeout 15000ms exceeded. |
| 2026-10-01T02:54:57Z | S6 Replay intro and return | scenario crashed | **FAIL** | TimeoutError: page.waitForSelector: Timeout 15000ms exceeded. |
| 2026-10-01T02:55:13Z | S7 tab hidden/visible + audio-focus loss | scenario crashed | **FAIL** | TimeoutError: page.waitForSelector: Timeout 15000ms exceeded. |
| 2026-10-01T02:55:29Z | S8 phone 390×844 | scenario crashed | **FAIL** | TimeoutError: page.waitForSelector: Timeout 15000ms exceeded. |
| 2026-10-01T02:55:44Z | S9 Arabic / RTL | scenario crashed | **FAIL** | TimeoutError: page.waitForSelector: Timeout 15000ms exceeded. |
| 2026-10-01T02:56:00Z | S10 autoplay policy / persisted narration-on | scenario crashed | **FAIL** | TimeoutError: page.waitForSelector: Timeout 15000ms exceeded. |

### Mismatches recorded in run `before` (9)

1. **S1 AUTO end-to-end — reached slide 39 and the last clip ended** (2026-10-01T02:53:46Z)  
   repro: see scenario  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: n=2 ended=false changes=1 in 170 s (playbackRate 4×)
2. **S3 N shortcut — scenario crashed** (2026-10-01T02:54:10Z)  
   repro: see scenario  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
3. **S4 Esc overview + deep links + ?intro=1 — scenario crashed** (2026-10-01T02:54:26Z)  
   repro: see scenario  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
4. **S5 slide-38 country tabs — scenario crashed** (2026-10-01T02:54:41Z)  
   repro: see scenario  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
5. **S6 Replay intro and return — scenario crashed** (2026-10-01T02:54:57Z)  
   repro: see scenario  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
6. **S7 tab hidden/visible + audio-focus loss — scenario crashed** (2026-10-01T02:55:13Z)  
   repro: see scenario  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
7. **S8 phone 390×844 — scenario crashed** (2026-10-01T02:55:29Z)  
   repro: see scenario  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
8. **S9 Arabic / RTL — scenario crashed** (2026-10-01T02:55:44Z)  
   repro: see scenario  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
9. **S10 autoplay policy / persisted narration-on — scenario crashed** (2026-10-01T02:56:00Z)  
   repro: see scenario  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.

## Run `before` — 2026-10-01T02:59:52Z → 2026-10-01T03:00:34Z

Base URL http://127.0.0.1:4173 · Chromium (Playwright) · playbackRate 4× for the AUTO end-to-end scenario · checks: **136 pass / 23 fail** of 159

| UTC | scenario | check | result | detail |
|---|---|---|---|---|
| 2026-10-01T02:59:54Z | S3 N shortcut | N starts narration on slide 5 · slide on screen | PASS | visible slide 5 (expected 5) hash=#/05 |
| 2026-10-01T02:59:54Z | S3 N shortcut | N starts narration on slide 5 · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 5 (2 ms) |
| 2026-10-01T02:59:54Z | S3 N shortcut | N starts narration on slide 5 · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=0.03 playingEvents=1 rejected=none (9 ms) |
| 2026-10-01T02:59:54Z | S3 N shortcut | N starts narration on slide 5 · audio progressing | PASS | currentTime 0.04 → 1.14 |
| 2026-10-01T02:59:54Z | S3 N shortcut | N starts narration on slide 5 · active cue narrates visible slide | PASS | cue #1 (slide 4) vs visible 5; audio 1.14s; expected first cue #1 |
| 2026-10-01T02:59:54Z | S3 N shortcut | N starts narration on slide 5 · CC caption == active cue text | PASS | caption="Section two, the Community Model." cue="Section two, the Community Model." |
| 2026-10-01T02:59:54Z | S3 N shortcut | N starts narration on slide 5 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=4 cue=#1 (slide 4) visible=5 transcript chars=409 |
| 2026-10-01T02:59:54Z | S3 N shortcut | N pauses narration | PASS | paused=true narrating=false |
| 2026-10-01T02:59:55Z | S3 N shortcut | paused + ArrowRight: caption/transcript follow the slide without audio | **FAIL** | n=6 clip=NAR-02 paused=false cue=#1 (slide 4) highlight slide=4 |
| 2026-10-01T02:59:55Z | S3 N shortcut | N resumes at the sentence of the slide on screen (6) · slide on screen | PASS | visible slide 6 (expected 6) hash=#/06 |
| 2026-10-01T02:59:55Z | S3 N shortcut | N resumes at the sentence of the slide on screen (6) · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 6 (1 ms) |
| 2026-10-01T02:59:55Z | S3 N shortcut | N resumes at the sentence of the slide on screen (6) · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=1.48 playingEvents=1 rejected=none (9 ms) |
| 2026-10-01T02:59:55Z | S3 N shortcut | N resumes at the sentence of the slide on screen (6) · audio progressing | **FAIL** | currentTime 1.48 → 0.09 |
| 2026-10-01T02:59:55Z | S3 N shortcut | N resumes at the sentence of the slide on screen (6) · active cue narrates visible slide | PASS | cue #1 (slide 4) vs visible 6; audio 0.09s; expected first cue #1 |
| 2026-10-01T02:59:55Z | S3 N shortcut | N resumes at the sentence of the slide on screen (6) · CC caption == active cue text | PASS | caption="Section two, the Community Model." cue="Section two, the Community Model." |
| 2026-10-01T02:59:55Z | S3 N shortcut | N resumes at the sentence of the slide on screen (6) · transcript highlight == on-screen slide | PASS | highlighted sentence slide=4 cue=#1 (slide 4) visible=6 transcript chars=409 |
| 2026-10-01T02:59:57Z | S4 Esc overview + deep links + ?intro=1 | guide on slide 2 · slide on screen | PASS | visible slide 2 (expected 2) hash=#/02 |
| 2026-10-01T02:59:57Z | S4 Esc overview + deep links + ?intro=1 | guide on slide 2 · clip == slide mapping | PASS | bar clip NAR-01 vs expected NAR-01 for slide 2 (1 ms) |
| 2026-10-01T02:59:57Z | S4 Esc overview + deep links + ?intro=1 | guide on slide 2 · audio playing ≤1 s | PASS | paused=false src=guide-01-the-pact-df1pHtGsVr.mp3 ct=0 playingEvents=0 rejected=none (5 ms) |
| 2026-10-01T02:59:57Z | S4 Esc overview + deep links + ?intro=1 | guide on slide 2 · audio progressing | PASS | currentTime 0 → 1.06 |
| 2026-10-01T02:59:57Z | S4 Esc overview + deep links + ?intro=1 | guide on slide 2 · active cue narrates visible slide | PASS | cue #1 (slide 2) vs visible 2; audio 1.06s; expected first cue #1 |
| 2026-10-01T02:59:57Z | S4 Esc overview + deep links + ?intro=1 | guide on slide 2 · CC caption == active cue text | PASS | caption="Section one, the Pact." cue="Section one, the Pact." |
| 2026-10-01T02:59:57Z | S4 Esc overview + deep links + ?intro=1 | guide on slide 2 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=2 cue=#1 (slide 2) visible=2 transcript chars=363 |
| 2026-10-01T02:59:57Z | S4 Esc overview + deep links + ?intro=1 | Esc opens the overview | PASS | overview dialog visible |
| 2026-10-01T02:59:57Z | S4 Esc overview + deep links + ?intro=1 | overview grid has tiles | PASS | 39 tiles |
| 2026-10-01T02:59:57Z | S4 Esc overview + deep links + ?intro=1 | overview tile → slide 7 · slide on screen | PASS | visible slide 7 (expected 7) hash=#/07 |
| 2026-10-01T02:59:57Z | S4 Esc overview + deep links + ?intro=1 | overview tile → slide 7 · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 7 (64 ms) |
| 2026-10-01T02:59:57Z | S4 Esc overview + deep links + ?intro=1 | overview tile → slide 7 · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=2.26 playingEvents=1 rejected=none (74 ms) |
| 2026-10-01T02:59:58Z | S4 Esc overview + deep links + ?intro=1 | overview tile → slide 7 · audio progressing | PASS | currentTime 2.26 → 3.5 |
| 2026-10-01T02:59:58Z | S4 Esc overview + deep links + ?intro=1 | overview tile → slide 7 · active cue narrates visible slide | PASS | cue #2 (slide 7) vs visible 7; audio 3.5s; expected first cue #2 |
| 2026-10-01T02:59:58Z | S4 Esc overview + deep links + ?intro=1 | overview tile → slide 7 · CC caption == active cue text | PASS | caption="Every webinar, chapter event and challenge should " cue="Every webinar, chapter event and challenge should " |
| 2026-10-01T02:59:58Z | S4 Esc overview + deep links + ?intro=1 | overview tile → slide 7 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=7 cue=#2 (slide 7) visible=7 transcript chars=409 |
| 2026-10-01T02:59:58Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/20 · slide on screen | PASS | visible slide 20 (expected 20) hash=#/20 |
| 2026-10-01T02:59:58Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/20 · clip == slide mapping | PASS | bar clip NAR-04 vs expected NAR-04 for slide 20 (64 ms) |
| 2026-10-01T02:59:58Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/20 · audio playing ≤1 s | PASS | paused=false src=guide-04-pledge-and-signing-PWeXZj1Rgc.mp3 ct=5.14 playingEvents=2 rejected=none (69 ms) |
| 2026-10-01T02:59:58Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/20 · audio progressing | PASS | currentTime 5.15 → 6.23 |
| 2026-10-01T02:59:58Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/20 · active cue narrates visible slide | PASS | cue #3 (slide 20) vs visible 20; audio 6.27s; expected first cue #3 |
| 2026-10-01T02:59:58Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/20 · CC caption == active cue text | PASS | caption="A signatory chooses its roles, sign, govern, build" cue="A signatory chooses its roles, sign, govern, build" |
| 2026-10-01T02:59:58Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/20 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=20 cue=#3 (slide 20) visible=20 transcript chars=391 |
| 2026-10-01T02:59:58Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/27/new-4 → 31 · slide on screen | PASS | visible slide 31 (expected 31) hash=#/27/new-4 |
| 2026-10-01T02:59:58Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/27/new-4 → 31 · clip == slide mapping | PASS | bar clip NAR-07 vs expected NAR-07 for slide 31 (64 ms) |
| 2026-10-01T02:59:58Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/27/new-4 → 31 · audio playing ≤1 s | PASS | paused=false src=guide-07-impact-and-funding-vWkiINp1IS.mp3 ct=21.39 playingEvents=1 rejected=none (69 ms) |
| 2026-10-01T02:59:59Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/27/new-4 → 31 · audio progressing | PASS | currentTime 21.4 → 22.54 |
| 2026-10-01T02:59:59Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/27/new-4 → 31 · active cue narrates visible slide | PASS | cue #5 (slide 31) vs visible 31; audio 22.55s; expected first cue #5 |
| 2026-10-01T02:59:59Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/27/new-4 → 31 · CC caption == active cue text | PASS | caption="Universal API licenses, marketplace revenue share " cue="Universal API licenses, marketplace revenue share " |
| 2026-10-01T02:59:59Z | S4 Esc overview + deep links + ?intro=1 | in-page hash #/27/new-4 → 31 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=31 cue=#5 (slide 31) visible=31 transcript chars=447 |
| 2026-10-01T02:59:59Z | S4 Esc overview + deep links + ?intro=1 | #slide-07 alias deep link → slide 7 | **FAIL** | n=1 clip=NAR-00 hash=#/01 |
| 2026-10-01T03:00:00Z | S4 Esc overview + deep links + ?intro=1 | full reload on #/25 bypasses the intro and maps clip | PASS | n=25 intro=false clip=NAR-05 |
| 2026-10-01T03:00:01Z | S4 Esc overview + deep links + ?intro=1 | ?intro=1 forces the intro film | PASS | intro=true |
| 2026-10-01T03:00:01Z | S4 Esc overview + deep links + ?intro=1 | no guide narration plays during the intro film | PASS | guide play() calls during intro: 0 |
| 2026-10-01T03:00:02Z | S4 Esc overview + deep links + ?intro=1 | after the intro the deck is on slide 1 with NAR-00 mapped | PASS | n=1 clip=NAR-00 |
| 2026-10-01T03:00:04Z | S5 slide-38 country tabs | guide on slide 38 · slide on screen | PASS | visible slide 38 (expected 38) hash=#/27/new-11 |
| 2026-10-01T03:00:04Z | S5 slide-38 country tabs | guide on slide 38 · clip == slide mapping | PASS | bar clip NAR-08 vs expected NAR-08 for slide 38 (1 ms) |
| 2026-10-01T03:00:04Z | S5 slide-38 country tabs | guide on slide 38 · audio playing ≤1 s | PASS | paused=false src=guide-08-athar-os-Ib4oKe91OD.mp3 ct=7.96 playingEvents=0 rejected=none (5 ms) |
| 2026-10-01T03:00:04Z | S5 slide-38 country tabs | guide on slide 38 · audio progressing | PASS | currentTime 7.96 → 8.98 |
| 2026-10-01T03:00:04Z | S5 slide-38 country tabs | guide on slide 38 · active cue narrates visible slide | PASS | cue #3 (slide 38) vs visible 38; audio 8.98s; expected first cue #3 |
| 2026-10-01T03:00:04Z | S5 slide-38 country tabs | guide on slide 38 · CC caption == active cue text | PASS | caption="Nations empowered." cue="Nations empowered." |
| 2026-10-01T03:00:04Z | S5 slide-38 country tabs | guide on slide 38 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=38 cue=#3 (slide 38) visible=38 transcript chars=375 |
| 2026-10-01T03:00:04Z | S5 slide-38 country tabs | tab in → narration seeks to its sentence (cue #3) | PASS | cue=#3 audio=9.19s tab aria-selected=true paused=false |
| 2026-10-01T03:00:04Z | S5 slide-38 country tabs | tab ke → narration seeks to its sentence (cue #4) | PASS | cue=#4 audio=10.58s tab aria-selected=true paused=false |
| 2026-10-01T03:00:06Z | S5 slide-38 country tabs | tab lb → narration seeks to its sentence (cue #2) | **FAIL** | cue=#5 audio=17.89s tab aria-selected=false paused=false |
| 2026-10-01T03:00:08Z | S6 Replay intro and return | guide on slide 4 · slide on screen | PASS | visible slide 4 (expected 4) hash=#/04 |
| 2026-10-01T03:00:08Z | S6 Replay intro and return | guide on slide 4 · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 4 (2 ms) |
| 2026-10-01T03:00:08Z | S6 Replay intro and return | guide on slide 4 · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=0 playingEvents=0 rejected=none (6 ms) |
| 2026-10-01T03:00:09Z | S6 Replay intro and return | guide on slide 4 · audio progressing | PASS | currentTime 0 → 1.08 |
| 2026-10-01T03:00:09Z | S6 Replay intro and return | guide on slide 4 · active cue narrates visible slide | PASS | cue #1 (slide 4) vs visible 4; audio 1.09s; expected first cue #1 |
| 2026-10-01T03:00:09Z | S6 Replay intro and return | guide on slide 4 · CC caption == active cue text | PASS | caption="Section two, the Community Model." cue="Section two, the Community Model." |
| 2026-10-01T03:00:09Z | S6 Replay intro and return | guide on slide 4 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=4 cue=#1 (slide 4) visible=4 transcript chars=409 |
| 2026-10-01T03:00:09Z | S6 Replay intro and return | Replay intro opens the intro film | PASS | intro-gate shown |
| 2026-10-01T03:00:10Z | S6 Replay intro and return | guide/narration is silent while the intro film plays | **FAIL** | audio=intro-narration.mp3 paused=false play() calls=,guide-02-community-model-9gUnFBtxrM.mp3 |
| 2026-10-01T03:00:12Z | S6 Replay intro and return | after the replayed intro the guide narrates slide 1 · slide on screen | **FAIL** | visible slide 4 (expected 1) hash=#/04 |
| 2026-10-01T03:00:12Z | S6 Replay intro and return | after the replayed intro the guide narrates slide 1 · clip == slide mapping | **FAIL** | bar clip  vs expected NAR-00 for slide 1 (1546 ms) |
| 2026-10-01T03:00:12Z | S6 Replay intro and return | after the replayed intro the guide narrates slide 1 · audio playing ≤1 s | **FAIL** | paused=false src=intro-narration.mp3 ct=13.18 playingEvents=0 rejected=none (1612 ms) |
| 2026-10-01T03:00:14Z | S6 Replay intro and return | after the replayed intro the guide narrates slide 1 · active cue narrates visible slide | **FAIL** | cue #null (slide null) vs visible 1; audio 18.16s; expected first cue #1 |
| 2026-10-01T03:00:14Z | S6 Replay intro and return | after the replayed intro the guide narrates slide 1 · CC caption == active cue text | PASS | caption="" cue="" |
| 2026-10-01T03:00:14Z | S6 Replay intro and return | after the replayed intro the guide narrates slide 1 · transcript highlight == on-screen slide | **FAIL** | highlighted sentence slide=null cue=#null (slide undefined) visible=1 transcript chars=309 |
| 2026-10-01T03:00:15Z | S7 tab hidden/visible + audio-focus loss | guide on slide 13 · slide on screen | PASS | visible slide 13 (expected 13) hash=#/13 |
| 2026-10-01T03:00:15Z | S7 tab hidden/visible + audio-focus loss | guide on slide 13 · clip == slide mapping | PASS | bar clip NAR-03 vs expected NAR-03 for slide 13 (2 ms) |
| 2026-10-01T03:00:15Z | S7 tab hidden/visible + audio-focus loss | guide on slide 13 · audio playing ≤1 s | PASS | paused=false src=guide-03-six-pillars-yxVqZJ2k1a.mp3 ct=0 playingEvents=0 rejected=none (5 ms) |
| 2026-10-01T03:00:16Z | S7 tab hidden/visible + audio-focus loss | guide on slide 13 · audio progressing | PASS | currentTime 0 → 1.1 |
| 2026-10-01T03:00:16Z | S7 tab hidden/visible + audio-focus loss | guide on slide 13 · active cue narrates visible slide | PASS | cue #1 (slide 13) vs visible 13; audio 1.11s; expected first cue #1 |
| 2026-10-01T03:00:16Z | S7 tab hidden/visible + audio-focus loss | guide on slide 13 · CC caption == active cue text | PASS | caption="Section three, six pillars." cue="Section three, six pillars." |
| 2026-10-01T03:00:16Z | S7 tab hidden/visible + audio-focus loss | guide on slide 13 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=13 cue=#1 (slide 13) visible=13 transcript chars=293 |
| 2026-10-01T03:00:16Z | S7 tab hidden/visible + audio-focus loss | visible again after 2 hidden slide changes → narrates slide 15 · slide on screen | PASS | visible slide 15 (expected 15) hash=#/15 |
| 2026-10-01T03:00:16Z | S7 tab hidden/visible + audio-focus loss | visible again after 2 hidden slide changes → narrates slide 15 · clip == slide mapping | PASS | bar clip NAR-03 vs expected NAR-03 for slide 15 (1 ms) |
| 2026-10-01T03:00:16Z | S7 tab hidden/visible + audio-focus loss | visible again after 2 hidden slide changes → narrates slide 15 · audio playing ≤1 s | PASS | paused=false src=guide-03-six-pillars-yxVqZJ2k1a.mp3 ct=9.91 playingEvents=0 rejected=none (5 ms) |
| 2026-10-01T03:00:17Z | S7 tab hidden/visible + audio-focus loss | visible again after 2 hidden slide changes → narrates slide 15 · audio progressing | PASS | currentTime 9.92 → 11.36 |
| 2026-10-01T03:00:17Z | S7 tab hidden/visible + audio-focus loss | visible again after 2 hidden slide changes → narrates slide 15 · active cue narrates visible slide | PASS | cue #3 (slide 14) vs visible 15; audio 11.37s; expected first cue #3 |
| 2026-10-01T03:00:17Z | S7 tab hidden/visible + audio-focus loss | visible again after 2 hidden slide changes → narrates slide 15 · CC caption == active cue text | PASS | caption="Reusable skills are built once and shared across t" cue="Reusable skills are built once and shared across t" |
| 2026-10-01T03:00:17Z | S7 tab hidden/visible + audio-focus loss | visible again after 2 hidden slide changes → narrates slide 15 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=14 cue=#3 (slide 14) visible=15 transcript chars=293 |
| 2026-10-01T03:00:17Z | S7 tab hidden/visible + audio-focus loss | external pause recorded | **FAIL** | paused=false |
| 2026-10-01T03:00:17Z | S7 tab hidden/visible + audio-focus loss | narration resumes after focus regain (audio-focus loss) | PASS | paused=false after 1 ms |
| 2026-10-01T03:00:19Z | S8 phone 390×844 | phone: guide on slide 2 · slide on screen | PASS | visible slide 2 (expected 2) hash=#/02 |
| 2026-10-01T03:00:19Z | S8 phone 390×844 | phone: guide on slide 2 · clip == slide mapping | PASS | bar clip NAR-01 vs expected NAR-01 for slide 2 (1 ms) |
| 2026-10-01T03:00:19Z | S8 phone 390×844 | phone: guide on slide 2 · audio playing ≤1 s | PASS | paused=false src=guide-01-the-pact-df1pHtGsVr.mp3 ct=0 playingEvents=0 rejected=none (5 ms) |
| 2026-10-01T03:00:19Z | S8 phone 390×844 | phone: guide on slide 2 · audio progressing | PASS | currentTime 0 → 1.06 |
| 2026-10-01T03:00:19Z | S8 phone 390×844 | phone: guide on slide 2 · active cue narrates visible slide | PASS | cue #1 (slide 2) vs visible 2; audio 1.07s; expected first cue #1 |
| 2026-10-01T03:00:19Z | S8 phone 390×844 | phone: guide on slide 2 · CC caption == active cue text | PASS | caption="Section one, the Pact." cue="Section one, the Pact." |
| 2026-10-01T03:00:19Z | S8 phone 390×844 | phone: guide on slide 2 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=2 cue=#1 (slide 2) visible=2 transcript chars=363 |
| 2026-10-01T03:00:19Z | S8 phone 390×844 | phone: bar next button visible and ≥44 px | PASS | 44×44 |
| 2026-10-01T03:00:19Z | S8 phone 390×844 | phone: bar next → 3 · slide on screen | PASS | visible slide 3 (expected 3) hash=#/03 |
| 2026-10-01T03:00:19Z | S8 phone 390×844 | phone: bar next → 3 · clip == slide mapping | PASS | bar clip NAR-01 vs expected NAR-01 for slide 3 (64 ms) |
| 2026-10-01T03:00:19Z | S8 phone 390×844 | phone: bar next → 3 · audio playing ≤1 s | PASS | paused=false src=guide-01-the-pact-df1pHtGsVr.mp3 ct=1.49 playingEvents=0 rejected=none (67 ms) |
| 2026-10-01T03:00:19Z | S8 phone 390×844 | phone: bar next → 3 · audio progressing | PASS | currentTime 1.5 → 2.87 |
| 2026-10-01T03:00:21Z | S8 phone 390×844 | phone: bar next → 3 · active cue narrates visible slide | **FAIL** | cue #2 (slide 2) vs visible 3; audio 7.6s; expected first cue #3 |
| 2026-10-01T03:00:21Z | S8 phone 390×844 | phone: bar next → 3 · CC caption == active cue text | PASS | caption="The Athar Open Agentic Pact is an open commitment " cue="The Athar Open Agentic Pact is an open commitment " |
| 2026-10-01T03:00:21Z | S8 phone 390×844 | phone: bar next → 3 · transcript highlight == on-screen slide | **FAIL** | highlighted sentence slide=2 cue=#2 (slide 2) visible=3 transcript chars=363 |
| 2026-10-01T03:00:22Z | S8 phone 390×844 | phone: bar next → 4 (new clip) · slide on screen | **FAIL** | visible slide 3 (expected 4) hash=#/03 |
| 2026-10-01T03:00:22Z | S8 phone 390×844 | phone: bar next → 4 (new clip) · clip == slide mapping | **FAIL** | bar clip NAR-01 vs expected NAR-02 for slide 4 (1551 ms) |
| 2026-10-01T03:00:22Z | S8 phone 390×844 | phone: bar next → 4 (new clip) · audio playing ≤1 s | **FAIL** | paused=false src=guide-01-the-pact-df1pHtGsVr.mp3 ct=14.22 playingEvents=0 rejected=none (1615 ms) |
| 2026-10-01T03:00:24Z | S8 phone 390×844 | phone: bar next → 4 (new clip) · active cue narrates visible slide | **FAIL** | cue #4 (slide 3) vs visible 4; audio 19.19s; expected first cue #1 |
| 2026-10-01T03:00:24Z | S8 phone 390×844 | phone: bar next → 4 (new clip) · CC caption == active cue text | PASS | caption="Signatories agree on shared standards, an open plu" cue="Signatories agree on shared standards, an open plu" |
| 2026-10-01T03:00:24Z | S8 phone 390×844 | phone: bar next → 4 (new clip) · transcript highlight == on-screen slide | **FAIL** | highlighted sentence slide=3 cue=#4 (slide undefined) visible=4 transcript chars=363 |
| 2026-10-01T03:00:24Z | S8 phone 390×844 | phone: bar prev → 3 · slide on screen | PASS | visible slide 3 (expected 3) hash=#/2 |
| 2026-10-01T03:00:24Z | S8 phone 390×844 | phone: bar prev → 3 · clip == slide mapping | PASS | bar clip NAR-01 vs expected NAR-01 for slide 3 (1 ms) |
| 2026-10-01T03:00:24Z | S8 phone 390×844 | phone: bar prev → 3 · audio playing ≤1 s | PASS | paused=false src=guide-01-the-pact-df1pHtGsVr.mp3 ct=19.55 playingEvents=0 rejected=none (4 ms) |
| 2026-10-01T03:00:24Z | S8 phone 390×844 | phone: bar prev → 3 · audio progressing | PASS | currentTime 19.55 → 20.97 |
| 2026-10-01T03:00:24Z | S8 phone 390×844 | phone: bar prev → 3 · active cue narrates visible slide | PASS | cue #4 (slide 3) vs visible 3; audio 20.98s; expected first cue #3 |
| 2026-10-01T03:00:24Z | S8 phone 390×844 | phone: bar prev → 3 · CC caption == active cue text | PASS | caption="Signatories agree on shared standards, an open plu" cue="Signatories agree on shared standards, an open plu" |
| 2026-10-01T03:00:24Z | S8 phone 390×844 | phone: bar prev → 3 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=3 cue=#4 (slide 3) visible=3 transcript chars=363 |
| 2026-10-01T03:00:24Z | S8 phone 390×844 | phone: bar fits the viewport (no horizontal overflow) | PASS | {"right":390,"w":390,"sw":390} |
| 2026-10-01T03:00:27Z | S9 Arabic / RTL | lang toggle → ar/rtl | PASS | lang=ar dir=rtl |
| 2026-10-01T03:00:27Z | S9 Arabic / RTL | RTL: guide on slide 2 · slide on screen | PASS | visible slide 2 (expected 2) hash=#/02 |
| 2026-10-01T03:00:27Z | S9 Arabic / RTL | RTL: guide on slide 2 · clip == slide mapping | PASS | bar clip NAR-01 vs expected NAR-01 for slide 2 (2 ms) |
| 2026-10-01T03:00:27Z | S9 Arabic / RTL | RTL: guide on slide 2 · audio playing ≤1 s | PASS | paused=false src=guide-01-the-pact-df1pHtGsVr.mp3 ct=0 playingEvents=0 rejected=none (6 ms) |
| 2026-10-01T03:00:27Z | S9 Arabic / RTL | RTL: guide on slide 2 · audio progressing | PASS | currentTime 0 → 1.05 |
| 2026-10-01T03:00:27Z | S9 Arabic / RTL | RTL: guide on slide 2 · active cue narrates visible slide | PASS | cue #1 (slide 2) vs visible 2; audio 1.05s; expected first cue #1 |
| 2026-10-01T03:00:27Z | S9 Arabic / RTL | RTL: guide on slide 2 · CC caption == active cue text | PASS | caption="Section one, the Pact." cue="Section one, the Pact." |
| 2026-10-01T03:00:27Z | S9 Arabic / RTL | RTL: guide on slide 2 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=2 cue=#1 (slide 2) visible=2 transcript chars=363 |
| 2026-10-01T03:00:27Z | S9 Arabic / RTL | RTL: ArrowLeft = next → 3 · slide on screen | PASS | visible slide 3 (expected 3) hash=#/03 |
| 2026-10-01T03:00:27Z | S9 Arabic / RTL | RTL: ArrowLeft = next → 3 · clip == slide mapping | PASS | bar clip NAR-01 vs expected NAR-01 for slide 3 (1 ms) |
| 2026-10-01T03:00:27Z | S9 Arabic / RTL | RTL: ArrowLeft = next → 3 · audio playing ≤1 s | PASS | paused=false src=guide-01-the-pact-df1pHtGsVr.mp3 ct=1.1 playingEvents=0 rejected=none (4 ms) |
| 2026-10-01T03:00:28Z | S9 Arabic / RTL | RTL: ArrowLeft = next → 3 · audio progressing | PASS | currentTime 1.1 → 13.15 |
| 2026-10-01T03:00:28Z | S9 Arabic / RTL | RTL: ArrowLeft = next → 3 · active cue narrates visible slide | PASS | cue #3 (slide 3) vs visible 3; audio 13.17s; expected first cue #3 |
| 2026-10-01T03:00:28Z | S9 Arabic / RTL | RTL: ArrowLeft = next → 3 · CC caption == active cue text | PASS | caption="It is a community proposal from ODA and AI Rev, de" cue="It is a community proposal from ODA and AI Rev, de" |
| 2026-10-01T03:00:28Z | S9 Arabic / RTL | RTL: ArrowLeft = next → 3 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=3 cue=#3 (slide 3) visible=3 transcript chars=363 |
| 2026-10-01T03:00:28Z | S9 Arabic / RTL | RTL: rapid ArrowLeft ×4 → 7 · slide on screen | PASS | visible slide 7 (expected 7) hash=#/07 |
| 2026-10-01T03:00:28Z | S9 Arabic / RTL | RTL: rapid ArrowLeft ×4 → 7 · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 7 (1 ms) |
| 2026-10-01T03:00:28Z | S9 Arabic / RTL | RTL: rapid ArrowLeft ×4 → 7 · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=2.27 playingEvents=0 rejected=none (5 ms) |
| 2026-10-01T03:00:28Z | S9 Arabic / RTL | RTL: rapid ArrowLeft ×4 → 7 · audio progressing | PASS | currentTime 2.27 → 3.47 |
| 2026-10-01T03:00:28Z | S9 Arabic / RTL | RTL: rapid ArrowLeft ×4 → 7 · active cue narrates visible slide | PASS | cue #2 (slide 7) vs visible 7; audio 3.47s; expected first cue #2 |
| 2026-10-01T03:00:28Z | S9 Arabic / RTL | RTL: rapid ArrowLeft ×4 → 7 · CC caption == active cue text | PASS | caption="Every webinar, chapter event and challenge should " cue="Every webinar, chapter event and challenge should " |
| 2026-10-01T03:00:28Z | S9 Arabic / RTL | RTL: rapid ArrowLeft ×4 → 7 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=7 cue=#2 (slide 7) visible=7 transcript chars=409 |
| 2026-10-01T03:00:28Z | S9 Arabic / RTL | RTL: ArrowRight = previous → 6 · slide on screen | PASS | visible slide 6 (expected 6) hash=#/06 |
| 2026-10-01T03:00:28Z | S9 Arabic / RTL | RTL: ArrowRight = previous → 6 · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 6 (2 ms) |
| 2026-10-01T03:00:28Z | S9 Arabic / RTL | RTL: ArrowRight = previous → 6 · audio playing ≤1 s | PASS | paused=false src=guide-02-community-model-9gUnFBtxrM.mp3 ct=3.52 playingEvents=0 rejected=none (5 ms) |
| 2026-10-01T03:00:29Z | S9 Arabic / RTL | RTL: ArrowRight = previous → 6 · audio progressing | **FAIL** | currentTime 3.53 → 1 |
| 2026-10-01T03:00:29Z | S9 Arabic / RTL | RTL: ArrowRight = previous → 6 · active cue narrates visible slide | PASS | cue #1 (slide 4) vs visible 6; audio 1.01s; expected first cue #1 |
| 2026-10-01T03:00:29Z | S9 Arabic / RTL | RTL: ArrowRight = previous → 6 · CC caption == active cue text | PASS | caption="Section two, the Community Model." cue="Section two, the Community Model." |
| 2026-10-01T03:00:29Z | S9 Arabic / RTL | RTL: ArrowRight = previous → 6 · transcript highlight == on-screen slide | PASS | highlighted sentence slide=4 cue=#1 (slide 4) visible=6 transcript chars=409 |
| 2026-10-01T03:00:29Z | S9 Arabic / RTL | RTL: bar is dir=rtl and shows the Arabic status text | PASS | {"dir":"rtl","title":"جارٍ السرد · 02 نموذج المجتمع · الشريحة 6 من 39","live":true} |
| 2026-10-01T03:00:32Z | S10 autoplay policy / persisted narration-on | reload with narration-on persisted: no audio before a gesture (autoplay policy respected) | PASS | paused=true play-rejected=none |
| 2026-10-01T03:00:32Z | S10 autoplay policy / persisted narration-on | blocked state is surfaced in the Guide bar ("tap to start") | **FAIL** | data-blocked=null title="Ready · 02 Community model · Slide 5 of 39" |
| 2026-10-01T03:00:32Z | S10 autoplay policy / persisted narration-on | first click unlocks and narration starts on the visible slide (5) · slide on screen | PASS | visible slide 5 (expected 5) hash=#/05 |
| 2026-10-01T03:00:32Z | S10 autoplay policy / persisted narration-on | first click unlocks and narration starts on the visible slide (5) · clip == slide mapping | PASS | bar clip NAR-02 vs expected NAR-02 for slide 5 (1 ms) |
| 2026-10-01T03:00:33Z | S10 autoplay policy / persisted narration-on | first click unlocks and narration starts on the visible slide (5) · audio playing ≤1 s | **FAIL** | paused=true src=guide-03-six-pillars-yxVqZJ2k1a.mp3 ct=0 playingEvents=0 rejected=none (1055 ms) |
| 2026-10-01T03:00:34Z | S10 autoplay policy / persisted narration-on | first click unlocks and narration starts on the visible slide (5) · active cue narrates visible slide | **FAIL** | cue #null (slide null) vs visible 5; audio 0s; expected first cue #1 |
| 2026-10-01T03:00:34Z | S10 autoplay policy / persisted narration-on | first click unlocks and narration starts on the visible slide (5) · CC caption == active cue text | PASS | caption="" cue="" |
| 2026-10-01T03:00:34Z | S10 autoplay policy / persisted narration-on | first click unlocks and narration starts on the visible slide (5) · transcript highlight == on-screen slide | **FAIL** | highlighted sentence slide=null cue=#null (slide undefined) visible=5 transcript chars=409 |

### Mismatches recorded in run `before` (23)

1. **S3 N shortcut — paused + ArrowRight: caption/transcript follow the slide without audio** (2026-10-01T02:59:55Z)  
   repro: press N (pause), then ArrowRight: the transcript highlight/CC must move to the new slide while paused  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: n=6 clip=NAR-02 paused=false cue=#1 (slide 4) highlight slide=4
2. **S3 N shortcut — N resumes at the sentence of the slide on screen (6) · audio progressing** (2026-10-01T02:59:55Z)  
   repro: press N again  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: currentTime 1.48 → 0.09
3. **S4 Esc overview + deep links + ?intro=1 — #slide-07 alias deep link → slide 7** (2026-10-01T02:59:59Z)  
   repro: set location.hash = "#slide-07"  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: n=1 clip=NAR-00 hash=#/01
4. **S5 slide-38 country tabs — tab lb → narration seeks to its sentence (cue #2)** (2026-10-01T03:00:06Z)  
   repro: on slide 38 while narrating, click the LB tab  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: cue=#5 audio=17.89s tab aria-selected=false paused=false
5. **S6 Replay intro and return — guide/narration is silent while the intro film plays** (2026-10-01T03:00:10Z)  
   repro: click Replay intro while narrating  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: audio=intro-narration.mp3 paused=false play() calls=,guide-02-community-model-9gUnFBtxrM.mp3
6. **S6 Replay intro and return — after the replayed intro the guide narrates slide 1 · slide on screen** (2026-10-01T03:00:12Z)  
   repro: Replay intro → Esc  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: visible slide 4 (expected 1) hash=#/04
7. **S6 Replay intro and return — after the replayed intro the guide narrates slide 1 · clip == slide mapping** (2026-10-01T03:00:12Z)  
   repro: Replay intro → Esc  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: bar clip  vs expected NAR-00 for slide 1 (1546 ms)
8. **S6 Replay intro and return — after the replayed intro the guide narrates slide 1 · audio playing ≤1 s** (2026-10-01T03:00:12Z)  
   repro: Replay intro → Esc  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: paused=false src=intro-narration.mp3 ct=13.18 playingEvents=0 rejected=none (1612 ms)
9. **S6 Replay intro and return — after the replayed intro the guide narrates slide 1 · active cue narrates visible slide** (2026-10-01T03:00:14Z)  
   repro: Replay intro → Esc  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: cue #null (slide null) vs visible 1; audio 18.16s; expected first cue #1
10. **S6 Replay intro and return — after the replayed intro the guide narrates slide 1 · transcript highlight == on-screen slide** (2026-10-01T03:00:14Z)  
   repro: Replay intro → Esc  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: highlighted sentence slide=null cue=#null (slide undefined) visible=1 transcript chars=309
11. **S7 tab hidden/visible + audio-focus loss — external pause recorded** (2026-10-01T03:00:17Z)  
   repro: see scenario  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: paused=false
12. **S8 phone 390×844 — phone: bar next → 3 · active cue narrates visible slide** (2026-10-01T03:00:21Z)  
   repro: phone viewport, tap the bar next button  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: cue #2 (slide 2) vs visible 3; audio 7.6s; expected first cue #3
13. **S8 phone 390×844 — phone: bar next → 3 · transcript highlight == on-screen slide** (2026-10-01T03:00:21Z)  
   repro: phone viewport, tap the bar next button  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: highlighted sentence slide=2 cue=#2 (slide 2) visible=3 transcript chars=363
14. **S8 phone 390×844 — phone: bar next → 4 (new clip) · slide on screen** (2026-10-01T03:00:22Z)  
   repro: see scenario  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: visible slide 3 (expected 4) hash=#/03
15. **S8 phone 390×844 — phone: bar next → 4 (new clip) · clip == slide mapping** (2026-10-01T03:00:22Z)  
   repro: see scenario  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: bar clip NAR-01 vs expected NAR-02 for slide 4 (1551 ms)
16. **S8 phone 390×844 — phone: bar next → 4 (new clip) · audio playing ≤1 s** (2026-10-01T03:00:22Z)  
   repro: see scenario  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: paused=false src=guide-01-the-pact-df1pHtGsVr.mp3 ct=14.22 playingEvents=0 rejected=none (1615 ms)
17. **S8 phone 390×844 — phone: bar next → 4 (new clip) · active cue narrates visible slide** (2026-10-01T03:00:24Z)  
   repro: see scenario  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: cue #4 (slide 3) vs visible 4; audio 19.19s; expected first cue #1
18. **S8 phone 390×844 — phone: bar next → 4 (new clip) · transcript highlight == on-screen slide** (2026-10-01T03:00:24Z)  
   repro: see scenario  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: highlighted sentence slide=3 cue=#4 (slide undefined) visible=4 transcript chars=363
19. **S9 Arabic / RTL — RTL: ArrowRight = previous → 6 · audio progressing** (2026-10-01T03:00:29Z)  
   repro: see scenario  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: currentTime 3.53 → 1
20. **S10 autoplay policy / persisted narration-on — blocked state is surfaced in the Guide bar ("tap to start")** (2026-10-01T03:00:32Z)  
   repro: persist narration-on, reload /#/5, look at the Guide bar before any click  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: data-blocked=null title="Ready · 02 Community model · Slide 5 of 39"
21. **S10 autoplay policy / persisted narration-on — first click unlocks and narration starts on the visible slide (5) · audio playing ≤1 s** (2026-10-01T03:00:33Z)  
   repro: click anywhere on the slide after the blocked state  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: paused=true src=guide-03-six-pillars-yxVqZJ2k1a.mp3 ct=0 playingEvents=0 rejected=none (1055 ms)
22. **S10 autoplay policy / persisted narration-on — first click unlocks and narration starts on the visible slide (5) · active cue narrates visible slide** (2026-10-01T03:00:34Z)  
   repro: click anywhere on the slide after the blocked state  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: cue #null (slide null) vs visible 5; audio 0s; expected first cue #1
23. **S10 autoplay policy / persisted narration-on — first click unlocks and narration starts on the visible slide (5) · transcript highlight == on-screen slide** (2026-10-01T03:00:34Z)  
   repro: click anywhere on the slide after the blocked state  
   expected: the Guide narrates the slide on screen (clip/cue per NAR-xx map, audio playing ≤1 s, caption/transcript matching)  
   actual: highlighted sentence slide=null cue=#null (slide undefined) visible=5 transcript chars=409
