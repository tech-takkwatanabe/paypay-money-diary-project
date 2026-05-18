import { createServer } from "node:https";
import { readFileSync } from "node:fs";
import { parse } from "node:url";
import next from "next";

const app = next({ dev: false });
const handle = app.getRequestHandler();
const port = process.env.PORT || 3000;

const httpsOptions = {
	key: readFileSync("../../.certificate/localhost-key.pem"),
	cert: readFileSync("../../.certificate/localhost-cert.pem"),
};

app.prepare().then(() => {
	createServer(httpsOptions, (req, res) => {
		const parsedUrl = parse(req.url || "", true);
		handle(req, res, parsedUrl);
	}).listen(port, () => {
		console.log(`▲ Next.js production server (HTTPS)`);
		console.log(`  - Local:   https://localhost:${port}`);
	});
});
