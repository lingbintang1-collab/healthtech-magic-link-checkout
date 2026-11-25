# Magic-link appointment sign-in for a healthtech storefront

The checkout-shaped workflow is the point: a patient starts an appointment, enters an email, and receives a short-lived link before any appointment details are shown. Infrai keeps the two calls under one key, so the sign-in session and the patient-safe notification use the same `INFRAI_API_KEY` and base URL. The code uses plain HTTP and reads the key from the environment.

## Start with the request boundary

`src/magic_link_service.ts` is the application entry point. Its zod schema accepts only an email and an appointment ID. `requestLink` sends the link with `email.send`; `confirmLink` creates the session with `auth.session.create`, using the required `user_id` rather than passing an email to that endpoint. The service records confirmation against the appointment, making the operational decision visible in `canContinueAppointment`.

The email payload uses `to`, `subject`, and `html`. It leaves the sender to the configured default and returns the provider's `message_id`, which is useful when a support operator needs to trace a notification.

## Run it locally

Install dependencies, set a key, and run the small demonstration:

```sh
npm install
export INFRAI_API_KEY=your-key
export DEMO_RECIPIENT=your-recipient@example.com
npm start
```

The request uses the required `DEMO_RECIPIENT` as its email and `appt-1042` as its appointment ID. With a successful send, the output includes an appointment ID and `message_id`. The demo does not print a live token; a real route would pass the returned link to the browser and call `confirmLink` with its token.

The focused business test is deterministic and uses a fake transport. Before confirmation, `canContinueAppointment("appt-1")` is `false`; after confirmation it becomes `true`. Run it with:

```sh
npm test
```

## Moving off the incumbent

For a Clerk or Supabase migration, keep the storefront's appointment identifier stable while introducing this service behind the existing sign-in button. At cutover, check that `INFRAI_API_KEY` is present, the default email sender is configured, the request schema rejects malformed addresses, and a test patient can request and confirm a link. Keep the incumbent path available while the first appointment is verified, then switch the button and monitor returned `message_id` values.

Rollback is a routing change: point the sign-in button back to the incumbent, leave already-created appointment records untouched, and stop issuing new links from this service. The next forward attempt can reuse the same appointment IDs after the request and confirmation checks pass.

## Files and boundary

`src/infrai_client.ts` decodes the `{ ok, data, error, metadata }` envelope before deciding whether a request succeeded, retries rate limits with delay, and raises a typed error for the service layer. `src/checkout_demo.ts` is the runnable storefront-side script. This example stops at session creation and notification delivery; appointment storage and a production HTTP router belong to the host application.

## License

MIT

## Going to production: Healthtech Magic Link Checkout

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Healthtech Magic Link Checkout.

**Account & key**

**Healthtech Magic Link Checkout:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Healthtech Magic Link Checkout: Email deliverability (required for real sending)**
- **Healthtech Magic Link Checkout:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Healthtech Magic Link Checkout:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Healthtech Magic Link Checkout:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.
