/* Athar deck — OPTIONAL feature "originsFilm" (Muhammed Khalid impact-story film, Athar — Origins of Impact, Episode 01). NOT part of the shipped dist/ while
   pact-deck/features.json → originsFilm is false (v1.5.7 default). When true, scripts/v1.4.7/build.mjs copies this file to dist/js/exec-film.js, the assets/ folder next to
   it to dist/assets/exec/video/, and injects <script src="/js/exec-film.js"> before exec-team.js in dist/index.html. exec-team.js reads window.AtharExecFilm.
   Film: the 1080p master (burned-in English subtitles) trimmed at the closing end card — 896 frames / 37.333 s, H.264 High + AAC, faststart; out-point 37.3 s = last content frame.
   Master sha256 c7c200050a422d580426b9972e83335c0b0456d442df51c1604b482a3a43ab2a (not committed; in the media library). */
(function () {
  'use strict';
  var V = '/assets/exec/video/';
  window.AtharExecFilm = {
    mp4: V + 'athar-origins-of-impact-ep01-muhammed-khalid-1080p.mp4', poster: V + 'athar-origins-of-impact-ep01-poster-15s5.jpg',
    vttEn: V + 'athar-origins-of-impact-ep01.en.vtt', vttAr: V + 'athar-origins-of-impact-ep01.ar.vtt', inPt: 0, outPt: 37.3, w: 1920, h: 1080,
    bodyExtra: { en: 'His Athar impact story plays alongside this letter.', ar: 'وتُعرض قصة أثره إلى جانب هذه الرسالة.' },
    strings: {
      en: { title: "Athar — Origins of Impact, Episode 01: Muhammed Khalid", note: "Poster frame at 00:15.5 (the film has no text-free frame) · captions EN / AR · the narrated guide pauses while the film plays and resumes after it.", aria: "Impact story film: Athar — Origins of Impact, Episode 01, Muhammed Khalid" },
      ar: { title: "أثر — أصول الأثر، الحلقة 01: محمد خالد", note: "صورة الغلاف عند 00:15.5 (لا يتضمن الفيلم إطاراً خالياً من النصوص) · ترجمة إنجليزية / عربية · يتوقف الدليل الصوتي أثناء عرض الفيلم ويستأنف بعده.", aria: "فيلم قصة الأثر: أثر — أصول الأثر، الحلقة 01، محمد خالد" }
    }
  };
})();
