package com.marketingtool.shared.dto;

import java.util.Map;

public record JobCallbackPayload(
    String stage,
    boolean finalStage,
    Map<String, Object> result
) {}
