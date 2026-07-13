const { buildBaseLayout } = require("./layout");

/**
 * Builds the HTML content for the Welcome email.
 *
 * @param {string} [fullName] - User full name.
 * @returns {string} Compiled HTML string.
 */
const getWelcomeEmail = (fullName) => {
  const greetingName = fullName ? fullName.trim() : "Explorer";
  const brandColorPrimary = "#2563EB";
  const homeUrl = process.env.ORIGIN || "http://localhost:5173";

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">Hi ${greetingName},</p>
    
    <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 22px; color: #475569;">
      Welcome to <strong>Traveler</strong>! We are absolutely thrilled to have you join our global community of explorers, adventurers, and storytellers.
    </p>

    <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 22px; color: #475569;">
      Here are a few things you can do to get started on your journey:
    </p>

    <!-- Checklist of Features -->
    <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="width: 100%; margin-bottom: 24px;">
      <tr>
        <td style="vertical-align: top; padding-bottom: 12px; width: 30px; font-size: 18px;">📸</td>
        <td style="padding-bottom: 12px; font-size: 14px; line-height: 20px; color: #334155;">
          <strong>Create Travel Posts</strong>: Share beautiful memories, tag your friends, and review your favorite locations.
        </td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding-bottom: 12px; width: 30px; font-size: 18px;">🗺️</td>
        <td style="padding-bottom: 12px; font-size: 14px; line-height: 20px; color: #334155;">
          <strong>Map Live Stories</strong>: Drop 24-hour visual pins on our interactive world map to show where you're traveling.
        </td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding-bottom: 12px; width: 30px; font-size: 18px;">🌲</td>
        <td style="padding-bottom: 12px; font-size: 14px; line-height: 20px; color: #334155;">
          <strong>Build Journey Trees</strong>: Document complete multi-step routes to showcase your itinerary node-by-node.
        </td>
      </tr>
      <tr>
        <td style="vertical-align: top; width: 30px; font-size: 18px;">🤝</td>
        <td style="font-size: 14px; line-height: 20px; color: #334155;">
          <strong>Collaborate</strong>: Invite travel partners to join your active journeys and add steps together.
        </td>
      </tr>
    </table>

    <!-- Call to Action Button -->
    <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin: 30px auto; text-align: center;">
      <tr>
        <td align="center" style="background-color: ${brandColorPrimary}; border-radius: 8px;">
          <a href="${homeUrl}" target="_blank" style="display: inline-block; padding: 14px 30px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 8px;">
            Go to Your Feed
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 22px; color: #64748B;">
      Happy exploring,<br>
      <strong>The Traveler Team</strong>
    </p>
  `;

  return buildBaseLayout({
    title: "Welcome to Traveler! 🌍",
    bodyHtml,
    previewText: "Your global explorer community awaits.",
  });
};

module.exports = getWelcomeEmail;
