# uscardforum-X

Private userscript for [uscardforum.com](https://www.uscardforum.com/).

> This repository is intended for private use under `mskatoni/uscardforum-X`.

## Features

- Adds a `拉黑 @username` button to Discourse user cards on US Card Forum.
- Uses Discourse's server-side Ignore endpoint instead of only hiding content locally.
- Shows Discourse Trust Level upgrade/retention gaps from forum JSON APIs.
- Stores per-module switches in Tampermonkey's own script menu.
- Does not add a separate settings panel to the forum page.
- Does not send data to any third-party server.

## Modules

| Module | Auto-active page/scope | Tampermonkey menu |
| --- | --- | --- |
| Hard Ignore | Only arms a short user-card observer after avatar/profile-link clicks | `关闭/开启用户卡硬拉黑按钮` |
| Trust Level Progress | Rewrites native stats on `/u/{username}/summary` only | `关闭/开启等级升级差距模块` |

The Trust Level module does not fetch data on every topic page. It only changes the forum's original stats on profile summary pages, for example `72/50` on `访问天数`.

## Install

1. Open `userscript/uscardforum-X.user.js`.
2. Copy the full file into Tampermonkey as a new script.
3. Save and refresh US Card Forum.

Because this is a private repository, `@downloadURL` and `@updateURL` are intentionally omitted.

## Usage

### Hard Ignore

1. Log in to US Card Forum.
2. Open any topic page.
3. Click a user's avatar or username to open the user card.
4. Click `拉黑 @username`.

The script calls:

```http
PUT /u/{username}/notification_level.json
```

with:

```json
{
  "notification_level": "ignore",
  "expiring_at": "2099-12-31T00:00:00Z"
}
```

### Trust Level Progress

On profile summary pages like:

```text
https://www.uscardforum.com/u/{username}/summary
```

the module does not add a separate panel. It rewrites matching native stat numbers as `current/target` and uses color to show whether the item is satisfied.

The module reads:

```http
GET /about.json
GET /u/{username}/summary.json
GET /directory_items?period=quarterly&order=days_visited&name={username}
```

## Toggle

Open Tampermonkey's script menu on US Card Forum:

- `关闭用户卡硬拉黑按钮`
- `开启用户卡硬拉黑按钮`
- `关闭等级升级差距模块`
- `开启等级升级差距模块`

Changing the switch reloads the current page.

## Notes

- The script uses the current browser login session and CSRF token.
- If the request returns `403`, the forum account may not have permission to ignore that user, or the target user may be protected by site rules.
- The action is server-side Ignore. It is not the same as a local CSS hide/filter rule.
- Trust Level progress is an estimate. Some Discourse requirements are not fully exposed by public APIs.
- TL3/white-gold dynamic thresholds use forum stats from `/about.json`; hidden checks that have no native summary stat are intentionally not rendered.

## Credits

- Trust Level API/interface design is based on the MIT-licensed [lupohan44/Discourse-Trust-Level-Progress](https://github.com/lupohan44/Discourse-Trust-Level-Progress).
- US Card Forum discussion: [魔改了个论坛脚本，能看 TL(TrustLevel) 升级进度](https://www.uscardforum.com/t/topic/397611).

## License

CC BY-NC-SA 4.0. See [LICENSE](./LICENSE).

Third-party notices are recorded in [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
