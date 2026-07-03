# Changelog

## 0.3.0

- Rename Tampermonkey menu entries to short module names.
- Show enabled modules with a green check mark, such as `✅ 拉黑用户`.
- Add Cloudflare Challenge helper module.
- Add `强制触发Cloudflare盾` / `Force Cloudflare Shield` menu command.
- Add Chinese/English script menu switching.
- Add bilingual README files and Star History section.

## 0.2.2

- Add TL3 hidden checks back as native-looking summary stats.
- Append `获赞用户数`, `获赞分布天数`, and `回复不同话题` when `user_actions.json` is accessible.

## 0.2.1

- Change profile summary enhancement to native stat replacement only.
- Remove the inline Trust Level summary panel from `/u/{username}/summary`.
- Remove the manual Trust Level modal entry and clean up legacy panel nodes.
- Stop querying hidden user action checks that cannot be rendered in native summary stats.
- Use compact `current/target` formatting such as `72/50`.

## 0.2.0

- Add Trust Level upgrade/retention gap module.
- Add menu command to fetch the current user's progress on demand.
- Auto-enhance only `/u/{username}/summary` pages.
- Split settings into per-module Tampermonkey menu switches.
- Reduce hard-ignore DOM observation to short user-card activation windows.

## 0.1.0

- Add server-side Ignore button to US Card Forum user cards.
- Add Tampermonkey menu switch.
- Omit public update URLs for private repository use.
