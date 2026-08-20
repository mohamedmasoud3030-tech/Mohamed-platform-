import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST?.includes("@")
  ? "smtp.gmail.com"
  : (process.env.SMTP_HOST ?? "smtp.gmail.com");
const SMTP_PORT = parseInt(process.env.SMTP_PORT ?? "465", 10);
const SMTP_USER = process.env.SMTP_USER ?? "";
const SMTP_PASS = process.env.SMTP_PASS ?? "";
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL ?? "Mohamedms.oud@outlook.com";

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

export interface InquiryData {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  service?: string | null;
  message: string;
  source?: string | null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderValue(value?: string | null): string {
  return value && value.trim() ? escapeHtml(value.trim()) : "—";
}

function renderSubjectValue(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

/**
 * Mail transport errors routinely carry the recipient address and parts of the
 * envelope. Only the shape of the failure is logged, never its contents.
 */
export function summariseTransportError(error: unknown): { name: string; code?: string; message: string } {
  if (error && typeof error === "object") {
    const candidate = error as { name?: string; code?: string; message?: string };
    return {
      name: candidate.name ?? "Error",
      code: typeof candidate.code === "string" ? candidate.code : undefined,
      // Anything resembling an address is removed before the line reaches the log.
      message: (candidate.message ?? "unknown").replace(/[^\s@]+@[^\s@]+/g, "[redacted]").slice(0, 200),
    };
  }
  return { name: "Error", message: "unknown" };
}

export async function sendNewInquiryNotification(inquiry: InquiryData): Promise<void> {
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn("[mailer] SMTP credentials not configured — skipping notification");
    return;
  }

  const rows = [
    ["الاسم", renderValue(inquiry.name)],
    ["البريد الإلكتروني", renderValue(inquiry.email)],
    ["الهاتف", renderValue(inquiry.phone)],
    ["الخدمة المطلوبة", renderValue(inquiry.service)],
    ["الرسالة", renderValue(inquiry.message)],
    ["المصدر", renderValue(inquiry.source)],
  ];

  const tableRows = rows.map(([label, value]) => `
      <tr>
        <td style="padding:8px 12px;background:#101936;color:#9fc3ff;font-weight:bold;border:1px solid #24305c;text-align:right;">${label}</td>
        <td style="padding:8px 12px;background:#071022;color:#eef4ff;border:1px solid #24305c;text-align:right;white-space:pre-wrap;">${value}</td>
      </tr>`).join("");

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:24px;background:#050814;font-family:Arial,sans-serif;">
  <div style="max-width:620px;margin:0 auto;background:#071022;border:1px solid #24305c;border-radius:18px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#245dff,#6b4dff 55%,#dc5bff);padding:26px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:22px;">استفسار جديد من LENA</h1>
      <p style="margin:8px 0 0;color:#ffffffcc;font-size:14px;">LENA Digital House — رقم #${inquiry.id}</p>
    </div>
    <div style="padding:24px;"><table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;">${tableRows}</table></div>
    <div style="padding:16px 24px;background:#0a1630;text-align:center;">
      <p style="margin:0;color:#9fb0d6;font-size:12px;">تم إرسال هذا الإشعار تلقائيًا من نموذج استفسارات LENA Digital House.</p>
    </div>
  </div>
</body>
</html>`;

  try {
    await transporter.sendMail({
      from: `"LENA Digital House" <${SMTP_USER}>`,
      to: NOTIFY_EMAIL,
      replyTo: inquiry.email || undefined,
      subject: `استفسار جديد إلى LENA — ${renderSubjectValue(inquiry.name)}`,
      html,
    });
    console.log(`[mailer] Notification sent for inquiry #${inquiry.id}`);
  } catch (error) {
    console.error("[mailer] Failed to send notification:", summariseTransportError(error));
  }
}
