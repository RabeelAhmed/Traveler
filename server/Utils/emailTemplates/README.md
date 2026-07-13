# Reusable HTML Email Template Framework

This folder contains Traveler's modular, responsive HTML email system. It is designed to work seamlessly across major email clients (such as Gmail, Outlook, and Apple Mail) by utilizing table-based structures and inlined CSS styles.

---

## Folder Structure

```
server/Utils/emailTemplates/
├── layout.js          # Base wrapper template layout (🌍 Traveler branding, footer, styling)
├── resetPassword.js   # Password reset email content
├── welcome.js         # User registration welcome email content
├── verifyEmail.js     # Account verification content
├── journeyInvite.js   # Journey collaboration invite content
├── notification.js    # Social action notification content
└── README.md          # Framework documentation (this file)
```

---

## How to Add New Email Templates

Adding a new email type is simple and takes just 3 steps:

### Step 1: Create a Content Template File
Create a new file in this directory (e.g. `promotionAlert.js`) and wrap the content in the `buildBaseLayout` function exported by `./layout`.

Example (`promotionAlert.js`):
```javascript
const { buildBaseLayout } = require("./layout");

/**
 * Builds the HTML content for a Promotion Alert email.
 */
const getPromotionAlertEmail = (promoCode, fullName) => {
  const greetingName = fullName ? fullName.trim() : "Explorer";
  const brandColorPrimary = "#2563EB";

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">Hi ${greetingName},</p>
    <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 22px; color: #475569;">
      Here is your exclusive travel promo code:
    </p>
    <div style="background-color: #F3F4F6; border: 2px dashed #2563EB; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px;">
      <span style="font-size: 20px; font-weight: bold; letter-spacing: 2px; color: #1E293B;">
        ${promoCode}
      </span>
    </div>
  `;

  return buildBaseLayout({
    title: "Exclusive Travel Offer!",
    bodyHtml,
    previewText: "Your discount code inside.",
  });
};

module.exports = getPromotionAlertEmail;
```

### Step 2: Require the Template in Your Controller
Import the template function at the top of your controller (e.g., `server/Controllers/authenticationController.js`):
```javascript
const getPromotionAlertEmail = require("../Utils/emailTemplates/promotionAlert");
```

### Step 3: Trigger the Email
Call the template function inside your logic and pass the result as the `html` field in your Resend email sending payload:
```javascript
await resend.emails.send({
  from: "no-reply@resend.dev",
  to: userEmail,
  subject: "Special Offer just for you!",
  html: getPromotionAlertEmail("EXPLORE2026", userFullname),
});
```

---

## Styling Guidelines
1. **Always Inline Styles**: Do not use stylesheet `<link>` tags or class lists since standard email clients discard them. Put all CSS styles in standard `style="..."` attributes on elements.
2. **Table-Based Spacing**: Use standard HTML table structures with `cellpadding="0" cellspacing="0" border="0"` for layout grids instead of complex absolute divs or flex containers.
3. **Primary Action Color**: Use `#2563EB` (Blue) for primary CTA buttons.
4. **Link Fallbacks**: Provide a monospace fallback text block for URLs in case the primary CTA button does not load or render in a basic text client.
