---
paths:
  - "src/main/java/**/audit/**"
  - "src/main/resources/logback*.xml"
  - "src/test/java/**/audit/**"
---
# Log file rotation, S3 shipping and retention

Each running instance writes two local files, an **audit log** and an **application log** (see `.claude/rules/audit-logging.md`). Both are rotated daily, shipped to S3 and retained in exactly the same way; everything below applies to both. Use Logback with one `RollingFileAppender` and time-based rolling policy per file. Do not use `FileWriter`, custom file writing or custom rotation logic.

File names start with the log type (`audit` or `application`) and include the date and an instance or pod identifier, so the type is clear from the name alone, locally and in S3.

## Daily rotation

- Rotation is based on **Europe/London** local time (GMT/BST aware), not UTC.
- Production rotates at **00:00 Europe/London**; non-production at **19:00 Europe/London**.
- The cutover time is **configurable per environment**.
- Both files use the same cutover, from one configuration value.
- At cutover, the current file is closed and a new dated file is opened.
- Use the framework's built-in time-based rolling policy wherever possible.

## Shipping to S3

One scheduled process uploads completed log files of both types to the configured S3 bucket and prefix.

- The log type stays in the object key, so audit and application files can be told apart in the bucket.
- Never upload the file currently being written.
- Only delete or archive a local file after upload confirmation.
- Retry uploads with backoff.
- Failed uploads generate error logs and operational alerts.
- Multiple instances ship independently; each writes unique file names including an instance or pod identifier.
- The job uses an IAM role for its service account (IRSA), scoped to the required bucket/prefix, with `PutObject` (and `GetObject` if it verifies uploads) only. No static AWS credentials.

## Retention

The application does not delete audit or application logs. Both are kept for a maximum of 6 months: anything older is removed by S3 lifecycle policies managed outside this repository. Never assume or build for a longer retention period.

Bucket, prefix, AWS account, scheduler frequency and whether the log directory needs a persistent volume are decided per project: if they are not written here, they are open questions in `docs/open-questions.md`.

For the step-by-step procedure, use the `log-shipping` skill.
