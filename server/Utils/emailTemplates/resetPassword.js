const { buildBaseLayout } = require("./layout");

/**
 * Builds the HTML content for the Password Reset email using the base layout.
 *
 * @param {string} resetUrl - Password reset action URL.
 * @param {string} [fullName] - User full name for personalization.
 * @returns {string} Compiled HTML string.
 */
const getResetPasswordEmail = (resetUrl, fullName) => {
  const greetingName = fullName ? fullName.trim() : "Explorer";
  const brandColorPrimary = "#2563EB"; // Blue (#2563EB)

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">Hi ${greetingName},</p>
    
    <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 22px; color: #475569;">
      We received a request to reset the password associated with your Traveler account. 
      Click the button below to choose a new password:
    </p>

    <!-- Call to Action Button -->
    <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin: 30px auto; text-align: center;">
      <tr>
        <td align="center" style="background-color: ${brandColorPrimary}; border-radius: 8px;">
          <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 14px 30px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 8px;">
            Reset Password
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748B;">
      If the button above does not work, copy and paste this link into your web browser:
    </p>
    
    <!-- Link Fallback Box -->
    <div style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px 16px; word-break: break-all; margin-bottom: 24px;">
      <a href="${resetUrl}" target="_blank" style="font-size: 13px; color: ${brandColorPrimary}; text-decoration: none; font-family: monospace;">
        ${resetUrl}
      </a>
    </div>

    <!-- Security & Expiry Block -->
    <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="width: 100%; border-top: 1px solid #E5E7EB; margin-top: 24px; padding-top: 16px;">
      <tr>
        <td>
          <p style="margin: 0 0 8px 0; font-size: 12px; line-height: 18px; color: #64748B;">
            <strong>Link Expiration:</strong> This request is temporary and will expire in <strong>1 hour</strong>.
          </p>
          <p style="margin: 0; font-size: 12px; line-height: 18px; color: #94A3B8;">
            If you did not request a password reset, you can safely ignore this email. Your account remains completely secure.
          </p>
        </td>
      </tr>
    </table>
  `;

  return buildBaseLayout({
    title: "Reset your password",
    bodyHtml,
    previewText: "Choose a new password for your Traveler account.",
  });
};

module.exports = getResetPasswordEmail;
