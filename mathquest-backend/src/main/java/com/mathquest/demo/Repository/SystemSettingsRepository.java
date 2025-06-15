package com.mathquest.demo.Repository;

import com.mathquest.demo.Model.SystemSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface SystemSettingsRepository extends JpaRepository<SystemSettings, Long> {
    // Find the first settings record ordered by ID
    Optional<SystemSettings> findFirstByOrderByIdAsc();
}