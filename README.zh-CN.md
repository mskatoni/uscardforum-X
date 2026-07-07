# uscardforum-X

[English README](./README.md)

面向 [美卡论坛](https://www.uscardforum.com/) 的公开 Tampermonkey 用户脚本。

[![GitHub stars](https://img.shields.io/github/stars/mskatoni/uscardforum-X?style=social)](https://github.com/mskatoni/uscardforum-X/stargazers)
[![Greasy Fork](https://img.shields.io/badge/Greasy%20Fork-uscardforum--X-670000)](https://greasyfork.org/en/scripts/585437-uscardforum-x)
[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/license-CC--BY--NC--SA--4.0-lightgrey.svg)](./LICENSE)

Greasy Fork 安装地址：[uscardforum-X](https://greasyfork.org/en/scripts/585437-uscardforum-x)。

## 脚本介绍

`uscardforum-X` 尽量不破坏论坛原生界面，只在必要位置增强 Discourse 功能：

- 用户卡里一键服务器端拉黑
- 在个人资料统计里显示当前等级和下一等级/保级差距
- 短回复提交前自动补图片 Markdown，避免有效字数不足 4
- 油猴菜单触发，模拟鼠标点击当前可见帖子的原生点赞按钮
- 授权测试用自动点赞：开启后在自动阅读滚动时点击当前可见 Like 按钮
- Cloudflare Challenge 一次性手动触发
- 自动阅读帖子；开启自动点赞测试时单独切换为较慢滚动
- 脚本菜单中文/英文切换

## 模块

| 模块 | 功能 | 生效范围 |
| --- | --- | --- |
| 拉黑用户 | 在用户卡加入服务器端 Ignore 按钮 | 只在点击头像/用户名后短时间工作 |
| 下一级距离 | 把个人资料原生统计改成 `当前/目标` | 只在 `/u/{username}/summary` 生效 |
| 短回复补图 | 有效字数为 1-3 时，提交前自动追加图片 Markdown | Discourse 编辑器提交按钮 |
| 点赞可见帖子 | 通过原生 Like 按钮模拟鼠标点击当前可见且未点赞的帖子 | 油猴菜单命令，只在当前页面即时执行 |
| 自动点赞测试 | 自动阅读滚动时，节流点击当前视口内的少量 Like 按钮 | 需同时开启 `自动阅读`，默认关闭 |
| Cloudflare盾 | 一次性跳转 `/challenge?redirect={当前页面}` | 仅油猴菜单命令 |
| 自动阅读 | 读取 `/latest.json` 队列，滚动帖子页并跳下一篇 | 只在首页/列表页/帖子页生效，默认关闭 |
| 中文面板 / English Panel | 切换脚本自身菜单和按钮语言 | 油猴菜单 |

开启的模块会在油猴菜单里显示绿钩，例如：

```text
✅ 拉黑用户
✅ 下一级距离
点赞可见帖子
自动点赞测试
Cloudflare盾
自动阅读
✅ 中文面板
```

## 安装方式

推荐方式：

1. 安装 Tampermonkey、Violentmonkey 等用户脚本管理器。
2. 打开 Greasy Fork 页面：[uscardforum-X](https://greasyfork.org/en/scripts/585437-uscardforum-x)。
3. 点击 `Install this script`，在脚本管理器里确认安装，然后刷新美卡论坛页面。

手动备用：

1. 打开 [`userscript/uscardforum-X.user.js`](./userscript/uscardforum-X.user.js)。
2. 复制完整内容，新建到 Tampermonkey/Violentmonkey 里。
3. 保存并刷新美卡论坛页面。

## 使用方式

### 拉黑用户

在帖子里点击用户头像或用户名，打开用户卡后点击 `拉黑 @用户名`。

脚本调用 Discourse 官方服务器端 Ignore 接口：

```http
PUT /u/{username}/notification_level.json
```

### 下一级距离

打开用户资料统计页：

```text
https://www.uscardforum.com/u/{username}/summary
```

脚本不会新开面板，只会修改论坛原来的统计数字，例如：

```text
72/50 访问天数
1992/500 浏览的话题
16/5 获赞用户数 *
6/7，差1 获赞分布天数 *
14/10 回复不同话题 *
```

带 `*` 的是 TL3/白金隐藏条件。只有论坛允许读取 `user_actions.json` 时才会显示，避免显示假数据。

### Cloudflare盾

这个菜单项是一次性触发按钮，不显示绿钩，也不代表后台模块已开启。

```text
/challenge?redirect={当前页面}
```

需要刷新 Cloudflare Challenge 状态时，点油猴菜单里的 `Cloudflare盾` 即可。

### 短回复补图

回复或发帖内容的有效字数为 1-3 时，脚本会在提交前自动追加图片 Markdown，帮助通过论坛最小长度检查。计数时会忽略引用块，`:sticker:` 形式的表情按 1 个字符计算；如果整条内容只有一个表情，则保持原样不补图。

### 点赞可见帖子

打开帖子页后，点油猴菜单里的 `点赞可见帖子`。脚本会查找当前视口内未点赞的原生 Discourse Reactions Like 按钮，然后走页面自己的按钮路径触发：移动/触控视图使用 touch 事件，桌面视图使用普通按钮点击。

这个命令只在点击菜单后即时执行一次，最多处理当前可见区域内的少量帖子，不会和 `自动阅读` 绑定，也不会在后台持续点赞。

### 自动点赞测试

`自动点赞测试` 默认关闭。它必须和 `自动阅读` 同时开启才会工作：自动阅读滚动帖子页时，脚本会按节流检查当前视口里未点赞的原生 Like 按钮，并通过页面自己的 reaction 按钮触发。

自动模式不会主动翻找隐藏按钮，也不会脱离自动阅读单独运行；每次触发只处理少量当前可见帖子，并在当前页面内记录已处理帖子，避免重复点击。如果 Discourse 弹出 24 小时点赞上限提示，脚本会暂停自动点赞，自动阅读则继续按普通速度运行。

### 自动阅读

`自动阅读` 默认关闭。它会在油猴菜单里用绿钩显示开启状态；开启后，打开论坛首页、最新/未读/热门/分类页或帖子页即可开始。

这个模块不会创建浮窗或按钮，只用油猴菜单开关。普通自动阅读按 `30px / 50ms` 滚动，到底后会从当前 `/latest.json` 队列跳到下一篇。只有同时开启 `自动点赞测试` 时，滚动才会切到较慢的 `18px / 180ms`，给 reaction 按钮留出挂载和触发时间。

## Star 趋势

Star History：

[![Star History Chart](https://api.star-history.com/svg?repos=mskatoni/uscardforum-X&type=Date)](https://star-history.com/#mskatoni/uscardforum-X&Date)

## 注意

- 脚本使用当前浏览器登录态和 CSRF token。
- 不向第三方服务器发送数据。
- 等级进度是基于 Discourse JSON API 的近似估算。
- 部分 TL3 隐藏条件取决于论坛是否允许当前账号读取对应动作历史。

## 许可证

CC BY-NC-SA 4.0，见 [LICENSE](./LICENSE)。
