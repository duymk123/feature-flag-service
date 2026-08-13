package com.example.featureflagservice.repository;

import com.example.featureflagservice.entity.Customer;
import com.example.featureflagservice.entity.CustomerFeatureFlag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CustomerFeatureFlagRepo extends JpaRepository<CustomerFeatureFlag, String> {
    List<CustomerFeatureFlag> findByFlagName(String flagName);

    List<CustomerFeatureFlag> findByCustomer(Customer customer);

    Optional<CustomerFeatureFlag> findByCustomerAndFlagName(Customer customer, String flagName);

    void deleteAllByCustomer(Customer customer);
}
