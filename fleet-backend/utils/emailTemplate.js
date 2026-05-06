import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const EMAIL_LOGO_CID = "axia-fleet-logo";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

export const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const isEmailReachableUrl = (value) => {
  if (!/^https?:\/\//i.test(value)) return false;

  try {
    const { hostname } = new URL(value);
    const normalizedHost = hostname.toLowerCase();
    if (["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(normalizedHost)) {
      return false;
    }
    if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(normalizedHost)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

const firstPublicClientUrl = () => {
  const candidates = [
    process.env.PUBLIC_WEB_URL,
    process.env.WEB_APP_URL,
    process.env.FRONTEND_URL,
    ...(process.env.CLIENT_URL || "").split(","),
  ];

  return candidates
    .map((value) => String(value || "").trim())
    .find(isEmailReachableUrl);
};

const brandLogoUrl = () => {
  const configuredLogoUrl = String(process.env.BRAND_LOGO_URL || "").trim();
  if (isEmailReachableUrl(configuredLogoUrl)) return configuredLogoUrl;

  const baseUrl = firstPublicClientUrl();
  return baseUrl ? `${baseUrl.replace(/\/$/, "")}/images/OFFICIAL%20LOGO.png` : "";
};

const resolveEmailLogoPath = () => {
  const configuredPath = String(process.env.BRAND_LOGO_PATH || "").trim();
  const candidates = [
    configuredPath && path.resolve(configuredPath),
    path.join(repoRoot, "fleet-web-app", "public", "images", "OFFICIAL LOGO.png"),
    path.join(repoRoot, "fleet-backend", "public", "images", "OFFICIAL LOGO.png"),
  ].filter(Boolean);

  return candidates.find((candidate) => fs.existsSync(candidate)) || "";
};

const emailLogoAttachment = () => {
  const logoPath = resolveEmailLogoPath();
  if (!logoPath) return null;

  return {
    filename: "axia-fleet-logo.png",
    path: logoPath,
    cid: EMAIL_LOGO_CID,
    contentDisposition: "inline",
  };
};

export const buildEmailAttachments = () => {
  const attachment = emailLogoAttachment();
  return attachment ? [attachment] : [];
};

export const buildEmailLogoHtml = () => {
  if (emailLogoAttachment()) {
    return `<img src="cid:${EMAIL_LOGO_CID}" alt="AXIA Fleet Manager" width="64" height="64" style="display:block;width:64px;height:64px;border-radius:18px;object-fit:cover;border:1px solid rgba(255,255,255,0.16);" />`;
  }

  const logoUrl = brandLogoUrl();
  if (logoUrl) {
    return `<img src="${escapeHtml(logoUrl)}" alt="AXIA Fleet Manager" width="64" height="64" style="display:block;width:64px;height:64px;border-radius:18px;object-fit:cover;border:1px solid rgba(255,255,255,0.16);" />`;
  }

  return `<div style="height:48px;width:48px;border-radius:14px;background:#0ea5e9;color:#ffffff;display:inline-flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;letter-spacing:0.08em;">AX</div>`;
};

export const buildFleetEmailHtml = ({ recipientName, subject, message }) => {
  const safeName = escapeHtml(recipientName || "there");
  const safeSubject = escapeHtml(subject || "Fleet notification");
  const safeMessage = escapeHtml(message || "A fleet update is available.").replaceAll("\n", "<br />");

  return `
    <div style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:24px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
              <tr>
                <td style="padding:24px 28px;background:#0f172a;color:#ffffff;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="76" valign="middle">${buildEmailLogoHtml()}</td>
                      <td valign="middle">
                        <p style="margin:0;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#93c5fd;">AXIA Fleet Manager</p>
                        <h1 style="margin:8px 0 0;font-size:22px;line-height:1.3;font-weight:700;">${safeSubject}</h1>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:28px;">
                  <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Hello ${safeName},</p>
                  <p style="margin:0;font-size:15px;line-height:1.7;">${safeMessage}</p>
                  <div style="margin-top:24px;padding-top:18px;border-top:1px solid #e2e8f0;">
                    <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
                      This is an automated operational notification from AXIA Fleet Manager.
                    </p>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
};

export const buildPlainTextEmail = ({ recipientName, message }) =>
  [
    `Hello ${recipientName || "there"},`,
    "",
    message || "A fleet update is available.",
    "",
    "This is an automated operational notification from AXIA Fleet Manager.",
    "",
    "AXIA Fleet Manager",
  ].join("\n");
