# uscardforum-X

[中文说明](./README.zh-CN.md)

Public userscript for [US Card Forum](https://www.uscardforum.com/).

[![GitHub stars](https://img.shields.io/github/stars/mskatoni/uscardforum-X?style=social)](https://github.com/mskatoni/uscardforum-X/stargazers)
[![Greasy Fork](https://img.shields.io/badge/Greasy%20Fork-uscardforum--X-670000)](https://greasyfork.org/en/scripts/585437-uscardforum-x)
[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/license-CC--BY--NC--SA--4.0-lightgrey.svg)](./LICENSE)

Install from Greasy Fork: [uscardforum-X](https://greasyfork.org/en/scripts/585437-uscardforum-x).

## Introduction

`uscardforum-X` is a focused Tampermonkey userscript for US Card Forum. It keeps the forum UI mostly native while adding a few practical Discourse helpers:

- server-side Ignore from user cards
- Trust Level upgrade or retention gap shown inside native profile stats
- short composer padding with image Markdown when a reply is under four effective characters
- menu-triggered native reaction triggers on visible Like buttons
- authorized-test Auto Like mode that clicks visible Like buttons while Auto Read scrolls
- one-click Cloudflare Challenge trigger
- Auto Read for slower hands-free topic reading
- Chinese/English script menu switching

## Modules

| Module | What it does | Scope |
| --- | --- | --- |
| Block Users | Adds an Ignore button to Discourse user cards | Topic/user-card interactions only |
| Next-Level Gap | Rewrites native profile summary stats as `current/target` | `/u/{username}/summary` only |
| Short Reply Padding | Appends image Markdown before submit when a composer body has 1-3 effective characters | Discourse composer submit buttons |
| Like Visible Posts | Simulates mouse clicks on visible native Like buttons that are not already liked | Tampermonkey menu command; one immediate run on the current page |
| Auto Like Test | Throttles native reaction triggers on a few visible Like buttons while Auto Read scrolls | Requires `Auto Read`; disabled by default |
| Cloudflare Shield | One-time redirect to `/challenge?redirect={current_page}` | Tampermonkey menu command only |
| Auto Read | Reads topics from `/latest.json`, scrolls topic pages, and moves to the next topic | Start pages and topic pages only; disabled by default |
| English Panel / 中文面板 | Switches this userscript's own menu/button text | Tampermonkey menu |

Enabled modules are marked with a green check in Tampermonkey's menu, for example:

```text
✅ Block Users
✅ Next-Level Gap
Like Visible Posts
Auto Like Test
Cloudflare Shield
Auto Read
✅ English Panel
```

## Install

Recommended:

1. Install a userscript manager such as Tampermonkey or Violentmonkey.
2. Open [uscardforum-X on Greasy Fork](https://greasyfork.org/en/scripts/585437-uscardforum-x).
3. Click `Install this script`, confirm in your userscript manager, then refresh US Card Forum.

Manual fallback:

1. Open [`userscript/uscardforum-X.user.js`](./userscript/uscardforum-X.user.js).
2. Copy the whole file into Tampermonkey/Violentmonkey as a new script.
3. Save the script and refresh US Card Forum.

## Usage

### Block Users

Open a user card by clicking an avatar or username, then click `拉黑 @username` / `Ignore @username`.

The script calls Discourse's server-side Ignore endpoint:

```http
PUT /u/{username}/notification_level.json
```

### Next-Level Gap

Open a profile summary page:

```text
https://www.uscardforum.com/u/{username}/summary
```

The script rewrites native stats such as:

```text
72/50 访问天数
1992/500 浏览的话题
16/5 获赞用户数 *
6/7，差1 获赞分布天数 *
14/10 回复不同话题 *
```

Hidden TL3 checks are appended as native-looking stats when `user_actions.json` is accessible.

### Cloudflare Shield

The menu item is a one-time trigger. It does not show a green check mark and does not mean a background module is enabled.

```text
/challenge?redirect={current_page}
```

Click `Cloudflare Shield` when you want to force a fresh Challenge pass.

### Short Reply Padding

When you submit a reply or topic with 1-3 effective characters, the script appends image Markdown so the composer passes the forum's minimum length check. Quoted text is ignored, `:sticker:` tokens count as one character, and a reply that is exactly one sticker is left untouched.

### Like Visible Posts

Open a topic page and click `Like Visible Posts` in the userscript menu. The script finds visible native Discourse Reactions Like buttons that are not already liked, then triggers the same button path used by the page: touch events on mobile/touch views and a plain button click on desktop views.

The command runs only once when triggered from the menu, handles a small number of currently visible posts, and is not tied to `Auto Read`.

### Auto Like Test

`Auto Like Test` is disabled by default. It only runs when both `Auto Like Test` and `Auto Read` are enabled: while Auto Read scrolls a topic page, the script throttles checks for visible native Like buttons and triggers them through the page's own reaction button.

The automatic mode does not hunt for hidden buttons or run separately from Auto Read. Each tick handles only a few currently visible posts and records handled posts on the current page to avoid repeated clicks. If Discourse shows the 24-hour like-limit dialog, Auto Like Test is paused and Auto Read continues without the like-paced slowdown.

### Auto Read

`Auto Read` is disabled by default. Its Tampermonkey menu row shows a green check only when it is enabled. After enabling it, open the forum homepage, latest/new/unread/top/category pages, or a topic page.

The module has no floating controls. Normal Auto Read scrolls at `30px / 50ms` and then jumps to the next topic from the current `/latest.json` queue. When `Auto Like Test` is also enabled, scrolling switches to the slower `18px / 180ms` pace so reaction buttons have time to mount and be triggered.

## Star Trend

Public Star History chart:

[![Star History Chart](https://api.star-history.com/svg?repos=mskatoni/uscardforum-X&type=Date)](https://star-history.com/#mskatoni/uscardforum-X&Date)

## Notes

- The script uses the current browser session and CSRF token.
- It does not send data to third-party servers.
- Trust Level values are best-effort estimates based on Discourse JSON APIs.
- Some hidden TL3 checks depend on data that the forum may not expose to every account.

## License

CC BY-NC-SA 4.0. See [LICENSE](./LICENSE).
