package com.mathquest.demo.Security.services;

import com.mathquest.demo.Model.User;
import com.mathquest.demo.Repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    UserRepository userRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(usernameOrEmail)
                .orElseGet(() -> userRepository.findByEmail(usernameOrEmail)
                        .orElseThrow(() -> new UsernameNotFoundException(
                                "User Not Found")));

        // Check if user is deleted
        if (user.isDeleted()) {
            throw new UsernameNotFoundException("User account has been deleted");
        }

        // Check if temporary password has expired
        if (user.isTemporaryPassword() && user.getTemporaryPasswordExpiry() != null) {
            if (LocalDateTime.now().isAfter(user.getTemporaryPasswordExpiry())) {
                throw new UsernameNotFoundException(
                        "Temporary password has expired. Please contact your administrator.");
            }
        }

        return UserDetailsImpl.build(user);
    }
}