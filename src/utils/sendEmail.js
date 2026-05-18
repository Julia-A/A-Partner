import mailTransporter from "../config/mail.js";
import ApiError from "./ApiError.js";

const sendEmail = async ({ to, subject, text, html }) => {
  if (!to) {
    throw new ApiError(401, "Sendmail missing 'to'");
  }
  if (!subject) {
    throw new ApiError(401, "Sendmail missing 'subject'");
  }

  const from = process.env.MAIL_FROM_EMAIL;
  // console.log("options:", mailTransporter.options)

  try {
    return await mailTransporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    })
  } catch (err) {
    throw new ApiError(400, err)
  }

};

export default sendEmail;
