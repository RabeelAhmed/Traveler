const { buildBaseLayout } = require("./layout");

/**
 * Builds the HTML content for a Social Notification email.
 *
 * @param {string} notificationMessage - Text summarizing the notification event.
 * @param {string} actionUrl - Target destination URL to view the action.
 * @param {string} [fullName] - Recipient full name.
 * @returns {string} Compiled HTML string.
 */
const getNotificationEmail = (notificationMessage, actionUrl, fullName) => {
  const greetingName = fullName ? fullName.trim() : "Explorer";
  const brandColorPrimary = "#2563EB";

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">Hi ${greetingName},</p>
    
    <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 22px; color: #475569;">
      You have a new alert on Traveler:
    </p>

    <!-- Notification message highlight box -->
    <div style="background-color: #F3F4F6; border-left: 4px solid ${brandColorPrimary}; padding: 16px; border-radius: 4px 8px 8px 4px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 16px; font-weight: 700; color: #1E293B; line-height: 22px;">
        ${notificationMessage}
      </p>
    </div>

    <!-- Call to Action Button -->
    <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin: 30px auto; text-align: center;">
      <tr>
        <td align="center" style="background-color: ${brandColorPrimary}; border-radius: 8px;">
          <a href="${actionUrl}" target="_blank" style="display: inline-block; padding: 12px 26px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 8px;">
            View on Traveler
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748B;">
      If the button above does not work, copy and paste this link into your browser:
    </p>
    
    <!-- Link Fallback Box -->
    <div style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px 16px; word-break: break-all; margin-bottom: 24px;">
      <a href="${actionUrl}" target="_blank" style="font-size: 13px; color: ${brandColorPrimary}; text-decoration: none; font-family: monospace;">
        ${actionUrl}
      </a>
    </div>

    <!-- Subscriptions disclaimer -->
    <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="width: 100%; border-top: 1px solid #E5E7EB; margin-top: 24px; padding-top: 16px;">
      <tr>
        <td>
          <p style="margin: 0; font-size: 11px; line-height: 16px; color: #94A3B8;">
            You can customize your email preferences or disable instant social updates inside your Traveler profile settings.
          </p>
        </td>
      </tr>
    </table>
  `;

  return buildBaseLayout({
    title: "New update on Traveler",
    bodyHtml,
    previewText: notificationMessage,
  });
};

module.exports = getNotificationEmail;
