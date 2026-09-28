package VERIFY.support;

// VERIFY: Testcontainers module/package names for the version in use, and image tags
// (match production versions where known).
import java.nio.file.Path;
import java.util.UUID;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.test.context.DynamicPropertyRegistrar;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.images.builder.ImageFromDockerfile;
import org.testcontainers.oracle.OracleContainer;

/** Shared containers for integration tests and TestApplication. TEST ONLY. */
@TestConfiguration(proxyBeanMethods = false)
public class IntegrationTestContainers {

    static final String AUDIT_BUCKET = "test-audit-logs";
    /** Generated per run; never committed. */
    static final String LDAP_ADMIN_PASSWORD = UUID.randomUUID().toString();

    @Bean
    @ServiceConnection
    OracleContainer oracle() {
        return new OracleContainer("gvenzl/oracle-free:VERIFY-TAG");
    }

    @Bean
    GenericContainer<?> apacheds() {
        var image = new ImageFromDockerfile("test-apacheds", false)
                .withFileFromPath(".", Path.of("src/test/docker/apacheds"))
                .withBuildArg("APACHEDS_VERSION", "VERIFY-VERSION");
        return new GenericContainer<>(image)
                .withExposedPorts(10389)
                .withEnv("LDAP_ADMIN_PASSWORD", LDAP_ADMIN_PASSWORD)
                .waitingFor(Wait.forListeningPort());
        // VERIFY: after start, load src/test/resources/ldap/test-seed.ldif (e.g. copy it in and run ldapadd),
        // and replace the distribution's default admin password with LDAP_ADMIN_PASSWORD.
    }

    // S3: see docs/open-questions.md #12. If LocalStack is approved, declare it here with
    // withEnv("LOCALSTACK_AUTH_TOKEN", System.getenv("LOCALSTACK_AUTH_TOKEN")) and register its endpoint below.
    // Until then, S3 tests use a mocked S3 client.

    @Bean
    DynamicPropertyRegistrar externalServiceProperties(GenericContainer<?> apacheds) {
        return registry -> {
            registry.add("spring.ldap.urls", () -> "ldap://" + apacheds.getHost() + ":" + apacheds.getMappedPort(10389));
            registry.add("app.audit.s3.bucket", () -> AUDIT_BUCKET);
            // VERIFY: property names match the application's configuration classes.
        };
    }
}
