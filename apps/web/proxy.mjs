import { createServer } from "node:https";
import { request } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { spawn } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const HTTPS_PORT = 3000;
const HTTP_PORT = 3001;

// 1. Next.js を標準の HTTP (ポート 3001) で起動
const nextProcess = spawn("npx", ["next", "start", "-p", HTTP_PORT.toString()], {
	stdio: "inherit",
	shell: true,
});

nextProcess.on("exit", (code) => {
	process.exit(code || 0);
});

// 2. HTTPS 証明書の読み込み
let httpsOptions;
try {
	httpsOptions = {
		key: readFileSync(join(__dirname, "../../.certificate/localhost-key.pem")),
		cert: readFileSync(join(__dirname, "../../.certificate/localhost-cert.pem")),
	};
} catch (error) {
	console.error(`❌ Failed to read SSL certificate files: ${error.message}`);
	nextProcess.kill();
	process.exit(1);
}

// 3. HTTPS プロキシサーバーの起動
const proxy = createServer(httpsOptions, (req, res) => {
	const options = {
		hostname: "localhost",
		port: HTTP_PORT,
		path: req.url,
		method: req.method,
		headers: {
			...req.headers,
			"x-forwarded-proto": "https",
			"x-forwarded-host": req.headers.host,
		},
	};

	const proxyReq = request(options, (proxyRes) => {
		res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
		proxyRes.pipe(res);
	});

	proxyReq.on("error", (err) => {
		console.error(`❌ Proxy error: ${err.message}`);
		res.writeHead(502);
		res.end("Bad Gateway");
	});

	req.pipe(proxyReq);
});

proxy.listen(HTTPS_PORT, () => {
	console.log(`▲ HTTPS Local Proxy: https://localhost:${HTTPS_PORT} -> http://localhost:${HTTP_PORT}`);
});

process.on("SIGINT", () => {
	nextProcess.kill();
	process.exit();
});
