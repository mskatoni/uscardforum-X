# Changelog

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
