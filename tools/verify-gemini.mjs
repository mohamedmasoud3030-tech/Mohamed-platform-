#!/usr/bin/env node
/**
 * Gemini key doctor — diagnoses exactly the failures the assistant degrades on.
 *
 * Not part of the build or verify gates: run it manually when the assistant
 * falls back to deterministic mode and you want to know why.
 *
 *   GEMINI_API_KEY=... node tools/verify-gemini.mjs
 *   # or with a .env present in the repo root:
 *   node --env-file=.env tools/verify-gemini.mjs
 */
import { readFileSync } from "node:fs";

const ROOT = new URL("..", import.meta.url);

function readKeyFromDotEnv() {
  try {
    const env = readFileSync(new URL(".env", ROOT), "utf8");
    const match = /^GEMINI_API_KEY=(.*)$/m.exec(env);
    return match ? match[1].trim() : "";
  } catch {
    return "";
  }
}

const key = process.env.GEMINI_API_KEY?.trim() || readKeyFromDotEnv();
const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

console.log("── Gemini key doctor ─────────────────────────────");

if (!key) {
  console.log("✗ لا يوجد مفتاح — GEMINI_API_KEY غير مضبوط.");
  console.log("  البوت سيعمل بالوضع الحتمي (إجابات موثقة حرفية) بدون استدعاء المزوّد.");
  console.log("  لتفعيل الوضع التوليدي:");
  console.log("   1) افتح Google AI Studio → Get API key.");
  console.log("   2) أنشئ مفتاحًا مقيدًا بـ Gemini API (المفاتيح غير المقيدة تُرفض منذ 2026-06-19).");
  console.log("   3) ضعه في متغيرات البيئة على الخادم فقط: GEMINI_API_KEY.");
  console.log("   4) أعد النشر، ثم أعد هذا الفحص.");
  process.exit(1);
}

console.log(`✓ يوجد مفتاح (${key.slice(0, 4)}…${key.slice(-2)}، طول ${key.length}).`);
console.log(`✓ الموديل: ${model}`);

let response;
try {
  response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}`, {
    headers: { "x-goog-api-key": key },
    signal: AbortSignal.timeout(10_000),
  });
} catch (error) {
  console.log("✗ فشل الاتصال بالشبكة — تحقق من الاتصال أو من حجب النطاق عندك.");
  console.log(`  ${error?.message ?? error}`);
  process.exit(1);
}

if (response.ok) {
  console.log("✓ المفتاح يعمل والموديل متاح — الوضع التوليدي مفعّل.");
  process.exit(0);
}

const body = await response.json().catch(() => ({}));
const message = body?.error?.message ?? "";
console.log(`✗ الطلب فشل (HTTP ${response.status}).`);
if (response.status === 400 && /api key not valid|api_key_invalid/i.test(message)) {
  console.log("  السبب: المفتاح غير صالح — محذوف أو غير مقيد (تُرفض المفاتيح غير المقيدة منذ 2026-06-19).");
  console.log("  الحل: أنشئ مفتاحًا جديدًا من AI Studio مقيدًا بـ Gemini API، أو قيّد مفتاحك الحالي من Google Cloud Credentials.");
} else if (response.status === 401 || response.status === 403) {
  console.log("  السبب: المفتاح مرفوض (Generative Language API غير مفعّلة، أو قيود المفتاح تمنعه، أو المنطقة غير مدعومة).");
  console.log("  الحل: فعّل Generative Language API في مشروع Google Cloud، وراجع API restrictions على المفتاح.");
} else if (response.status === 429) {
  console.log("  السبب: الحصة/المعدل — المفتاح صالح لكن تجاوز الحد المجاني أو الميزانية.");
  console.log("  الحل: انتظر أو فعّل الفوترة؛ البوت يبقى يعمل بالوضع الحتمي.");
} else if (response.status === 404) {
  console.log(`  السبب: اسم الموديل غير موجود (${model}).`);
  console.log("  الحل: عدّل GEMINI_MODEL إلى موديل صالح، أو احذف المتغير ليُستخدم الافتراضي.");
} else {
  console.log(`  التفصيل: ${message || "غير معروف"}`);
}
process.exit(1);
