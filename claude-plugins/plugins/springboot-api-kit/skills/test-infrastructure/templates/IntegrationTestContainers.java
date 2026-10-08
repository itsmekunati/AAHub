package VERIFY.support;

// VERIFY: Testcontainers module/package names for the version in use, and image tags
// (match production versions where known).
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.oracle.OracleContainer;

/** Shared containers for integration tests and TestApplication. TEST ONLY. */
@TestConfiguration(proxyBeanMethods = false)
public class IntegrationTestContainers {

    // VERIFY: use the container for the project's production database engine (Oracle shown; PostgreSQL,
    // SQL Server and others have their own Testcontainers modules).
    @Bean
    @ServiceConnection
    OracleContainer database() {
        return new OracleContainer("gvenzl/oracle-free:VERIFY-TAG");
    }

    // Other backing services (a directory, a message broker, object storage): declare one GenericContainer
    // bean per service here, generate any password at runtime (never commit one), and register its
    // connection properties with a DynamicPropertyRegistrar bean:
    //
    //   @Bean
    //   DynamicPropertyRegistrar externalServiceProperties(GenericContainer<?> service) {
    //       return registry -> registry.add("app.service.url",
    //               () -> "http://" + service.getHost() + ":" + service.getMappedPort(VERIFY_PORT));
    //   }
    //
    // VERIFY: property names match the application's configuration classes.
}
