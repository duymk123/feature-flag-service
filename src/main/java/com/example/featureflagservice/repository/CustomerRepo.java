package com.example.featureflagservice.repository;

import com.example.featureflagservice.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CustomerRepo extends JpaRepository<Customer, String> {
    Optional<Customer> findByCustomerCode(String customerCode);
}
