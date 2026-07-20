

export const otpEmailTemplate = (otp) => {
  return `
 <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ChatApp - OTP Verification</title>

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      background: #f5f7fb;
      font-family: Arial, Helvetica, sans-serif;
      padding: 40px 15px;
      color: #333;
    }

    .container {
      max-width: 600px;
      margin: auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 12px 30px rgba(0,0,0,0.08);
    }

    .header {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      padding: 35px 20px;
      text-align: center;
      color: #fff;
    }

    .logo {
      font-size: 34px;
      margin-bottom: 10px;
    }

    .title {
      font-size: 28px;
      font-weight: bold;
    }

    .subtitle {
      margin-top: 8px;
      font-size: 15px;
      opacity: 0.9;
    }

    .content {
      padding: 40px 35px;
      text-align: center;
    }

    .content h2 {
      color: #111827;
      margin-bottom: 15px;
    }

    .content p {
      color: #6b7280;
      line-height: 1.7;
      font-size: 15px;
    }

    .otp-box {
      margin: 35px auto;
      display: inline-block;
      background: #eff6ff;
      border: 2px dashed #2563eb;
      border-radius: 12px;
      padding: 18px 35px;
    }

    .otp {
      font-size: 38px;
      font-weight: bold;
      letter-spacing: 10px;
      color: #2563eb;
    }

    .expire {
      margin-top: 15px;
      font-size: 14px;
      color: #ef4444;
      font-weight: 600;
    }

    .note {
      margin-top: 30px;
      background: #f9fafb;
      border-left: 4px solid #2563eb;
      padding: 15px;
      text-align: left;
      border-radius: 8px;
      font-size: 14px;
      color: #555;
    }

    .footer {
      background: #f9fafb;
      text-align: center;
      padding: 25px;
      font-size: 13px;
      color: #777;
      border-top: 1px solid #e5e7eb;
    }

    .footer strong {
      color: #2563eb;
    }

    @media(max-width:600px) {
      .content {
        padding: 30px 20px;
      }

      .otp {
        font-size: 30px;
        letter-spacing: 6px;
      }
    }
  </style>
</head>

<body>

  <div class="container">

    <div class="header">
      <div class="logo">💬</div>
      <div class="title">ChatApp</div>
      <div class="subtitle">
        Secure Email Verification
      </div>
    </div>

    <div class="content">

      <h2>Verify Your Email</h2>

      <p>
        Welcome to <strong>ChatApp</strong>!
        Use the One-Time Password (OTP) below to complete your email verification.
      </p>

      <div class="otp-box">
        <div class="otp">${otp}</div>
      </div>

      <div class="expire">
        ⏱ This OTP is valid for only 5 minutes.
      </div>

      <div class="note">
        <strong>Security Tip:</strong><br><br>
        Never share this OTP with anyone. ChatApp will never ask for your OTP through calls, messages, or emails. If you didn't request this verification, you can safely ignore this email.
      </div>

    </div>

    <div class="footer">
      © ${new Date().getFullYear()} <strong>ChatApp</strong><br><br>
      Connecting conversations securely.
    </div>

  </div>

</body>
</html>
  `;
};
