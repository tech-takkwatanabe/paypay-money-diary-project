import { createServer } from "node:https";
import { readFileSync } from "node:fs";
import { parse } from "node:url";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import next from "next";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = next({ dev: false });
const handle = app.getRequestHandler();
const port = process.env.PORT || 3000;

let httpsOptions;
try {
	const keyPath = process.env.SSL_KEY_PATH || join(__dirname, "../../.certificate/localhost-key.pem");
	const certPath = process.env.SSL_CERT_PATH || join(__dirname, "../../.certificate/localhost-cert.pem");
	
	httpsOptions = {
		key: readFileSync(keyPath),
		cert: readFileSync(certPath),
	};
} catch (error) {
	console.error(`❌ Failed to read SSL certificate files: ${error.message}`);
	process.exit(1);
}

app.prepare()
	.then(() => {
		const server = createServer(httpsOptions, (req, res) => {
			const parsedUrl = parse(req.url || "", true);
			handle(req, res, parsedUrl);
		});

		server.on("error", (err) => {
			console.error(`❌ Failed to start server: ${err.message}`);
			process.exit(1);
		});

		server.listen(port, () => {
			console.log(`▲ Next.js production server (HTTPS)`);
			console.log(`  - Local:   https://localhost:${port}`);
		});
	})
	.catch((err) => {
		console.error(`❌ Failed to prepare Next.js app: ${err.message}`);
		process.exit(1);
	});
