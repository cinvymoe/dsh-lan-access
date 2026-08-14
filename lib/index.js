/**
 * dsh-lan-access — DSH 局域网访问插件（代码部分）
 *
 * 职责：
 *   1) webserver 绑定 0.0.0.0 由 cordis.patch.yml 负责（见同目录补丁）；
 *   2) 本模块通过 webserver 的 tapIndex 钩子，给每次返回的 index.html
 *      注入 crypto.randomUUID polyfill。
 *
 * 为什么需要 polyfill：浏览器只在"安全上下文"（HTTPS 或 localhost）暴露
 * `crypto.randomUUID`。本机访问 127.0.0.1 是安全上下文，而局域网明文
 * HTTP（如 http://192.168.x.x:3080）不是，`crypto.randomUUID` 不存在，
 * 导致 DSH 浏览器端 RPC（消息 ID / RPC ID）全部抛
 * "crypto.randomUUID is not a function"，项目/会话列表与工作区全部不可用。
 * 注入的兜底实现仅用于功能可用性，非安全用途。
 */
const name = "dsh-lan-access";

/** 需要 webserver 服务先就绪，才能注册 index tap。 */
const inject = ["webServer"];

/** UUID v4 兜底实现（Math.random 版，与 Node crypto 同构，非加密用途）。 */
function uuidV4Fallback() {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

/** 注入到 <head> 末尾的内联脚本；带幂等守卫，重复注入不叠加。 */
const POLYFILL_SCRIPT = `<script>
if (typeof crypto !== "undefined" && typeof crypto.randomUUID !== "function") {
	crypto.randomUUID = ${uuidV4Fallback.toString()};
}
</script>`;

/**
 * @param ctx - plugin context；因 inject: [webServer]，ctx.webServer 可用。
 * @param config - 本行配置（当前无配置项）。
 */
function apply(ctx) {
	ctx.webServer.tapIndex((html) =>
		html.includes("randomUUID") ? html : html.replace("</head>", POLYFILL_SCRIPT + "</head>")
	);
}

export { apply, inject, name };
