import type { RoleUserType } from "../../services/roleManagement";
import { identifierCopy, identifierMessages, isFinalError, sanitiseIdentifier, validateIdentifier } from "./validateIdentifier";

const internal: RoleUserType = "SG";
const publicUser: RoleUserType = "public";

const invisibleOrControl = [
  "x12\u00003456",
  "jo\tbloggs",
  "jo\nbloggs",
  "abcd\u007f",
  "x123​456",
  "‮jo.bloggs",
  "jo.bloggs\u{1f600}",
  "jöe.bloggs",
  "ｘ１２３４５６",
  "<script>",
  "../x123",
  "x123%2F",
];

describe("sanitiseIdentifier", () => {
  it.each([
    ["  x123456  ", internal, "x123456"],
    [" x123456 ", internal, "x123456"],
    ["X123456", internal, "X123456"],
    ["\tjo.bloggs\n", publicUser, "jo.bloggs"],
  ])("AC12: trims %j for %s to the clean value %j, keeping the letter case", (raw, userType, value) => {
    expect(sanitiseIdentifier(raw, userType)).toEqual({ ok: true, value });
  });

  it.each(["SNH", "FGS"] as const)("AC12: treats %s like Scottish Government", (userType) => {
    expect(sanitiseIdentifier("x123456", userType)).toEqual({ ok: true, value: "x123456" });
    expect(sanitiseIdentifier("jo.bloggs", userType)).toEqual({ ok: false, message: identifierMessages.xNumber });
  });

  it.each(invisibleOrControl)("AC12: rejects %j instead of changing it, for every user type", (raw) => {
    expect(sanitiseIdentifier(raw, internal)).toEqual({ ok: false, message: identifierMessages.characters });
    expect(sanitiseIdentifier(raw, publicUser)).toEqual({ ok: false, message: identifierMessages.characters });
  });

  it("AC12: applies the 20 character limit to a public username after trimming", () => {
    expect(sanitiseIdentifier("a".repeat(21), publicUser)).toEqual({ ok: false, message: identifierMessages.length });
    expect(sanitiseIdentifier(`  ${"a".repeat(20)}  `, publicUser)).toEqual({ ok: true, value: "a".repeat(20) });
  });

  it("AC12: agrees with validateIdentifier", () => {
    for (const userType of [internal, publicUser]) {
      for (const raw of ["", "abc", "x12345", "ab!c", "x123456"]) {
        const result = sanitiseIdentifier(raw, userType);
        expect(result.ok ? undefined : result.message).toBe(validateIdentifier(raw, userType));
      }
    }
  });
});

describe("validateIdentifier for a public user (username)", () => {
  it("AC2: asks for a username when the field is empty or only spaces", () => {
    expect(validateIdentifier("", publicUser)).toBe(identifierMessages.missingUsername);
    expect(validateIdentifier("   ", publicUser)).toBe(identifierMessages.missingUsername);
  });

  it.each(["abc", "a", "a".repeat(21), "9".repeat(25)])("AC2: rejects %s as the wrong length", (value) => {
    expect(validateIdentifier(value, publicUser)).toBe(identifierMessages.length);
  });

  it.each(["abcd", "a".repeat(20), "jo.bloggs", "jo_bloggs-2", "x12345a", "x123456", "X1234567"])(
    "AC2: accepts %s",
    (value) => {
      expect(validateIdentifier(value, publicUser)).toBeUndefined();
    },
  );

  it.each(["ab!c", "jo bloggs", "jo@bloggs", "jo\tbloggs", "jo\u0000bloggs"])(
    "AC2: rejects %j with characters that are not allowed",
    (value) => {
      expect(validateIdentifier(value, publicUser)).toBe(identifierMessages.characters);
    },
  );
});

describe("validateIdentifier for any other user type (x number)", () => {
  it("AC2: asks for an x number when the field is empty or only spaces", () => {
    expect(validateIdentifier("", internal)).toBe(identifierMessages.missingXNumber);
    expect(validateIdentifier("   ", internal)).toBe(identifierMessages.missingXNumber);
  });

  it.each(["x123456", "X123456", "  x123456  "])("AC2: accepts the x number %j", (value) => {
    expect(validateIdentifier(value, internal)).toBeUndefined();
  });

  it.each(["x12345", "x1234567", "X00000000", "abc", "jo.bloggs", "123456", "y123456", "x12345a", "xabcdef", "x"])(
    "AC2: rejects %s with the x number message",
    (value) => {
      expect(validateIdentifier(value, internal)).toBe(identifierMessages.xNumber);
    },
  );

  it.each(["x12 456", "x12345!", "jo bloggs", "x12\u0000456"])("AC2: rejects %j with characters that are not allowed", (value) => {
    expect(validateIdentifier(value, internal)).toBe(identifierMessages.characters);
  });
});

describe("identifierCopy", () => {
  it("AC2: describes a username for public users and an x number for everyone else", () => {
    expect(identifierCopy(publicUser)).toEqual({
      label: "Enter the username",
      hint: "Use 4 to 20 letters, numbers, full stops, underscores or hyphens",
      unavailable: "Enter a valid username to continue",
    });
    expect(identifierCopy(internal)).toEqual({
      label: "Enter the x number",
      hint: "Use the format x111111",
      unavailable: "Enter a valid x number to continue",
    });
  });
});

describe("isFinalError", () => {
  it.each(["ab!c", "a".repeat(21), "  ab!c  "])("AC2: %s cannot be fixed by typing more for a public user, so it shows at once", (value) => {
    expect(isFinalError(value, publicUser)).toBe(true);
  });

  it.each(["", "abc", "x", "x123", "x1234567", "jo.bloggs", "a".repeat(20)])(
    "AC2: %s waits until a public user leaves the field",
    (value) => {
      expect(isFinalError(value, publicUser)).toBe(false);
    },
  );

  it.each(["ab!c", "x1234567", "jo.bloggs", "  x 23  "])(
    "AC2: %s cannot be fixed by typing more for an x number, so it shows at once",
    (value) => {
      expect(isFinalError(value, internal)).toBe(true);
    },
  );

  it.each(["", "abc", "x", "x123", "x12345", "x123456", " x123456 "])(
    "AC2: %s waits until the operator leaves the field for an x number",
    (value) => {
      expect(isFinalError(value, internal)).toBe(false);
    },
  );
});
