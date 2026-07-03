// ==UserScript==
// @name         uscardforum-X
// @name:zh-CN   美卡论坛 X
// @namespace    https://github.com/mskatoni/uscardforum-X
// @version      0.4.1
// @description  美卡论坛增强脚本：用户卡服务器端拉黑、等级升级差距、Cloudflare Challenge 触发、自动阅读、中英文脚本面板切换。
// @description:en  US Card Forum enhancer: server-side user ignore, Trust Level gap, Cloudflare Challenge helper, Auto Read, and bilingual script menu.
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
    autoReadEnabled: "autoRead.enabled",
    language: "ui.language",
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

  function toggleLabel(label, enabled) {
    return enabled ? `✅ ${label}` : label;
  }

  function registerToggle(label, key, currentValue) {
    registerMenu(toggleLabel(label, currentValue), () => {
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

  const TEXTS = {
    zh: {
      localeMenu: "中文面板",
      hardIgnoreMenu: "拉黑用户",
      trustLevelMenu: "下一级距离",
      challengeMenu: "Cloudflare盾",
      autoReadMenu: "自动阅读",
      alreadyOnChallenge: "已在 Cloudflare Challenge 页面，无需重复跳转。",
      hardIgnoreButton: (username) => `拉黑 @${username}`,
      hardIgnoring: "拉黑中...",
      hardIgnored: (username) => `已拉黑 @${username}`,
      hardIgnoreStatus: "服务器端 Ignore",
      noCsrf: "没有找到 CSRF token，确认你已登录美卡论坛后刷新页面。",
      targetMaintainTl3: "保级 TL3 / 白金会员",
      targetNextLevel: (level) => `升级到 TL${level}`,
      currentTl: (level) => `当前 TL${level}`,
      hiddenRequirement: "隐藏条件",
      satisfied: "已满足",
      missing: (value) => `还差 ${value}`,
      compactMissing: (value) => `，差${value}`,
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
      minutes: "分钟",
      hours: "小时",
      minutesShort: "分",
    },
    en: {
      localeMenu: "English Panel",
      hardIgnoreMenu: "Block Users",
      trustLevelMenu: "Next-Level Gap",
      challengeMenu: "Cloudflare Shield",
      autoReadMenu: "Auto Read",
      alreadyOnChallenge: "Already on the Cloudflare Challenge page.",
      hardIgnoreButton: (username) => `Ignore @${username}`,
      hardIgnoring: "Ignoring...",
      hardIgnored: (username) => `Ignored @${username}`,
      hardIgnoreStatus: "Server-side Ignore",
      noCsrf: "CSRF token not found. Make sure you are logged in and refresh the page.",
      targetMaintainTl3: "Maintain TL3",
      targetNextLevel: (level) => `Upgrade to TL${level}`,
      currentTl: (level) => `Current TL${level}`,
      hiddenRequirement: "Hidden requirement",
      satisfied: "Satisfied",
      missing: (value) => `missing ${value}`,
      compactMissing: (value) => `, -${value}`,
      labels: {
        days_visited: "Days Visited",
        likes_given: "Likes Given",
        likes_received: "Likes Received",
        likes_received_users: "Unique Likers",
        likes_received_days: "Like Days",
        posts_count: "Posts",
        topics_entered: "Topics Viewed",
        posts_read_count: "Posts Read",
        replies_to_different_topics: "Topics Replied",
        topics_replied_to: "Topics Replied",
        time_read: "Read Time",
      },
      minutes: "min",
      hours: "h",
      minutesShort: "m",
    },
  };

  const legacyHardIgnoreEnabled = getSetting("enabled", true);
  const hardIgnoreEnabled = getSetting(SETTINGS.hardIgnoreEnabled, legacyHardIgnoreEnabled);
  const trustLevelEnabled = getSetting(SETTINGS.trustLevelEnabled, true);
  const autoReadEnabled = getSetting(SETTINGS.autoReadEnabled, false);
  const language = getSetting(SETTINGS.language, "zh") === "en" ? "en" : "zh";
  const T = TEXTS[language];

  registerToggle(T.hardIgnoreMenu, SETTINGS.hardIgnoreEnabled, hardIgnoreEnabled);
  registerToggle(T.trustLevelMenu, SETTINGS.trustLevelEnabled, trustLevelEnabled);
  registerMenu(T.challengeMenu, () => ChallengeModule.forceChallenge());
  registerToggle(T.autoReadMenu, SETTINGS.autoReadEnabled, autoReadEnabled);
  registerMenu(toggleLabel(T.localeMenu, true), () => {
    setSetting(SETTINGS.language, language === "zh" ? "en" : "zh");
    window.location.reload();
  });

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
        throw new Error(T.noCsrf);
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
        text: T.hardIgnoreButton(username),
      });
      const status = el("span", {
        class: "uscf-hard-ignore-status",
        text: T.hardIgnoreStatus,
      });

      button.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();

        button.disabled = true;
        button.textContent = T.hardIgnoring;
        status.textContent = "";

        try {
          await this.hardIgnore(username);
          button.textContent = T.hardIgnored(username);
          status.textContent = T.satisfied;
        } catch (error) {
          button.disabled = false;
          button.textContent = T.hardIgnoreButton(username);
          status.textContent = String(error.message || error);
        }
      });

      row.append(button, status);
      insertionPoint.appendChild(row);
      card.dataset.uscfHardIgnoreReady = "1";
    },
  };

  const ChallengeModule = {
    challengePath: "/challenge",
    notFoundGuardKey: `${STORAGE_PREFIX}:challenge.notFoundGuardTs`,
    observer: null,
    observerTimer: null,
    dialogSelectors: [".dialog-body", ".modal-body", ".d-modal__body"],
    errorTexts: [
      "403 error",
      "该回应是很久以前创建的",
      "reaction was created too long ago",
      "我们无法加载该话题",
      "You are not allowed to react",
    ],

    init() {
      if (this.isChallengePage()) {
        if (this.isNotFoundPage()) {
          this.redirectFromNotFoundPage();
        }
        return;
      }
      if (this.checkAndRedirect()) return;
      this.startObserver();
    },

    isChallengePage() {
      return location.pathname.startsWith(this.challengePath);
    },

    isNotFoundPage() {
      return Boolean(document.querySelector(".page-not-found"));
    },

    getRedirectParamUrl() {
      try {
        const raw = new URLSearchParams(location.search).get("redirect");
        if (!raw) return "";
        const url = new URL(raw, location.origin);
        return url.origin === location.origin ? url.href : "";
      } catch {
        return "";
      }
    },

    getNotFoundGuardTs() {
      try {
        const raw = sessionStorage.getItem(this.notFoundGuardKey);
        const value = raw ? Number(raw) : 0;
        return Number.isFinite(value) ? value : 0;
      } catch {
        return 0;
      }
    },

    setNotFoundGuardTs(value) {
      try {
        sessionStorage.setItem(this.notFoundGuardKey, String(value));
      } catch {
        // Ignore sessionStorage failures; the redirect still works without guard persistence.
      }
    },

    redirectFromNotFoundPage() {
      const fallback = `${location.origin}/`;
      const target = this.getRedirectParamUrl() || fallback;
      const now = Date.now();
      const guardTs = this.getNotFoundGuardTs();
      if (guardTs && now - guardTs < 5000) return;
      this.setNotFoundGuardTs(now);
      location.replace(target === location.href ? fallback : target);
    },

    getDialogText() {
      return this.dialogSelectors
        .flatMap((selector) => Array.from(document.querySelectorAll(selector)))
        .map((node) => node.textContent || "")
        .join("\n");
    },

    isChallengeFailure() {
      if (this.isChallengePage()) return false;
      const text = this.getDialogText();
      if (!text) return false;
      return this.errorTexts.some((needle) => text.includes(needle));
    },

    buildChallengeUrl() {
      const current = location.href;
      return `${this.challengePath}?redirect=${encodeURIComponent(current)}`;
    },

    redirectToChallenge() {
      if (this.isChallengePage()) return;
      location.assign(this.buildChallengeUrl());
    },

    forceChallenge() {
      if (this.isChallengePage()) {
        alert(T.alreadyOnChallenge);
        return;
      }
      this.redirectToChallenge();
    },

    checkAndRedirect(observer) {
      if (!this.isChallengeFailure()) return false;
      observer?.disconnect();
      this.redirectToChallenge();
      return true;
    },

    startObserver() {
      const root = document.body || document.documentElement;
      if (!root || this.observer) return;
      this.observer = new MutationObserver((_, observer) => {
        if (this.isChallengePage()) {
          if (this.isNotFoundPage()) {
            this.redirectFromNotFoundPage();
          }
          return;
        }
        this.checkAndRedirect(observer);
      });
      this.observer.observe(root, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    },
  };

  const AutoReadModule = {
    storagePrefix: `${STORAGE_PREFIX}:autoRead.`,
    config: {
      maxTopics: 100,
      maxPagesPerLoad: 10,
      maxPostsPerTopic: 1000,
      scrollStep: 30,
      scrollInterval: 48,
      fetchDelay: 600,
      jumpDelay: 2400,
      bottomSettleDelay: 2160,
      startDelay: 1440,
      maxRetry: 3,
    },
    navigating: false,
    scrollStarted: false,
    startTimer: 0,

    init() {
      if (!this.isEnabled()) return;
      if (this.isTopicPage()) {
        this.startScroll();
        return;
      }
      if (this.isStartPage()) {
        clearTimeout(this.startTimer);
        this.startTimer = setTimeout(() => this.goNext(), this.config.startDelay);
      }
    },

    isEnabled() {
      return getSetting(SETTINGS.autoReadEnabled, false) === true;
    },

    storeKey(key) {
      return `${this.storagePrefix}${key}`;
    },

    storeGet(key) {
      try {
        return localStorage.getItem(this.storeKey(key));
      } catch {
        return null;
      }
    },

    storeSet(key, value) {
      try {
        localStorage.setItem(this.storeKey(key), String(value));
      } catch {
        // Ignore localStorage failures; the current page can still continue.
      }
    },

    storeRemove(key) {
      try {
        localStorage.removeItem(this.storeKey(key));
      } catch {
        // Ignore localStorage failures.
      }
    },

    isTopicPage() {
      return /^\/t\//i.test(location.pathname);
    },

    isStartPage() {
      const path = location.pathname.replace(/\/+$/, "") || "/";
      return (
        path === "/" ||
        /^\/(latest|new|unread|top|categories)(\/|$)/i.test(path) ||
        /^\/c\//i.test(path)
      );
    },

    sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },

    toPositiveInt(value, fallback = 1) {
      const number = Number.parseInt(value, 10);
      return Number.isFinite(number) && number > 0 ? number : fallback;
    },

    getStoredPage() {
      const page = Number.parseInt(this.storeGet("page") || "0", 10);
      return Number.isFinite(page) && page >= 0 ? page : 0;
    },

    getScrollHeight() {
      const body = document.body;
      const root = document.documentElement;
      return Math.max(
        body?.scrollHeight || 0,
        body?.offsetHeight || 0,
        root?.clientHeight || 0,
        root?.scrollHeight || 0,
        root?.offsetHeight || 0,
      );
    },

    isAtBottom() {
      return window.innerHeight + window.scrollY >= this.getScrollHeight() - 120;
    },

    parseQueue() {
      try {
        const queue = JSON.parse(this.storeGet("queue") || "[]");
        if (!Array.isArray(queue)) throw new Error("queue is not an array");
        return queue.filter((topic) => topic && Number.isFinite(Number(topic.id)));
      } catch (error) {
        console.warn("[uscardforum-X] Auto Read queue is broken, clearing it:", error);
        this.storeRemove("queue");
        return [];
      }
    },

    async fetchJson(url) {
      let lastError;
      for (let i = 0; i < this.config.maxRetry; i += 1) {
        try {
          const response = await fetch(url, {
            credentials: "same-origin",
            headers: { Accept: "application/json" },
          });
          if (response.status === 429) {
            const retryAfter = Number.parseInt(response.headers.get("Retry-After") || "0", 10);
            const wait = retryAfter > 0 ? retryAfter * 1000 : 2400 * (i + 1);
            await this.sleep(wait);
            continue;
          }
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json();
        } catch (error) {
          lastError = error;
          if (i < this.config.maxRetry - 1) await this.sleep(840 * (i + 1));
        }
      }
      throw lastError || new Error("fetch failed");
    },

    isUsableTopic(topic, seen) {
      const id = Number(topic?.id);
      if (!Number.isFinite(id) || seen.has(id)) return false;
      if (Number(topic.posts_count || 0) >= this.config.maxPostsPerTopic) return false;
      return true;
    },

    async loadTopics() {
      let page = this.getStoredPage();
      let pagesRead = 0;
      const seen = new Set();
      const topicsToRead = [];

      while (topicsToRead.length < this.config.maxTopics && pagesRead < this.config.maxPagesPerLoad) {
        let data;
        try {
          data = await this.fetchJson(`${location.origin}/latest.json?page=${page}`);
        } catch (error) {
          console.warn("[uscardforum-X] Auto Read failed to fetch latest topics:", error);
          break;
        }

        const topics = data?.topic_list?.topics || [];
        if (!topics.length) {
          page = 0;
          break;
        }

        for (const topic of topics) {
          if (!this.isUsableTopic(topic, seen)) continue;
          seen.add(Number(topic.id));
          topicsToRead.push(topic);
          if (topicsToRead.length >= this.config.maxTopics) break;
        }

        page += 1;
        pagesRead += 1;
        this.storeSet("page", page);

        if (topicsToRead.length < this.config.maxTopics) await this.sleep(this.config.fetchDelay);
      }

      this.storeSet("page", page);
      return topicsToRead;
    },

    async goNext() {
      if (!this.isEnabled() || this.navigating) return;
      this.navigating = true;

      let queue = this.parseQueue();
      if (!queue.length) queue = await this.loadTopics();

      while (queue.length) {
        const next = queue.shift();
        this.storeSet("queue", JSON.stringify(queue));

        const topicId = Number(next?.id);
        if (!Number.isFinite(topicId)) continue;

        const post = this.toPositiveInt(next.last_read_post_number, 1);
        setTimeout(() => {
          location.assign(`${location.origin}/t/${topicId}/${post}`);
        }, this.config.jumpDelay);
        return;
      }

      console.warn("[uscardforum-X] Auto Read found no readable topics");
      this.storeRemove("queue");
      this.navigating = false;
    },

    startScroll() {
      if (this.scrollStarted || !this.isEnabled()) return;
      this.scrollStarted = true;

      let timer = 0;
      let finishing = false;

      const stop = () => {
        if (timer) {
          clearTimeout(timer);
          timer = 0;
        }
      };

      const schedule = () => {
        stop();
        timer = setTimeout(step, this.config.scrollInterval);
      };

      const finishWhenStable = async () => {
        if (finishing) return;
        finishing = true;
        stop();

        await this.sleep(this.config.bottomSettleDelay);
        if (!this.isEnabled()) {
          this.scrollStarted = false;
          finishing = false;
          return;
        }

        if (!this.isAtBottom()) {
          finishing = false;
          schedule();
          return;
        }

        await this.sleep(this.config.jumpDelay);
        if (!this.isEnabled()) {
          this.scrollStarted = false;
          finishing = false;
          return;
        }

        this.goNext();
      };

      const step = () => {
        if (!this.isEnabled()) {
          this.scrollStarted = false;
          stop();
          return;
        }

        if (document.hidden) {
          schedule();
          return;
        }

        window.scrollBy(0, this.config.scrollStep);

        if (this.isAtBottom()) {
          finishWhenStable();
          return;
        }

        schedule();
      };

      window.addEventListener("beforeunload", stop, { once: true });
      schedule();
    },
  };

  const TrustLevelModule = {
    styleReady: false,
    routeTimer: null,
    lastSummaryPath: "",
    lastSummaryRun: 0,
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
    labels: T.labels,
    summarySelectors: {
      days_visited: "li.stats-days-visited > div > span > span",
      likes_given: "li.stats-likes-given > a > div > span > span",
      likes_received: "li.stats-likes-received > div > span > span",
      posts_count: "li.stats-post-count > a > div > span > span",
      topics_entered: "li.stats-topics-entered > div > span > span",
      posts_read_count: "li.stats-posts-read > div > span > span",
      time_read: "li.stats-time-read > div > span",
    },
    hiddenKeys: new Set(["likes_received_users", "likes_received_days", "topics_replied_to"]),
    extraStatClasses: {
      likes_received_users: "stats-likes-received-users",
      likes_received_days: "stats-likes-received-days",
      topics_replied_to: "stats-topics-replied-to",
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
        .uscf-tl-extra-stat .uscf-tl-hidden-mark {
          color: #b26a00;
          font-weight: 700;
          margin-right: 3px;
        }
        .uscf-tl-extra-stat .value .number {
          white-space: nowrap;
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
      const targetLevel = isMaintain ? T.targetMaintainTl3 : T.targetNextLevel(trustLevel + 1);
      const requirements = this.cloneRequirements(tierIndex, siteStats);
      const stats = this.mergeStats(summary.stats, directoryItem);
      const unavailableHiddenKeys = new Set();

      if (tierIndex === 2) {
        try {
          Object.assign(stats, await this.fetchHiddenStats(username));
        } catch (error) {
          console.warn("[uscardforum-X] hidden trust level checks unavailable:", error);
          this.hiddenKeys.forEach((key) => unavailableHiddenKeys.add(key));
        }
      }

      const items = Object.entries(requirements).map(([key, need]) => {
        const hidden = this.hiddenKeys.has(key);
        const unavailable = hidden && unavailableHiddenKeys.has(key);
        const current = Number(stats[key] ?? 0);
        const ok = current >= Number(need);
        return {
          key,
          label: this.labels[key] || key.replace(/_/g, " "),
          current,
          need: Number(need),
          ok,
          missing: ok ? 0 : Number(need) - current,
          hidden,
          unavailable,
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
        if (minutes < 60) return `${minutes} ${T.minutes}`;
        const hours = Math.floor(minutes / 60);
        const rest = minutes % 60;
        return rest ? `${hours} ${T.hours} ${rest} ${T.minutes}` : `${hours} ${T.hours}`;
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
      this.removeExtraNativeStats();

      for (const item of result.items) {
        if (item.unavailable) continue;
        const selector = this.summarySelectors[item.key];
        if (!selector) {
          if (item.hidden && this.appendExtraNativeStat(result, item)) {
            painted += 1;
          }
          continue;
        }
        const statNode = document.querySelector(selector);
        if (!statNode) continue;
        statNode.textContent = this.formatNativeStatText(item);
        statNode.classList.remove("uscf-tl-native-ok", "uscf-tl-native-missing");
        statNode.classList.add(item.ok ? "uscf-tl-native-ok" : "uscf-tl-native-missing");
        statNode.title = this.buildNativeStatTitle(result, item);
        painted += 1;
      }

      if (painted === 0 && retry < 10) {
        setTimeout(() => this.paintNativeSummaryStats(result, retry + 1), 350);
      }
    },

    removeExtraNativeStats() {
      document.querySelectorAll(".uscf-tl-extra-stat").forEach((node) => node.remove());
    },

    appendExtraNativeStat(result, item) {
      const extraStats = Array.from(document.querySelectorAll(".uscf-tl-extra-stat"));
      const anchor =
        extraStats[extraStats.length - 1] ||
        document.querySelector("li.stats-likes-received") ||
        document.querySelector("li.stats-post-count") ||
        document.querySelector("li[class*='stats-']");
      const list = anchor?.parentElement;
      if (!list) return false;

      const number = el("span", {
        class: `number ${item.ok ? "uscf-tl-native-ok" : "uscf-tl-native-missing"}`,
        text: this.formatNativeStatText(item),
        title: this.buildNativeStatTitle(result, item),
      });
      const li = el(
        "li",
        {
          class: `${this.extraStatClasses[item.key] || `stats-${item.key.replace(/_/g, "-")}`} uscf-tl-extra-stat`,
        },
        el(
          "div",
          { class: "user-stat" },
          el("span", { class: "value" }, number),
          "\n",
          el("span", { class: "label" }, item.label, " ", el("span", { class: "uscf-tl-hidden-mark", text: "*" })),
        ),
      );

      list.insertBefore(li, anchor.nextSibling);
      return true;
    },

    buildNativeStatTitle(result, item) {
      return [
        `@${result.username}`,
          T.currentTl(result.trustLevel),
          result.targetLevel,
          `${item.label}: ${this.formatValue(item.key, item.current)} / ${this.formatValue(item.key, item.need)}`,
          item.hidden ? T.hiddenRequirement : "",
          item.ok ? T.satisfied : T.missing(this.formatValue(item.key, item.missing)),
      ]
        .filter(Boolean)
        .join(" · ");
    },

    formatNativeStatText(item) {
      const base = `${this.formatNativeValue(item.key, item.current)}/${this.formatNativeValue(item.key, item.need)}`;
      return item.ok ? base : `${base}${T.compactMissing(this.formatNativeValue(item.key, item.missing))}`;
    },

    formatNativeValue(key, value) {
      if (key === "time_read") {
        const minutes = Math.round(Number(value || 0) / 60);
        if (minutes < 60) return `${minutes}${T.minutes}`;
        const hours = Math.floor(minutes / 60);
        const rest = minutes % 60;
        return rest ? `${hours}${T.hours}${rest}${T.minutesShort}` : `${hours}${T.hours}`;
      }
      return String(Math.round(Number(value || 0)));
    },
  };

  if (hardIgnoreEnabled) {
    HardIgnoreModule.init();
  }

  if (ChallengeModule.isChallengePage() && ChallengeModule.isNotFoundPage()) {
    ChallengeModule.redirectFromNotFoundPage();
  }

  if (trustLevelEnabled) {
    TrustLevelModule.init();
  }

  if (autoReadEnabled) {
    AutoReadModule.init();
  }
})();
