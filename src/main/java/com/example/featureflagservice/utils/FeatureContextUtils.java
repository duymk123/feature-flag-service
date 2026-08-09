package com.example.featureflagservice.utils;

import com.example.featureflagservice.common.FeatureContextConstants;
import com.example.featureflagservice.dto.FeatureContext;
import org.togglz.core.user.FeatureUser;

public final class FeatureContextUtils {

    private FeatureContextUtils() {
        // Prevent instantiation
    }

    public static FeatureContext getContext(FeatureUser user) {
        if (user == null) {
            return null;
        }
        Object attribute = user.getAttribute(FeatureContextConstants.ATTRIBUTE);
        if (attribute instanceof FeatureContext context) {
            return context;
        }
        return null;
    }
}
