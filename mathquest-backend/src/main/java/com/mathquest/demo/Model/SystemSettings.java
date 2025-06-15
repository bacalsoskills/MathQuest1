package com.mathquest.demo.Model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "system_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SystemSettings {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "theme_primary_color")
    private String themePrimaryColor;

    @Column(name = "theme_secondary_color")
    private String themeSecondaryColor;

    @Column(name = "default_language")
    private String defaultLanguage = "en";

    @Column(name = "timezone")
    private String timezone = "UTC";

    @Column(name = "system_name")
    private String systemName;

    @Lob
    @Column(name = "system_logo", columnDefinition = "LONGBLOB")
    private byte[] systemLogo;

    @Column(name = "system_logo_name")
    private String systemLogoName;

    @Column(name = "dark_mode_enabled")
    private boolean darkModeEnabled;

    @Column(name = "theme_mode")
    private String themeMode = "neutral";

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "settings_id")
    private List<Announcement> announcements = new ArrayList<>();
}