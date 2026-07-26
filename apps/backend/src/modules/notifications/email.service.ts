import nodemailer, { Transporter } from "nodemailer";
import { env } from "../../config/env";
import { logger } from "../../logger";

let transporterPromise: Promise<Transporter> | null = null;

function buildTransporter(): Promise<Transporter> {
  if (env.SMTP_HOST) {
    return Promise.resolve(
      nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: Number(env.SMTP_PORT),
        secure: env.SMTP_SECURE === "true",
        auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
      })
    );
  }

  logger.warn("SMTP_HOST not set — using an auto-created Ethereal test inbox for outbound email");
  return nodemailer.createTestAccount().then((account) =>
    nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: { user: account.user, pass: account.pass },
    })
  );
}

function getTransporter(): Promise<Transporter> {
  if (!transporterPromise) {
    transporterPromise = buildTransporter();
  }
  return transporterPromise;
}

async function send(to: string, subject: string, html: string): Promise<void> {
  if (env.NODE_ENV === "test") {
    logger.info({ to, subject }, "Email suppressed in test environment");
    return;
  }

  const transporter = await getTransporter();
  const info = await transporter.sendMail({ from: env.EMAIL_FROM, to, subject, html });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    logger.info({ to, subject, previewUrl }, "Email sent (Ethereal preview)");
  } else {
    logger.info({ to, subject }, "Email sent");
  }
}

export async function sendApplicationPendingEmail(to: string, companyName: string): Promise<void> {
  await send(
    to,
    "Your HRM PLUS application has been received",
    `<p>Hi ${companyName},</p>
     <p>Thanks for applying for an HRM PLUS workspace. Your application is now pending review by our team.</p>
     <p>We'll email you as soon as it has been approved.</p>`
  );
}

export async function sendApplicationApprovedEmail(
  to: string,
  companyName: string,
  loginUrl: string,
  password: string
): Promise<void> {
  await send(
    to,
    "Your HRM PLUS workspace is ready",
    `<p>Hi ${companyName},</p>
     <p>Your HRM PLUS workspace has been approved and is ready to use.</p>
     <p><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a><br/>
        <strong>Email:</strong> ${to}<br/>
        <strong>Temporary password:</strong> ${password}</p>
     <p>You'll be asked to set a new password the first time you log in.</p>`
  );
}

export async function sendApplicationRejectedEmail(
  to: string,
  companyName: string,
  reviewNote?: string
): Promise<void> {
  await send(
    to,
    "Your HRM PLUS application status",
    `<p>Hi ${companyName},</p>
     <p>Unfortunately your HRM PLUS application was not approved at this time.</p>
     ${reviewNote ? `<p>Note from our team: ${reviewNote}</p>` : ""}`
  );
}
