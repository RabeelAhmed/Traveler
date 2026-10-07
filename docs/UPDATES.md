# Traveler updates

## Implemented

- Versioned cache keys separate collection-owner access from public access, public profiles from account profiles, and viewer-specific like flags. Social writes clear affected cached views. Existing cache entries are not reused.
- Public profiles explicitly select public fields, including nested post authors. Reset tokens and session versions are excluded from ordinary account queries.
- Access tokens expire after 24 hours. Authentication checks account existence and session version. Password resets atomically consume a hashed token, change the password, increment the session version, and disconnect sockets.
- Authentication logs no longer print passwords or access tokens. Signup/reset passwords must contain at least eight characters and at most 72 UTF-8 bytes.
- Sockets authenticate using the access token and join server-assigned user rooms. Client-controlled message relaying is removed; the API emits saved messages. Typing events check conversation membership. Coordinates are validated and location updates are throttled.
- Messages initially show the latest 30 entries, support loading older history using an ID cursor, and poll every ten seconds in active conversations without sockets. Only fetched messages are marked read. Failed sends restore the text.
- Signup/profile uploads are rate limited; profile pictures have a 10 MB parser limit. File extensions and MIME types must agree. Signed upload receipts bind post/story media to the submitting account and prevent substituting another asset URL or public ID. Signup profile receipts are scoped separately.
- Redis counters use an atomic increment/expiry operation. Local development without Redis has a bounded in-memory limiter. Configured Redis failures return 503 instead of bypassing limits. Forwarded IPs are trusted only through configured proxy hops.
- Existing API response envelopes now set actual HTTP statuses. Axios preserves server errors and clears expired sessions. Route IDs, account fields, collection fields, search length, message text and pagination are validated.
- Journey creation/step writes and following updates use MongoDB transactions. New conversations have a unique participant key. Added query indexes for posts, conversations, messages, notifications, and story cleanup.
- Stories older than 24 hours are filtered on reads. A daily serverless cleanup endpoint removes media and documents, retaining failed media deletions for retry. Persistent servers continue hourly cleanup.
- Fixed post-card conditional hooks, the marker component, and feed/story error handlers. ESLint ignores generated caches. MotionConfig respects reduced-motion preferences for Framer Motion animations.
- Shared frontend libraries are split into cacheable vendor chunks. The advisor uses one shared result map. Geographic recommendations use great-circle distance with coordinate range checks.
- Regression tests are available through `npm test` in `server`.

## Release preparation

Local verification: 12 regression tests and 10 isolated replica-set integration flows pass, backend/agent JavaScript syntax checks pass, and the frontend production build passes. The main application JavaScript chunk decreased from approximately 541 KB to 221 KB before gzip; vendor code is now separate. Full ESLint still reports 403 errors and 7 warnings, with no undefined-variable or hook-order findings.

1. Use MongoDB Atlas or a replica set. Transactions do not work with a standalone MongoDB instance. The previous local example connection needs a replica-set configuration for journey/follow writes.
2. Set a strong `JWT_SECRET`. Previously issued tokens without expiry will be rejected; users need to sign in again. Pending reset links created before this change must be requested again.
3. Set `CRON_SECRET` on the backend hosting project. The Vercel schedule calls `/internal/cleanup-stories` daily. Its secret is sent in the Authorization header; see [Vercel's cron documentation](https://vercel.com/docs/cron-jobs/manage-cron-jobs).
4. Run `npm run db:indexes` from `server` against the target database during release preparation. Production startup does not automatically create indexes. This script creates declared indexes without dropping existing ones; investigate any duplicate-key failure before release.
5. Configure Upstash Redis for shared production rate limits. The local limiter is per process and does not provide a distributed production limit. Set `TRUST_PROXY_HOPS` only for the trusted proxy chain outside Vercel.
6. Deploy frontend and backend together: new media creates require upload receipts, and sockets require authenticated handshakes. Previously saved posts still render; unfinished uploads should be uploaded again.
7. Set `VITE_SOCKET_IO_ENABLED=true` only for a persistent backend that supports sockets. Vercel deployments use the messaging polling fallback.
8. Verify signup, login, reset email, media uploads, private collections, collaborative steps, and cleanup with two test accounts on staging. Local MongoDB transactions and concurrent writes passed integration tests. Hosted MongoDB, Cloudinary, Resend, and deployed socket connections still need staging verification.

## Remaining work

- The repository still has existing lint findings for missing prop validation, unused declarations, unescaped JSX text, and effect dependencies. Semantic undefined-variable and hook-order errors found during this change have been fixed; the full lint command is not clean.
- Add cursor pagination with matching UI controls for feeds, profiles, search, notifications, and conversation lists. The current notification/conversation limits are 100; this is a bound, not complete pagination.
- Replace coarse social cache invalidation with targeted invalidation or versioned namespaces as traffic grows.
- Add a durable cleanup queue, locking, upload orphan cleanup, and reconciliation. Cleanup processes at most 100 expired stories per call and reports whether another batch may remain.
- Large videos still use in-memory upload buffers. Production serverless request limits can be lower than application limits; migrate large files to a signed direct-upload flow with server-side ownership verification.
- Signup upload receipts can be replayed during their one-hour lifetime. A persisted provisional upload session with one-time consumption would further harden anonymous signup uploads.
- The advisor is dataset-based filtering/proximity lookup. Learned preference ranking, destination pages, trip dates/budgets/export, reporting/blocking/moderation, comprehensive accessibility QA, and image optimization remain separate feature work.
- Regression tests mock cache/socket services; the integration suite checks database indexes and transaction races against a disposable replica set. Hosted services still need staging verification. Run `npm ci --prefix server/verification` and `node server/verification/integration.cjs` to repeat the integration suite (its first run downloads MongoDB).
