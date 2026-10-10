// ==================================================================
//  referrer.js — contextual greeting based on where the visitor came from
//  Uses document.referrer + localStorage to greet the visitor.
// ==================================================================

(function () {
  "use strict";

  // не запускаемся, если терминала ещё нет
  function waitForTerminal(cb) {
    if (document.getElementById("log") && typeof window.log === "function") {
      cb();
    } else {
      setTimeout(() => waitForTerminal(cb), 200);
    }
  }

  // ---------- ПОДГОТОВКА ----------
  function getReferrerInfo() {
    const raw = document.referrer || "";
    let host = "";
    try {
      const u = new URL(raw);
      host = u.hostname.toLowerCase();
    } catch (e) {
      host = "";
    }
    return { raw, host };
  }

  // ---------- ОПРЕДЕЛЕНИЕ ИСТОЧНИКА ----------
  function classifySource(host) {
    if (!host) return "direct";

    if (host.includes("youtube.") || host.includes("youtu.be")) return "youtube";
    if (host.includes("google."))    return "google";
    if (host.includes("discord."))   return "discord";
    if (host.includes("t.me") || host.includes("telegram.")) return "telegram";
    if (host.includes("vk.com"))     return "vk";
    if (host.includes("twitter.") || host.includes("x.com")) return "twitter";
    if (host.includes("reddit."))    return "reddit";
    if (host.includes("github."))    return "github";
    if (host.includes("bing."))      return "bing";
    if (host.includes("duckduckgo."))return "duckduckgo";
    if (host.includes("facebook.") || host.includes("fb.")) return "facebook";
    if (host.includes("pinterest.")) return "pinterest";
    if (host.includes("tiktok."))    return "tiktok";
    if (host.includes("soundcloud."))return "soundcloud";
    if (host.includes("bandcamp."))  return "bandcamp";
    if (host.includes("spotify."))   return "spotify";
    if (host.includes("punchdrunk")) return "internal"; // переходы внутри сайта
    return "unknown";
  }

  // ---------- СООБЩЕНИЯ ПО ИСТОЧНИКУ ----------
  const MESSAGES = {
    youtube: [
      "we saw you watching.",
      "you came from the videos.",
      "you watched the tape. now you are inside it."
    ],
    google: [
      "searching for us?",
      "we were already here.",
      "you did not find us. we found you."
    ],
    discord: [
      "you came from the group.",
      "which one of them sent you?",
      "someone shared this link. do you know who?"
    ],
    telegram: [
      "you came from the channel.",
      "messages forwarded. signal received.",
      "the channel was never meant for this."
    ],
    vk: [
      "you came from the wall.",
      "the post is still there. for now."
    ],
    twitter: [
      "you came from the timeline.",
      "the post was deleted. but the link survives."
    ],
    reddit: [
      "you came from the thread.",
      "they told you not to click. you clicked."
    ],
    github: [
      "you came from the source.",
      "you read the code. now you know too much."
    ],
    bing: [
      "bing found us?",
      "so did you."
    ],
    duckduckgo: [
      "privacy search. still tracked.",
      "you came from duckduckgo. we still see you."
    ],
    facebook: [
      "you came from the feed.",
      "the algorithm is our ally now."
    ],
    pinterest: [
      "you came from the pins.",
      "this is not a recipe."
    ],
    tiktok: [
      "you came from the short videos.",
      "the videos were longer once."
    ],
    soundcloud: [
      "you came from the tracks.",
      "the tracks were never supposed to be public."
    ],
    bandcamp: [
      "you came from the album.",
      "there is no album. only signal."
    ],
    spotify: [
      "you came from the playlist.",
      "the playlist was curated by them."
    ],
    internal: [
      "you came from another page.",
      "you are still inside."
    ],
    direct: [
      "you came directly. good.",
      "no referrer. no trail. you are careful.",
      "you typed the address. or it was typed for you."
    ],
    unknown: [
      "your origin is masked.",
      "we cannot trace you. interesting.",
      "you came from nowhere. or somewhere you do not remember."
    ]
  };

  // ---------- ПЕРСОНАЛИЗАЦИЯ ----------
  function fillPlaceholders(text) {
    const subject = (typeof window.getSubjectId === "function")
      ? window.getSubjectId()
      : (localStorage.getItem("subject_id") || "SUBJECT_????-????");
    return text
      .replace(/\{SUBJECT\}/g, subject)
      .replace(/\{TIME\}/g, new Date().toLocaleTimeString())
      .replace(/\{DATE\}/g, new Date().toLocaleDateString());
  }

  // ---------- ПЕЧАТЬ СООБЩЕНИЯ ----------
  function printReferrerMessage() {
    waitForTerminal(() => {
      const { host } = getReferrerInfo();
      const source = classifySource(host);

      // кулдаун: не чаще раза в 5 минут
      const lastTime = parseInt(sessionStorage.getItem("last_ref_msg") || "0", 10);
      const now = Date.now();
      if (now - lastTime < 5 * 60 * 1000) return;
      sessionStorage.setItem("last_ref_msg", now.toString());

      const pool = MESSAGES[source] || MESSAGES.unknown;
      const text = fillPlaceholders(pool[Math.floor(Math.random() * pool.length)]);

      // первое сообщение через 3 секунды после загрузки
      setTimeout(() => {
        if (typeof window.log === "function") {
          window.log(text, "whisper");
        }
      }, 3000);

      // сохраняем источник для статистики (можно использовать позже)
      localStorage.setItem("last_referrer_source", source);

      // иногда — второй шёпот через 8 секунд
      if (Math.random() < 0.5) {
        setTimeout(() => {
          const pool2 = MESSAGES[source] || MESSAGES.unknown;
          let second = pool2[Math.floor(Math.random() * pool2.length)];
          // не повторяем то же самое
          if (second === text) second = pool2[(pool2.indexOf(second) + 1) % pool2.length];
          if (typeof window.log === "function") {
            window.log(fillPlaceholders(second), "whisper");
          }
        }, 8000);
      }
    });
  }

  // ---------- ЗАПУСК ----------
  // ждём загрузки страницы
  if (document.readyState === "complete" || document.readyState === "interactive") {
    printReferrerMessage();
  } else {
    document.addEventListener("DOMContentLoaded", printReferrerMessage);
  }

  // экспорт для отладки
  window._referrerInfo = () => {
    const { raw, host } = getReferrerInfo();
    return { raw, host, source: classifySource(host) };
  };
})();
