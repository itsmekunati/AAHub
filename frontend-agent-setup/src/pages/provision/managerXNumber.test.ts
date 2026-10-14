import {
  DUMMY_MANAGER_X_NUMBER,
  isFinalManagerError,
  managerXNumberMessage,
  sanitiseManagerXNumber,
  validateManagerXNumber,
} from "./managerXNumber";

describe("sanitiseManagerXNumber", () => {
  it.each(["x111111", "X000001", "  x123456\t"])("accepts %j, trimmed and with its letter case kept", (raw) => {
    expect(sanitiseManagerXNumber(raw)).toEqual({ ok: true, value: raw.trim() });
  });

  it.each(["", "   "])("accepts %j as blank, because the manager's x number is optional", (raw) => {
    expect(sanitiseManagerXNumber(raw)).toEqual({ ok: true, value: "" });
  });

  it.each(["u111111", "x12345", "x1234567", "111111", "xx11111", "x11111a", "x 111111", "ｘ１１１１１１"])(
    "rejects %j",
    (raw) => {
      expect(sanitiseManagerXNumber(raw)).toEqual({ ok: false, message: managerXNumberMessage });
    },
  );
});

describe("validateManagerXNumber", () => {
  it("returns nothing for a valid or blank value and the message for an invalid one", () => {
    expect(validateManagerXNumber("x111111")).toBeUndefined();
    expect(validateManagerXNumber("")).toBeUndefined();
    expect(validateManagerXNumber("x1")).toBe(managerXNumberMessage);
  });
});

describe("isFinalManagerError", () => {
  it.each(["", "x", "X1", "x12345", "x111111", " x11 "])(
    "waits while %j could still become a valid x number",
    (raw) => {
      expect(isFinalManagerError(raw)).toBe(false);
    },
  );

  it.each(["u", "1", "x1a", "xx", "x1234567", "x-1"])(
    "reports %j at once, because typing more cannot fix it",
    (raw) => {
      expect(isFinalManagerError(raw)).toBe(true);
    },
  );
});

describe("DUMMY_MANAGER_X_NUMBER", () => {
  it("is the word dummy, which an operator could never type as an x number", () => {
    expect(DUMMY_MANAGER_X_NUMBER).toBe("dummy");
    expect(validateManagerXNumber(DUMMY_MANAGER_X_NUMBER)).toBe(managerXNumberMessage);
  });
});
