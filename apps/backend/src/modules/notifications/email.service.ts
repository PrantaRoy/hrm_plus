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

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  await send(
    to,
    "Reset your HRM PLUS password",
    `<p>We received a request to reset your HRM PLUS password.</p>
     <p><a href="${resetUrl}">Click here to reset your password</a></p>
     <p>This link will expire in 5 minutes. If you didn't request this, you can safely ignore this email.</p>`
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

export async function sendDocumentStepPendingEmail(
  to: string,
  documentTypeName: string,
  requesterName: string
): Promise<void> {
  await send(
    to,
    `Document request awaiting your approval: ${documentTypeName}`,
    `<p>${requesterName} has requested a <strong>${documentTypeName}</strong> and it's now awaiting your approval.</p>
     <p>Please review it from your Document Approvals queue.</p>`
  );
}

export async function sendDocumentApprovedEmail(to: string, documentTypeName: string): Promise<void> {
  await send(
    to,
    `Your ${documentTypeName} request moved forward`,
    `<p>Your <strong>${documentTypeName}</strong> request has been approved at this step and has moved on to the next approver.</p>`
  );
}

export async function sendDocumentRejectedEmail(
  to: string,
  documentTypeName: string,
  comment?: string | null
): Promise<void> {
  await send(
    to,
    `Your ${documentTypeName} request was rejected`,
    `<p>Your <strong>${documentTypeName}</strong> request was rejected.</p>
     ${comment ? `<p>Reason given: ${comment}</p>` : ""}`
  );
}

export async function sendDocumentIssuedEmail(
  to: string,
  documentTypeName: string,
  downloadPageUrl: string
): Promise<void> {
  await send(
    to,
    `Your ${documentTypeName} is ready`,
    `<p>Your <strong>${documentTypeName}</strong> has been fully approved and is ready to download.</p>
     <p><a href="${downloadPageUrl}">View and download it here</a></p>`
  );
}
