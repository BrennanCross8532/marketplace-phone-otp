import assert from "node:assert/strict";
import { loginBody } from "./marketplace.ts";

const accepted = loginBody.safeParse({ phone: "+15555550123", code: "123456", captchaToken: "captcha", captchaWidgetRecordId: "widget-record" });
assert.equal(accepted.success, true);
const rejected = loginBody.safeParse({ phone: "", code: "abc", captchaToken: "", captchaWidgetRecordId: "" });
assert.equal(rejected.success, false);
assert.equal(loginBody.safeParse({ phone: "+15555550123", code: "123456", captchaToken: "captcha" }).success, false);
console.log("login boundary test passed");
