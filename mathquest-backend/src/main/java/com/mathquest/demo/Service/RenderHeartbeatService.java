package com.mathquest.demo.Service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

/**
 * Periodically sends a GET request to a configured Render server endpoint to keep it warm
 * and logs the response status or any errors.
 */
@Service
public class RenderHeartbeatService {

	private static final Logger log = LoggerFactory.getLogger(RenderHeartbeatService.class);

	private final RestTemplate restTemplate;

	@Value("${render.heartbeat.url}")
	private String heartbeatUrl;

	public RenderHeartbeatService(RestTemplate restTemplate) {
		this.restTemplate = restTemplate;
	}

	/**
	 * Executes every 5 seconds after the previous execution completes.
	 * Sends an HTTP GET to the configured Render URL and logs the status.
	 */
	@Scheduled(fixedDelay = 5000)
	public void sendHeartbeat() {
		try {
			ResponseEntity<String> response = restTemplate.getForEntity(heartbeatUrl, String.class);
			log.info("Render heartbeat: status={} url={}", response.getStatusCode().value(), heartbeatUrl);
		} catch (RestClientException ex) {
			log.warn("Render heartbeat failed: url={} error={}", heartbeatUrl, ex.getMessage());
		}
	}
}


