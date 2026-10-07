---
name: log-shipping
description: Test-first procedure for the audit log's daily rotation (Logback, Europe/London cutover per environment) and the scheduled job that ships completed files to S3 with retries, upload confirmation and IRSA credentials. Use this whenever you build or change log rotation, the logback configuration, the S3 shipping job or its scheduling.
---

# Audit log rotation and S3 shipping (test-first)

Relevant rules: `.claude/rules/log-shipping.md`, `audit-logging.md`, `tdd.md`, `testing.md`. Use the `tdd-cycle` loop and the `test-infrastructure` skill (`AuditLogCapture`). Never connect to a real AWS account or bucket.

## 1. Check the open decisions
`docs/open-questions.md`:
- **#4** bucket, prefix and AWS account, and **#5** how often the scheduler runs: keep both in configuration with no defaults that point at real resources.
- **#6** whether the log directory needs a persistent volume: affects `deploy/`, which you do not change; note it in the report.
- **#12** S3 in tests: until it is decided, use a **mocked S3 client** and report `NEEDS-DECISION` for the S3 container.
If the sprint contract needs something these leave open, **stop and return `NEEDS-DECISION`**.

## 2. Rotation (Logback only)
**Red first**, then configure:
- a `RollingFileAppender` with a time-based rolling policy for the audit logger; no `FileWriter`, custom writing or custom rotation;
- rotation on **Europe/London** time at a **configurable cutover** (00:00 in production, 19:00 elsewhere), correct across the GMT/BST change;
- file names include the date and an instance or pod identifier, so instances never collide;
- records stay single-line JSON (`audit-logging.md`).
Test with a fixed `Clock` or the policy's own time source; cover a cutover on a clock-change day.

## 3. Shipping job
**Red first**, with the S3 client mocked, test that the job:
- uploads only **completed** files, never the one being written;
- uses a key under the configured prefix that includes the instance identifier;
- deletes or archives a local file **only after** the upload is confirmed;
- retries with backoff, then logs an error and emits a failure audit record (`AuditLogCapture`) when retries run out, leaving the file in place;
- is safe to run again after a partial run, and on several instances at once;
- never deletes logs by age: retention (six months) is S3 lifecycle, outside this repository.
Commit the failing tests (`test(sprint-NN): ACn failing tests`), then implement.

## 4. Credentials and configuration
- AWS SDK with the **default credential chain** (IRSA in OpenShift). No static keys, no `aws` CLI calls, no credentials in `application*.yml`.
- Bucket, prefix, cutover time, time zone and schedule come from `@ConfigurationProperties` bound to environment variables.
- Record the IAM permissions needed (`PutObject`, plus `GetObject` only if the job verifies uploads, scoped to the bucket and prefix) in the PR description, not in code.

## 5. Finish
`./mvnw clean verify`. Report what was built, the tests for each behaviour, the configuration keys each environment must set (names only), and the open questions still affecting it.
