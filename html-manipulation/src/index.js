const UPSTREAM_BASE = "<Your Upstream URL>";
const TARGET_BASE = "<Your Target URL>";

// Convert only relative href links matching the pattern to absolute URLs
const LINK_PATTERN = /href="(<Match Condition>)"/g;

async function handleRequest(request) {
  // Build the upstream URL by appending the incoming path + query string
  // e.g. /path/a.html         → <Your Upstream URL>/path/a.html
  // e.g. /path/all.html?q=1   → <Your Upstream URL>/path/all.html?q=1
  const incomingUrl = new URL(request.url);
  const upstreamUrl = UPSTREAM_BASE + incomingUrl.pathname + incomingUrl.search;

  const response = await fetch(upstreamUrl);

  if (!response.ok) {
    return new Response(
      `Failed to fetch upstream: ${response.status} ${response.statusText}\n${upstreamUrl}`,
      { status: response.status, headers: { "Content-Type": "text/plain; charset=UTF-8" } }
    );
  }

  const contentType = response.headers.get("Content-Type") ?? "";

  // Pass through non-HTML responses (images, CSS, JS, etc.) unchanged
  if (!contentType.includes("text/html")) {
    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    });
  }

  const html = await response.text();

  // Rewrite example:
  //   href="<Match Condition>"
  //   → href="<Your Target URL><Match Condition>"
  const rewritten = html.replace(LINK_PATTERN, `href="${TARGET_BASE}$1"`);

  return new Response(rewritten, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=UTF-8" },
  });
}

addEventListener("fetch", (event) => {
  event.respondWith(
    handleRequest(event.request).catch((err) =>
      new Response(`Internal error: ${err.message}`, {
        status: 500,
        headers: { "Content-Type": "text/plain; charset=UTF-8" },
      })
    )
  );
});
