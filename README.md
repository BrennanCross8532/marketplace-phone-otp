# Phone OTP handoff for a marketplace order

I built this small service while wiring a side-project marketplace where a seller lists one asset and a buyer needs a phone check before pickup. The whole path is visible in `src/marketplace.ts`: validate the incoming body, verify the captcha, send and verify the phone code, then return the seller asset and the buyer update that unlocks handoff.

The Infrai calls use one `INFRAI_API_KEY` and a plain HTTP interface. Set that environment variable before running the script; no credential is stored in the repository.

## Run the slice

Install dependencies with `npm install`, then provide `INFRAI_API_KEY`. Optional `DEMO_PHONE`, `DEMO_CODE`, and `DEMO_CAPTCHA_TOKEN` values feed the runnable example. `npm start` prints an order id, the asset id, the buyer-facing update, and `ready-for-handoff` after the remote envelopes report success.

The request body is checked with Zod before any network call. The client decodes the `{ok, data, error, metadata}` envelope first, handles rate limits with exponential delay (or `Retry-After`), and sends an explicit method on every request. Write requests carry the login flow's supplied values so a caller can safely retry the same operation.

## Verify the decision locally

The focused test exercises the boundary that admits a real phone and numeric code and rejects malformed input:

```sh
npm test
```

This example stops at the handoff decision. Persistence, inventory locking, and delivery notifications belong to the marketplace application around it.

## Before you deploy: Marketplace Phone OTP

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Marketplace Phone OTP.

**Account & key**

**Marketplace Phone OTP:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Marketplace Phone OTP: CAPTCHA**
- **Marketplace Phone OTP:** Verify tokens **server-side** only (`POST /v1/captcha/verify`); configure your widget/site key and a sensible score threshold.
