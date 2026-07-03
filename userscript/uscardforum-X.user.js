// ==UserScript==
// @name         uscardforum-X
// @namespace    https://github.com/mskatoni/uscardforum-X
// @version      0.1.0
// @description  美卡论坛增强脚本：在 Discourse 用户卡中加入服务器端 Ignore 拉黑按钮，并支持 Tampermonkey 菜单开关。
// @author       mskatoni
// @match        https://www.uscardforum.com/*
// @match        https://uscardforum.com/*
// @match        https://forum-cdn.uscardforum.com/*
// @run-at       document-idle
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @license      CC-BY-NC-SA-4.0
// @homepageURL  https://github.com/mskatoni/uscardforum-X
// @supportURL   https://github.com/mskatoni/uscardforum-X/issues
// ==/UserScript==

(function () {
  "use strict";

  const EXPIRES_AT = "2099-12-31T00:00:00Z";
  const BTN_CLASS = "uscf-hard-ignore-button";
  const ROW_CLASS = "uscf-hard-ignore-row";
  const STORAGE_PREFIX = "uscfHardIgnore";
  const ENABLED_KEY = "enabled";

  function getSetting(key, fallback) {
    try {
      if (typeof GM_getValue === "function") return GM_getValue(key, fallback);
      const value = localStorage.getItem(`${STORAGE_PREFIX}:${key}`);
      return value === null ? fallback : JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function setSetting(key, value) {
    try {
      if (typeof GM_setValue === "function") {
        GM_setValue(key, value);
        return;
      }
      localStorage.setItem(`${STORAGE_PREFIX}:${key}`, JSON.stringify(value));
    } catch {
      // Ignore storage failures; the script will fall back to the default state.
    }
  }

  const enabled = getSetting(ENABLED_KEY, true);

  if (typeof GM_registerMenuCommand === "function") {
    GM_registerMenuCommand(enabled ? "关闭用户卡硬拉黑按钮" : "开启用户卡硬拉黑按钮", () => {
      setSetting(ENABLED_KEY, !enabled);
      window.location.reload();
    });
  }

  if (!enabled) return;

  const addStyle =
    typeof GM_addStyle === "function"
      ? GM_addStyle
      : (css) => {
          const style = document.createElement("style");
          style.textContent = css;
          document.head.appendChild(style);
        };

  addStyle(`
    .${ROW_CLASS} {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid var(--primary-low, #ddd);
    }
    .${BTN_CLASS} {
      appearance: none;
      border: 1px solid #c62828;
      border-radius: 4px;
      background: #d32f2f;
      color: #fff;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      line-height: 1.2;
      padding: 7px 10px;
    }
    .${BTN_CLASS}:hover {
      background: #b71c1c;
      border-color: #b71c1c;
    }
    .${BTN_CLASS}:disabled {
      cursor: default;
      opacity: 0.7;
    }
    .uscf-hard-ignore-status {
      color: var(--primary-medium, #777);
      font-size: 12px;
      line-height: 1.4;
    }
  `);

  function normalizeUsername(value) {
    return String(value || "")
      .trim()
      .replace(/^@/, "")
      .replace(/\/$/, "");
  }

  function getCsrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.content || "";
  }

  function usernameFromHref(href) {
    const match = String(href || "").match(/\/u\/([^/?#]+)/i);
    return match ? decodeURIComponent(match[1]) : "";
  }

  function getUsername(card) {
    const attrEl =
      card.matches?.("[data-user-card]") && card.getAttribute("data-user-card")
        ? card
        : card.querySelector("[data-user-card]");

    const fromAttr = normalizeUsername(attrEl?.getAttribute("data-user-card"));
    if (fromAttr) return fromAttr;

    const profileLink = card.querySelector('a[href^="/u/"], a[href*="uscardforum.com/u/"]');
    const fromHref = normalizeUsername(usernameFromHref(profileLink?.getAttribute("href")));
    if (fromHref) return fromHref;

    const usernameEl = card.querySelector(".username, .names .first, .names span");
    return normalizeUsername(usernameEl?.textContent);
  }

  function getInsertionPoint(card) {
    return (
      card.querySelector(".usercard-controls") ||
      card.querySelector(".card-content") ||
      card.querySelector(".user-card-content") ||
      card.querySelector(".details") ||
      card
    );
  }

  async function hardIgnore(username) {
    const csrf = getCsrfToken();
    if (!csrf) {
      throw new Error("没有找到 CSRF token，确认你已登录美卡论坛后刷新页面。");
    }

    const response = await fetch(`/u/${encodeURIComponent(username)}/notification_level.json`, {
      method: "PUT",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-CSRF-Token": csrf,
      },
      body: JSON.stringify({
        notification_level: "ignore",
        expiring_at: EXPIRES_AT,
      }),
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`${response.status}: ${text.slice(0, 240)}`);
    }
    return text;
  }

  function addButton(card) {
    if (!card) return;
    if (card.dataset.uscfHardIgnoreReady === "1" && card.querySelector(`.${ROW_CLASS}`)) return;

    const username = getUsername(card);
    if (!username || username.toLowerCase() === "system") return;

    const insertionPoint = getInsertionPoint(card);
    if (!insertionPoint || insertionPoint.querySelector(`.${ROW_CLASS}`)) return;

    const row = document.createElement(insertionPoint.tagName === "UL" ? "li" : "div");
    row.className = ROW_CLASS;

    const button = document.createElement("button");
    button.type = "button";
    button.className = BTN_CLASS;
    button.textContent = `拉黑 @${username}`;

    const status = document.createElement("span");
    status.className = "uscf-hard-ignore-status";
    status.textContent = "服务器端 Ignore";

    button.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      button.disabled = true;
      button.textContent = "拉黑中...";
      status.textContent = "";

      try {
        await hardIgnore(username);
        button.textContent = `已拉黑 @${username}`;
        status.textContent = "成功";
      } catch (error) {
        button.disabled = false;
        button.textContent = `拉黑 @${username}`;
        status.textContent = String(error.message || error);
      }
    });

    row.append(button, status);
    insertionPoint.appendChild(row);
    card.dataset.uscfHardIgnoreReady = "1";
  }

  function scan(root = document) {
    root.querySelectorAll?.(".user-card, .user-card.show, .user-card-content").forEach(addButton);
  }

  let timer = null;
  function scheduleScan(delay = 80) {
    clearTimeout(timer);
    timer = setTimeout(() => scan(), delay);
  }

  document.addEventListener(
    "click",
    (event) => {
      if (event.target.closest?.("[data-user-card], a[href^='/u/']")) {
        scheduleScan(180);
      }
    },
    true,
  );

  new MutationObserver(() => scheduleScan()).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  scan();
})();
