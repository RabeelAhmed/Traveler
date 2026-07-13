const { buildBaseLayout } = require("./layout");

/**
 * Builds the HTML content for the Email Verification email.
 *
 * @param {string} verificationUrl - Verification activation route link.
 * @param {string} [fullName] - User full name.
 * @returns {string} Compiled HTML string.
 */
const getVerifyEmail = (verificationUrl, fullName) => {
  const greetingName = fullName ? fullName.trim() : "Explorer";
  const brandColorPrimary = "#2563EB";

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">Hi ${greetingName},</p>
    
    <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 22px; color: #475569;">
      Thank you for registering on Traveler! To complete your account activation and ensure your profile stays secure, please verify your email address by clicking the button below:
    </p>

    <!-- Call to Action Button -->
    <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin: 30px auto; text-align: center;">
      <tr>
        <td align="center" style="background-color: ${brandColorPrimary}; border-radius: 8px;">
          <a href="${verificationUrl}" target="_blank" style="display: inline-block; padding: 14px 30px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 8px;">
            Verify Email Address
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748B;">
      If the button above does not work, copy and paste this link into your browser:
    </p>
    
    <!-- Link Fallback Box -->
    <div style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px 16px; word-break: break-all; margin-bottom: 24px;">
      <a href="${verificationUrl}" target="_blank" style="font-size: 13px; color: ${brandColorPrimary}; text-decoration: none; font-family: monospace;">
        ${verificationUrl}
      </a>
    </div>

    <!-- Security disclaimer -->
    <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="width: 100%; border-top: 1px solid #E5E7EB; margin-top: 24px; padding-top: 16px;">
      <tr>
        <td>
          <p style="margin: 0; font-size: 12px; line-height: 18px; color: #94A3B8;">
            If you did not create a Traveler account, no further action is required. You can safely ignore this email.
          </p>
        </td>
      </tr>
    </table>
  `;

  return buildBaseLayout({
    title: "Verify your email address",
    bodyHtml,
    previewText: "Confirm your email to complete registration.",
  });
};

module.exports = getVerifyEmail;
