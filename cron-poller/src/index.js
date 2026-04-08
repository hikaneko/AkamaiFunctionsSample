import { AutoRouter } from "itty-router";

const router = AutoRouter();

// Replace with the URL you want to poll
const TARGET_URL = "<TARGET_URL>";

router.get("/poll", async () => {
  const now = new Date().toISOString();
  console.log(`[${now}] Polling ${TARGET_URL}`);

  try {
    const response = await fetch(TARGET_URL, {
      method: "GET",
      headers: {
        "User-Agent": "SpinCronPoller/1.0",
      },
    });

    const body = await response.text();
    console.log(`[${now}] Status: ${response.status}`);
    console.log(`[${now}] Body: ${body.slice(0, 200)}`);

    return new Response(
      JSON.stringify({ status: response.status, body: body.slice(0, 200) }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    console.error(`[${now}] Error: ${err}`);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
});

addEventListener("fetch", (event) => {
  event.respondWith(router.fetch(event.request));
});
