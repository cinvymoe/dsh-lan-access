# dsh-lan-access

让 DeepSeek Harness Web GUI 可在局域网内被其他设备访问的 DSH 插件（可信内网专用）。

## 功能

1. **局域网绑定**：把 webserver 的 `host` 改为 `0.0.0.0`，手机/其他电脑可通过
   `http://<Mac局域网IP>:3080` 访问（查 IP：`ipconfig getifaddr en0`）。
2. **crypto.randomUUID polyfill**：浏览器只在安全上下文（HTTPS/localhost）暴露
   `crypto.randomUUID`，局域网明文 HTTP 下不存在，会导致 DSH 的 RPC 全部失败
   （项目/会话列表加载不出、无法添加工作区）。本插件向每次返回的 index.html
   注入兜底实现，任何设备的浏览器访问都正常。

## 安装

```sh
dsh plugin --profile web add dsh-lan-access
# 本地开发安装：
# dsh plugin --profile web add file:/path/to/dsh-lan-access
```

安装后重启服务生效：

```sh
launchctl kickstart -k gui/$(id -u)/com.dsh.web   # 如果用 launchd 常驻
```

## 卸载

```sh
dsh plugin --profile web remove dsh-lan-access
```

卸载后 webserver 恢复默认仅 `127.0.0.1`，polyfill 不再注入。

## 安全提醒

- 绑定 `0.0.0.0` 后，同一网络内任何设备都能连接 DSH（**无认证**），
  等于整网都能触达本机的命令执行能力。**仅限家庭/公司可信内网使用**，
  公共 WiFi 请勿开启。
- 建议：路由器/防火墙限制来源 IP；出外网访问请叠加 Tailscale 等隧道。

## 技术说明

- 绑定：以 bundle patch 覆盖 `webserver` 行（`host: 0.0.0.0`，port 保持
  `ctx.webStartup.port ?? 3080` 表达式）。
- polyfill：代码行注入 `webServer`，用官方预留的 `tapIndex` 钩子向
  index.html `<head>` 注入内联脚本；带幂等守卫，非安全上下文才生效，
  本机 localhost 访问不受影响。
