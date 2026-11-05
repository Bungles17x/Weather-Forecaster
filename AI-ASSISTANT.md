# WeatherDesk AI Assistant

WeatherDesk has two assistant modes:

- **Local weather helper:** Works without an AI key. It applies transparent rules to data already loaded by WeatherDesk and provides meteorology explanations for a focused set of topics. It labels its limitations rather than claiming to be a full language model.
- **Optional AI model:** Uses a separately hosted Node.js backend. The backend keeps the provider API key on the server, receives the selected location and loaded weather context, exposes tool calls for current conditions, forecast periods, precipitation-probability windows, and alert-feed status, then calls the configured AI provider. Those tools read the already-loaded context snapshot; they do not independently fetch radar imagery or fresh NWS records. The browser only knows the backend URL.

All live weather data shown by the app continues to come from the National Weather Service / Weather.gov services described in the main README. The AI model receives a snapshot of already-loaded NWS products; it does not have independent access to the user's browser, private accounts, or an image of the live radar map. A backend response should never be treated as an official alert.

## Local helper only

No additional setup is required. Leave `VITE_WEATHERDESK_AI_ENDPOINT` empty. The Assistant page shows **LOCAL WEATHER HELPER** and answers from the last successfully loaded local data plus general meteorology explanations.

## Enable the optional model locally

1. Use Node.js 20 or newer and install the project dependencies with `npm ci`.
2. Set the AI provider secret in the backend process environment. For a PowerShell session:

   ```powershell
   $env:OPENAI_API_KEY = "your-secret-key"
   $env:AI_PORT = "8787"
   $env:AI_ALLOWED_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"
   npm run start:ai
   ```

   On macOS/Linux, use `export OPENAI_API_KEY=...`, `export AI_PORT=8787`, and `export AI_ALLOWED_ORIGINS=...` before `npm run start:ai`.
3. Create `.env.local` in the project root with this public endpoint URL:

   ```env
   VITE_WEATHERDESK_AI_ENDPOINT=http://localhost:8787/api/assistant
   ```

4. Start the web app in another terminal with `npm run dev` and open the local Vite URL.
5. Confirm that the Assistant page shows **AI RESPONSE ACTIVE** after a successful model response. If the backend or provider fails, WeatherDesk indicates that it used the local helper instead.

The backend only reads `OPENAI_API_KEY` from its server environment. **Never place it in `.env.local`, a `VITE_*` variable, frontend code, a public repository, or the compiled `docs/` directory.** AI provider usage can incur charges or usage limits under the configured provider account. Set appropriate budget/usage controls before exposing the backend publicly. The model name is configurable with the server-only `OPENAI_MODEL` variable (defaults to `gpt-4.1-mini`).

## Deploying for public access

GitHub Pages can host the static WeatherDesk frontend, but it cannot run this Node server or safely keep a private provider key. To enable model responses in a public deployment, host `server/ai-server.mjs` or an equivalent protected API on a server/serverless platform, set `OPENAI_API_KEY` as a server secret, configure `AI_ALLOWED_ORIGINS` for the exact deployed frontend origin, and set `VITE_WEATHERDESK_AI_ENDPOINT` to the HTTPS endpoint before building the frontend.

The included backend provides request-size checks, strict allowed-origin handling, a per-IP in-memory rate limit, a request timeout, and no persistent conversation storage. For public production use, put it behind a reputable HTTPS host/reverse proxy, configure the true trusted client IP handling, add provider budget alerts, monitor abuse, and consider distributed rate limiting. An in-memory limiter is a basic guardrail, not a complete public-service abuse-prevention system.

## Data and safety limitations

- The context passed to the model is a snapshot of data already loaded in the user's browser. Refresh WeatherDesk to obtain newer products.
- No radar image is sent. The assistant cannot visually inspect a radar image just because the Radar page is open.
- Missing or failed products remain unknown; an alert-feed failure is not an all-clear.
- The local fallback is deterministic and limited; it is not a substitute for a real language model for open-ended requests.
- The application is independent educational software, not an official NWS product. Follow actual official alert text and local emergency authorities.


## Provider status note

The current backend request path is OpenAI Chat Completions. The `AI_PROVIDER` variable documents the intended provider abstraction but Anthropic and Ollama are not yet wired into the request adapter in this build; do not set those values expecting them to work.
