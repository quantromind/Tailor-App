const nodemailer = require('nodemailer');

// Lazy-initialize transporter so env vars are loaded first
let transporter = null;

function getTransporter() {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS, // Gmail App Password (not your login password)
            },
        });
    }
    return transporter;
}

/**
 * Send a subscription confirmation email.
 * Sends to both the admin (ADMIN_EMAIL) and optionally to the user.
 *
 * @param {Object} opts
 * @param {string} opts.userName         - Tailor's full name
 * @param {string} opts.companyName      - Tailor's shop / company name
 * @param {string} opts.userEmail        - Tailor's email (may be empty)
 * @param {string} opts.userPhone        - Tailor's phone number
 * @param {string} opts.planName         - Plan name (e.g. "Silver", "Gold")
 * @param {number} opts.amount           - Total amount paid (INR)
 * @param {number} opts.maxClients       - Customer limit on this plan
 * @param {string} opts.endDate          - ISO string of subscription end date
 * @param {string} opts.razorpayOrderId  - Razorpay order ID for reference
 */
async function sendSubscriptionConfirmation(opts) {
    const {
        userName,
        companyName,
        userEmail,
        userPhone,
        planName,
        amount,
        maxClients,
        endDate,
        razorpayOrderId,
    } = opts;

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
        console.warn('[Mailer] ADMIN_EMAIL not set. Skipping email.');
        return;
    }

    const formattedDate = endDate
        ? new Date(endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'N/A';

    const formattedAmount = `₹${Number(amount).toFixed(2)}`;

    // Shared HTML body builder
    const buildHtml = (recipientLabel) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Subscription Confirmation</title>
</head>
<body style="margin:0;padding:0;background:#F7F8F2;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F8F2;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #E4E9D9;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#2C4238,#3D5945);padding:36px 40px;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;color:rgba(255,255,255,0.7);letter-spacing:3px;text-transform:uppercase;">eTailoring App</p>
              <h1 style="margin:0;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">✅ Subscription Activated</h1>
              <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">${recipientLabel}</p>
            </td>
          </tr>

          <!-- Plan Badge -->
          <tr>
            <td style="padding:32px 40px 0;text-align:center;">
              <div style="display:inline-block;background:#EAF0E3;border:1px solid #A3B18A;border-radius:50px;padding:10px 28px;">
                <span style="font-size:20px;font-weight:900;color:#2C4238;letter-spacing:0.5px;">🏆 ${planName} Plan</span>
              </div>
            </td>
          </tr>

          <!-- Details -->
          <tr>
            <td style="padding:28px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #E4E9D9;">
                    <span style="color:#6B705C;font-size:13px;">Tailor Name</span>
                  </td>
                  <td align="right" style="padding:12px 0;border-bottom:1px solid #E4E9D9;">
                    <strong style="color:#1B2621;font-size:14px;">${userName}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #E4E9D9;">
                    <span style="color:#6B705C;font-size:13px;">Company / Shop</span>
                  </td>
                  <td align="right" style="padding:12px 0;border-bottom:1px solid #E4E9D9;">
                    <strong style="color:#1B2621;font-size:14px;">${companyName || '—'}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #E4E9D9;">
                    <span style="color:#6B705C;font-size:13px;">Phone</span>
                  </td>
                  <td align="right" style="padding:12px 0;border-bottom:1px solid #E4E9D9;">
                    <strong style="color:#1B2621;font-size:14px;">${userPhone}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #E4E9D9;">
                    <span style="color:#6B705C;font-size:13px;">Customer Limit</span>
                  </td>
                  <td align="right" style="padding:12px 0;border-bottom:1px solid #E4E9D9;">
                    <strong style="color:#1B2621;font-size:14px;">${maxClients >= 1000000 ? 'Unlimited' : maxClients} clients</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #E4E9D9;">
                    <span style="color:#6B705C;font-size:13px;">Valid Until</span>
                  </td>
                  <td align="right" style="padding:12px 0;border-bottom:1px solid #E4E9D9;">
                    <strong style="color:#1B2621;font-size:14px;">${formattedDate}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 0 4px;">
                    <span style="color:#6B705C;font-size:13px;">Amount Paid</span>
                  </td>
                  <td align="right" style="padding:14px 0 4px;">
                    <strong style="color:#2C4238;font-size:22px;font-weight:900;">${formattedAmount}</strong>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Reference -->
          <tr>
            <td style="padding:0 40px 28px;">
              <p style="margin:0;font-size:11px;color:#93998A;">Order Ref: ${razorpayOrderId}</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F7F8F2;padding:20px 40px;text-align:center;border-top:1px solid #E4E9D9;">
              <p style="margin:0;font-size:12px;color:#93998A;">eTailoring App · Powering Smart Tailors 🧵</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const subject = `🏆 Subscription Activated — ${planName} Plan · ${companyName || userName}`;

    const recipients = [adminEmail];
    if (userEmail && userEmail !== adminEmail) {
        recipients.push(userEmail);
    }

    try {
        await getTransporter().sendMail({
            from: `"eTailoring App" <${process.env.MAIL_USER}>`,
            to: recipients.join(', '),
            subject,
            html: buildHtml(
                userEmail && userEmail !== adminEmail
                    ? `Sent to admin & tailor (${userEmail})`
                    : 'Admin notification'
            ),
        });
        console.log(`[Mailer] Subscription confirmation sent → ${recipients.join(', ')}`);
    } catch (err) {
        // Email failure should never block the API response
        console.error('[Mailer] Failed to send subscription confirmation email:', err.message);
    }
}

/**
 * Send a subscription failure email.
 * Sends to both the admin and optionally to the user.
 */
async function sendSubscriptionFailure(opts) {
    const {
        userName,
        companyName,
        userEmail,
        userPhone,
        planName,
        amount,
        razorpayOrderId,
        failureReason,
    } = opts;

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
        console.warn('[Mailer] ADMIN_EMAIL not set. Skipping failure email.');
        return;
    }

    const formattedAmount = `₹${Number(amount).toFixed(2)}`;

    // Shared HTML body builder
    const buildHtml = (recipientLabel) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Payment Failed</title>
</head>
<body style="margin:0;padding:0;background:#F7F8F2;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F8F2;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #E4E9D9;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#8B0000,#B22222);padding:36px 40px;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;color:rgba(255,255,255,0.7);letter-spacing:3px;text-transform:uppercase;">eTailoring App</p>
              <h1 style="margin:0;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">❌ Payment Failed</h1>
              <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">${recipientLabel}</p>
            </td>
          </tr>

          <!-- Details -->
          <tr>
            <td style="padding:28px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #E4E9D9;">
                    <span style="color:#6B705C;font-size:13px;">Tailor Name</span>
                  </td>
                  <td align="right" style="padding:12px 0;border-bottom:1px solid #E4E9D9;">
                    <strong style="color:#1B2621;font-size:14px;">${userName}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #E4E9D9;">
                    <span style="color:#6B705C;font-size:13px;">Company / Shop</span>
                  </td>
                  <td align="right" style="padding:12px 0;border-bottom:1px solid #E4E9D9;">
                    <strong style="color:#1B2621;font-size:14px;">${companyName || '—'}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #E4E9D9;">
                    <span style="color:#6B705C;font-size:13px;">Phone</span>
                  </td>
                  <td align="right" style="padding:12px 0;border-bottom:1px solid #E4E9D9;">
                    <strong style="color:#1B2621;font-size:14px;">${userPhone}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #E4E9D9;">
                    <span style="color:#6B705C;font-size:13px;">Plan Attempted</span>
                  </td>
                  <td align="right" style="padding:12px 0;border-bottom:1px solid #E4E9D9;">
                    <strong style="color:#1B2621;font-size:14px;">${planName}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #E4E9D9;">
                    <span style="color:#6B705C;font-size:13px;">Failure Reason</span>
                  </td>
                  <td align="right" style="padding:12px 0;border-bottom:1px solid #E4E9D9;">
                    <strong style="color:#8B0000;font-size:14px;">${failureReason}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 0 4px;">
                    <span style="color:#6B705C;font-size:13px;">Amount</span>
                  </td>
                  <td align="right" style="padding:14px 0 4px;">
                    <strong style="color:#2C4238;font-size:22px;font-weight:900;">${formattedAmount}</strong>
                  </td>
                </tr>
              </table>
              
              <p style="margin-top:20px;font-size:14px;color:#1B2621;line-height:1.5;">
                We noticed your recent payment attempt failed. No amount has been deducted. You can try again using a different payment method!
              </p>
            </td>
          </tr>

          <!-- Reference -->
          <tr>
            <td style="padding:0 40px 28px;">
              <p style="margin:0;font-size:11px;color:#93998A;">Order Ref: ${razorpayOrderId}</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const subject = `⚠️ Payment Failed — ${planName} Plan · ${companyName || userName}`;

    const recipients = [adminEmail];
    if (userEmail && userEmail !== adminEmail) {
        recipients.push(userEmail);
    }

    try {
        await getTransporter().sendMail({
            from: `"eTailoring App" <${process.env.MAIL_USER}>`,
            to: recipients.join(', '),
            subject,
            html: buildHtml(
                userEmail && userEmail !== adminEmail
                    ? `Sent to admin & tailor (${userEmail})`
                    : 'Admin notification'
            ),
        });
        console.log(`[Mailer] Payment failure email sent → ${recipients.join(', ')}`);
    } catch (err) {
        console.error('[Mailer] Failed to send payment failure email:', err.message);
    }
}

module.exports = { sendSubscriptionConfirmation, sendSubscriptionFailure };
