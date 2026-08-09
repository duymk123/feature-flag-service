package com.example.featureflagservice.adapter;

import com.example.featureflagservice.dto.FeatureContext;

public final class FeatureContextHolder {

    private static final ThreadLocal<FeatureContext> CONTEXT_HOLDER = new ThreadLocal<>();

    private FeatureContextHolder() {
        // Prevent instantiation
    }

    public static void setContext(FeatureContext context) {
        CONTEXT_HOLDER.set(context);
    }

    public static FeatureContext getContext() {
        return CONTEXT_HOLDER.get();
    }

    public static void clear() {
        CONTEXT_HOLDER.remove();
    }
}
