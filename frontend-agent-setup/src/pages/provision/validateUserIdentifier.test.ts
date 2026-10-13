import type { UserType } from "../../services/provisioning";
import {
  isFinalError,
  sanitiseUserIdentifier,
  userIdentifierCopy,
  userIdentifierMessages,
  validateUserIdentifier,
} from "./validateUserIdentifier";

const numberTypes: UserType[] = ["SG", "FGS"];

describe("sanitiseUserIdentifier", () => {
  it.each(["u111111", "U100001", "z200002", "Z200002", "c123456", "C123456"])(
    "accepts %s for Scottish Government and Scottish Forestry, keeping the letter case",
    (raw) => {
      for (const userType of numberTypes) {
        expect(sanitiseUserIdentifier(raw, userType)).toEqual({ ok: true, value: raw });
      }
    },
  );

  it("trims white space around the value", () => {
    expect(sanitiseUserIdentifier("  u111111\t", "SG")).toEqual({ ok: true, value: "u111111" });
    expect(sanitiseUserIdentifier(" GAKWO300003 ", "SNH")).toEqual({ ok: true, value: "GAKWO300003" });
  });

  it.each(["x111111", "u12345", "u1234567", "111111", "uu11111", "u11111a", "u 111111", "GAKWO300003", "ｕ１１１１１１"])(
    "rejects %j for Scottish Government and Scottish Forestry",
    (raw) => {
      for (const userType of numberTypes) {
        expect(sanitiseUserIdentifier(raw, userType)).toEqual({ ok: false, message: userIdentifierMessages.number });
      }
    },
  );

  it.each(["GAKWO300003", "gakwo300003"])("accepts %s for NatureScot", (raw) => {
    expect(sanitiseUserIdentifier(raw, "SNH")).toEqual({ ok: true, value: raw });
  });

  it.each(["U100001", "GAKWO30000", "GAKWO3000033", "GAKW300003", "GAKWO-300003", "300003"])(
    "rejects %j for NatureScot",
    (raw) => {
      expect(sanitiseUserIdentifier(raw, "SNH")).toEqual({ ok: false, message: userIdentifierMessages.gakwo });
    },
  );

  it("asks for the value when it is empty or only white space", () => {
    expect(sanitiseUserIdentifier("   ", "SG")).toEqual({ ok: false, message: userIdentifierMessages.missingNumber });
    expect(sanitiseUserIdentifier("", "SNH")).toEqual({ ok: false, message: userIdentifierMessages.missingGakwo });
  });
});

describe("validateUserIdentifier", () => {
  it("returns nothing for a valid value and the message for an invalid one", () => {
    expect(validateUserIdentifier("u111111", "FGS")).toBeUndefined();
    expect(validateUserIdentifier("u1", "FGS")).toBe(userIdentifierMessages.number);
  });
});

describe("isFinalError", () => {
  it.each(["", "u", "Z1", "c12345", "u111111", " u11 "])("waits while %j could still become a valid number", (raw) => {
    expect(isFinalError(raw, "SG")).toBe(false);
  });

  it.each(["x", "1", "u1a", "uu", "u1234567", "u-1"])("reports %j at once, because typing more cannot fix it", (raw) => {
    expect(isFinalError(raw, "SG")).toBe(true);
  });

  it.each(["g", "GAK", "gakwo", "GAKWO3", "GAKWO300003"])("waits while %j could still become a valid GAKWO number", (raw) => {
    expect(isFinalError(raw, "SNH")).toBe(false);
  });

  it.each(["u", "GAKX", "GAKWOO", "GAKWO3000033", "GAKWO3a"])("reports %j at once for NatureScot", (raw) => {
    expect(isFinalError(raw, "SNH")).toBe(true);
  });
});

describe("userIdentifierCopy", () => {
  it("describes a u, z or c number for Scottish Government and Scottish Forestry", () => {
    for (const userType of numberTypes) {
      expect(userIdentifierCopy(userType)).toEqual({
        label: "Enter user's u/z/c number",
        hint: "Use the following format: U, Z or C number, for example u111111",
        unavailable: "Enter a valid u, z or c number to continue",
      });
    }
  });

  it("describes a GAKWO number for NatureScot", () => {
    expect(userIdentifierCopy("SNH")).toEqual({
      label: "Enter user's GAKWO number",
      hint: "Use the following format: GAKWO number, for example GAKWO111111",
      unavailable: "Enter a valid GAKWO number to continue",
    });
  });
});
