import { describe, it, expect } from "vitest";
import { getUserFromCognito, isAdminUser } from "../packages/lambda-proxy/lib/auth.js";

describe("supabase-proxy auth utils", () => {
  it("returns null when no claims present", () => {
    const normalized = { claims: null };
    const user = getUserFromCognito(normalized);
    expect(user).toBeNull();
  });

  it("extracts user fields and groups correctly (array)", () => {
    const normalized = {
      claims: {
        sub: "abc123",
        email: "test@example.com",
        email_verified: "true",
        name: "Test User",
        given_name: "Test",
        family_name: "User",
        "cognito:groups": ["admins", "other"],
      },
    };

    const user = getUserFromCognito(normalized);
    expect(user).not.toBeNull();
    expect(user.cognitoId).toBe("abc123");
    expect(user.email).toBe("test@example.com");
    expect(user.email_verified).toBe(true);
    expect(Array.isArray(user.groups)).toBe(true);
    expect(isAdminUser(user)).toBe(true);
  });

  it("handles groups as comma-separated string", () => {
    const normalized = { claims: { "cognito:groups": "admins,managers" } };
    const user = getUserFromCognito(normalized);
    expect(user.groups).toContain("admins");
    expect(isAdminUser(user)).toBe(true);
  });

  it("isAdminUser is case-insensitive and accepts singular/plural", () => {
    expect(isAdminUser({ groups: ["Admin"] })).toBe(true);
    expect(isAdminUser({ groups: ["admins"] })).toBe(true);
    expect(isAdminUser({ groups: ["users"] })).toBe(false);
  });
});
