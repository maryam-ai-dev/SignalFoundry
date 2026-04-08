package com.marketingtool.engagement;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EngagementService {

    private final CommentDraftRepository draftRepository;
    private final CommentOpportunityRepository opportunityRepository;

    @Transactional
    public CommentDraft approveDraft(UUID draftId) {
        CommentDraft draft = draftRepository.findById(draftId)
                .orElseThrow(() -> new EntityNotFoundException("Draft not found: " + draftId));

        CommentOpportunity opportunity = opportunityRepository.findById(draft.getOpportunityId())
                .orElseThrow(() -> new EntityNotFoundException("Opportunity not found: " + draft.getOpportunityId()));

        if (opportunity.getStatus() == CommentOpportunity.Status.EXPIRED) {
            throw new ExpiredOpportunityException("Cannot approve draft — opportunity has expired");
        }

        if (draft.isRequiresEdit()) {
            throw new RequiresEditException("Cannot approve draft — requires edit first");
        }

        draft.setStatus(CommentDraft.Status.APPROVED);
        draft.setApprovedAt(Instant.now());
        draftRepository.save(draft);

        opportunity.setStatus(CommentOpportunity.Status.DRAFT_READY);
        opportunityRepository.save(opportunity);

        return draft;
    }

    @Transactional
    public CommentDraft rejectDraft(UUID draftId) {
        CommentDraft draft = draftRepository.findById(draftId)
                .orElseThrow(() -> new EntityNotFoundException("Draft not found: " + draftId));
        draft.setStatus(CommentDraft.Status.REJECTED);
        return draftRepository.save(draft);
    }

    @Transactional
    public CommentDraft editDraft(UUID draftId, String editedText) {
        CommentDraft draft = draftRepository.findById(draftId)
                .orElseThrow(() -> new EntityNotFoundException("Draft not found: " + draftId));
        draft.setEditedText(editedText);
        draft.setRequiresEdit(false);
        return draftRepository.save(draft);
    }
}
