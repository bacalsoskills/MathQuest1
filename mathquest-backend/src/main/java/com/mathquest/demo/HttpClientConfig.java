package com.mathquest.demo;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/**
 * Provides HTTP client beans.
 */
@Configuration
public class HttpClientConfig {

	/**
	 * RestTemplate bean for making HTTP requests.
	 *
	 * @param builder RestTemplateBuilder to configure the template
	 * @return configured RestTemplate instance
	 */
	@Bean
	public RestTemplate restTemplate(RestTemplateBuilder builder) {
		return builder.build();
	}
}


