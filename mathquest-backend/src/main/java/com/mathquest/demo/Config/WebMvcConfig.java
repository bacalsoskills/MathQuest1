package com.mathquest.demo.Config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.format.FormatterRegistry;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

@Override
public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/**")
            .allowedOriginPatterns("http://localhost:3000", "http://127.0.0.1:3000") // ✅ supports local dev
            //.allowedOriginPatterns("https://your-frontend-domain.com") // add production domain here
            .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
            .allowedHeaders("Authorization", "Content-Type", "Accept", "X-Requested-With", "Origin")
            .exposedHeaders("Content-Disposition", "Content-Type")
            .allowCredentials(true)
            .maxAge(3600);
}


    @Override
    public void addFormatters(FormatterRegistry registry) {
        // Add custom converter for String to Long that handles "undefined" and "null"
        // strings
        registry.addConverter(new Converter<String, Long>() {
            @Override
            public Long convert(String source) {
                if (source == null || source.trim().isEmpty() ||
                        "undefined".equalsIgnoreCase(source.trim()) ||
                        "null".equalsIgnoreCase(source.trim())) {
                    return null;
                }
                try {
                    return Long.parseLong(source);
                } catch (NumberFormatException e) {
                    // Log the error but return null instead of throwing exception
                    System.err.println("Cannot convert string to Long: " + source);
                    return null;
                }
            }
        });
    }
}