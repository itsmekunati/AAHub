# TEST-ONLY ApacheDS image (src/test/docker/apacheds/Dockerfile), built from the official Apache distribution.
# VERIFY: the Java version ApacheDS supports, the ApacheDS version used in production,
# and the SHA-512 from https://downloads.apache.org/directory/apacheds/dist/<version>/
FROM eclipse-temurin:VERIFY-JAVA-TAG

ARG APACHEDS_VERSION
ARG APACHEDS_SHA512=VERIFY-SHA512

RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ldap-utils \
 && rm -rf /var/lib/apt/lists/* \
 && curl -fsSL "https://downloads.apache.org/directory/apacheds/dist/${APACHEDS_VERSION}/apacheds-${APACHEDS_VERSION}.tar.gz" -o /tmp/apacheds.tar.gz \
 && echo "${APACHEDS_SHA512}  /tmp/apacheds.tar.gz" | sha512sum -c - \
 && mkdir -p /opt/apacheds \
 && tar -xzf /tmp/apacheds.tar.gz -C /opt/apacheds --strip-components=1 \
 && rm /tmp/apacheds.tar.gz \
 && useradd -r -u 10001 apacheds \
 && chown -R apacheds /opt/apacheds

USER 10001
EXPOSE 10389
# VERIFY the foreground start command for the distribution.
CMD ["/opt/apacheds/bin/apacheds.sh", "default", "run"]
