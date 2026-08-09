package com.example.featureflagservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Request body khi tạo flag mới.
 */

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class CreateFlagReq {
    @NotBlank(message = "Name không được để trống")
    @Pattern(regexp = "^[A-Z][A-Z0-9_]*$",
            message = "Name phải viết hoa, chỉ chứa chữ cái, số và dấu gạch dưới. Ví dụ: BUY_NOW")
    private String name;

    private String description;

    private boolean enabled = false;
}

