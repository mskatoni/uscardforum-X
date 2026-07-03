# uscardforum-X

[中文说明](./README.zh-CN.md)

Private userscript for [US Card Forum](https://www.uscardforum.com/).

[![GitHub stars](https://img.shields.io/github/stars/mskatoni/uscardforum-X?style=social)](https://github.com/mskatoni/uscardforum-X/stargazers)
[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/license-CC--BY--NC--SA--4.0-lightgrey.svg)](./LICENSE)

> This repository is currently private. GitHub star badges and Star History charts may only render after the repository is public or visible to the viewer.

## Introduction

`uscardforum-X` is a focused Tampermonkey userscript for US Card Forum. It keeps the forum UI mostly native while adding a few practical Discourse helpers:

- server-side Ignore from user cards
- Trust Level upgrade or retention gap shown inside native profile stats
- one-click Cloudflare Challenge trigger
- Auto Read for slower hands-free topic reading
- Chinese/English script menu switching

## Modules

| Module | What it does | Scope |
| --- | --- | --- |
| Block Users | Adds an Ignore button to Discourse user cards | Topic/user-card interactions only |
| Next-Level Gap | Rewrites native profile summary stats as `current/target` | `/u/{username}/summary` only |
| Cloudflare Shield | One-time redirect to `/challenge?redirect={current_page}` | Tampermonkey menu command only |
| Auto Read | Reads topics from `/latest.json`, scrolls topic pages, and moves to the next topic | Start pages and topic pages only; disabled by default |
| English Panel / 中文面板 | Switches this userscript's own menu/button text | Tampermonkey menu |

Enabled modules are marked with a green check in Tampermonkey's menu, for example:

```text
✅ Block Users
✅ Next-Level Gap
Cloudflare Shield
Auto Read
✅ English Panel
```

## Install

1. Open [`userscript/uscardforum-X.user.js`](./userscript/uscardforum-X.user.js).
2. Copy the whole file into Tampermonkey as a new script.
3. Save the script and refresh US Card Forum.

Because this is a private repository, `@downloadURL` and `@updateURL` are intentionally omitted.

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

### Auto Read

`Auto Read` is disabled by default. Its Tampermonkey menu row shows a green check only when it is enabled. After enabling it, open the forum homepage, latest/new/unread/top/category pages, or a topic page.

The module has no floating controls. It scrolls topic pages about 20% slower than the reference script and then jumps to the next topic from the current `/latest.json` queue.

## Star Trend

Public Star History chart:

[![Star History Chart](https://api.star-history.com/svg?repos=mskatoni/uscardforum-X&type=Date)](https://star-history.com/#mskatoni/uscardforum-X&Date)

For a private repository, GitHub and Star History may not be able to read the star data.

## Notes

- The script uses the current browser session and CSRF token.
- It does not send data to third-party servers.
- Trust Level values are best-effort estimates based on Discourse JSON APIs.
- Some hidden TL3 checks depend on data that the forum may not expose to every account.

## Credits

- Trust Level endpoint and requirement mapping are based on the MIT-licensed [lupohan44/Discourse-Trust-Level-Progress](https://github.com/lupohan44/Discourse-Trust-Level-Progress).
- US Card Forum discussion: [魔改了个论坛脚本，能看 TL(TrustLevel) 升级进度](https://www.uscardforum.com/t/topic/397611).

## License

CC BY-NC-SA 4.0. See [LICENSE](./LICENSE).

Third-party notices are recorded in [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
