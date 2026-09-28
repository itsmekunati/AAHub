package VERIFY.support;

import java.util.List;

import org.slf4j.LoggerFactory;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;

/**
 * Captures audit log events in tests.
 * Usage: try (var audit = AuditLogCapture.start()) { ...act...; assertThat(audit.events()).hasSize(1); }
 * VERIFY: the audit logger name; to assert the exact JSON line, encode events with the production encoder.
 */
public final class AuditLogCapture implements AutoCloseable {

    private static final String AUDIT_LOGGER = "AUDIT"; // VERIFY: match the audit component's logger name

    private final Logger logger;
    private final ListAppender<ILoggingEvent> appender = new ListAppender<>();

    private AuditLogCapture() {
        logger = (Logger) LoggerFactory.getLogger(AUDIT_LOGGER);
        appender.start();
        logger.addAppender(appender);
    }

    public static AuditLogCapture start() {
        return new AuditLogCapture();
    }

    public List<ILoggingEvent> events() {
        return List.copyOf(appender.list);
    }

    @Override
    public void close() {
        logger.detachAppender(appender);
        appender.stop();
    }
}
