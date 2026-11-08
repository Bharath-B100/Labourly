# Labourly free-tier boundary — 2 November 2026

Owner instruction: free tier only. No billing account, payment card, paid plan, automatic upgrade or chargeable usage is authorized. Stop when a free quota is exhausted; do not switch to paid capacity. No accounts or paid resources were created in this checkpoint.

## Services that fit the initial no-cost boundary

- Firebase Cloud Messaging: Google documents no charge for FCM. Use an owner-controlled Firebase project. Stay on Spark and do not link Cloud Billing/upgrade to Blaze. Credentials and Android package/signing configuration are still required.
- Expo: Free plan offers limited build/update quotas; free accounts cannot incur overage charges. Wait for quota renewal or use existing local tools if exhausted. Do not choose paid priority builds or paid add-ons.
- Existing local Spring Boot, PostgreSQL test containers, React Native/Jest and admin tooling: no third-party paid service activated.

Sources checked 2 November 2026:
- https://firebase.google.com/products/cloud-messaging
- https://firebase.google.com/docs/projects/billing/firebase-pricing-plans
- https://docs.expo.dev/billing/plans/

## Hosting is not solved by choosing any free plan

Render explicitly says its free instances are not for production. Free web services sleep after 15 idle minutes and free PostgreSQL expires after 30 days. Do not put real customer bookings into an expiring trial database or describe it as reliable production hosting. Source: https://render.com/docs/free

No production Spring Boot/PostGIS hosting solution with verified backup, uptime, data retention and no-cost limits has been provisioned. Do not substitute Firestore for the existing PostgreSQL transaction/locking/exclusion architecture merely because it has a free tier. Hosting remains an unresolved launch dependency within the owner's zero-cost constraint.

A free-tier account is not unlimited service. Public load, retention and availability must fit actual quotas; if they do not, remain in restricted testing rather than incur charges or remove safety controls.

## Remaining owner-controlled setup

Firebase/Expo sign-in, MFA, terms acceptance and project ownership must be completed under Labourly's account. No credentials should be pasted into chat. Existing OAuth client IDs are public configuration; client secrets and private service-account keys stay outside Git/mobile bundles. Store publishing may have separate account requirements/fees; no store registration or payment is authorized by this plan.

No deployment or public release has been performed. All code verification uses local or disposable test environments.
