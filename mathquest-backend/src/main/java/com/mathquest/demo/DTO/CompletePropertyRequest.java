package com.mathquest.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CompletePropertyRequest {
    private Integer propertyIndex;
    private String propertyName;
    private String badgeName;
    private Integer totalSteps;
    private Long completionTimeSeconds;
}
