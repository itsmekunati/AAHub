package VERIFY;

import java.util.Map;

import io.micronaut.runtime.Micronaut;

import VERIFY.support.IntegrationTestContainers;

/**
 * Runs the real application against Testcontainers. TEST/LOCAL ONLY.
 *   cd av-service && ./mvnw -q exec:java -Dexec.classpathScope=test -Dexec.mainClass=VERIFY.TestApplication
 * VERIFY: the exec plugin command, or use `./mvnw mn:run` if the team chose Micronaut Test Resources.
 */
public final class TestApplication {

    private TestApplication() {
    }

    public static void main(String[] args) {
        Micronaut.build(args)
                .mainClass(Application.class)   // VERIFY: the real main class
                .properties(Map.copyOf(IntegrationTestContainers.properties()))
                .start();
    }
}
