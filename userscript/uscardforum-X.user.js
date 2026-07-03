// ==UserScript==
// @name         uscardforum-X
// @namespace    https://github.com/mskatoni/uscardforum-X
// @version      0.2.1
// @description  美卡论坛增强脚本：用户卡服务器端拉黑、Discourse 信任等级升级差距原生统计增强，并支持 Tampermonkey 菜单分模块开关。
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
    styleReady: false,
    routeTimer: null,
    lastSummaryPath: "",
    lastSummaryRun: 0,
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
      },
    },
    labels: {
      days_visited: "访问天数",
      likes_given: "给出点赞",
      likes_received: "收到点赞",
      posts_count: "发帖/回复数",
      topics_entered: "进入话题",
      posts_read_count: "阅读帖子",
      replies_to_different_topics: "回复不同话题",
      time_read: "阅读时长",
    },
    summarySelectors: {
      days_visited: "li.stats-days-visited > div > span > span",
      likes_given: "li.stats-likes-given > a > div > span > span",
      likes_received: "li.stats-likes-received > div > span > span",
      posts_count: "li.stats-post-count > a > div > span > span",
      topics_entered: "li.stats-topics-entered > div > span > span",
      posts_read_count: "li.stats-posts-read > div > span > span",
      time_read: "li.stats-time-read > div > span",
    },

    init() {
      this.removeLegacyTrustLevelUi();
      this.installRouteWatcher();
      this.maybeEnhanceSummaryPage();
    },

    removeLegacyTrustLevelUi() {
      document.getElementById("uscf-tl-summary-panel")?.remove();
      document.getElementById("uscf-tl-panel")?.remove();
    },

    injectStyle() {
      if (this.styleReady) return;
      this.styleReady = true;
      addStyle(`
        .uscf-tl-native-ok {
          color: #2e8b57 !important;
        }
        .uscf-tl-native-missing {
          color: #c62828 !important;
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

    maybeEnhanceSummaryPage() {
      if (!this.isSummaryPage()) return;
      this.removeLegacyTrustLevelUi();
      const path = location.pathname + location.search;
      if (this.lastSummaryPath === path) return;
      this.lastSummaryPath = path;
      const username = this.getSummaryUsername();
      if (!username) return;
      this.injectStyle();
      const runId = Date.now();
      this.lastSummaryRun = runId;
      this.loadProgress(username)
        .then((result) => {
          if (this.lastSummaryRun !== runId) return;
          this.paintNativeSummaryStats(result);
        })
        .catch((error) => console.warn("[uscardforum-X] trust level summary enhance failed:", error));
    },

    paintNativeSummaryStats(result, retry = 0) {
      let painted = 0;
      for (const item of result.items) {
        const selector = this.summarySelectors[item.key];
        if (!selector) continue;
        const statNode = document.querySelector(selector);
        if (!statNode) continue;
        statNode.textContent = `${this.formatNativeValue(item.key, item.current)}/${this.formatNativeValue(item.key, item.need)}`;
        statNode.classList.remove("uscf-tl-native-ok", "uscf-tl-native-missing");
        statNode.classList.add(item.ok ? "uscf-tl-native-ok" : "uscf-tl-native-missing");
        statNode.title = [
          `@${result.username}`,
          `当前 TL${result.trustLevel}`,
          result.targetLevel,
          `${item.label}: ${this.formatValue(item.key, item.current)} / ${this.formatValue(item.key, item.need)}`,
          item.ok ? "已满足" : `还差 ${this.formatValue(item.key, item.missing)}`,
        ].join(" · ");
        painted += 1;
      }

      if (painted === 0 && retry < 10) {
        setTimeout(() => this.paintNativeSummaryStats(result, retry + 1), 350);
      }
    },

    formatNativeValue(key, value) {
      if (key === "time_read") {
        const minutes = Math.round(Number(value || 0) / 60);
        if (minutes < 60) return `${minutes}分钟`;
        const hours = Math.floor(minutes / 60);
        const rest = minutes % 60;
        return rest ? `${hours}小时${rest}分` : `${hours}小时`;
      }
      return String(Math.round(Number(value || 0)));
    },
  };

  if (hardIgnoreEnabled) {
    HardIgnoreModule.init();
  }

  if (trustLevelEnabled) {
    TrustLevelModule.init();
  }
})();
