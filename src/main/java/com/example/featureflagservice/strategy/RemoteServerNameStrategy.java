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
public class RemoteServerNameStrategy implements ActivationStrategy {

    public static final String ID = "remote-server-name";
    public static final String PARAM_SERVER_NAMES = "serverNames";

    @Override
    public String getId() {
        return ID;
    }

    @Override
    public String getName() {
        return "Remote Server Name";
    }

    @Override
    public boolean isActive(FeatureState state, FeatureUser user) {
        String allowedServers = state.getParameter(PARAM_SERVER_NAMES);
        if (allowedServers == null || allowedServers.isBlank()) {
            return false;
        }

        FeatureContext context = FeatureContextUtils.getContext(user);
        if (context == null || context.getHost() == null) {
            return false;
        }

        List<String> serverList = Arrays.asList(allowedServers.split("[,\\s]+"));
        return serverList.contains(context.getHost());
    }

    @Override
    public Parameter[] getParameters() {
        return new Parameter[]{
                ParameterBuilder.create(PARAM_SERVER_NAMES)
                        .label("Server Names")
                        .description("A comma-separated list of server names/hosts for which the feature should be active.")
        };
    }
}
