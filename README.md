# uscardforum-X

Private userscript for [uscardforum.com](https://www.uscardforum.com/).

> This repository is intended for private use under `mskatoni/uscardforum-X`.

## Features

- Adds a `拉黑 @username` button to Discourse user cards on US Card Forum.
- Uses Discourse's server-side Ignore endpoint instead of only hiding content locally.
- Stores an on/off switch in Tampermonkey's own script menu.
- Does not add a separate settings panel to the forum page.
- Does not send data to any third-party server.

## Install

1. Open `userscript/uscardforum-X.user.js`.
2. Copy the full file into Tampermonkey as a new script.
3. Save and refresh US Card Forum.

Because this is a private repository, `@downloadURL` and `@updateURL` are intentionally omitted.

## Usage

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

## Toggle

Open Tampermonkey's script menu on US Card Forum:

- `关闭用户卡硬拉黑按钮`
- `开启用户卡硬拉黑按钮`

Changing the switch reloads the current page.

## Notes

- The script uses the current browser login session and CSRF token.
- If the request returns `403`, the forum account may not have permission to ignore that user, or the target user may be protected by site rules.
- The action is server-side Ignore. It is not the same as a local CSS hide/filter rule.

## License

CC BY-NC-SA 4.0. See [LICENSE](./LICENSE).
