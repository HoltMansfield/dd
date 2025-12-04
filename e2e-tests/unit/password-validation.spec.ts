import { test, expect } from "@playwright/test";

test.describe("Password Validation - Unit Tests", () => {
  test("should validate password length requirement", async () => {
    const { validatePassword, PASSWORD_MIN_LENGTH } = await import(
      "../../src/lib/password-validation"
    );

    // Test password too short
    const shortResult = validatePassword("Short1!");
    expect(shortResult.isValid).toBe(false);
    expect(shortResult.failedRequirements).toContain("At least 12 characters");

    // Test password exactly minimum length
    const exactResult = validatePassword("Exact12Char!");
    expect(exactResult.isValid).toBe(true);
    expect(exactResult.failedRequirements).toHaveLength(0);

    // Verify constant value
    expect(PASSWORD_MIN_LENGTH).toBe(12);
  });

  test("should validate uppercase letter requirement", async () => {
    const { validatePassword } = await import(
      "../../src/lib/password-validation"
    );

    // Test password without uppercase
    const noUpperResult = validatePassword("password123!");
    expect(noUpperResult.isValid).toBe(false);
    expect(noUpperResult.failedRequirements).toContain(
      "At least one uppercase letter"
    );

    // Test password with uppercase
    const withUpperResult = validatePassword("Password123!");
    expect(withUpperResult.isValid).toBe(true);
  });

  test("should validate lowercase letter requirement", async () => {
    const { validatePassword } = await import(
      "../../src/lib/password-validation"
    );

    // Test password without lowercase
    const noLowerResult = validatePassword("PASSWORD123!");
    expect(noLowerResult.isValid).toBe(false);
    expect(noLowerResult.failedRequirements).toContain(
      "At least one lowercase letter"
    );

    // Test password with lowercase
    const withLowerResult = validatePassword("Password123!");
    expect(withLowerResult.isValid).toBe(true);
  });

  test("should validate number requirement", async () => {
    const { validatePassword } = await import(
      "../../src/lib/password-validation"
    );

    // Test password without number
    const noNumberResult = validatePassword("PasswordOnly!");
    expect(noNumberResult.isValid).toBe(false);
    expect(noNumberResult.failedRequirements).toContain("At least one number");

    // Test password with number
    const withNumberResult = validatePassword("Password123!");
    expect(withNumberResult.isValid).toBe(true);
  });

  test("should validate special character requirement", async () => {
    const { validatePassword } = await import(
      "../../src/lib/password-validation"
    );

    // Test password without special character
    const noSpecialResult = validatePassword("Password1234");
    expect(noSpecialResult.isValid).toBe(false);
    expect(noSpecialResult.failedRequirements).toContain(
      "At least one special character (!@#$%^&*)"
    );

    // Test password with special character
    const withSpecialResult = validatePassword("Password123!");
    expect(withSpecialResult.isValid).toBe(true);
  });

  test("should accept various special characters", async () => {
    const { validatePassword } = await import(
      "../../src/lib/password-validation"
    );

    const specialChars = [
      "!",
      "@",
      "#",
      "$",
      "%",
      "^",
      "&",
      "*",
      "(",
      ")",
      "_",
      "+",
      "-",
      "=",
      "[",
      "]",
      "{",
      "}",
      ";",
      "'",
      ":",
      '"',
      "\\",
      "|",
      ",",
      ".",
      "<",
      ">",
      "/",
      "?",
    ];

    for (const char of specialChars) {
      const password = `StrongPass123${char}`;
      const result = validatePassword(password);
      expect(result.isValid).toBe(true);
    }
  });

  test("should return multiple failed requirements for weak password", async () => {
    const { validatePassword } = await import(
      "../../src/lib/password-validation"
    );

    const result = validatePassword("weak");
    expect(result.isValid).toBe(false);
    expect(result.failedRequirements.length).toBeGreaterThan(1);
    expect(result.failedRequirements).toContain("At least 12 characters");
    expect(result.failedRequirements).toContain(
      "At least one uppercase letter"
    );
    expect(result.failedRequirements).toContain("At least one number");
    expect(result.failedRequirements).toContain(
      "At least one special character (!@#$%^&*)"
    );
  });

  test("should accept password meeting all requirements", async () => {
    const { validatePassword } = await import(
      "../../src/lib/password-validation"
    );

    const validPasswords = [
      "StrongPass123!",
      "MySecure#Pass456",
      "Complex@Password789",
      "Tr0ng&P@ssw0rd",
      "ValidPassword1!",
      "AnotherGood1@Pass",
    ];

    for (const password of validPasswords) {
      const result = validatePassword(password);
      expect(result.isValid).toBe(true);
      expect(result.failedRequirements).toHaveLength(0);
    }
  });

  test("getPasswordErrorMessage should return null for valid password", async () => {
    const { getPasswordErrorMessage } = await import(
      "../../src/lib/password-validation"
    );

    const message = getPasswordErrorMessage("StrongPass123!");
    expect(message).toBeNull();
  });

  test("getPasswordErrorMessage should return error for invalid password", async () => {
    const { getPasswordErrorMessage } = await import(
      "../../src/lib/password-validation"
    );

    const message = getPasswordErrorMessage("weak");
    expect(message).toBeTruthy();
    expect(message).toContain("Password must have:");
  });

  test("getPasswordErrorMessage should format single requirement error", async () => {
    const { getPasswordErrorMessage } = await import(
      "../../src/lib/password-validation"
    );

    // Password missing only special character
    const message = getPasswordErrorMessage("NoSpecialChar123");
    expect(message).toBeTruthy();
    expect(message).toContain("Password must have:");
    expect(message?.toLowerCase()).toContain("special character");
  });

  test("PASSWORD_REQUIREMENTS should have all required checks", async () => {
    const { PASSWORD_REQUIREMENTS } = await import(
      "../../src/lib/password-validation"
    );

    expect(PASSWORD_REQUIREMENTS).toHaveLength(5);

    const labels = PASSWORD_REQUIREMENTS.map((req) => req.label);
    expect(labels).toContain("At least 12 characters");
    expect(labels).toContain("At least one uppercase letter");
    expect(labels).toContain("At least one lowercase letter");
    expect(labels).toContain("At least one number");
    expect(labels).toContain("At least one special character (!@#$%^&*)");
  });

  test("PASSWORD_REQUIREMENTS test functions should work correctly", async () => {
    const { PASSWORD_REQUIREMENTS } = await import(
      "../../src/lib/password-validation"
    );

    const testPassword = "StrongPass123!";

    // All requirements should pass for a strong password
    for (const requirement of PASSWORD_REQUIREMENTS) {
      expect(requirement.test(testPassword)).toBe(true);
    }

    // Test each requirement individually with failing passwords
    const lengthReq = PASSWORD_REQUIREMENTS.find((r) =>
      r.label.includes("12 characters")
    );
    expect(lengthReq?.test("Short1!")).toBe(false);

    const upperReq = PASSWORD_REQUIREMENTS.find((r) =>
      r.label.includes("uppercase")
    );
    expect(upperReq?.test("password123!")).toBe(false);

    const lowerReq = PASSWORD_REQUIREMENTS.find((r) =>
      r.label.includes("lowercase")
    );
    expect(lowerReq?.test("PASSWORD123!")).toBe(false);

    const numberReq = PASSWORD_REQUIREMENTS.find((r) =>
      r.label.includes("number")
    );
    expect(numberReq?.test("PasswordOnly!")).toBe(false);

    const specialReq = PASSWORD_REQUIREMENTS.find((r) =>
      r.label.includes("special character")
    );
    expect(specialReq?.test("Password1234")).toBe(false);
  });

  test("should handle edge cases", async () => {
    const { validatePassword } = await import(
      "../../src/lib/password-validation"
    );

    // Empty string
    const emptyResult = validatePassword("");
    expect(emptyResult.isValid).toBe(false);
    expect(emptyResult.failedRequirements.length).toBe(5);

    // Very long password
    const longPassword = "A".repeat(100) + "a1!";
    const longResult = validatePassword(longPassword);
    expect(longResult.isValid).toBe(true);

    // Password with unicode characters
    const unicodePassword = "Pässwörd123!";
    const unicodeResult = validatePassword(unicodePassword);
    expect(unicodeResult.isValid).toBe(true);

    // Password with spaces
    const spacePassword = "Strong Pass 123!";
    const spaceResult = validatePassword(spacePassword);
    expect(spaceResult.isValid).toBe(true);
  });

  test("should be consistent across multiple calls", async () => {
    const { validatePassword } = await import(
      "../../src/lib/password-validation"
    );

    const password = "TestPassword123!";

    // Call multiple times
    for (let i = 0; i < 10; i++) {
      const result = validatePassword(password);
      expect(result.isValid).toBe(true);
      expect(result.failedRequirements).toHaveLength(0);
    }
  });
});
