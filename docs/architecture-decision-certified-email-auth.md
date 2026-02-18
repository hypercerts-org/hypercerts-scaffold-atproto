# Certified Email-First Auth: Architecture Decision Document

**Date**: February 18, 2026  
**Constraint**: Ma Earth grants round imminent — need shipping path this week 

---

## TL;DR

**Ship Option A1: a stock (unmodified) PDS at `certified.app` with passwordless email login built entirely in our application layer.** Users enter email, get a code, enter the code, and they're in — no handles, no passwords, no "what's a PDS." Under the hood, we auto-generate a PDS password the user never sees and wrap it with our own OTP service. The PDS stays vanilla and upgradeable. No fork, no upstream dependency, no entryway infrastructure to build.

This ships in **2-3 days** with 2 engineers. It scales to 10-50K users — more than enough for Ma Earth's grants round and the next 3-6 months. The org/RBAC layer is a separate parallel workstream that works identically regardless of auth method. Holke's prototype (`maearth-demo` + `magic-pds`) already validates the UX and OAuth flow — the main work is confirming it runs against a stock PDS (no fork), hardening for production, and redeploying under `certified.app`. When we eventually need multi-PDS (Option B), everything we build now carries over.

---

## The Problem in One Sentence

Users hit the Certified login, see "enter your handle" (e.g. `alice.certified.app`), don't know what a handle is, and leave. We lose them at the exact moment they're most motivated — during grant applications and funding windows.

## What We Want

User enters email → receives code → enters code → they're in. No handles, no passwords, no "what's a PDS." Sign-up and sign-in are identical from the user's perspective. This works across Ma Earth, GainForest, Silvi, and any future Certified app.

## What We Also Need (Organizations)

Users belong to organizations. Each org has shared data (a shared repo or PDS). Users see all orgs they belong to after login, with role-based access (admin, contributor, viewer) controlling who can write to org repos.

---

## The Key Shortcut

The standard ATProto OAuth flow requires handle → DID → PDS resolution. But `oauthClient.authorize('https://certified.app')` skips all of that — if the app already knows the PDS, the user never sees a handle field. [^1] This is the "Sign in with Certified" button. Each app gets independent OAuth tokens (DPoP-bound) for the same DID.

## Hard Constraints

**Entryway ↔ PDS is 1:1.** Emelia: "there is an explicit binding between the Entryway and the PDSes behind it. It's a 1:1 relationship." A PDS can either handle its own auth OR delegate to an entryway — not both, and only one entryway. Building a multi-PDS entryway means building Bluesky's hosting infrastructure from scratch. [^6]

**No native org support.** ATProto has no multi-signature repos, no RBAC, no org identity, no delegation tokens. Every repo has exactly one signing key. All org logic must live in our application layer — the protocol can't help us here. [^7]

**Email can't discover a PDS.** Apps can resolve a handle or DID to find a PDS, but there's no way to go from an email address to a PDS. Emelia: "Applications typically don't know email addresses, so it has to still be handle at the application." This is why a single known PDS (Option A) is so much simpler — we bypass the discovery problem entirely.

**No PDS fork.** Maintaining a fork diverges from upstream and creates ongoing merge burden we can't staff. All passwordless logic must live in our application layer, not inside the PDS. [^8]

---

## Three Architecture Options

### Option A: Single Stock Certified PDS + Application-Layer Passwordless OTP

**What it is**: One stock (unmodified) PDS at `certified.app`. All users get accounts here. A separate Certified backend service handles the passwordless UX — OTP generation, email sending, code validation — and authenticates against the PDS using auto-generated passwords the user never sees. Apps use `oauthClient.authorize('https://certified.app')` — no handle entry needed. The PDS stays vanilla and upgradeable.

**The auth flow a user sees**:
1. On Ma Earth, clicks "Sign in with Certified"
2. Redirected to `certified.app/oauth/authorize`
3. Enters email address
4. Receives OTP code via email
5. Enters code
6. Approves Ma Earth's access (OAuth consent)
7. Redirected back to Ma Earth, logged in

Sign-up is identical: if the email doesn't have an account, the PDS creates one (handle auto-assigned as `username.certified.app`), sends OTP, and continues.

**For organizations**: Application-layer only. Our backend maintains org membership (`user_did → [org_ids]`), roles, and mediates writes to org repos. Org repos are DID-based accounts whose signing keys we hold server-side.

**How to get passwordless without forking the PDS**:

The OTP [PR #4221](https://github.com/bluesky-social/atproto/pull/4221) is a 2FA layer on top of passwords, not passwordless auth. And forking the PDS is a hard no. So we need passwordless UX **without modifying the PDS**.

- **A1: Application-layer OTP + hidden password (no fork). RECOMMENDED.** Keep the stock PDS with standard password auth. Our Certified backend handles the user-facing flow: user enters email → backend generates and sends OTP → user enters code → backend validates → backend authenticates against the stock PDS using an auto-generated password the user never sees. On sign-up, backend calls `com.atproto.server.createAccount` with a random password, stores the password server-side (encrypted), and sends OTP for verification. The PDS stays vanilla and upgradeable. Adds ~1 day for the OTP service layer.

- **A2: Wait for OTP to merge upstream.** If Emelia's PR merges soon, we get native OTP on a stock PDS (though still as 2FA, not passwordless). We could combine it with A1's hidden-password pattern to remove the password step from the user's perspective. Timeline depends entirely on upstream — could be weeks, could be months. Not viable given Ma Earth's timeline.

**Recommendation**: A1. Stock PDS, passwordless UX in our application layer. No fork, no merge conflicts, upgradeable.

**What has to be built**:

| Component | Effort | Notes |
|---|---|---|
| Deploy stock PDS at `certified.app` with SMTP | ✅ Done | Already running |
| OTP service layer (email send, code validation, password management) | 0.5-1 day | Standard patterns; stores encrypted auto-generated passwords + OTP codes |
| Unified sign-up/sign-in flow (auto-create on unknown email) | 0.5 day | Service calls `createAccount` on first OTP, stores credentials |
| OAuth client integration in Ma Earth + GainForest | 0.5 day | Same BFF pattern, different client_id; parallelizable |
| Org membership + RBAC backend | ⏳ In progress | Ma Earth migration plan covers this; see [MIGRATION.md](https://gist.github.com/daviddao/0087cd6cf30144c8e0756a7294f1cff6) |
| Org repo management (server-side signing) | ⏳ In progress | PdsAdminService + PdsRecordService pattern already designed |
| Extend org pattern to GainForest/Silvi | 1-2 days | Adapt PdsRecordService to their Lexicons |
| Integration testing + security hardening | 1-2 days | End-to-end flow testing, rate limiting, secrets management |
| **Total (auth only)** | **~2-3 days** | With 2 engineers; org work is a separate parallel track |

**Risks**:
- We hold auto-generated passwords server-side — if our backend is compromised, all PDS accounts are exposed. Mitigation: encrypt at rest, use a secrets manager (AWS KMS / Vault)
- Two auth layers (our OTP + PDS password) means two things to keep in sync
- Single PDS = single point of failure, scales to ~10-50K users
- If PDS goes down, all apps lose auth

**When this breaks down**: A single PDS handles all user auth, repo operations, and blob storage on one server. Around ~10K active users, response times start degrading — not a hard crash, but a gradual slowdown as database and compute contention increases. The other constraint is organizational: the single-PDS model means all partner data lives on infrastructure we control. If a partner like GainForest or Silvi eventually needs data on their own infrastructure (for compliance, data sovereignty, or organizational policy), this model can't accommodate that. Both pressures push toward Option B eventually, but neither is likely during the Ma Earth grants round timeframe.

---

### Option B: Entryway + Multiple PDSes

**What it is**: A separate auth service (the entryway) handles login for multiple PDSes. Users enter email at the entryway, it routes to the right PDS.

**Why this is harder than it sounds**: Emelia's email is explicit — entryway-to-PDS is a 1:1 binding in the [reference implementation](https://github.com/bluesky-social/atproto/tree/main/packages/pds). The PDS can either self-auth OR delegate to an entryway, not both, and only to one entryway. To do multi-PDS behind one entryway, you'd need to build a custom entryway service that:
- Maintains email → PDS mapping
- Issues tokens accepted by each PDS
- Handles the ES256K JWT signing that PDSes validate
- Coordinates account creation across PDSes

This is essentially building Bluesky's bsky.social infrastructure. The entryway code is not cleanly separated in the reference repo ([bluesky-social/atproto](https://github.com/bluesky-social/atproto)) — it's deeply intertwined with Bluesky's specific hosting setup. [^9]

**What has to be built**:

| Component | Effort | Notes |
|---|---|---|
| Everything in Option A | ~1 week | Same baseline |
| Custom entryway service | 2-3 weeks | No off-the-shelf; must build token issuance, routing, email mapping |
| Multi-PDS deployment + orchestration | 2-3 days | Docker/K8s, monitoring per PDS |
| PDS assignment logic | 1-2 days | By org? By region? By load? |
| **Total** | **~4-5 weeks** | With 2-3 engineers |

**When to choose this**: Only if you know today that you'll need >10K users within 6 months, or partner orgs contractually require separate data hosting.

---

### Option C: Email→PDS Router Microservice

**What it is**: A thin service that maps emails to PDS URLs. Each PDS handles its own auth. The router just tells the app "this user's PDS is at X, redirect them there."

**Why Emelia doesn't recommend this**: From the email thread — "the user could change their email on the PDS and your service wouldn't know about that email change." Also: different PDSes give different login UX (your OTP flow vs Bluesky's password flow), creating a fragmented experience.

**What has to be built**:

| Component | Effort | Notes |
|---|---|---|
| Everything in Option A | ~1 week | Same baseline |
| Router microservice | 1-1.5 weeks | Email→PDS lookup, health checks, caching |
| Handle external PDS auth flows | 1-1.5 weeks | Graceful fallback for non-OTP PDSes |
| Email sync/invalidation handling | 2-3 days | What happens when user changes email on PDS? |
| **Total** | **~4-5 weeks** | With 2-3 engineers |

**When to choose this**: Only if a large fraction of users will come with existing Bluesky/ATProto identities and you want maximum ecosystem purity.

---

## Organizations: No Conflict With Passwordless

ATProto has no native org support — all RBAC lives in the application layer. [^7] Ma Earth is the first app implementing this via an app-managed stock PDS ([MIGRATION.md](https://gist.github.com/daviddao/0087cd6cf30144c8e0756a7294f1cff6)), and the same pattern will be used across Certified apps. The key point: **the org/RBAC layer is completely independent of how users authenticate.** Whether users log in with OTP, password, or carrier pigeon, the org membership DB, permission checks, and server-side repo signing are the same code. These two workstreams can proceed in parallel without interfering with each other.

---

## Recommendation: Option A, Starting Now

**Here's why**:

1. **It can ship in 2-3 days.** The `authorize('https://certified.app')` pattern works today on a stock PDS. The OTP service is standard application-layer code. No fork, no upstream dependency.

2. **No PDS fork required.** The stock PDS handles account creation and password auth. Our OTP service wraps it with a passwordless UX using hidden auto-generated passwords. The PDS stays vanilla and upgradeable.

3. **10-50K users is enough for now.** Ma Earth's grants round won't generate 50K accounts. This buys 3-6 months of runway before scaling pressure.

4. **The migration path to Option B doesn't block anything.** Option A ships for round 3. The entryway + multi-PDS work for Option B can happen in parallel as a round 4 goal later this year, without disrupting what's already live. The app-layer org logic and OAuth client integrations carry over unchanged.

5. **The org pattern is independent of auth and already in progress.** Ma Earth's SDS→PDS migration covers org RBAC, record management, and the PdsAdminService pattern. Whether we run one PDS or five, it's the same code.

6. **Emelia independently arrived at the same conclusion.** From the email thread: "This sounds like you should just have a 'Certified PDS' and then have a button 'Sign in with Certified' which takes you directly to that PDS, where the user can enter their email address."

### Execution Plan

**Days 1-2**: OTP service layer + unified sign-up/sign-in. Verify the flow end-to-end in dev: email → OTP → consent → redirect → logged in. In parallel: OAuth client integration in Ma Earth + GainForest using BFF pattern.

**Day 3**: Integration testing, security hardening, deploy to production. Add "Sign in with ATProto/Bluesky" button for ecosystem interop.

**Org work** (parallel track, already in progress): Ma Earth's SDS→PDS migration continues independently per [MIGRATION.md](https://gist.github.com/daviddao/0087cd6cf30144c8e0756a7294f1cff6). Extend org pattern to GainForest/Silvi once their Lexicons are defined.

### Open Questions to Resolve This Week

1. **Handle assignment strategy**: When a user signs up with `alice@example.com`, do we auto-assign `alice.certified.app`? What about collisions? Recommendation: auto-assign, add numeric suffix for collisions (`alice2.certified.app`), let users change later.

2. **Where does the OTP service live?** Standalone microservice, or built into the existing Ma Earth backend? If other Certified apps need it too, standalone is cleaner — but adds a deployment.

3. **Is Holke's `magic-pds` prototype viable as the OTP service?** If it wraps a stock PDS without modifying it, it could be the starting point. See the [Existing Work](#existing-work-holkes-prototype-maearth-demo--magic-pds) section — the key question is whether it requires a PDS fork.

4. **Hidden password storage**: Where do we store the auto-generated passwords? Same DB as Ma Earth's org credentials, or a separate secrets store? Needs to be encrypted at rest regardless.

---

## Existing Work: Holke's Prototype (`maearth-demo` + `magic-pds`)

Before choosing an architecture, we should evaluate the prototype that's already running — and map it against Options A, B, and C.

**What exists**:
- [`holkexyz/maearth-demo`](https://github.com/holkexyz/maearth-demo) — A Next.js OAuth client (live at [maearth-demo.vercel.app](https://maearth-demo.vercel.app)) that implements passwordless email login against a PDS at `pds.certs.network`, with an external auth service at `auth.pds.certs.network`. Also provisions Ethereum wallets via a separate [`magic-wallet`](https://github.com/holkexyz/magic-wallet) service.
- [`holkexyz/magic-pds`](https://github.com/holkexyz/magic-pds) — A "Passwordless AT Protocol PDS" (referenced in the maearth-demo README). This appears to be the auth service that handles the email OTP flow and sits alongside (or wraps) the PDS.
- [`holkexyz/atproto`](https://github.com/holkexyz/atproto) — A fork of [`bluesky-social/atproto`](https://github.com/bluesky-social/atproto), labeled "HolkesPDS - a friendly fork."

### How the Prototype Maps to the Three Options

The prototype was built before this research, but it lands closest to **Option A (single PDS + application-layer passwordless)** — with one critical divergence.

| Aspect | Option A (Recommended) | Prototype | Match? |
|---|---|---|---|
| **Architecture** | Single PDS + external OTP service | Single PDS (`pds.certs.network`) + external auth (`auth.pds.certs.network` / `magic-pds`) | ✅ Same topology |
| **User-facing flow** | Email → OTP → OAuth consent → redirect | Email → OTP → OAuth consent → redirect | ✅ Identical UX |
| **OAuth implementation** | Full ATProto OAuth (PAR + PKCE + DPoP) | Full ATProto OAuth (PAR + PKCE + DPoP) | ✅ Proven working |
| **PDS modification** | Stock PDS, no fork | `holkexyz/atproto` fork exists and may be deployed | ⚠️ Key divergence |
| **Passwordless method** | Hidden auto-generated password, user never sees it | Unknown — does `magic-pds` use hidden passwords, or bypass PDS auth? | ❓ Needs verification |
| **Handle entry** | Skipped via `authorize('https://certified.app')` | Skipped for email users; handle login supported as fallback | ✅ Same pattern |
| **Multi-PDS routing** | Not needed (single PDS) | Not needed (single PDS) | ✅ N/A for both |
| **Org/RBAC support** | Application-layer, separate from auth | Not implemented | — Expected; prototype focused on auth |

The prototype is **not** Option B (no entryway, no multi-PDS coordination) and **not** Option C (no email→PDS router — it talks to one known PDS). It is structurally Option A with the auth service externalized, which is exactly what A1 recommends.

### What the Prototype Did Right

1. **Nailed the UX.** The email → OTP → consent → redirect flow is precisely what we want users to experience. This was validated before the research confirmed it as the right approach.
2. **Separated auth from PDS internals.** The `magic-pds` service sits alongside the PDS as a separate process at its own subdomain (`auth.pds.certs.network`). This is directionally aligned with A1's "application-layer OTP" pattern — the passwordless logic doesn't live inside the PDS.
3. **Full ATProto OAuth compliance.** PAR, PKCE, DPoP — the hard parts of ATProto OAuth are already implemented and working. This is non-trivial and saves significant effort.
4. **Handle fallback for ecosystem interop.** The prototype already supports handle-based login for users with existing ATProto identities, alongside the email flow. This matches our plan for a "Sign in with ATProto/Bluesky" button.
5. **Wallet provisioning as a bonus.** The `magic-wallet` service (Ethereum wallet creation) is outside the auth scope but demonstrates the extensibility of the architecture — additional services can plug in alongside the auth flow.

### What Can Be Done Better

1. **Eliminate the PDS fork dependency (critical).** The existence of `holkexyz/atproto` is the biggest risk. If `pds.certs.network` is running the fork, we're violating the hard constraint ("No PDS fork" — maintaining a fork diverges from upstream and creates ongoing merge burden we can't staff). **Action**: determine whether the fork is deployed or was an experiment. If deployed, migrate to a stock PDS and confirm `magic-pds` works against it without PDS modifications.
2. **Clarify the credential management pattern.** Option A1 specifies a hidden-password approach: auto-generate a password the user never sees, authenticate against the stock PDS with it, store the password encrypted server-side. If `magic-pds` uses a different mechanism (e.g., bypassing PDS auth, issuing its own tokens, or relying on fork-specific APIs), it needs to be adapted to the hidden-password pattern to work with a stock PDS.
3. **Production hardening.** The prototype is a proof-of-concept. Before it can serve Ma Earth's grants round, it needs: rate limiting on OTP attempts, OTP expiry and replay protection, encrypted storage for auto-generated passwords (AWS KMS / Vault), email deliverability setup (SPF/DKIM/DMARC for `certified.app`), error handling and graceful degradation, and logging/monitoring for auth failures.
4. **Org/RBAC layer is missing (expected).** The prototype only covers auth. The org membership, role-based access, and server-side repo signing described in Option A still need to be built — but this is a separate parallel workstream already covered by [MIGRATION.md](https://gist.github.com/daviddao/0087cd6cf30144c8e0756a7294f1cff6).
5. **Consolidate deployment to `certified.app`.** The prototype runs on `pds.certs.network` / `auth.pds.certs.network`. For the recommended architecture, everything should live under `certified.app` (PDS at `certified.app`, auth service at `auth.certified.app` or as a route on the same domain). This simplifies the `authorize('https://certified.app')` pattern and unifies the brand.

### Bottom Line

The prototype validates that Option A's architecture works in practice — the UX, the OAuth flow, and the external-auth-service topology are all proven. The open risk is the PDS fork. **If `magic-pds` works against a stock PDS**, the prototype is a significant head start and the remaining work shrinks to hardening, credential management cleanup, and redeployment under `certified.app`. **If it depends on the fork**, we extract the valuable pieces (OTP logic, OAuth client, frontend flow, wallet integration) and rebuild the auth layer on top of a stock PDS per A1.

---

## References

[^1]: ATProto OAuth spec, ["Identity Authentication" section](https://atproto.com/specs/oauth): "starting with a server hostname, provided by the user." Also confirmed in the [`@atproto/oauth-client-browser` README](https://www.npmjs.com/package/@atproto/oauth-client-browser): the user can provide "Their PDS/Entryway hostname" instead of a handle.

[^2]: [PR #4221](https://github.com/bluesky-social/atproto/pull/4221) by ThisIsMissEm (Emelia). Opened September 2025, 14 commits, still open/unmerged on the `feat/email-based-otp` branch. OTP is enforced only for accounts with confirmed emails; app passwords bypass OTP.

[^3]: [PR #4461](https://github.com/bluesky-social/atproto/pull/4461) (merged) added `prompt=create` to the reference PDS. [Discussion #4587](https://github.com/bluesky-social/atproto/discussions/4587) proposes standardizing it in the ATProto OAuth profile.

[^4]: [Issue #4194](https://github.com/bluesky-social/atproto/issues/4194) documents `PDS_EMAIL_SMTP_URL` configuration. The PDS uses Nodemailer internally via `emailSmtpUrl` in [`packages/pds/src/config/env.ts`](https://github.com/bluesky-social/atproto/blob/main/packages/pds/src/config/env.ts).

[^5]: [Discussion #4118](https://github.com/bluesky-social/atproto/discussions/4118): "granular permissions have been implemented on the bsky.social hosting service, and are rolling out to the self-hosted PDS distribution."

[^6]: Emelia's email (Feb 18, 2026): "there is an explicit binding between the Entryway and the PDSes behind it. It's a 1:1 relationship." And: "The reference PDS implementation can either be behind an entryway or support its own authentication and authorization — not both."

[^7]: The ATProto spec defines no org Lexicons. Each repo has exactly one signing key per the [repo spec](https://atproto.com/specs/repository).

[^8]: [`holkexyz/atproto`](https://github.com/holkexyz/atproto) exists as a fork but maintaining divergence from [`bluesky-social/atproto`](https://github.com/bluesky-social/atproto) is not viable for our team size.

[^9]: The entryway logic lives across multiple packages in [bluesky-social/atproto](https://github.com/bluesky-social/atproto) — primarily in [`packages/pds`](https://github.com/bluesky-social/atproto/tree/main/packages/pds) and [`packages/oauth/oauth-provider`](https://github.com/bluesky-social/atproto/tree/main/packages/oauth/oauth-provider). There is no standalone `entryway` package or service. The bsky.social entryway behavior (centralizing OAuth for multiple PDSes) is implemented through Bluesky's internal infrastructure and is not available as a reusable component. See also [Discussion #3095](https://github.com/bluesky-social/atproto/discussions/3095).

[^10]: Bryan Newbold, ["Community Spaces on AT Protocol"](https://whtwnd.com/bnewbold.net/3lhbpyx2luc2v), February 2025. Describes group accounts, membership records, and governance delegation patterns that validate the app-managed PDS approach. 
