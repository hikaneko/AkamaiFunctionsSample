# Akamai Functions Samples

A collection of WebAssembly (Fermyon Spin) samples for Akamai Functions.

## Samples

### [html-manipulation](./html-manipulation)

A Wasm Function that acts as a reverse proxy, fetching HTML from an upstream server and rewriting relative links to absolute URLs.

- Proxies incoming requests to a configurable upstream server
- Rewrites matching relative links in HTML responses to absolute URLs using a regex pattern
- Passes non-HTML content (images, CSS, JS, etc.) through unchanged

### [cron-poller](./cron-poller)

A Wasm Function that periodically polls a target URL using Spin cron jobs on Akamai Functions.

- Triggered by a Spin cron job on a configurable schedule (e.g. every 10 minutes)
- Sends an HTTP GET request to the configured target URL
- Logs the response status code and body

### [zuplo-ai-gateway-integration](./zuplo-ai-gateway-integration)

An AI chat application that runs on Akamai Functions and uses [Zuplo](https://zuplo.com/) as an AI Gateway to handle LLM API routing.

- Serves a React-based chat UI (no build step required)
- Proxies `/api/chat` requests to the Zuplo AI Gateway, keeping the upstream URL hidden from the browser
- Zuplo handles authentication, rate limiting, and routing to LLM backends (OpenAI, Gemini, etc.)
- Exposes a `/api/info` endpoint that returns the IP and city of the running edge node

### [chat-auth-demo](./chat-auth-demo)

A login-gated AI chat application on Akamai Functions — only users who log in successfully can chat, backed by a JWT auth policy on the AAM (AI Gateway).

- Serves a React-based chat UI with a username/password login form (no pasted API key)
- Proxies `/api/login` to a token-issuing AAM auth-server, and `/api/chat` to a JWT-protected AAM (AI Gateway) route — the browser never talks to either upstream directly, only ever holding the short-lived JWT it received from login
- Requests without a valid JWT (missing, expired, or tampered) are rejected with 401 before reaching the LLM backend
- Exposes a `/api/info` endpoint that returns the IP and city of the running edge node
