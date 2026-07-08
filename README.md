# uscardforum-X

面向 [美卡论坛](https://www.uscardforum.com/) 的 Tampermonkey 增强脚本。它尽量保持论坛原生界面，只在关键位置补齐几个日常刷论坛时常用的小功能。

[English](./README.en.md) · 简体中文（当前）

[![GitHub stars](https://img.shields.io/github/stars/mskatoni/uscardforum-X?style=social)](https://github.com/mskatoni/uscardforum-X/stargazers)
[![Greasy Fork](https://img.shields.io/badge/Greasy%20Fork-uscardforum--X-670000)](https://greasyfork.org/en/scripts/585437-uscardforum-x)
[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/license-CC--BY--NC--SA--4.0-lightgrey.svg)](./LICENSE)

Greasy Fork 安装地址：[uscardforum-X](https://greasyfork.org/en/scripts/585437-uscardforum-x)

更新日志：[CHANGELOG.md](./CHANGELOG.md)

## 目录

- [简介](#简介)
- [模块一览](#模块一览)
- [安装方式](#安装方式)
- [使用说明](#使用说明)
- [Star 趋势](#star-趋势)
- [注意事项与使用建议](#注意事项与使用建议)
- [反馈与贡献](#反馈与贡献)
- [许可证](#许可证)

## 简介

`uscardforum-X` 是一个专注于美卡论坛的用户脚本，在不改变原生 UI 观感的前提下，补上几个官方没有直接提供的 Discourse 辅助功能：

- 服务器端拉黑：从用户卡片一键加入 Discourse 官方 Ignore 名单。
- 等级晋升/保级差距：把个人资料页原生统计数字改写成“当前/目标”。
- 短回复补图：回复内容低于最低长度限制时，提交前自动补入图片 Markdown。
- 点赞助手：一键触发当前可见帖子的 Like 按钮，也可以配合自动阅读做低频测试。
- Cloudflare Challenge 助手：手动刷新盾验证状态，并处理 challenge 404 兜底。
- 自动阅读：滚动帖子、标记已读，读完后自动跳下一篇。
- 中英文双语菜单：油猴菜单本身支持中文/英文切换。

## 模块一览

| # | 模块 | 类型 | 默认状态 | 生效范围 |
| --- | --- | --- | --- | --- |
| 1 | 拉黑用户 | 常驻开关 | 开启 | 用户卡片弹出后短时间内生效 |
| 2 | 下一级距离 | 常驻开关 | 开启 | 仅 `/u/{username}/summary` |
| 3 | 短回复补图 | 常驻开关 | 开启 | 发帖/回复编辑器提交按钮 |
| 4 | 点赞可见帖子 | 一次性命令 | 不适用 | 当前页面可见区域 |
| 5 | 自动点赞测试 | 常驻开关 | 关闭 | 需搭配“自动阅读”一起使用 |
| 6 | Cloudflare盾 | 一次性命令 | 不适用 | 任意页面 |
| 7 | 自动阅读 | 常驻开关 | 关闭 | 首页/最新/未读/热门/分类/帖子页 |
| 8 | 中文面板 / English Panel | 一次性命令 | 中文 | 油猴菜单自身 |

开启中的常驻开关会在 Tampermonkey 菜单里显示绿色勾选，默认菜单大致如下：

```text
✅ 拉黑用户
✅ 下一级距离
✅ 短回复补图
点赞可见帖子
自动点赞测试
Cloudflare盾
自动阅读
✅ 中文面板
```

## 安装方式

推荐方式：

1. 安装用户脚本管理器，例如 Tampermonkey 或 Violentmonkey。
2. 打开 Greasy Fork 页面：[uscardforum-X](https://greasyfork.org/en/scripts/585437-uscardforum-x)。
3. 点击 `Install this script`，在脚本管理器里确认安装，然后刷新美卡论坛页面。

手动备用方式：

1. 打开源码文件：[userscript/uscardforum-X.user.js](./userscript/uscardforum-X.user.js)。
2. 复制完整内容，在脚本管理器里新建一个脚本并粘贴。
3. 保存后刷新美卡论坛页面。

## 使用说明

### 1. 拉黑用户

在帖子里点击任意用户的头像或用户名，打开用户卡片后，会看到 `拉黑 @用户名` 按钮。

点击后脚本会调用 Discourse 官方服务器端 Ignore 接口：

```http
PUT /u/{username}/notification_level.json
```

脚本会把到期时间设置到 2099 年，等同于长期生效。由于这是服务器端设置，换设备、换浏览器登录同一账号后依然有效。操作前需要保证你已登录论坛，脚本会读取页面里的 CSRF token，读取不到会给出提示。

### 2. 下一级距离

打开任意用户的资料统计页：

```text
https://www.uscardforum.com/u/{username}/summary
```

脚本不会另开浮窗，而是直接改写论坛原生统计数字。绿色表示已达标，红色表示还差多少，鼠标悬停可看到详细数值，例如：

```text
72/50 访问天数
1992/500 浏览的话题
16/5 获赞用户数 *
6/7，差1 获赞分布天数 *
14/10 回复不同话题 *
```

带 `*` 的是 TL3/白金隐藏条件。只有论坛允许当前账号读取 `user_actions.json` 时才会显示，避免展示不准确的假数据。隐藏条件请求带有 429 退避重试和页间延迟，避免瞬间打出一串用户动作历史请求。

<details>
<summary>点击展开完整门槛表</summary>

**TL0 -> TL1（基础用户）**

| 统计项 | 门槛 |
| --- | --- |
| 进入话题数 | 5 |
| 已读帖子数 | 30 |
| 累计阅读时长 | 10 分钟 |

**TL1 -> TL2（成员）**

| 统计项 | 门槛 |
| --- | --- |
| 访问天数 | 15 |
| 给出点赞 | 1 |
| 收到点赞 | 1 |
| 发帖/回复数 | 3 |
| 进入话题数 | 20 |
| 已读帖子数 | 100 |
| 累计阅读时长 | 60 分钟 |
| 回复不同话题数 | 3 |

**TL2 -> TL3 / 保级 TL3（常客 / 白金会员）**

| 统计项 | 门槛 |
| --- | --- |
| 访问天数 | 50 |
| 给出点赞 | 30 |
| 收到点赞 | 20 |
| 发帖/回复数 | 10 |
| 已读帖子数 | 站点近 30 天发帖数 / 4，上限 20000，动态计算 |
| 进入话题数 | 站点近 30 天话题数 / 4，上限 500，动态计算 |
| 获赞用户数 * | 5 |
| 获赞分布天数 * | 7 |
| 回复不同话题数 * | 10 |

带 `*` 的三项基于最近 100 天的 `user_actions.json` 数据统计得出。若你已经是 TL3 及以上，脚本会把这组门槛当作“保级”标准显示，仅供参考，实际判定以论坛官方规则为准。

</details>

### 3. 短回复补图

`短回复补图` 默认开启，也可以在 Tampermonkey 菜单里关闭。开启后，点击“回复”“发布”“创建主题”等提交按钮的瞬间，脚本会：

1. 去掉引用块 `[quote]...[/quote]`，因为引用内容不应计入有效长度。
2. 计算剩余内容的有效长度，`:表情代码:` 这类表情按 1 个字符计。
3. 如果有效长度在 1 到 3 之间，就在末尾追加图片 Markdown，帮助通过论坛最低长度检查。
4. 如果整条内容本来就只有一个表情代码，则不做处理。
5. 处理完成后，输入框会短暂高亮，让这次改写可见。

补图使用的默认图片来自公开外链，只用于满足编辑器最低长度限制。如果不喜欢默认图片，可以修改脚本里的 `ComposerPaddingModule.paddingImage` 常量。

### 4. 点赞助手

点赞相关功能分成两部分：

- `点赞可见帖子`：Tampermonkey 菜单里的一次性命令。它扫描当前屏幕内、还没点赞过、也不是你自己发的帖子，依次触发原生 Discourse Reactions Like 按钮。单次最多处理 8 个，每次触发之间有短暂停顿。
- `自动点赞测试`：常驻开关，默认关闭。只有在 `自动阅读` 同时开启时才会生效。滚动阅读帖子时，脚本会顺手触发当前可见的未点赞帖子，每约 0.9 秒检查一次，每次最多处理 3 个。

触控/移动视图下，脚本走 Discourse Reactions 的 touch 事件路径；桌面视图下使用普通按钮点击。开启 `自动点赞测试` 后，`自动阅读` 会从普通速度 `30px / 50ms` 切换到较慢的 `18px / 180ms`，给 reaction 按钮挂载和请求完成留出时间。

如果页面出现论坛的 24 小时点赞上限提示，脚本会暂停自动点赞，自动阅读继续按普通速度运行。

### 5. Cloudflare盾

这是一个一次性命令，不显示绿色勾选，也不代表有后台模块在持续运行：

```text
/challenge?redirect={当前页面}
```

需要强制刷新 Cloudflare Challenge 验证状态时，点菜单里的 `Cloudflare盾` 即可跳转。此外，如果你停留在 `/challenge` 页面但页面显示“未找到”，脚本会把你带回原本想访问的页面或首页，并带有 5 秒防抖，避免反复跳转。

### 6. 自动阅读

`自动阅读` 默认关闭。开启后，打开论坛首页、最新/未读/热门/分类页或某个帖子页即可自动开始工作，没有任何浮窗或按钮：

- 在起始页面，脚本会分页拉取 `/latest.json`，每次最多读 10 页、凑够 100 个话题，跳过帖子数超过 1000 的超长话题，并把结果存进队列。
- 进入帖子页后，普通自动阅读按 `30px / 50ms` 向下滚动；到底部并稳定停留一段时间后，跳转到队列里的下一个话题。
- 同时开启 `自动点赞测试` 时，滚动速度切换为 `18px / 180ms`。
- 请求遇到 429 时会读取 `Retry-After` 自动重试，最多重试 3 次。
- 阅读进度（队列、页码）保存在本地，切换页面或刷新后也不会立即丢失。

### 7. 中文面板 / English Panel

Tampermonkey 菜单本身的语言可以在菜单里一键切换中文/英文，切换后会自动刷新页面生效。

## Star 趋势

[![Star History Chart](https://api.star-history.com/svg?repos=mskatoni/uscardforum-X&type=Date)](https://star-history.com/#mskatoni/uscardforum-X&Date)

## 注意事项与使用建议

- 脚本只使用你当前浏览器里的登录状态和 CSRF token 完成请求，不会把数据发送到第三方服务器。
- “下一级距离”展示的进度是基于 Discourse JSON 接口的尽力估算，不是论坛官方判定结果，仅供参考。
- 部分 TL3 隐藏条件依赖论坛是否允许当前账号读取对应的历史动作数据，个别账号可能看不到这些项。
- “自动阅读”和“自动点赞测试”都属于自动化行为，会真实调用论坛接口做已读或点赞操作。脚本内置了请求节流和点赞上限检测，但仍建议自行控制使用频率。
- “短回复补图”只帮助通过编辑器最低长度检查，回复内容是否合适、是否符合版规仍需自己判断。

## 反馈与贡献

- 遇到问题或有功能建议，欢迎提交 [Issues](https://github.com/mskatoni/uscardforum-X/issues)。
- 项目主页：[github.com/mskatoni/uscardforum-X](https://github.com/mskatoni/uscardforum-X)

## 许可证

CC BY-NC-SA 4.0，见 [LICENSE](./LICENSE)。
