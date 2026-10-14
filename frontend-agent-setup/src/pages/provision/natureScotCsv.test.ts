import { isFinalCsvError, natureScotCsvMessages, parseNatureScotCsv } from "./natureScotCsv";

const valid = "Jo, Test, jo.test@example.test, GAKWO300003, x722222, , Ecologist, Battleby,";

describe("parseNatureScotCsv", () => {
  it("reads the eight values in order, trimmed, ignoring the 6th and a trailing comma", () => {
    expect(parseNatureScotCsv(valid)).toEqual({
      ok: true,
      user: {
        userIdentifier: "GAKWO300003",
        firstName: "Jo",
        surname: "Test",
        email: "jo.test@example.test",
        managerXNumber: "",
        jobTitle: "Ecologist",
      },
      managerXNumber: "x722222",
      location: "Battleby",
    });
  });

  it("accepts the line without a trailing comma, and with something in the 6th value", () => {
    const parsed = parseNatureScotCsv("Jo,Test,jo.test@example.test,GAKWO300003,x722222,anything,Ecologist,Battleby");
    expect(parsed.ok).toBe(true);
  });

  it("accepts a blank manager's x number", () => {
    const parsed = parseNatureScotCsv("Jo, Test, jo.test@example.test, GAKWO300003, , , Ecologist, Battleby");
    expect(parsed).toMatchObject({ ok: true, managerXNumber: "" });
  });

  it("asks for the information when nothing has been pasted", () => {
    expect(parseNatureScotCsv("  ")).toEqual({ ok: false, message: natureScotCsvMessages.missing });
  });

  it.each([
    "Jo, Test, jo.test@example.test, GAKWO300003, x722222, , Ecologist",
    "Jo, Test, jo.test@example.test, GAKWO300003, x722222, , Ecologist, Battleby, extra",
    "Jo, Test, jo.test@example.test, GAKWO300003, x722222, , Ecologist, Battleby, , ",
  ])("rejects %j, which does not have eight values", (raw) => {
    expect(parseNatureScotCsv(raw)).toEqual({ ok: false, message: natureScotCsvMessages.columns });
  });

  it.each([
    [" , Test, jo.test@example.test, GAKWO300003, , , Ecologist, Battleby", natureScotCsvMessages.firstName],
    ["Jo, , jo.test@example.test, GAKWO300003, , , Ecologist, Battleby", natureScotCsvMessages.surname],
    ["Jo, Test, , GAKWO300003, , , Ecologist, Battleby", natureScotCsvMessages.email],
    ["Jo, Test, not-an-email, GAKWO300003, , , Ecologist, Battleby", natureScotCsvMessages.email],
    ["Jo, Test, jo.test@example.test, , , , Ecologist, Battleby", natureScotCsvMessages.userIdentifier],
    ["Jo, Test, jo.test@example.test, XXXX, , , Ecologist, Battleby", natureScotCsvMessages.userIdentifier],
    ["Jo, Test, jo.test@example.test, u100001, , , Ecologist, Battleby", natureScotCsvMessages.userIdentifier],
    ["Jo, Test, jo.test@example.test, GAKWO300003, x72, , Ecologist, Battleby", natureScotCsvMessages.managerXNumber],
    ["Jo, Test, jo.test@example.test, GAKWO300003, , , , Battleby", natureScotCsvMessages.jobTitle],
    ["Jo, Test, jo.test@example.test, GAKWO300003, , , Ecologist, ", natureScotCsvMessages.location],
  ])("rejects %j, saying which value is wrong", (raw, message) => {
    expect(parseNatureScotCsv(raw)).toEqual({ ok: false, message });
  });

  it("names the value's position in every message", () => {
    const positions = ["1st", "2nd", "3rd", "4th", "5th", "7th", "8th"];
    const messages = [
      natureScotCsvMessages.firstName,
      natureScotCsvMessages.surname,
      natureScotCsvMessages.email,
      natureScotCsvMessages.userIdentifier,
      natureScotCsvMessages.managerXNumber,
      natureScotCsvMessages.jobTitle,
      natureScotCsvMessages.location,
    ];
    messages.forEach((message, index) => expect(message).toContain(positions[index]));
  });
});

describe("isFinalCsvError", () => {
  it.each(["", "Jo", "Jo, Test, jo.test@example.test", valid, `${valid.slice(0, -1)}`])(
    "waits while %j could still become valid",
    (raw) => {
      expect(isFinalCsvError(raw)).toBe(false);
    },
  );

  it.each([`${valid} extra`, `${valid},`, `${valid} , ,`])("reports %j at once: typing more cannot fix it", (raw) => {
    expect(isFinalCsvError(raw)).toBe(true);
  });
});
