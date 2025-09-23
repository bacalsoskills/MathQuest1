package com.mathquest.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SaveProgressRequest {
    private List<Integer> completedProperties;
    private Integer activePropertyIndex;
    private Integer totalPropertiesCompleted;
}
