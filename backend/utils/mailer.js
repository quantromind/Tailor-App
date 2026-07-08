const nodemailer = require('nodemailer');

// Lazy-initialize transporter so env vars are loaded first
let transporter = null;

function getTransporter() {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS, // Gmail App Password (no spaces)
            },
        });
    }
    return transporter;
}

// ─── Shared helpers ──────────────────────────────────────────────────────────

function formatAmount(amount) {
    return `₹${Number(amount).toFixed(2)}`;
}

function formatDate(date) {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
    });
}

function usagePercent(current, max) {
    if (!max || max >= 1000000) return 0;
    return Math.min(100, Math.round((current / max) * 100));
}

function usageBar(current, max) {
    const pct = usagePercent(current, max);
    const color = pct >= 90 ? '#C0392B' : pct >= 70 ? '#E67E22' : '#27AE60';
    return `
      <div style="background:#E4E9D9;border-radius:50px;height:10px;width:100%;margin-top:6px;">
        <div style="background:${color};width:${pct}%;height:10px;border-radius:50px;transition:width 0.3s;"></div>
      </div>`;
}

// ─── ADMIN email ─────────────────────────────────────────────────────────────

function buildAdminHtml(opts) {
    const {
        userName, companyName, userEmail, userPhone,
        planName, amount, maxClients, currentClients,
        isActive, startDate, razorpayOrderId,
    } = opts;

    const maxLabel = maxClients >= 1000000 ? 'Unlimited' : maxClients;
    const statusColor = isActive ? '#27AE60' : '#C0392B';
    const statusLabel = isActive ? '✅ Active' : '❌ Inactive';
    const pct = usagePercent(currentClients, maxClients);

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Admin — Subscription Activated</title>
</head>
<body style="margin:0;padding:0;background:#F0F4F8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F4F8;padding:40px 20px;">
    <tr><td align="center">
      <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #D9E2EC;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a3c34,#2d6a4f);padding:36px 40px;text-align:center;">
            <p style="margin:0 0 6px;font-size:11px;color:rgba(255,255,255,0.65);letter-spacing:3px;text-transform:uppercase;">eTailoring App · Admin Notification</p>
            <h1 style="margin:0;font-size:24px;font-weight:800;color:#fff;">🏆 New Subscription Activated</h1>
            <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.75);">A tailor just subscribed — full details below</p>
          </td>
        </tr>

        <!-- Plan Badge -->
        <tr>
          <td style="padding:28px 40px 0;text-align:center;">
            <div style="display:inline-block;background:#E8F5E9;border:1.5px solid #81C784;border-radius:50px;padding:10px 30px;">
              <span style="font-size:18px;font-weight:900;color:#1a3c34;letter-spacing:0.5px;">📦 ${planName} Plan</span>
            </div>
          </td>
        </tr>

        <!-- Section: User Details -->
        <tr>
          <td style="padding:28px 40px 0;">
            <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#2d6a4f;letter-spacing:2px;text-transform:uppercase;">👤 User Details</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E4E9D9;border-radius:12px;overflow:hidden;">
              <tr style="background:#F7FBF9;">
                <td style="padding:11px 16px;font-size:13px;color:#6B705C;border-bottom:1px solid #E4E9D9;">Name</td>
                <td style="padding:11px 16px;font-size:13px;font-weight:600;color:#1B2621;text-align:right;border-bottom:1px solid #E4E9D9;">${userName}</td>
              </tr>
              <tr>
                <td style="padding:11px 16px;font-size:13px;color:#6B705C;border-bottom:1px solid #E4E9D9;">Shop / Company</td>
                <td style="padding:11px 16px;font-size:13px;font-weight:600;color:#1B2621;text-align:right;border-bottom:1px solid #E4E9D9;">${companyName || '—'}</td>
              </tr>
              <tr style="background:#F7FBF9;">
                <td style="padding:11px 16px;font-size:13px;color:#6B705C;border-bottom:1px solid #E4E9D9;">Email</td>
                <td style="padding:11px 16px;font-size:13px;font-weight:600;color:#1B2621;text-align:right;border-bottom:1px solid #E4E9D9;">${userEmail || '—'}</td>
              </tr>
              <tr>
                <td style="padding:11px 16px;font-size:13px;color:#6B705C;">Phone</td>
                <td style="padding:11px 16px;font-size:13px;font-weight:600;color:#1B2621;text-align:right;">${userPhone || '—'}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Section: Subscription Details -->
        <tr>
          <td style="padding:24px 40px 0;">
            <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#2d6a4f;letter-spacing:2px;text-transform:uppercase;">📋 Subscription Details</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E4E9D9;border-radius:12px;overflow:hidden;">
              <tr style="background:#F7FBF9;">
                <td style="padding:11px 16px;font-size:13px;color:#6B705C;border-bottom:1px solid #E4E9D9;">Plan</td>
                <td style="padding:11px 16px;font-size:13px;font-weight:600;color:#1B2621;text-align:right;border-bottom:1px solid #E4E9D9;">${planName}</td>
              </tr>
              <tr>
                <td style="padding:11px 16px;font-size:13px;color:#6B705C;border-bottom:1px solid #E4E9D9;">Amount Paid</td>
                <td style="padding:11px 16px;font-size:20px;font-weight:900;color:#1a3c34;text-align:right;border-bottom:1px solid #E4E9D9;">${formatAmount(amount)}</td>
              </tr>
              <tr style="background:#F7FBF9;">
                <td style="padding:11px 16px;font-size:13px;color:#6B705C;border-bottom:1px solid #E4E9D9;">Customer Limit</td>
                <td style="padding:11px 16px;font-size:13px;font-weight:600;color:#1B2621;text-align:right;border-bottom:1px solid #E4E9D9;">${maxLabel} clients</td>
              </tr>
              <tr>
                <td style="padding:11px 16px;font-size:13px;color:#6B705C;">Start Date</td>
                <td style="padding:11px 16px;font-size:13px;font-weight:600;color:#1B2621;text-align:right;">${formatDate(startDate)}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Section: Usage & Status -->
        <tr>
          <td style="padding:24px 40px 0;">
            <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#2d6a4f;letter-spacing:2px;text-transform:uppercase;">📊 Usage &amp; Status</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E4E9D9;border-radius:12px;overflow:hidden;">
              <tr style="background:#F7FBF9;">
                <td style="padding:11px 16px;font-size:13px;color:#6B705C;border-bottom:1px solid #E4E9D9;">Status</td>
                <td style="padding:11px 16px;font-size:13px;font-weight:700;color:${statusColor};text-align:right;border-bottom:1px solid #E4E9D9;">${statusLabel}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding:14px 16px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:13px;color:#6B705C;">Customers Used</span>
                    <span style="font-size:13px;font-weight:700;color:#1B2621;">${currentClients} / ${maxLabel} <span style="color:#6B705C;font-weight:400;">(${pct}%)</span></span>
                  </div>
                  ${usageBar(currentClients, maxClients)}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Reference -->
        <tr>
          <td style="padding:20px 40px 28px;">
            <p style="margin:0;font-size:11px;color:#93998A;">Order Ref: ${razorpayOrderId}</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F7F8F2;padding:18px 40px;text-align:center;border-top:1px solid #E4E9D9;">
            <p style="margin:0;font-size:12px;color:#93998A;">eTailoring App · Admin Dashboard · Powering Smart Tailors 🧵</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── USER email ───────────────────────────────────────────────────────────────

function buildUserHtml(opts) {
    const {
        userName, planName, amount, maxClients,
        currentClients, isActive, startDate, razorpayOrderId,
    } = opts;

    const maxLabel = maxClients >= 1000000 ? 'Unlimited' : maxClients;
    const statusColor = isActive ? '#27AE60' : '#C0392B';
    const statusLabel = isActive ? '✅ Active' : '❌ Inactive';
    const pct = usagePercent(currentClients, maxClients);

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Subscription Confirmed</title>
</head>
<body style="margin:0;padding:0;background:#F7F8F2;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F8F2;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #E4E9D9;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#2C4238,#3D5945);padding:36px 40px;text-align:center;">
            <p style="margin:0 0 6px;font-size:11px;color:rgba(255,255,255,0.65);letter-spacing:3px;text-transform:uppercase;">eTailoring App</p>
            <h1 style="margin:0;font-size:26px;font-weight:800;color:#fff;">✅ Subscription Activated!</h1>
            <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.8);">Hi ${userName}, your plan is now live 🎉</p>
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

        <!-- Section: Subscription Details -->
        <tr>
          <td style="padding:28px 40px 0;">
            <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#3D5945;letter-spacing:2px;text-transform:uppercase;">📋 Subscription Details</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E4E9D9;border-radius:12px;overflow:hidden;">
              <tr style="background:#F7FBF9;">
                <td style="padding:12px 16px;font-size:13px;color:#6B705C;border-bottom:1px solid #E4E9D9;">Plan</td>
                <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#1B2621;text-align:right;border-bottom:1px solid #E4E9D9;">${planName}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font-size:13px;color:#6B705C;border-bottom:1px solid #E4E9D9;">Amount Paid</td>
                <td style="padding:12px 16px;font-size:20px;font-weight:900;color:#2C4238;text-align:right;border-bottom:1px solid #E4E9D9;">${formatAmount(amount)}</td>
              </tr>
              <tr style="background:#F7FBF9;">
                <td style="padding:12px 16px;font-size:13px;color:#6B705C;border-bottom:1px solid #E4E9D9;">Customer Limit</td>
                <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#1B2621;text-align:right;border-bottom:1px solid #E4E9D9;">${maxLabel} clients</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font-size:13px;color:#6B705C;">Active Since</td>
                <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#1B2621;text-align:right;">${formatDate(startDate)}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Section: Usage & Status -->
        <tr>
          <td style="padding:24px 40px 0;">
            <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#3D5945;letter-spacing:2px;text-transform:uppercase;">📊 Usage &amp; Status</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E4E9D9;border-radius:12px;overflow:hidden;">
              <tr style="background:#F7FBF9;">
                <td style="padding:12px 16px;font-size:13px;color:#6B705C;border-bottom:1px solid #E4E9D9;">Status</td>
                <td style="padding:12px 16px;font-size:13px;font-weight:700;color:${statusColor};text-align:right;border-bottom:1px solid #E4E9D9;">${statusLabel}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding:14px 16px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:13px;color:#6B705C;">Customers Used</span>
                    <span style="font-size:13px;font-weight:700;color:#1B2621;">${currentClients} / ${maxLabel} <span style="color:#6B705C;font-weight:400;">(${pct}%)</span></span>
                  </div>
                  ${usageBar(currentClients, maxClients)}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Encouragement -->
        <tr>
          <td style="padding:20px 40px 0;">
            <div style="background:#EAF0E3;border-radius:12px;padding:16px 20px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#2C4238;line-height:1.6;">
                🧵 Thank you for choosing eTailoring App!<br/>
                Start adding your customers and manage your tailoring business with ease.
              </p>
            </div>
          </td>
        </tr>

        <!-- Reference -->
        <tr>
          <td style="padding:16px 40px 24px;">
            <p style="margin:0;font-size:11px;color:#93998A;">Order Ref: ${razorpayOrderId}</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F7F8F2;padding:18px 40px;text-align:center;border-top:1px solid #E4E9D9;">
            <p style="margin:0;font-size:12px;color:#93998A;">eTailoring App · Powering Smart Tailors 🧵</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── sendSubscriptionConfirmation ─────────────────────────────────────────────

/**
 * Send subscription confirmation emails.
 *  - Admin gets: user details + subscription details + usage + status
 *  - User  gets: subscription details + usage + status
 *
 * @param {Object} opts
 * @param {string} opts.userName
 * @param {string} opts.companyName
 * @param {string} opts.userEmail
 * @param {string} opts.userPhone
 * @param {string} opts.planName
 * @param {number} opts.amount
 * @param {number} opts.maxClients
 * @param {number} opts.currentClients
 * @param {boolean} opts.isActive
 * @param {Date}   opts.startDate
 * @param {string} opts.razorpayOrderId
 */
async function sendSubscriptionConfirmation(opts) {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
        console.warn('[Mailer] ADMIN_EMAIL not set. Skipping confirmation email.');
        return;
    }

    const subject = `🏆 Subscription Activated — ${opts.planName} Plan · ${opts.companyName || opts.userName}`;

    const sends = [];

    // 1. Admin email — full details
    sends.push(
        getTransporter().sendMail({
            from: `"eTailoring App" <${process.env.MAIL_USER}>`,
            to: adminEmail,
            subject: `[Admin] ${subject}`,
            html: buildAdminHtml(opts),
        }).then(() => console.log(`[Mailer] Admin confirmation sent → ${adminEmail}`))
    );

    // 2. User email — personalised (only if they have an email and it differs from admin)
    if (opts.userEmail && opts.userEmail.trim() !== '' && opts.userEmail !== adminEmail) {
        sends.push(
            getTransporter().sendMail({
                from: `"eTailoring App" <${process.env.MAIL_USER}>`,
                to: opts.userEmail,
                subject,
                html: buildUserHtml(opts),
            }).then(() => console.log(`[Mailer] User confirmation sent → ${opts.userEmail}`))
        );
    }

    try {
        await Promise.all(sends);
    } catch (err) {
        console.error('[Mailer] Failed to send subscription confirmation email:', err.message);
    }
}

// ─── sendSubscriptionFailure ──────────────────────────────────────────────────

/**
 * Send a subscription failure / payment-cancelled email.
 * Sends to both the admin and optionally to the user.
 */
async function sendSubscriptionFailure(opts) {
    const {
        userName, companyName, userEmail, userPhone,
        planName, amount, razorpayOrderId, failureReason,
    } = opts;

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
        console.warn('[Mailer] ADMIN_EMAIL not set. Skipping failure email.');
        return;
    }

    const formattedAmount = formatAmount(amount);

    const buildFailureHtml = (isAdmin) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Payment Failed</title>
</head>
<body style="margin:0;padding:0;background:#F7F8F2;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F8F2;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #E4E9D9;">
        <tr>
          <td style="background:linear-gradient(135deg,#8B0000,#B22222);padding:36px 40px;text-align:center;">
            <p style="margin:0 0 6px;font-size:11px;color:rgba(255,255,255,0.65);letter-spacing:3px;text-transform:uppercase;">eTailoring App${isAdmin ? ' · Admin' : ''}</p>
            <h1 style="margin:0;font-size:26px;font-weight:800;color:#fff;">❌ Payment Failed</h1>
            <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">${isAdmin ? 'A tailor\'s payment attempt failed' : `Hi ${userName}, your payment could not be processed`}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E4E9D9;border-radius:12px;overflow:hidden;">
              ${isAdmin ? `
              <tr style="background:#FFF5F5;"><td style="padding:11px 16px;font-size:13px;color:#6B705C;border-bottom:1px solid #E4E9D9;">Tailor Name</td><td style="padding:11px 16px;font-size:13px;font-weight:600;color:#1B2621;text-align:right;border-bottom:1px solid #E4E9D9;">${userName}</td></tr>
              <tr><td style="padding:11px 16px;font-size:13px;color:#6B705C;border-bottom:1px solid #E4E9D9;">Shop / Company</td><td style="padding:11px 16px;font-size:13px;font-weight:600;color:#1B2621;text-align:right;border-bottom:1px solid #E4E9D9;">${companyName || '—'}</td></tr>
              <tr style="background:#FFF5F5;"><td style="padding:11px 16px;font-size:13px;color:#6B705C;border-bottom:1px solid #E4E9D9;">Phone</td><td style="padding:11px 16px;font-size:13px;font-weight:600;color:#1B2621;text-align:right;border-bottom:1px solid #E4E9D9;">${userPhone || '—'}</td></tr>
              ` : ''}
              <tr ${isAdmin ? '' : 'style="background:#FFF5F5;"'}><td style="padding:11px 16px;font-size:13px;color:#6B705C;border-bottom:1px solid #E4E9D9;">Plan Attempted</td><td style="padding:11px 16px;font-size:13px;font-weight:600;color:#1B2621;text-align:right;border-bottom:1px solid #E4E9D9;">${planName}</td></tr>
              <tr ${isAdmin ? 'style="background:#FFF5F5;"' : ''}><td style="padding:11px 16px;font-size:13px;color:#6B705C;border-bottom:1px solid #E4E9D9;">Failure Reason</td><td style="padding:11px 16px;font-size:13px;font-weight:700;color:#8B0000;text-align:right;border-bottom:1px solid #E4E9D9;">${failureReason}</td></tr>
              <tr ${isAdmin ? '' : 'style="background:#FFF5F5;"'}><td style="padding:11px 16px;font-size:13px;color:#6B705C;">Amount</td><td style="padding:11px 16px;font-size:20px;font-weight:900;color:#2C4238;text-align:right;">${formattedAmount}</td></tr>
            </table>
            ${!isAdmin ? `
            <div style="background:#FFF3CD;border-radius:12px;padding:16px 20px;margin-top:20px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#856404;line-height:1.6;">No amount has been deducted. You can try again with a different payment method! 💳</p>
            </div>` : ''}
          </td>
        </tr>
        <tr><td style="padding:0 40px 20px;"><p style="margin:0;font-size:11px;color:#93998A;">Order Ref: ${razorpayOrderId}</p></td></tr>
        <tr><td style="background:#F7F8F2;padding:18px 40px;text-align:center;border-top:1px solid #E4E9D9;"><p style="margin:0;font-size:12px;color:#93998A;">eTailoring App · Powering Smart Tailors 🧵</p></td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const subject = `⚠️ Payment Failed — ${planName} Plan · ${companyName || userName}`;
    const sends = [];

    sends.push(
        getTransporter().sendMail({
            from: `"eTailoring App" <${process.env.MAIL_USER}>`,
            to: adminEmail,
            subject: `[Admin] ${subject}`,
            html: buildFailureHtml(true),
        }).then(() => console.log(`[Mailer] Failure email sent → ${adminEmail}`))
    );

    if (userEmail && userEmail.trim() !== '' && userEmail !== adminEmail) {
        sends.push(
            getTransporter().sendMail({
                from: `"eTailoring App" <${process.env.MAIL_USER}>`,
                to: userEmail,
                subject,
                html: buildFailureHtml(false),
            }).then(() => console.log(`[Mailer] Failure email sent → ${userEmail}`))
        );
    }

    try {
        await Promise.all(sends);
    } catch (err) {
        console.error('[Mailer] Failed to send payment failure email:', err.message);
    }
}

module.exports = { sendSubscriptionConfirmation, sendSubscriptionFailure };
