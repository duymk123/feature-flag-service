package com.example.featureflagservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class FeatureFlagServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(FeatureFlagServiceApplication.class, args);
    }

}
