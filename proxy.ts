//
// Simple Node TS proxy server.
// Author: ChatGPT.
//

import { default as http, IncomingMessage, ServerResponse } from "http";
import url from "url";

const PROXY_PORT = 3000;
const TARGET_HOST = "localhost";
const TARGET_PORT = 3001;

// In-memory toggle
let proxyEnabled = true;

const server = http.createServer(
  (req: IncomingMessage, res: ServerResponse) => {
    if (!req.url || !req.method) {
      res.writeHead(400);
      res.end("Bad request");
      return;
    }

    const parsedUrl = url.parse(req.url, true);

    // Serve the toggle page
    if (parsedUrl.pathname === "/proxy/toggle") {
      if (req.method === "POST") {
        // Toggle state
        proxyEnabled = !proxyEnabled;
        res.writeHead(302, { Location: "/proxy/toggle" });
        res.end();
        return;
      }

      // GET -> show the page
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Proxy Toggle</title>
            <style>
              body { font-family: sans-serif; padding: 2rem; }
              button { padding: 1rem 2rem; font-size: 1.2rem; }
            </style>
          </head>
          <body>
            <h1>Proxy is ${proxyEnabled ? "ON" : "OFF"}</h1>
            <form method="POST">
              <button type="submit">Toggle Proxy</button>
            </form>
          </body>
        </html>
      `;
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(html);
      return;
    }

    // If proxy is disabled, reject requests
    if (!proxyEnabled) {
      res.writeHead(503, { "Content-Type": "text/plain" });
      res.end("Proxy is OFF");
      return;
    }

    // Proxy logic
    const options: http.RequestOptions = {
      hostname: TARGET_HOST,
      port: TARGET_PORT,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: `${TARGET_HOST}:${TARGET_PORT}`,
      },
    };

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on("error", (err) => {
      console.error("Proxy error:", err);
      res.writeHead(502);
      res.end("Bad gateway");
    });

    req.pipe(proxyReq);
  }
);

server.listen(PROXY_PORT, () => {
  console.log(`Proxy listening on http://localhost:${PROXY_PORT}`);
  console.log(`Toggle page: http://localhost:${PROXY_PORT}/proxy/toggle`);
});
