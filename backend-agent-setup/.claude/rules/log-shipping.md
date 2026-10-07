---
paths:
  - "src/main/java/**/audit/**"
  - "src/main/resources/logback*.xml"
  - "src/test/java/**/audit/**"
---
# Log file rotation, S3 shipping and retention

Each running instance writes to a local file, rotated daily and shipped to S3. Use Logback with a `RollingFileAppender` and a time-based rolling policy. Do not use `FileWriter`, custom file writing or custom rotation logic.

## Daily rotation

- Rotation is based on **Europe/London** local time (GMT/BST aware), not UTC.
- Production rotates at **00:00 Europe/London**; non-production at **19:00 Europe/London**.
- The cutover time is **configurable per environment**.
- At cutover, the current file is closed and a new dated file is opened.
- Use the framework's built-in time-based rolling policy wherever possible.

## Shipping to S3

A scheduled process uploads completed log files to the configured S3 bucket and prefix.

- Never upload the file currently being written.
- Only delete or archive a local file after upload confirmation.
- Retry uploads with backoff.
- Failed uploads generate error logs and operational alerts.
- Multiple instances ship independently; each writes unique file names including an instance or pod identifier.
- The job uses an IAM role for its service account (IRSA), scoped to the required bucket/prefix, with `PutObject` (and `GetObject` if it verifies uploads) only. No static AWS credentials.

## Retention

The application does not delete audit logs. Logs are kept for a maximum of 6 months: anything older is removed by S3 lifecycle policies managed outside this repository. Never assume or build for a longer retention period.

Bucket, prefix, AWS account, scheduler frequency and whether the log directory needs a persistent volume are still open: see `docs/open-questions.md`.

For the step-by-step procedure, use the `log-shipping` skill.
