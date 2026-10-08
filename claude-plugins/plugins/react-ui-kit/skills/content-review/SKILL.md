---
name: content-review
description: Read-only review of the words users see in the UI - headings, labels, hints, buttons, links, error messages, notifications and page titles - against the project's design system writing guidance, plain English and sentence case, with suggested rewrites. Use this when someone asks to check wording, error messages or content, or after adding a new journey.
argument-hint: "[path(s), default src/pages and src/components]"
---

# Content review

Relevant rules: `.claude/rules/forms-accessibility.md` (Content), and `design-system.md` if the project has it. Checklist: the Content section of `docs/reference/accessibility-checklist.md`. Read-only: report, change nothing unless asked.

## 1. Collect the text
- From the argument, or `src/pages/**` and `src/components/**`, plus the user-facing messages built in `src/services/`.
- Every string a user sees or hears: page titles, headings, labels, hints, button and link text, error summary and inline errors, notifications, empty states, confirmation pages, `aria-label` and visually hidden text.
- Skip test files, mocks and internal event names.

## 2. Check each string
- **Plain English:** short sentences, common words, active voice, no jargon or internal system names a user would not know.
- **Sentence case** everywhere, including buttons and headings.
- **Errors** say what went wrong and how to fix it, in the design system's patterns ("Enter ...", "Select ...", "... must be ..."); never blame the user; never raw server text, status codes or stack traces.
- **Buttons and links** make sense out of context; no "click here" or "read more"; buttons start with a verb.
- **Page titles** follow one pattern across the service, and the error state starts with "Error: ".
- **Consistency:** the same thing has the same name everywhere (for example the same label for the same field on every page).
- **Placeholders:** no lorem ipsum, sample names, emails or test data in shipped text.
- **Inclusive and specific:** no "please" padding, no ambiguous dates or numbers.

## 3. Report

| File:line | Current text | Problem | Suggested text |
|---|---|---|---|

Group by page. Note any naming inconsistency once, with every place it appears.

## 4. If the user wants the changes
Tests assert on visible text, so wording changes are code changes: update the test first, then the text, using the `react-ui-kit:fix-bug` skill or the normal `react-ui-kit:tdd-cycle` loop.
