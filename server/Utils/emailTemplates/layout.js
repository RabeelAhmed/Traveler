/**
 * Generates a modern, responsive HTML email base layout.
 * Designed to work across modern email clients with inlined CSS, tables, and Arial/Helvetica typography.
 *
 * @param {Object} options
 * @param {string} options.title - The headline title of the email content card.
 * @param {string} options.bodyHtml - Content inside the email card.
 * @param {string} [options.previewText] - Inbox preview text snippet.
 * @returns {string} Fully styled HTML layout wrapper.
 */
const buildBaseLayout = ({ title, bodyHtml, previewText = "" }) => {
  const brandColorPrimary = "#2563EB"; // Blue (#2563EB)
  const brandColorDark = "#1E293B"; // Gray-800
  const brandColorBg = "#F3F4F6"; // Light Gray (#F3F4F6)
  const textColor = "#334155"; // Gray-700
  const textMuted = "#64748B"; // Gray-500
  const containerBg = "#FFFFFF"; // White card

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <style>
    td,th,div,p,a,h1,h2,h3,h4,h5,h6 {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
  <style>
    @media (max-width: 600px) {
      .sm-w-full {
        width: 100% !important;
      }
      .sm-py-32 {
        padding-top: 32px !important;
        padding-bottom: 32px !important;
      }
      .sm-px-24 {
        padding-left: 24px !important;
        padding-right: 24px !important;
      }
      .sm-leading-32 {
        line-height: 32px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; width: 100%; padding: 0; word-break: break-word; -webkit-font-smoothing: antialiased; background-color: ${brandColorBg}; color: ${textColor}; font-family: Arial, Helvetica, sans-serif;">
  
  ${previewText ? `<div style="display: none; max-height: 0; overflow: hidden;">${previewText}</div>` : ""}

  <div role="article" aria-roledescription="email" lang="en" style="background-color: ${brandColorBg}; padding-top: 32px; padding-bottom: 32px;">
    <table align="center" cellpadding="0" cellspacing="0" border="0" role="presentation" style="width: 100%; max-width: 600px;" class="sm-w-full">
      
      <!-- Brand Header -->
      <tr>
        <td align="center" style="padding: 12px 24px 24px 24px;">
          <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="width: 100%;">
            <tr>
              <td align="center">
                <a href="${process.env.ORIGIN || 'http://localhost:5173'}" target="_blank" style="text-decoration: none;">
                  <span style="font-size: 28px; font-weight: 800; color: ${brandColorPrimary}; letter-spacing: -0.5px;">🌍 Traveler</span>
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Main white container card with 16px rounded corners -->
      <tr>
        <td style="padding: 0 12px;">
          <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="width: 100%; background-color: ${containerBg}; border-radius: 16px; border: 1px solid #E5E7EB; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.06);" class="sm-px-24">
            <tr>
              <td style="padding: 40px 32px;" class="sm-px-24">
                
                <!-- Email Headline -->
                <h1 style="margin: 0 0 24px 0; font-size: 22px; font-weight: 700; line-height: 28px; color: ${brandColorDark}; font-family: Arial, Helvetica, sans-serif;" class="sm-leading-32">
                  ${title}
                </h1>

                <!-- Body HTML content block -->
                <div style="font-size: 15px; line-height: 24px; color: ${textColor}; margin: 0;">
                  ${bodyHtml}
                </div>

              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td align="center" style="padding: 32px 24px 12px 24px;">
          <p style="margin: 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: ${brandColorPrimary};">
            Explore &bull; Share &bull; Inspire
          </p>
          <p style="margin: 12px 0 0 0; font-size: 12px; line-height: 18px; color: ${textMuted}; text-align: center;">
            &copy; ${new Date().getFullYear()} Traveler. All rights reserved.<br>
            If you have questions, contact us at <a href="mailto:support@travelerapp.com" style="color: ${brandColorPrimary}; text-decoration: none;">support@travelerapp.com</a>.
          </p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
`;
};

module.exports = { buildBaseLayout };
