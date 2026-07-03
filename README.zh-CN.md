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
- Cloudflare Challenge 一次性手动触发
- 自动阅读帖子，按较慢速度滚动并跳下一篇
- 脚本菜单中文/英文切换

## 模块

| 模块 | 功能 | 生效范围 |
| --- | --- | --- |
| 拉黑用户 | 在用户卡加入服务器端 Ignore 按钮 | 只在点击头像/用户名后短时间工作 |
| 下一级距离 | 把个人资料原生统计改成 `当前/目标` | 只在 `/u/{username}/summary` 生效 |
| Cloudflare盾 | 一次性跳转 `/challenge?redirect={当前页面}` | 仅油猴菜单命令 |
| 自动阅读 | 读取 `/latest.json` 队列，滚动帖子页并跳下一篇 | 只在首页/列表页/帖子页生效，默认关闭 |
| 中文面板 / English Panel | 切换脚本自身菜单和按钮语言 | 油猴菜单 |

开启的模块会在油猴菜单里显示绿钩，例如：

```text
✅ 拉黑用户
✅ 下一级距离
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

### 自动阅读

`自动阅读` 默认关闭。它会在油猴菜单里用绿钩显示开启状态；开启后，打开论坛首页、最新/未读/热门/分类页或帖子页即可开始。

这个模块不会创建浮窗或按钮，只用油猴菜单开关。读帖滚动节奏比参考脚本慢约 20%，到底后会从当前 `/latest.json` 队列跳到下一篇。

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
