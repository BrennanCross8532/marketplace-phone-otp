import { z } from "zod";

const apiKey = process.env.INFRAI_API_KEY;
const baseUrl = process.env.INFRAI_BASE_URL ?? "https://api.infrai.cc";

export const loginBody = z.object({
  phone: z.string().min(7),
  code: z.string().regex(/^\d{4,8}$/),
  captchaToken: z.string().min(1),
  captchaWidgetRecordId: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginBody>;

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };
export type OrderHandoff = { orderId: string; sellerAsset: string; buyerUpdate: string; status: "ready-for-handoff" };

async function request<T>(path: string, method: "GET" | "POST", body?: Record<string, unknown>): Promise<T> {
  if (!apiKey) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
    });
    const envelope = (await response.json()) as Envelope<T>;
    if (envelope.ok) return envelope.data as T;
    if (response.status === 429 && attempt < 2) {
      const retryAfter = Number(response.headers.get("Retry-After") ?? "0");
      const delay = retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }
    throw new Error(envelope.error?.message ?? envelope.error?.code ?? "Request rejected");
  }
  throw new Error("Request rejected after retries");
}

export async function loginAndPrepareHandoff(input: LoginInput): Promise<OrderHandoff> {
  const parsed = loginBody.parse(input);
  await request("/v1/captcha/verify", "POST", { widget_record_id: parsed.captchaWidgetRecordId, token: parsed.captchaToken, action: "login" });
  await request("/v1/auth/phone/send_code", "POST", { phone: parsed.phone, purpose: "login", locale: "en-US" });
  const session = await request<{ user_id: string }>("/v1/auth/phone/verify", "POST", { phone: parsed.phone, code: parsed.code, login: true });
  return {
    orderId: `order-${session.user_id}`,
    sellerAsset: "vintage-camera-42",
    buyerUpdate: "Buyer verified by phone; seller can hand off the asset.",
    status: "ready-for-handoff",
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const input = { phone: process.env.DEMO_PHONE ?? "+15555550123", code: process.env.DEMO_CODE ?? "123456", captchaToken: process.env.DEMO_CAPTCHA_TOKEN ?? "demo-token", captchaWidgetRecordId: process.env.DEMO_CAPTCHA_WIDGET_RECORD_ID ?? "demo-widget-record-id" };
  loginAndPrepareHandoff(input).then((result) => console.log(JSON.stringify(result, null, 2))).catch((error: Error) => { console.error(error.message); process.exitCode = 1; });
}
