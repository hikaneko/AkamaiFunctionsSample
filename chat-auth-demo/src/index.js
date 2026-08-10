const LOGIN_URL = "https://zuplo-auth-server-main-375181e.d2.zuplo.dev/login";
const CHAT_URL = "https://red-salamander-main-30e3b86.d2.zuplo.dev/config_66ddcc8ec2754ed3ae86ca93c0252445/v1/chat/completions";
const EDC_URL = "http://edc.edgesuite.net/";

// Injected server-side (never sent by the browser) so long-winded replies
// don't slow down perceived response time in the UI.
const CONCISE_SYSTEM_PROMPT =
  "You are a concise assistant. Always keep answers as short as possible—get straight to the point, avoid preambles, repetition, and unnecessary elaboration. Always reply in the same language the user's most recent message is written in.";

// Akamai Functions kills the whole invocation at 30s with an opaque 500.
// Race our own timeout first so we control the response shape instead.
const UPSTREAM_TIMEOUT_MS = 25000;

function timeout(ms) {
  return new Promise((resolve) => setTimeout(() => resolve({ kind: "timeout" }), ms));
}

addEventListener("fetch", async (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(req) {
  const url = new URL(req.url);

  if (url.pathname === "/api/info" && req.method === "GET") {
    return handleInfo();
  }

  if (url.pathname === "/api/login" && req.method === "POST") {
    return handleLogin(req);
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

// Proxies to the auth-server so the browser never learns its URL, matching
// the same hide-upstream pattern as /api/chat below.
async function handleLogin(req) {
  try {
    const rawBody = await req.text();

    const upstream = await fetch(LOGIN_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: rawBody,
    });

    const responseBody = await upstream.arrayBuffer();
    return new Response(responseBody, {
      status: upstream.status,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Login request failed" }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
}

async function handleChat(req) {
  const authHeader = req.headers.get("authorization") || "";

  try {
    const rawBody = await req.text();

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (err) {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    payload.messages = [
      { role: "system", content: CONCISE_SYSTEM_PROMPT },
      ...(payload.messages || []),
    ];
    const body = JSON.stringify(payload);

    // The browser only ever holds the JWT it got from /api/login; this
    // header is forwarded as-is straight to red-salamander's jwt-auth-inbound
    // policy on the chat-app route.
    const fetchPromise = fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": authHeader,
      },
      body: body,
    }).then((r) => ({ kind: "response", response: r }));

    // Swallow late rejections that arrive after the timeout has already won
    // the race, so they don't surface as unhandled rejections.
    const result = await Promise.race([
      fetchPromise.catch((err) => ({ kind: "error", err })),
      timeout(UPSTREAM_TIMEOUT_MS),
    ]);

    if (result.kind === "error") {
      throw result.err;
    }

    if (result.kind === "timeout") {
      return new Response(
        JSON.stringify({ error: "timeout", message: "Upstream did not respond in time" }),
        { status: 504, headers: { "content-type": "application/json" } }
      );
    }

    const upstream = result.response;
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
