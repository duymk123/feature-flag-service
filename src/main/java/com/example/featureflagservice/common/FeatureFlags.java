package com.example.featureflagservice.common;

import org.togglz.core.Feature;
import org.togglz.core.annotation.EnabledByDefault;
import org.togglz.core.annotation.Label;
import org.togglz.core.context.FeatureContext;

public enum FeatureFlags implements Feature {
    @Label("Buy Now")
    BUY_NOW,

    @Label("Price Increase")
    PRICE_INCREASE,

    @Label("OrderDetail")
    @EnabledByDefault
    ORDER_DETAIL;


    public boolean isActive() {

        return FeatureContext.getFeatureManager().isActive(this);
    }
}
