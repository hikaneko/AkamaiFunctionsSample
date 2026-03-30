const UPSTREAM_URL = "https://zuplo-proxy.akamai.tech/v1/chat/completions";
const EDC_URL = "http://edc.edgesuite.net/";

addEventListener("fetch", async (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(req) {
  const url = new URL(req.url);

  if (url.pathname === "/api/info" && req.method === "GET") {
    return handleInfo();
  }

  if (url.pathname === "/api/chat" && req.method === "POST") {
    return handleChat(req);
  }

  return new Response(JSON.stringify({ error: "Not Found" }), {
    status: 404,
    headers: { "content-type": "application/json" },
  });
}

async function handleInfo() {
  try {
    const res = await fetch(EDC_URL);
    const html = await res.text();

    // Extract: "Your IP is 1.2.3.4 (close to CITY, CC)."
    const match = html.match(/Your IP is ([\d.]+) \(close to ([^,]+),/);
    const ip = match ? match[1] : "unknown";
    const city = match ? match[2].trim() : "unknown";

    return new Response(JSON.stringify({ ip, city }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ip: "unknown", city: "unknown" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
}

async function handleChat(req) {
  const authHeader = req.headers.get("authorization") || "";

  try {
    const body = await req.arrayBuffer();

    const upstream = await fetch(UPSTREAM_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": authHeader,
      },
      body: body,
    });

    const responseBody = await upstream.arrayBuffer();
    const contentType = upstream.headers.get("content-type") || "application/json";

    return new Response(responseBody, {
      status: upstream.status,
      headers: { "content-type": contentType },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Upstream request failed" }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
}
