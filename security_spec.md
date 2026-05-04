# Security Specification: HR ScreenPro Agent

## 1. Data Invariants
- A `Candidate` must have a valid score (0-100) if status is not `PENDING`.
- All `Candidate` documents must have a non-empty `resumeText`.
- Only authenticated HR administrators (based on email) can write to `config`.
- Candidates can be created by any authenticated user (simulating public application), but only HR can read/update them? 
- Wait, the request says "Candidate Screening Agent". Usually, HR uploads documents.
- Let's assume HR uses the tool.

## 2. The Dirty Dozen Payloads
1. **Identity Spoofing**: Attempting to set `score: 100` for a candidate without running AI.
2. **Resource Poisoning**: Document ID with 1KB junk characters.
3. **Ghost Fields**: Adding `isVerified: true` to a candidate.
4. **State Shortcutting**: Moving from `PENDING` directly to `INTERVIEW_SCHEDULED` without a score.
5. **PII Leak**: Non-admin user reading all candidates' emails and resume text.
6. **Denial of Wallet**: Creating 10,000 candidates in a loop.
7. **Type Mismatch**: Setting `score: "one hundred"`.
8. **Negative Score**: Setting `score: -50`.
9. **Oversized Field**: Setting `matchReasoning` to 2MB of text.
10. **Admin Elevation**: Trying to overwrite `/config/main` to change the JD to something malicious.
11. **Immutable Bypass**: Changing `appliedDate` after creation.
12. **Null ID**: Using `null` or `..` as a path variable.

## 3. Test Preview
The tests will verify that:
- `create` on `candidates` requires valid schema and authentication.
- `update` on `candidates` validates specific action keys (e.g., status change).
- `read` on `candidates` is restricted to authorized HR (or user email match).
- `config` has immutable fields.
