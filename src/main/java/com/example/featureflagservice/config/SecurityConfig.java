package com.example.featureflagservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.togglz.core.user.SimpleFeatureUser;
import org.togglz.core.user.UserProvider;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration

public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/v1/flags/**").permitAll() // Trả API public cho tracking-order gọi thoải mái
                        .requestMatchers("/togglz-console/**").hasRole("FEATURE_ADMIN") // Khóa giao diện UI lại
                        .anyRequest().authenticated()
                )
                .formLogin(withDefaults()) // Hiển thị form đăng nhập mặc định của Spring
                .httpBasic(withDefaults()); // Hoặc popup đăng nhập
        return http.build();
    }

    @Bean
    public org.springframework.web.cors.CorsConfigurationSource corsConfigurationSource() {
        org.springframework.web.cors.CorsConfiguration configuration = new org.springframework.web.cors.CorsConfiguration();
        configuration.setAllowedOrigins(java.util.List.of("*"));
        configuration.setAllowedMethods(java.util.List.of("*"));
        configuration.setAllowedHeaders(java.util.List.of("*"));
        org.springframework.web.cors.UrlBasedCorsConfigurationSource source = new org.springframework.web.cors.UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
    // 1. TẠO TÀI KHOẢN IN-MEMORY (Lưu trên RAM)
    @Bean
    public UserDetailsService userDetailsService() {
        UserDetails admin = User.builder()
                .username("admin")
                .password("{noop}123456") // {noop} nghĩa là không mã hóa mật khẩu, dùng text thô
                .roles("FEATURE_ADMIN")
                .build();
        return new InMemoryUserDetailsManager(admin);
    }
    // 2. CẤU HÌNH TOGGLZ USER PROVIDER CHO ADMIN CONSOLE
    @Bean
    public UserProvider userProvider() {
        return () -> {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
                return null; // Khách lạ -> không có quyền
            }
            // Kiểm tra xem user có role FEATURE_ADMIN không
            boolean isFeatureAdmin = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_FEATURE_ADMIN"));
            return new SimpleFeatureUser(auth.getName(), isFeatureAdmin);
        };
    }
}
