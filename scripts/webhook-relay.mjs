import http from "node:http";

// Public tunnel must target this relay, never the application's port directly.
const target = "http://127.0.0.1:3000/api/payments/webhook";
const server = http.createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/api/payments/webhook") {
    response.writeHead(404).end();
    return;
  }
  if (!request.headers["content-type"]?.startsWith("application/json")) {
    response.writeHead(415).end();
    return;
  }
  try {
    let size = 0;
    const chunks = [];
    for await (const chunk of request) {
      size += chunk.length;
      if (size > 65536) {
        response.writeHead(413).end();
        return;
      }
      chunks.push(chunk);
    }
    const result = await fetch(target, {
      method: "POST",
      redirect: "error",
      headers: {
        "Content-Type": "application/json",
        "X-SFPY-SIGNATURE": String(request.headers["x-sfpy-signature"] ?? ""),
      },
      body: Buffer.concat(chunks),
      signal: AbortSignal.timeout(15000),
    });
    response.writeHead(result.status, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    });
    response.end(await result.text());
  } catch {
    if (!response.headersSent)
      response.writeHead(502, { "Content-Type": "application/json" });
    response.end('{"error":"Local webhook unavailable."}');
  }
});
server.requestTimeout = 20000;
server.headersTimeout = 10000;
server.listen(8791, "127.0.0.1", () =>
  console.log(
    "Webhook-only relay listening on 127.0.0.1:8791. All other routes return 404.",
  ),
);
