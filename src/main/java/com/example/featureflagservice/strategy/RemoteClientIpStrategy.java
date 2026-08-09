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
public class RemoteClientIpStrategy implements ActivationStrategy {

    public static final String ID = "remote-client-ip";
    public static final String PARAM_IPS = "ips";

    @Override
    public String getId() {
        return ID;
    }

    @Override
    public String getName() {
        return "Remote Client IP";
    }

    @Override
    public boolean isActive(FeatureState state, FeatureUser user) {
        String allowedIps = state.getParameter(PARAM_IPS);
        if (allowedIps == null || allowedIps.isBlank()) {
            return false;
        }

        FeatureContext context = FeatureContextUtils.getContext(user);
        if (context == null || context.getClientIp() == null) {
            return false;
        }

        List<String> ipList = Arrays.asList(allowedIps.split("[,\\s]+"));
        return ipList.contains(context.getClientIp());
    }

    @Override
    public Parameter[] getParameters() {
        return new Parameter[]{
                ParameterBuilder.create(PARAM_IPS)
                        .label("IP Addresses")
                        .description("A comma-separated list of IP addresses for which the feature should be active.")
        };
    }
}
