package com.mathquest.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserSummaryDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String username;
    private String email;
    private boolean inClassroom = false;
    private byte[] profileImage;

    public UserSummaryDTO(Long id, String firstName, String lastName, String username, String email) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.username = username;
        this.email = email;
    }

    public UserSummaryDTO(Long id, String firstName, String lastName, String username, String email,
            byte[] profileImage) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.username = username;
        this.email = email;
        this.profileImage = profileImage;
    }
}