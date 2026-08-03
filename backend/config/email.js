const nodemailer = require("nodemailer");

const createTransporter = () => {
  const host = process.env.EMAIL_HOST || "smtp.gmail.com";
  const port = Number(process.env.EMAIL_PORT) || 587;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;

  if (!user || !pass) {
    // Return a mock transport if SMTP credentials are not configured
    return {
      sendMail: async (options) => {
        console.log("--------------------------------------------------");
        console.log("📧 [MOCK EMAIL SERVICE] SMTP credentials not set.");
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log("HTML Body Preview:");
        console.log(options.html);
        console.log("--------------------------------------------------");
        return { messageId: "mock-email-id" };
      },
    };
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
};

const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();
  const from = process.env.EMAIL_FROM || '"Mishra Library ERP" <noreply@mishralibrary.com>';

  const mailOptions = {
    from,
    to,
    subject,
    html,
  };

  return await transporter.sendMail(mailOptions);
};

module.exports = { sendEmail };
