import { env } from "../env";
import { logger } from "@repo/logger";

export async function sendOTPEmail(
  email: string,
  otp: string,
  subject = "Verify your email address",
  bodyHtml?: string
): Promise<void> {
  const fromEmail = env.RESEND_FROM_EMAIL;
  const apiKey = env.RESEND_API_KEY;

  const finalHtml =
    bodyHtml ||
    `
    <div style="font-family: serif; max-width: 500px; margin: 0 auto; padding: 20px; background-color: #F2E9D8; border-radius: 24px; border: 1px solid #D1C3A9;">
      <h2 style="color: #3E2723; text-align: center; font-size: 28px; margin-bottom: 20px;">Inquest</h2>
      <p style="color: #5D4037; font-size: 16px; line-height: 1.6;">Hello,</p>
      <p style="color: #5D4037; font-size: 16px; line-height: 1.6;">Thank you for using Inquest. To verify your email address, please use the following 6-digit verification code:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 6px; color: #D87040; background-color: #EADFC8; padding: 10px 24px; border-radius: 12px; font-family: monospace;">${otp}</span>
      </div>
      <p style="color: #8D6E63; font-size: 14px; line-height: 1.6;">This code is valid for the next 10 minutes. If you did not request this code, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #D1C3A9; margin: 30px 0;" />
      <p style="color: #BCAAA4; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Inquest — Thoughtful enquiries, meaningful insights.</p>
    </div>
  `;

  if (!apiKey) {
    logger.warn(`[Resend Email Mock] No RESEND_API_KEY configured. Printing OTP to console.`);
    logger.info(`[Resend Email Mock] To: ${email} | Subject: ${subject} | OTP Code: ${otp}`);
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: subject,
        html: finalHtml,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Resend API Error: ${response.status} - ${errText}`);
    }

    logger.info(`[Resend Email] Successfully sent email to ${email}`);
  } catch (error: any) {
    logger.error(`[Resend Email] Failed to send email: ${error.message}`);
    throw error;
  }
}
