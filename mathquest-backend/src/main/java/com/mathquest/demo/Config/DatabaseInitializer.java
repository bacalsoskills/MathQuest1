package com.mathquest.demo.Config;

import com.mathquest.demo.Model.ERole;
import com.mathquest.demo.Model.Role;
import com.mathquest.demo.Repository.RoleRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DatabaseInitializer implements CommandLineRunner {

    @Autowired
    private RoleRepository roleRepository;

    @Override
    public void run(String... args) throws Exception {
        initRoles();
    }

    private void initRoles() {
        // Initialize roles if they don't exist
        for (ERole role : ERole.values()) {
            if (!roleRepository.existsById(role.ordinal() + 1)) {
                roleRepository.save(new Role(role));
            }
        }
    }
}