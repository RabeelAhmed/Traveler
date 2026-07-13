const { buildBaseLayout } = require("./layout");

/**
 * Builds the HTML content for a Journey Collaboration Invitation email.
 *
 * @param {Object} params
 * @param {string} params.inviterName - Name of the person sending the invite.
 * @param {string} params.journeyTitle - Name of the trip/journey.
 * @param {string} params.acceptUrl - Action link to accept the collaboration request.
 * @param {string} params.declineUrl - Action link to decline the collaboration request.
 * @param {string} [params.fullName] - Recipient full name.
 * @returns {string} Compiled HTML string.
 */
const getJourneyInviteEmail = ({ inviterName, journeyTitle, acceptUrl, declineUrl, fullName }) => {
  const greetingName = fullName ? fullName.trim() : "Explorer";
  const brandColorPrimary = "#2563EB";

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">Hi ${greetingName},</p>
    
    <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 22px; color: #475569;">
      <strong>${inviterName}</strong> has invited you to collaborate on their journey tree: 
      <strong style="color: #1E293B;">"${journeyTitle}"</strong>.
    </p>

    <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 20px; color: #64748B;">
      By accepting this invitation, you will be added as a collaborator on this journey. You'll be able to create and append your own travel stops, images, and posts directly onto the shared journey map/tree with your name attributed!
    </p>

    <!-- Side-by-Side Call to Action Buttons -->
    <table align="center" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin: 30px auto; text-align: center;">
      <tr>
        <!-- Accept Button -->
        <td style="background-color: ${brandColorPrimary}; border-radius: 8px;">
          <a href="${acceptUrl}" target="_blank" style="display: inline-block; padding: 12px 24px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 8px;">
            Accept Invite
          </a>
        </td>
        <!-- Spacer -->
        <td style="width: 16px;"></td>
        <!-- Decline Button -->
        <td style="background-color: #EF4444; border-radius: 8px;">
          <a href="${declineUrl}" target="_blank" style="display: inline-block; padding: 12px 24px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 8px;">
            Decline
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748B;">
      Alternatively, you can copy/paste this link to respond to the invitation:
    </p>
    
    <!-- Link Fallback Box -->
    <div style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px 16px; word-break: break-all; margin-bottom: 24px;">
      <a href="${acceptUrl}" target="_blank" style="font-size: 13px; color: ${brandColorPrimary}; text-decoration: none; font-family: monospace;">
        ${acceptUrl}
      </a>
    </div>

    <!-- Info Notice -->
    <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="width: 100%; border-top: 1px solid #E5E7EB; margin-top: 24px; padding-top: 16px;">
      <tr>
        <td>
          <p style="margin: 0; font-size: 12px; line-height: 18px; color: #94A3B8;">
            You can also view and respond to this invitation directly inside the Notifications tab on Traveler.
          </p>
        </td>
      </tr>
    </table>
  `;

  return buildBaseLayout({
    title: "Journey collaboration invite",
    bodyHtml,
    previewText: `${inviterName} invited you to collaborate on "${journeyTitle}".`,
  });
};

module.exports = getJourneyInviteEmail;
