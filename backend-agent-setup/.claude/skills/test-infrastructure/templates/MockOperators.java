package VERIFY.support;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor;

/**
 * Mock operators for slice and integration tests. Sets authorities directly (bypasses the role converter);
 * keep one separate test of the converter with the real claim shape (Okta groups AAH_Editor and AAH_Viewer).
 */
public final class MockOperators {

    private MockOperators() {}

    public static JwtRequestPostProcessor editor() {
        return operator("test-editor-subject", "test.editor", "ROLE_EDITOR");
    }

    /** May use User Role Management and Check existing access; must get 403 on every User Provisioning endpoint. */
    public static JwtRequestPostProcessor viewer() {
        return operator("test-viewer-subject", "test.viewer", "ROLE_VIEWER");
    }

    public static JwtRequestPostProcessor noRoles() {
        return jwt().jwt(j -> j.subject("test-noroles-subject").claim("preferred_username", "test.noroles"));
    }

    private static JwtRequestPostProcessor operator(String subject, String username, String authority) {
        return jwt()
                .jwt(j -> j.subject(subject).claim("preferred_username", username))
                .authorities(new SimpleGrantedAuthority(authority));
    }
}
