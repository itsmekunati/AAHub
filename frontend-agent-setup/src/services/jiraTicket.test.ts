import { isFinalTicketError, parseTicketNumber } from "./jiraTicket";

describe("isFinalTicketError", () => {
  it.each(["", "   ", "1", "12345", "123456", "I", "it", "ITS", "ITS-", "ITS-1", "ITS-12345", "ITS-123456", " 123 "])(
    "AC13: %j is empty, unfinished or valid, so it is not reported while typing",
    (raw) => {
      expect(isFinalTicketError(raw)).toBe(false);
    },
  );

  it.each(["1234567", "12a", "a", "ITS-1234567", "ABC-1", "ITS--1", "12 34", "１２３", "ITS-12a"])(
    "AC13: %j cannot become a valid ticket by typing more",
    (raw) => {
      expect(isFinalTicketError(raw)).toBe(true);
    },
  );
});

describe("parseTicketNumber", () => {
  it.each(["123456", " 123456 ", "\t123456\n", "ITS-123456", "its-123456", " ITS-123456 "])(
    "AC13: reads %j as ITS-123456",
    (raw) => {
      expect(parseTicketNumber(raw)).toEqual({ ok: true, ticketId: "ITS-123456" });
    },
  );

  it.each(["", "   "])("AC13: says %j is missing", (raw) => {
    expect(parseTicketNumber(raw)).toEqual({ ok: false, reason: "missing" });
  });

  it.each([
    "12345",
    "1234567",
    "ITS-12345",
    "ITS-1234567",
    "ABC-123456",
    "ITS123456",
    "12a456",
    "123 456",
    "123-456",
    "１２３４５６",
    "12345\u0000",
    "ITS-ITS-123456",
  ])("AC13: rejects %j as the wrong format instead of changing it", (raw) => {
    expect(parseTicketNumber(raw)).toEqual({ ok: false, reason: "format" });
  });
});
