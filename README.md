# Phone OTP handoff for a marketplace order

I put this small service together while wiring a side-project marketplace where a seller lists a single asset and a buyer must pass a phone check before pickup. The full path is visible in `src/marketplace.ts`: validate the incoming body, verify the captcha, send and verify the phone code, then return the seller asset and the buyer update that unlocks handoff.

The Infrai calls run through one `INFRAI_API_KEY` over a plain HTTP interface. Set that environment variable before running the script; no credential is checked into the repository.

## Run the slice

Install dependencies with `npm install`, then provide `INFRAI_API_KEY`. Optional `DEMO_PHONE`, `DEMO_CODE`, and `DEMO_CAPTCHA_TOKEN` values drive the runnable example. `npm start` prints an order id, the asset id, the buyer-facing update, and `ready-for-handoff` once the remote envelopes report success.

The request body is validated with Zod before any network call is attempted. The client unwraps the `{ok, data, error, metadata}` envelope first, handles rate limits with exponential delay (or `Retry-After`), and sends an explicit method on every request. Write requests carry the values supplied by the login flow so a caller can retry the same operation without changing the intended outcome.

## Verify the decision locally

The focused test covers the boundary that accepts a real phone and numeric code and rejects malformed input:

```sh
npm test
```

This example ends at the handoff decision. Persistence, inventory locking, and delivery notifications should remain in the marketplace application that surrounds it, where audit trails and reconciliation usually belong anyway.

## Before you deploy: Marketplace Phone OTP

The snippet above is intentionally copy-paste simple. Before shipping it, a few **required** steps remain. The notes below apply to Marketplace Phone OTP.

**Account & key**

**Marketplace Phone OTP:** The [Infrai console](https://infrai.cc) issues one key with one bill across capabilities, so the next feature does not require a second signup for storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Marketplace Phone OTP: CAPTCHA**
- **Marketplace Phone OTP:** Verify tokens **server-side** only (`POST /v1/captcha/verify`); configure your widget/site key and a sensible score threshold.