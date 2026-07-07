# Changelog

## 0.4.11

- Restore normal Auto Read speed to `30px / 50ms` when Auto Like Test is not active.
- Keep Auto Like Test on the slower `18px / 180ms` reading-paced scroll.
- Pause Auto Like Test when Discourse shows the 24-hour like-limit dialog, while leaving Auto Read running.

## 0.4.10

- Slow Auto Read from the previous fast sweep to a reading-paced scroll so Discourse has time to mount reaction buttons.
- Let Auto Read run the Like Assist scan before and after each scroll step, with a short settle delay around the movement.
- Shorten the auto-like scan interval while increasing the per-click delay to avoid skipping newly visible posts.

## 0.4.9

- Simplify Like Assist to the official Discourse Reactions action wrapper selector.
- Use the mobile/touch `touchstart` + `touchend` path required by Discourse Reactions on touch/mobile views, with a plain click fallback for desktop.
- Mark auto-like posts as seen only after a trigger is actually sent.

## 0.4.8

- Match the Discourse Reactions wrapper used by the forum itself: `.discourse-reactions-reaction-button`.
- Use the surrounding `.discourse-reactions-actions` state to skip own posts and already-reacted posts before clicking.

## 0.4.7

- Make `Auto Like Test` trigger from actual page scroll/focus events as well as the Auto Read loop.
- Add delayed first-screen checks so Discourse posts mounted after page load can still be liked during testing.

## 0.4.6

- Align Like helpers with US Card Forum's Discourse Reactions plugin button class from HAR captures.
- Skip logged-out reaction prompts such as `请注册或登录以点赞此帖子` so tests do not open the login modal by mistake.
- Expand already-reacted detection for selected/reaction-active states.

## 0.4.5

- Add an `Auto Like Test` toggle that runs only together with Auto Read.
- During Auto Read scrolling, throttle mouse-style clicks on visible native Like buttons and de-duplicate posts on the current page.
- Keep the one-shot `Like Visible Posts` command for manual testing.

## 0.4.4

- Add a menu-triggered Like Visible Posts helper that simulates mouse events on visible native Like buttons.
- Limit each run to currently visible, unliked Like buttons and keep it separate from Auto Read.
- Update bilingual docs for the new like helper.

## 0.4.3

- Fix Trust Level progress not appearing on cold external links directly opened at `/u/{username}/summary`.
- Repaint native summary stats when Discourse mounts the profile DOM after the userscript has already loaded progress data.

## 0.4.2

- Add short composer padding: when a reply or topic body has 1-3 effective characters, append the configured image Markdown before submit.
- Ignore quoted text while counting, count `:sticker:` tokens as one character, and skip padding when the whole reply is exactly one sticker.
- Update bilingual docs for the new composer helper.

## 0.4.1

- Change `Cloudflare盾` / `Cloudflare Shield` to a one-time Challenge trigger without a green check mark.
- Keep `自动阅读` / `Auto Read` as the persistent toggle that shows enabled state with a green check mark.
- Update bilingual docs to reflect the corrected menu semantics.

## 0.4.0

- Add the Auto Read module, disabled by default and exposed only through the Tampermonkey menu.
- Slow Auto Read pacing by about 20% compared with the reference script.
- Keep the menu to five rows by folding the Cloudflare force trigger into the Cloudflare row when the module is disabled.
- Update bilingual README docs for the new module and Cloudflare menu behavior.

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
