package com.example.featureflagservice.strategy;

import com.example.featureflagservice.dto.FeatureContext;
import com.example.featureflagservice.utils.FeatureContextUtils;
import org.springframework.stereotype.Component;
import org.togglz.core.activation.Parameter;
import org.togglz.core.activation.ParameterBuilder;
import org.togglz.core.repository.FeatureState;
import org.togglz.core.spi.ActivationStrategy;
import org.togglz.core.user.FeatureUser;

import java.util.Arrays;
import java.util.List;

@Component
public class RemoteSpringProfileStrategy implements ActivationStrategy {

    public static final String ID = "remote-spring-profile";
    public static final String PARAM_PROFILES = "profiles";

    @Override
    public String getId() {
        return ID;
    }

    @Override
    public String getName() {
        return "Remote Spring Profile";
    }

    @Override
    public boolean isActive(FeatureState state, FeatureUser user) {
        String allowedProfiles = state.getParameter(PARAM_PROFILES);
        if (allowedProfiles == null || allowedProfiles.isBlank()) {
            return false;
        }

        FeatureContext context = FeatureContextUtils.getContext(user);
        if (context == null || context.getSpringProfiles() == null || context.getSpringProfiles().isEmpty()) {
            return false;
        }

        List<String> profileList = Arrays.asList(allowedProfiles.split("[,\\s]+"));
        for (String profile : profileList) {
            if (context.getSpringProfiles().contains(profile)) {
                return true;
            }
        }
        return false;
    }

    @Override
    public Parameter[] getParameters() {
        return new Parameter[]{
                ParameterBuilder.create(PARAM_PROFILES)
                        .label("Spring Profiles")
                        .description("A comma-separated list of Spring profiles for which the feature should be active.")
        };
    }
}
