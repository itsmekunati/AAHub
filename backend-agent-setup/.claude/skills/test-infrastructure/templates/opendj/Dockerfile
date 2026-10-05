# TEST-ONLY OpenDJ image (src/test/docker/opendj/Dockerfile).
# VERIFY: which OpenDJ distribution and version production runs (docs/open-questions.md #2),
# and pass a matching, pinned base image as OPENDJ_IMAGE. Never use an unpinned "latest" tag.
ARG OPENDJ_IMAGE
FROM ${OPENDJ_IMAGE}

# VERIFY: the LDAP port for this image (OpenDJ's default is 1389), that it runs as a non-root user,
# and how it sets the base DN and the directory manager password.
EXPOSE 1389
