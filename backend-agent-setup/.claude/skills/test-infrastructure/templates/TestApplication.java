package VERIFY;

import org.springframework.boot.SpringApplication;

import VERIFY.support.IntegrationTestContainers;

/**
 * Runs the real application against Testcontainers:  ./mvnw spring-boot:test-run
 * TEST/LOCAL ONLY. Protected endpoints return 401 without a token; role behaviour is proven by the tests.
 */
public class TestApplication {
    public static void main(String[] args) {
        SpringApplication.from(Application::main)   // VERIFY: the real main class
                .with(IntegrationTestContainers.class)
                .run(args);
    }
}
