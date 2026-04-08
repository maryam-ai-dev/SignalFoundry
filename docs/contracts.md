# Contracts

Shared Pydantic (Python) and Java record shapes used for inter-service communication.

---

## Shared

### GoalContext

Optional goal-directed context attached to scans and generation. `null` = GENERAL mode.

| Field | Type | Default | Notes |
|---|---|---|---|
| goal_type / goalType | string | required | e.g. AWARENESS, ENGAGEMENT, CONVERSION |
| target_audience / targetAudience | string? | null | |
| desired_action / desiredAction | string? | null | |
| cta_style / ctaStyle | string? | null | |
| tone_guidance / toneGuidance | string? | null | |

**Python:** `app.contracts.shared.GoalContext`
**Java:** `com.marketingtool.shared.dto.GoalContext`

---

## Research

### RunResearchScanRequest

Request to start a niche intelligence scan.

| Field | Type | Default | Notes |
|---|---|---|---|
| workspace_id / workspaceId | string | required | |
| query_text / queryText | string | required | |
| platforms | list[string] | required | e.g. ["reddit", "youtube"] |
| mode | string | "GENERAL" | GENERAL or CAMPAIGN |
| goal_context / goalContext | GoalContext? | null | Required when mode = CAMPAIGN |

**Python:** `app.contracts.research.RunResearchScanRequest`
**Java:** `com.marketingtool.shared.dto.ResearchContracts.RunResearchScanRequest`

### ResearchScanResult

Result returned after a scan completes.

| Field | Type | Default | Notes |
|---|---|---|---|
| run_id / runId | string | required | |
| status | string | required | e.g. COMPLETED, FAILED |
| normalized_post_count / normalizedPostCount | int | required | |
| normalized_comment_count / normalizedCommentCount | int | required | |
| errors | list[string] | [] | Per-connector error messages |

**Python:** `app.contracts.research.ResearchScanResult`
**Java:** `com.marketingtool.shared.dto.ResearchContracts.ResearchScanResult`
