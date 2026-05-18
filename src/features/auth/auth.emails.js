import ApiError from "../../utils/ApiError.js";
import sendEmail from "../../utils/sendEmail.js";

const APP_NAME = process.env.APP_NAME;

export const sendRegistrationMail = async ({ to, name }) => {
  const subject = "Welcome to your Accountability Partner";
  const html = `
  <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Registration Successful</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f6f8; font-family: Arial, Helvetica, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding:20px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">

            <!-- Header -->
            <tr>
              <td style="background-color:#4f46e5; padding:24px; text-align:center;">
                <h1 style="color:#ffffff; margin:0; font-size:24px;">
                  Welcome to the Accountability App 🎉
                </h1>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:32px; color:#333333;">
                <p style="font-size:16px; margin:0 0 16px 0;">
                  Hi ${name},
                </p>

                <p style="font-size:16px; margin:0 0 16px 0; line-height:1.5;">
                  Thanks for registering with <strong>A-Partner</strong>.
                  Your account has been successfully created.
                </p>

                <p style="font-size:16px; margin:0 0 24px 0; line-height:1.5;">
                  Please verify your email address by clicking the button below:
                </p>

                <!-- Button -->
                <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px auto;">
                  <tr>
                    <td align="center" style="background-color:#4f46e5; border-radius:6px;">
                      <a
                        href="/"
                        target="_blank"
                        style="
                          display:inline-block;
                          padding:14px 28px;
                          color:#ffffff;
                          text-decoration:none;
                          font-size:16px;
                          font-weight:bold;
                        "
                      >
                        Verify Email
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="font-size:14px; color:#666666; line-height:1.5;">
                  If the button doesn't work, copy and paste this link into your browser:
                </p>

                <p style="font-size:14px; word-break:break-all; color:#4f46e5;">
                  {{verificationLink}}
                </p>

                <p style="font-size:14px; color:#666666; margin-top:24px;">
                  If you didn't create this account, you can safely ignore this email.
                </p>

                <p style="font-size:16px; margin-top:32px;">
                  — The A-Partner Team
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color:#f4f6f8; padding:16px; text-align:center; font-size:12px; color:#999999;">
                © ${new Date().getFullYear()} A-Partner. All rights reserved.
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>

  `;
  try {
    await sendEmail({
    to: to,
    subject,
    html,
  });
  } catch (err) {
    throw new ApiError(err)
  }
};

export const sendResetPasswordMail = async ({ to, resetUrl }) => {
  if (!to) {
    throw new ApiError(401, "SendMail error: 'to' is missing");
  }

  if (!resetUrl) {
    throw new ApiError(401, "SendMail error: 'resetUrl' is missing");
  }

  const expiryMinutes = 10;
  const subject = "Reset Your A-Partner Password";
  const html = `
    <!doctype html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Password Reset Link</title>
        </head>
        <body style="margin:0; padding:0; background:#f6f7fb; font-family:Arial, Helvetica, sans-serif; color:#111827;">
          <div style="max-width:600px; margin:0 auto; padding:24px;">

            <div style="text-align:center; padding:12px 0 20px;">
              <div style="font-size:18px; font-weight:700; color:#111827;">
                ${APP_NAME}
              </div>
            </div>

            <div style="background:#ffffff; border-radius:12px; padding:24px; box-shadow:0 2px 10px rgba(17,24,39,0.06);">
              <h1 style="margin:0 0 12px; font-size:20px; line-height:1.3; color:#111827;">
                Reset your password
              </h1>

              <p style="margin:0 0 16px; font-size:14px; line-height:1.6; color:#374151;">
                We received a request to reset the password for your ${APP_NAME} account.
                Use the link below:
              </p>

              <div style="margin:20px 0; text-align:center;">
                <a style="display:inline-block; padding:14px 18px; border-radius:10px; background:#f3f4f6; letter-spacing:6px; font-size:24px; font-weight:700; color:#111827;">
                  ${resetUrl}
                </a>
              </div>

              <p style="margin:0 0 16px; font-size:14px; line-height:1.6; color:#374151;">
                This link will expire in <strong>${expiryMinutes} minutes</strong>.
              </p>

              <p style="margin:0 0 16px; font-size:14px; line-height:1.6; color:#374151;">
                If you didn't request a password reset, you can safely ignore this email — your password won't change.
              </p>

              <hr style="border:none; border-top:1px solid #e5e7eb; margin:20px 0;" />

              <p style="margin:0; font-size:12px; line-height:1.6; color:#6b7280;">
                Need help? Contact us at <a href="mailto:apartner@support.com" style="color:#2563eb; text-decoration:none;">{{SUPPORT_EMAIL}}</a>.
              </p>
            </div>

            <div style="text-align:center; padding:18px 0 0;">
              <p style="margin:0; font-size:12px; color:#9ca3af;">
                © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>


  `;
  await sendEmail({
    to,
    subject,
    html,
  });
};
