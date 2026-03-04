package com.smarthome.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration class to load environment variables from .env file
 */
@Configuration
public class EnvConfig {
    
    static {
        Dotenv dotenv = Dotenv.configure()
                .ignoreIfMissing()
                .load();
    }
}
