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

---

## Generation

### GenerateHooksRequest

Request to generate hook suggestions from scan data.

| Field | Type | Default | Notes |
|---|---|---|---|
| workspace_id / workspaceId | string | required | |
| topic | string | required | |
| pain_clusters / painClusters | list[dict] | [] | |
| narrative_clusters / narrativeClusters | list[dict] | [] | |
| goal_context / goalContext | GoalContext? | null | |
| voice_profile_id / voiceProfileId | string? | null | |

**Python:** `app.contracts.generation.GenerateHooksRequest`
**Java:** `com.marketingtool.shared.dto.GenerationContracts.GenerateHooksRequest`

### HookGenerationResult

| Field | Type | Default | Notes |
|---|---|---|---|
| hooks | list[dict] | required | |

**Python:** `app.contracts.generation.HookGenerationResult`
**Java:** `com.marketingtool.shared.dto.GenerationContracts.HookGenerationResult`

### GenerateCommentDraftRequest

Request to generate comment drafts for an engagement opportunity.

| Field | Type | Default | Notes |
|---|---|---|---|
| workspace_id / workspaceId | string | required | |
| post_context / postContext | dict | required | |
| voice_profile_id / voiceProfileId | string? | null | |
| goal_context / goalContext | GoalContext? | null | |

**Python:** `app.contracts.generation.GenerateCommentDraftRequest`
**Java:** `com.marketingtool.shared.dto.GenerationContracts.GenerateCommentDraftRequest`

### CommentDraftResult

| Field | Type | Default | Notes |
|---|---|---|---|
| drafts | list[dict] | required | |

**Python:** `app.contracts.generation.CommentDraftResult`
**Java:** `com.marketingtool.shared.dto.GenerationContracts.CommentDraftResult`

---

## Voice

### AnalyzeVoiceSampleRequest

Request to analyse a writing sample for voice stylometry.

| Field | Type | Default | Notes |
|---|---|---|---|
| workspace_id / workspaceId | string | required | |
| sample_type / sampleType | string | required | TEXT or AUDIO |
| content | string? | null | Text content (when sample_type = TEXT) |
| file_path / filePath | string? | null | File path (when sample_type = AUDIO) |

**Python:** `app.contracts.voice.AnalyzeVoiceSampleRequest`
**Java:** `com.marketingtool.shared.dto.VoiceContracts.AnalyzeVoiceSampleRequest`

### VoiceSampleAnalysisResult

Result of voice sample analysis.

| Field | Type | Default | Notes |
|---|---|---|---|
| features | dict | required | Extracted style feature vector |
| quality_score / qualityScore | float | required | 0.0–1.0 |
| is_sufficient / isSufficient | bool | required | Whether sample meets minimum quality |
| word_count / wordCount | int | required | |

**Python:** `app.contracts.voice.VoiceSampleAnalysisResult`
**Java:** `com.marketingtool.shared.dto.VoiceContracts.VoiceSampleAnalysisResult`
