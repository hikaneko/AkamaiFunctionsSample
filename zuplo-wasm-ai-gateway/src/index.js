const UPSTREAM_URL = "https://zuplo-proxy.akamai.tech/v1/chat/completions";

addEventListener("fetch", async (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(req) {
  const url = new URL(req.url);

  if (req.method !== "POST" || url.pathname !== "/api/chat") {
    return new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }

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
