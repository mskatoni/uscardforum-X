// ==UserScript==
// @name         uscardforum-X
// @namespace    https://github.com/mskatoni/uscardforum-X
// @version      0.2.0
// @description  美卡论坛增强脚本：用户卡服务器端拉黑、Discourse 信任等级升级差距查询，并支持 Tampermonkey 菜单分模块开关。
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

  const FORUM_HOSTS = new Set(["www.uscardforum.com", "uscardforum.com"]);
  if (!FORUM_HOSTS.has(location.hostname)) return;

  const STORAGE_PREFIX = "uscardforumX";
  const SETTINGS = {
    hardIgnoreEnabled: "hardIgnore.enabled",
    trustLevelEnabled: "trustLevel.enabled",
  };

  function storageKey(key) {
    return `${STORAGE_PREFIX}:${key}`;
  }

  function getSetting(key, fallback) {
    try {
      if (typeof GM_getValue === "function") return GM_getValue(key, fallback);
      const value = localStorage.getItem(storageKey(key));
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
      localStorage.setItem(storageKey(key), JSON.stringify(value));
    } catch {
      // Storage can fail in restricted contexts. The default state will be used.
    }
  }

  function addStyle(css) {
    if (typeof GM_addStyle === "function") {
      GM_addStyle(css);
      return;
    }
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
  }

  function registerMenu(label, callback) {
    if (typeof GM_registerMenuCommand === "function") {
      GM_registerMenuCommand(label, callback);
    }
  }

  function registerToggle(labelWhenOn, labelWhenOff, key, currentValue) {
    registerMenu(currentValue ? labelWhenOn : labelWhenOff, () => {
      setSetting(key, !currentValue);
      window.location.reload();
    });
  }

  function normalizeUsername(value) {
    return String(value || "")
      .trim()
      .replace(/^@/, "")
      .replace(/\/$/, "");
  }

  function safeText(value) {
    return value == null ? "" : String(value);
  }

  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const [key, value] of Object.entries(attrs)) {
        if (value == null) continue;
        if (key === "class") node.className = value;
        else if (key === "text") node.textContent = safeText(value);
        else if (key === "style") node.style.cssText = value;
        else if (key.startsWith("on") && typeof value === "function") {
          node.addEventListener(key.slice(2).toLowerCase(), value);
        } else {
          node.setAttribute(key, safeText(value));
        }
      }
    }
    for (const child of children) {
      if (child == null) continue;
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    }
    return node;
  }

  const legacyHardIgnoreEnabled = getSetting("enabled", true);
  const hardIgnoreEnabled = getSetting(SETTINGS.hardIgnoreEnabled, legacyHardIgnoreEnabled);
  const trustLevelEnabled = getSetting(SETTINGS.trustLevelEnabled, true);

  registerToggle(
    "关闭用户卡硬拉黑按钮",
    "开启用户卡硬拉黑按钮",
    SETTINGS.hardIgnoreEnabled,
    hardIgnoreEnabled,
  );
  registerToggle(
    "关闭等级升级差距模块",
    "开启等级升级差距模块",
    SETTINGS.trustLevelEnabled,
    trustLevelEnabled,
  );

  function getCsrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.content || "";
  }

  const HardIgnoreModule = {
    expiresAt: "2099-12-31T00:00:00Z",
    buttonClass: "uscf-hard-ignore-button",
    rowClass: "uscf-hard-ignore-row",
    observer: null,
    timer: null,
    observerTimer: null,

    init() {
      this.injectStyle();
      document.addEventListener("click", this.onDocumentClick.bind(this), true);
    },

    injectStyle() {
      addStyle(`
        .${this.rowClass} {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid var(--primary-low, #ddd);
        }
        .${this.buttonClass} {
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
        .${this.buttonClass}:hover {
          background: #b71c1c;
          border-color: #b71c1c;
        }
        .${this.buttonClass}:disabled {
          cursor: default;
          opacity: 0.7;
        }
        .uscf-hard-ignore-status {
          color: var(--primary-medium, #777);
          font-size: 12px;
          line-height: 1.4;
        }
      `);
    },

    onDocumentClick(event) {
      if (!event.target.closest?.("[data-user-card], a[href^='/u/'], a[href*='uscardforum.com/u/']")) return;
      this.armShortObserver();
      [120, 320, 700].forEach((delay) => setTimeout(() => this.scan(), delay));
    },

    armShortObserver() {
      clearTimeout(this.observerTimer);
      if (!this.observer) {
        this.observer = new MutationObserver(() => this.scheduleScan(80));
        this.observer.observe(document.body || document.documentElement, {
          childList: true,
          subtree: true,
        });
      }
      this.observerTimer = setTimeout(() => {
        this.observer?.disconnect();
        this.observer = null;
      }, 5000);
    },

    scheduleScan(delay = 80) {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.scan(), delay);
    },

    scan(root = document) {
      root.querySelectorAll?.(".user-card, .user-card.show, .user-card-content").forEach((card) => {
        this.addButton(card);
      });
    },

    usernameFromHref(href) {
      const match = String(href || "").match(/\/u\/([^/?#]+)/i);
      return match ? decodeURIComponent(match[1]) : "";
    },

    getUsername(card) {
      const attrEl =
        card.matches?.("[data-user-card]") && card.getAttribute("data-user-card")
          ? card
          : card.querySelector("[data-user-card]");

      const fromAttr = normalizeUsername(attrEl?.getAttribute("data-user-card"));
      if (fromAttr) return fromAttr;

      const profileLink = card.querySelector('a[href^="/u/"], a[href*="uscardforum.com/u/"]');
      const fromHref = normalizeUsername(this.usernameFromHref(profileLink?.getAttribute("href")));
      if (fromHref) return fromHref;

      const usernameEl = card.querySelector(".username, .names .first, .names span");
      return normalizeUsername(usernameEl?.textContent);
    },

    getInsertionPoint(card) {
      return (
        card.querySelector(".usercard-controls") ||
        card.querySelector(".card-content") ||
        card.querySelector(".user-card-content") ||
        card.querySelector(".details") ||
        card
      );
    },

    async hardIgnore(username) {
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
          expiring_at: this.expiresAt,
        }),
      });

      const text = await response.text();
      if (!response.ok) {
        throw new Error(`${response.status}: ${text.slice(0, 240)}`);
      }
      return text;
    },

    addButton(card) {
      if (!card) return;
      if (card.dataset.uscfHardIgnoreReady === "1" && card.querySelector(`.${this.rowClass}`)) return;

      const username = this.getUsername(card);
      if (!username || username.toLowerCase() === "system") return;

      const insertionPoint = this.getInsertionPoint(card);
      if (!insertionPoint || insertionPoint.querySelector(`.${this.rowClass}`)) return;

      const row = document.createElement(insertionPoint.tagName === "UL" ? "li" : "div");
      row.className = this.rowClass;

      const button = el("button", {
        type: "button",
        class: this.buttonClass,
        text: `拉黑 @${username}`,
      });
      const status = el("span", {
        class: "uscf-hard-ignore-status",
        text: "服务器端 Ignore",
      });

      button.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();

        button.disabled = true;
        button.textContent = "拉黑中...";
        status.textContent = "";

        try {
          await this.hardIgnore(username);
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
    },
  };

  const TrustLevelModule = {
    panelId: "uscf-tl-panel",
    summaryPanelId: "uscf-tl-summary-panel",
    styleReady: false,
    routeTimer: null,
    lastSummaryPath: "",
    hiddenPeriodDays: 100,
    requirements: {
      0: {
        topics_entered: 5,
        posts_read_count: 30,
        time_read: 600,
      },
      1: {
        days_visited: 15,
        likes_given: 1,
        likes_received: 1,
        posts_count: 3,
        topics_entered: 20,
        posts_read_count: 100,
        time_read: 3600,
        replies_to_different_topics: 3,
      },
      2: {
        days_visited: 50,
        likes_given: 30,
        likes_received: 20,
        posts_count: 10,
        posts_read_count: 20000,
        topics_entered: 500,
        likes_received_users: 5,
        likes_received_days: 7,
        topics_replied_to: 10,
      },
    },
    labels: {
      days_visited: "访问天数",
      likes_given: "给出点赞",
      likes_received: "收到点赞",
      likes_received_users: "获赞用户数",
      likes_received_days: "获赞分布天数",
      posts_count: "发帖/回复数",
      topics_entered: "进入话题",
      posts_read_count: "阅读帖子",
      replies_to_different_topics: "回复不同话题",
      topics_replied_to: "回复不同话题",
      time_read: "阅读时长",
    },
    summarySelectors: {
      days_visited: "li.stats-days-visited > div > span > span",
      likes_given: "li.stats-likes-given > a > div > span > span",
      likes_received: "li.stats-likes-received > div > span > span",
      posts_count: "li.stats-posts-count > a > div > span > span",
      topics_entered: "li.stats-topics-entered > div > span > span",
      posts_read_count: "li.stats-posts-read > div > span > span",
      time_read: "li.stats-time-read > div > span",
    },
    hiddenKeys: new Set(["likes_received_users", "likes_received_days", "topics_replied_to"]),

    init() {
      registerMenu("查看等级升级差距", () => this.showCurrentUserPanel());
      this.installRouteWatcher();
      this.maybeEnhanceSummaryPage();
    },

    injectStyle() {
      if (this.styleReady) return;
      this.styleReady = true;
      addStyle(`
        .uscf-tl-overlay {
          position: fixed;
          inset: 0;
          z-index: 99990;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.35);
        }
        .uscf-tl-modal,
        .uscf-tl-summary {
          box-sizing: border-box;
          color: var(--primary, #1f2937);
          background: var(--secondary, #fff);
          border: 1px solid var(--primary-low, #ddd);
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.20);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .uscf-tl-modal {
          width: min(720px, calc(100vw - 32px));
          max-height: calc(100vh - 48px);
          overflow: auto;
          border-radius: 8px;
        }
        .uscf-tl-summary {
          margin: 14px 0;
          padding: 14px;
          border-radius: 6px;
          box-shadow: none;
        }
        .uscf-tl-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 16px;
          border-bottom: 1px solid var(--primary-low, #ddd);
        }
        .uscf-tl-title {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }
        .uscf-tl-title strong {
          font-size: 15px;
          line-height: 1.25;
        }
        .uscf-tl-title span,
        .uscf-tl-note {
          color: var(--primary-medium, #6b7280);
          font-size: 12px;
          line-height: 1.45;
        }
        .uscf-tl-close,
        .uscf-tl-refresh {
          appearance: none;
          border: 1px solid var(--primary-low, #ddd);
          border-radius: 4px;
          background: var(--secondary, #fff);
          color: var(--primary, #1f2937);
          cursor: pointer;
          font-size: 13px;
          line-height: 1.2;
          padding: 6px 9px;
        }
        .uscf-tl-close:hover,
        .uscf-tl-refresh:hover {
          background: var(--primary-very-low, #f4f4f5);
        }
        .uscf-tl-body {
          padding: 14px 16px 16px;
        }
        .uscf-tl-progress {
          height: 8px;
          overflow: hidden;
          border-radius: 999px;
          background: var(--primary-low, #e5e7eb);
          margin: 8px 0 12px;
        }
        .uscf-tl-progress-fill {
          height: 100%;
          min-width: 2px;
          background: #2e8b57;
          transition: width 0.2s ease;
        }
        .uscf-tl-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 8px;
        }
        .uscf-tl-item {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px;
          align-items: center;
          border: 1px solid var(--primary-low, #ddd);
          border-radius: 6px;
          padding: 8px 10px;
          background: var(--primary-very-low, #fafafa);
        }
        .uscf-tl-item-ok {
          border-color: rgba(46, 139, 87, 0.42);
        }
        .uscf-tl-item-missing {
          border-color: rgba(198, 40, 40, 0.35);
        }
        .uscf-tl-label {
          display: flex;
          align-items: center;
          gap: 5px;
          min-width: 0;
          font-size: 13px;
          font-weight: 600;
        }
        .uscf-tl-hidden-mark {
          color: #b26a00;
          font-size: 12px;
        }
        .uscf-tl-value {
          color: var(--primary-medium, #6b7280);
          font-size: 12px;
          text-align: right;
          white-space: nowrap;
        }
        .uscf-tl-ok {
          color: #2e8b57;
          font-weight: 700;
        }
        .uscf-tl-missing {
          color: #c62828;
          font-weight: 700;
        }
        .uscf-tl-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 12px;
        }
        .uscf-tl-error {
          color: #c62828;
          font-size: 13px;
          white-space: pre-wrap;
        }
        .uscf-tl-inline-loading {
          color: var(--primary-medium, #6b7280);
          font-size: 13px;
        }
      `);
    },

    installRouteWatcher() {
      const check = () => {
        clearTimeout(this.routeTimer);
        this.routeTimer = setTimeout(() => this.maybeEnhanceSummaryPage(), 180);
      };

      if ("onurlchange" in window) {
        window.addEventListener("urlchange", check);
        return;
      }

      const pushState = history.pushState;
      const replaceState = history.replaceState;
      history.pushState = function (...args) {
        const result = pushState.apply(this, args);
        check();
        return result;
      };
      history.replaceState = function (...args) {
        const result = replaceState.apply(this, args);
        check();
        return result;
      };
      window.addEventListener("popstate", check);
    },

    isSummaryPage() {
      return /\/u\/[^/?#]+\/summary(?:[/?#]|$)/i.test(location.pathname + location.search);
    },

    getSummaryUsername() {
      const match = location.pathname.match(/\/u\/([^/?#]+)\/summary/i);
      return match ? normalizeUsername(decodeURIComponent(match[1])) : "";
    },

    getApiBase() {
      return location.origin;
    },

    async fetchJson(path) {
      const response = await fetch(path, {
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`${response.status}: ${text.slice(0, 180) || response.statusText}`);
      }
      return response.json();
    },

    async getCurrentUsername() {
      const fromMeta = normalizeUsername(document.querySelector('meta[name="current-user-username"]')?.content);
      if (fromMeta) return fromMeta;

      const session = await this.fetchJson(`${this.getApiBase()}/session/current.json`);
      return normalizeUsername(session?.current_user?.username);
    },

    async fetchSiteStats() {
      const data = await this.fetchJson(`${this.getApiBase()}/about.json`);
      return data?.about?.stats || {};
    },

    async fetchUserSummary(username) {
      const data = await this.fetchJson(`${this.getApiBase()}/u/${encodeURIComponent(username)}/summary.json`);
      return {
        stats: data?.user_summary || {},
        trustLevel: Number(data?.users?.[0]?.trust_level ?? 0),
      };
    },

    async fetchDirectoryStats(username) {
      const encoded = encodeURIComponent(username);
      const data = await this.fetchJson(
        `${this.getApiBase()}/directory_items?period=quarterly&order=days_visited&name=${encoded}`,
      );
      const items = data?.directory_items || [];
      const target = username.toLowerCase();
      return (
        items.find((item) => normalizeUsername(item?.user?.username).toLowerCase() === target) ||
        items[0] ||
        null
      );
    },

    async fetchAllActions(username, filter, sinceTs) {
      const pageSize = 30;
      const maxPages = 60;
      const out = [];
      for (let page = 0; page < maxPages; page += 1) {
        const offset = page * pageSize;
        const data = await this.fetchJson(
          `${this.getApiBase()}/user_actions.json?username=${encodeURIComponent(username)}&filter=${filter}&offset=${offset}&limit=${pageSize}`,
        );
        const actions = data?.user_actions || [];
        if (!actions.length) break;

        let hitCutoff = false;
        for (const action of actions) {
          if (Date.parse(action.created_at) < sinceTs) {
            hitCutoff = true;
            break;
          }
          out.push(action);
        }

        if (hitCutoff || actions.length < pageSize) break;
      }
      return out;
    },

    async fetchHiddenStats(username) {
      const sinceTs = Date.now() - this.hiddenPeriodDays * 86400000;
      const [likesReceived, replies] = await Promise.all([
        this.fetchAllActions(username, 2, sinceTs),
        this.fetchAllActions(username, 5, sinceTs),
      ]);
      return {
        likes_received_users: new Set(likesReceived.map((action) => action.acting_username).filter(Boolean)).size,
        likes_received_days: new Set(likesReceived.map((action) => safeText(action.created_at).slice(0, 10))).size,
        topics_replied_to: new Set(replies.map((action) => action.topic_id).filter(Boolean)).size,
      };
    },

    cloneRequirements(tierIndex, siteStats) {
      const req = { ...(this.requirements[tierIndex] || this.requirements[0]) };
      if (tierIndex === 2) {
        const posts30 = Number(siteStats.posts_30_days);
        const topics30 = Number(siteStats.topics_30_days);
        req.posts_read_count = Number.isFinite(posts30) && posts30 > 0 ? Math.min(Math.floor(posts30 / 4), 20000) : 20000;
        req.topics_entered = Number.isFinite(topics30) && topics30 > 0 ? Math.min(Math.floor(topics30 / 4), 500) : 500;
      }
      return req;
    },

    mergeStats(summaryStats, directoryItem) {
      const stats = { ...summaryStats };
      if (directoryItem) {
        const pairs = [
          ["days_visited", directoryItem.days_visited],
          ["likes_given", directoryItem.likes_given],
          ["likes_received", directoryItem.likes_received],
          ["posts_count", directoryItem.post_count],
          ["topics_entered", directoryItem.topics_entered],
          ["posts_read_count", directoryItem.posts_read],
        ];
        for (const [key, value] of pairs) {
          if (value != null) stats[key] = value;
        }
      }
      return stats;
    },

    async loadProgress(username) {
      const [siteStats, summary, directoryItem] = await Promise.all([
        this.fetchSiteStats(),
        this.fetchUserSummary(username),
        this.fetchDirectoryStats(username).catch(() => null),
      ]);

      const trustLevel = Number(directoryItem?.user?.trust_level ?? summary.trustLevel ?? 0);
      const isMaintain = trustLevel >= 3;
      const tierIndex = isMaintain ? 2 : Math.max(0, Math.min(trustLevel, 2));
      const targetLevel = isMaintain ? "保级 TL3 / 白金会员" : `升级到 TL${trustLevel + 1}`;
      const requirements = this.cloneRequirements(tierIndex, siteStats);
      const stats = this.mergeStats(summary.stats, directoryItem);
      let hiddenError = "";

      if (tierIndex === 2) {
        try {
          Object.assign(stats, await this.fetchHiddenStats(username));
        } catch (error) {
          hiddenError = String(error.message || error);
        }
      }

      const items = Object.entries(requirements).map(([key, need]) => {
        const current = Number(stats[key] ?? 0);
        const ok = current >= Number(need);
        return {
          key,
          label: this.labels[key] || key.replace(/_/g, " "),
          current,
          need: Number(need),
          ok,
          missing: ok ? 0 : Number(need) - current,
          hidden: this.hiddenKeys.has(key),
        };
      });

      const done = items.filter((item) => item.ok).length;
      const percent = items.length ? Math.round((done / items.length) * 100) : 0;

      return {
        username,
        trustLevel,
        targetLevel,
        isMaintain,
        tierIndex,
        items,
        done,
        total: items.length,
        percent,
        hiddenError,
      };
    },

    formatValue(key, value) {
      if (key === "time_read") {
        const minutes = Math.round(Number(value || 0) / 60);
        if (minutes < 60) return `${minutes} 分钟`;
        const hours = Math.floor(minutes / 60);
        const rest = minutes % 60;
        return rest ? `${hours} 小时 ${rest} 分钟` : `${hours} 小时`;
      }
      return String(Math.round(Number(value || 0)));
    },

    renderItems(result) {
      return el(
        "div",
        { class: "uscf-tl-grid" },
        ...result.items.map((item) => {
          const label = el("span", { class: "uscf-tl-label" }, item.label);
          if (item.hidden) {
            label.appendChild(el("span", { class: "uscf-tl-hidden-mark", title: "公开文档未完整说明的 Discourse 条件" }, "*"));
          }
          const valueText = item.ok
            ? `${this.formatValue(item.key, item.current)} / ${this.formatValue(item.key, item.need)}`
            : `${this.formatValue(item.key, item.current)} / ${this.formatValue(item.key, item.need)}，还差 ${this.formatValue(item.key, item.missing)}`;
          return el(
            "div",
            { class: `uscf-tl-item ${item.ok ? "uscf-tl-item-ok" : "uscf-tl-item-missing"}` },
            label,
            el("span", { class: `uscf-tl-value ${item.ok ? "uscf-tl-ok" : "uscf-tl-missing"}`, text: valueText }),
          );
        }),
      );
    },

    renderProgress(result) {
      return el(
        "div",
        { class: "uscf-tl-progress", title: `${result.done}/${result.total}` },
        el("div", {
          class: "uscf-tl-progress-fill",
          style: `width: ${Math.max(2, result.percent)}%;`,
        }),
      );
    },

    renderNote(result) {
      const missing = result.total - result.done;
      const parts = [
        missing === 0 ? "当前公开指标已满足。" : `还有 ${missing} 项未满足。`,
        "TL3 / 白金相关统计为近似估算，部分隐藏条件受公开 API 限制。",
      ];
      if (result.hiddenError) {
        parts.push(`隐藏项查询失败：${result.hiddenError}`);
      }
      return el("div", { class: "uscf-tl-note", text: parts.join(" ") });
    },

    async showCurrentUserPanel() {
      this.injectStyle();
      const overlay = el(
        "div",
        {
          id: this.panelId,
          class: "uscf-tl-overlay",
          onclick: (event) => {
            if (event.target.id === this.panelId) overlay.remove();
          },
        },
        el(
          "section",
          { class: "uscf-tl-modal" },
          el(
            "div",
            { class: "uscf-tl-header" },
            el("div", { class: "uscf-tl-title" }, el("strong", { text: "等级升级差距" }), el("span", { text: "正在读取当前账号数据..." })),
            el("button", { class: "uscf-tl-close", type: "button", text: "关闭", onclick: () => overlay.remove() }),
          ),
          el("div", { class: "uscf-tl-body" }, el("div", { class: "uscf-tl-inline-loading", text: "Loading..." })),
        ),
      );

      document.getElementById(this.panelId)?.remove();
      document.body.appendChild(overlay);

      try {
        const username = await this.getCurrentUsername();
        if (!username) throw new Error("未检测到登录账号。");
        const result = await this.loadProgress(username);
        this.renderModalResult(overlay, result);
      } catch (error) {
        this.renderModalError(overlay, error);
      }
    },

    renderModalResult(overlay, result) {
      overlay.textContent = "";
      overlay.appendChild(
        el(
          "section",
          { class: "uscf-tl-modal" },
          el(
            "div",
            { class: "uscf-tl-header" },
            el(
              "div",
              { class: "uscf-tl-title" },
              el("strong", { text: `@${result.username}：${result.targetLevel}` }),
              el("span", { text: `当前 TL${result.trustLevel}，完成 ${result.done}/${result.total} 项` }),
            ),
            el("button", { class: "uscf-tl-close", type: "button", text: "关闭", onclick: () => overlay.remove() }),
          ),
          el(
            "div",
            { class: "uscf-tl-body" },
            this.renderProgress(result),
            this.renderItems(result),
            this.renderNote(result),
            el(
              "div",
              { class: "uscf-tl-actions" },
              el("button", {
                class: "uscf-tl-refresh",
                type: "button",
                text: "刷新",
                onclick: () => this.showCurrentUserPanel(),
              }),
            ),
          ),
        ),
      );
    },

    renderModalError(overlay, error) {
      const message = String(error.message || error);
      const body = overlay.querySelector(".uscf-tl-body");
      if (body) {
        body.textContent = "";
        body.appendChild(el("div", { class: "uscf-tl-error", text: message }));
      }
    },

    maybeEnhanceSummaryPage() {
      if (!this.isSummaryPage()) return;
      const path = location.pathname + location.search;
      if (this.lastSummaryPath === path && document.getElementById(this.summaryPanelId)) return;
      this.lastSummaryPath = path;
      const username = this.getSummaryUsername();
      if (!username) return;
      this.injectStyle();
      this.renderSummaryLoading(username);
      this.loadProgress(username)
        .then((result) => {
          this.renderSummaryResult(result);
          this.paintNativeSummaryStats(result);
        })
        .catch((error) => this.renderSummaryError(error));
    },

    getSummaryMount() {
      return (
        document.querySelector(".user-main .about") ||
        document.querySelector(".user-content") ||
        document.querySelector(".user-main") ||
        document.querySelector("#main-outlet") ||
        document.body
      );
    },

    renderSummaryLoading(username) {
      document.getElementById(this.summaryPanelId)?.remove();
      const panel = el(
        "section",
        { id: this.summaryPanelId, class: "uscf-tl-summary" },
        el("div", { class: "uscf-tl-title" }, el("strong", { text: `@${username} 等级升级差距` })),
        el("div", { class: "uscf-tl-inline-loading", text: "正在读取 Discourse 统计..." }),
      );
      this.getSummaryMount().prepend(panel);
    },

    renderSummaryResult(result) {
      const panel = document.getElementById(this.summaryPanelId);
      if (!panel) return;
      panel.textContent = "";
      panel.append(
        el(
          "div",
          { class: "uscf-tl-header", style: "padding: 0 0 10px; border-bottom: 0;" },
          el(
            "div",
            { class: "uscf-tl-title" },
            el("strong", { text: `@${result.username}：${result.targetLevel}` }),
            el("span", { text: `当前 TL${result.trustLevel}，完成 ${result.done}/${result.total} 项` }),
          ),
          el("button", {
            class: "uscf-tl-refresh",
            type: "button",
            text: "刷新",
            onclick: () => {
              this.lastSummaryPath = "";
              this.maybeEnhanceSummaryPage();
            },
          }),
        ),
        this.renderProgress(result),
        this.renderItems(result),
        this.renderNote(result),
      );
    },

    renderSummaryError(error) {
      const panel = document.getElementById(this.summaryPanelId);
      if (!panel) return;
      panel.textContent = "";
      panel.appendChild(el("div", { class: "uscf-tl-error", text: String(error.message || error) }));
    },

    paintNativeSummaryStats(result) {
      for (const item of result.items) {
        const selector = this.summarySelectors[item.key];
        if (!selector) continue;
        const statNode = document.querySelector(selector);
        if (!statNode) continue;
        statNode.textContent = `${this.formatValue(item.key, item.current)} / ${this.formatValue(item.key, item.need)}`;
        statNode.style.color = item.ok ? "#2e8b57" : "#c62828";
      }
    },
  };

  if (hardIgnoreEnabled) {
    HardIgnoreModule.init();
  }

  if (trustLevelEnabled) {
    TrustLevelModule.init();
  }
})();
