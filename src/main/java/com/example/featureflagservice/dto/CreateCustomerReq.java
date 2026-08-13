package com.example.featureflagservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateCustomerReq {
    @NotBlank
    private String customerCode;

    @NotBlank
    private String name;

    @NotBlank
    private String ipAddress;
}
