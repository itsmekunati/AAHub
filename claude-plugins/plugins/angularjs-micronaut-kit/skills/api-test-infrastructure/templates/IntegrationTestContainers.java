package VERIFY.support;

import java.util.Map;

import org.testcontainers.containers.PostgreSQLContainer;

/**
 * Shared containers for integration tests and TestApplication. TEST ONLY.
 * Each container starts once per test run (static, started on first use) and is reused by every test class.
 *
 * Usage in a test:
 *   @MicronautTest
 *   @TestInstance(TestInstance.Lifecycle.PER_CLASS)
 *   class RecordRepositoryIT implements TestPropertyProvider {
 *       @Override public Map<String, String> getProperties() { return IntegrationTestContainers.properties(); }
 *   }
 *
 * Alternative: Micronaut Test Resources provisions the same containers automatically when the datasource URL
 * is not set. If the team chooses it, keep this class only for services Test Resources does not cover and for
 * the Outages helper, which needs a handle on the container.
 */
public final class IntegrationTestContainers {

    // VERIFY: the container for the project's production database engine and a tag that matches production.
    public static final PostgreSQLContainer<?> DATABASE = new PostgreSQLContainer<>("postgres:VERIFY-TAG");

    // Other backing services (object storage, a message broker): one GenericContainer per service here.
    // Generate any password at runtime; never commit one.

    private IntegrationTestContainers() {
    }

    public static synchronized Map<String, String> properties() {
        if (!DATABASE.isRunning()) {
            DATABASE.start();
        }
        // VERIFY: property names match the application's datasource configuration.
        return Map.of(
                "datasources.default.url", DATABASE.getJdbcUrl(),
                "datasources.default.username", DATABASE.getUsername(),
                "datasources.default.password", DATABASE.getPassword(),
                // Paused containers hang rather than refuse, so fail fast in tests.
                "datasources.default.connection-timeout", "2000",
                "micronaut.http.client.read-timeout", "2s");
    }
}
