package com.example.featureflagservice.strategy;

import com.example.featureflagservice.dto.FeatureContext;
import com.example.featureflagservice.utils.FeatureContextUtils;
import org.springframework.stereotype.Component;
import org.togglz.core.activation.Parameter;
import org.togglz.core.activation.ParameterBuilder;
import org.togglz.core.repository.FeatureState;
import org.togglz.core.spi.ActivationStrategy;
import org.togglz.core.user.FeatureUser;

import java.util.Map;

@Component
public class RemoteSystemPropertyStrategy implements ActivationStrategy {

    public static final String ID = "remote-system-property";
    public static final String PARAM_PROPERTY_NAME = "property";
    public static final String PARAM_PROPERTY_VALUE = "value";

    @Override
    public String getId() {
        return ID;
    }

    @Override
    public String getName() {
        return "Remote System Property";
    }

    @Override
    public boolean isActive(FeatureState state, FeatureUser user) {
        String propertyName = state.getParameter(PARAM_PROPERTY_NAME);
        String expectedValue = state.getParameter(PARAM_PROPERTY_VALUE);

        if (propertyName == null || propertyName.isBlank()) {
            return false;
        }

        FeatureContext context = FeatureContextUtils.getContext(user);
        if (context == null || context.getSystemProperties() == null) {
            return false;
        }

        Map<String, String> properties = context.getSystemProperties();
        if (!properties.containsKey(propertyName)) {
            return false;
        }

        String actualValue = properties.get(propertyName);
        
        // Nếu không điền value mong muốn, chỉ cần có property là được
        if (expectedValue == null || expectedValue.isBlank()) {
            return true;
        }

        return expectedValue.equals(actualValue);
    }

    @Override
    public Parameter[] getParameters() {
        return new Parameter[]{
                ParameterBuilder.create(PARAM_PROPERTY_NAME)
                        .label("Property Name")
                        .description("The name of the system property that should be checked."),
                ParameterBuilder.create(PARAM_PROPERTY_VALUE)
                        .label("Property Value")
                        .description("Optional: The expected value of the property. If empty, it only checks if the property exists.")
                        .optional()
        };
    }
}
