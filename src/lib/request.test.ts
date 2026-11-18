import { describe, expect, it } from "vitest";
import { clientIp, cookieShouldBeSecure } from "./request";

const headers = (init: Record<string, string>) => new Headers(init);

describe("clientIp", () => {
  it("prefere CF-Connecting-IP", () => {
    expect(clientIp(headers({ "cf-connecting-ip": "1.2.3.4", "x-forwarded-for": "9.9.9.9" }))).toBe("1.2.3.4");
  });

  it("usa o primeiro IP de X-Forwarded-For", () => {
    expect(clientIp(headers({ "x-forwarded-for": "5.6.7.8, 10.0.0.1" }))).toBe("5.6.7.8");
  });

  it("cai para um valor fixo sem cabeçalhos", () => {
    expect(clientIp(headers({}))).toBe("desconhecido");
  });
});

describe("cookieShouldBeSecure", () => {
  it("auto segue X-Forwarded-Proto", () => {
    expect(cookieShouldBeSecure(headers({ "x-forwarded-proto": "https" }), "auto")).toBe(true);
    expect(cookieShouldBeSecure(headers({ "x-forwarded-proto": "http" }), "auto")).toBe(false);
    expect(cookieShouldBeSecure(headers({}), "auto")).toBe(false);
  });

  it("true e false ignoram o cabeçalho", () => {
    expect(cookieShouldBeSecure(headers({}), "true")).toBe(true);
    expect(cookieShouldBeSecure(headers({ "x-forwarded-proto": "https" }), "false")).toBe(false);
  });
});
