package VERIFY.support;

import org.testcontainers.containers.GenericContainer;

/**
 * Simulates an external service outage in an integration test, and always restores it.
 * Usage: try (var outage = Outages.pause(container)) { ...act and assert failure handling... }
 * Set short connect/read timeouts in the test configuration, because paused services hang rather than refuse.
 */
public final class Outages implements AutoCloseable {

    private final GenericContainer<?> container;

    private Outages(GenericContainer<?> container) {
        this.container = container;
        container.getDockerClient().pauseContainerCmd(container.getContainerId()).exec();
    }

    public static Outages pause(GenericContainer<?> container) {
        return new Outages(container);
    }

    @Override
    public void close() {
        container.getDockerClient().unpauseContainerCmd(container.getContainerId()).exec();
    }
}
