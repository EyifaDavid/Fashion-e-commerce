import fetch from "node-fetch";

const RESEND_API_URL = "https://api.resend.com/emails";

const sendEmail = async ({ to, subject, text, html }) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      text,
      html,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    const message = data?.message || JSON.stringify(data);
    throw new Error(`Resend send failed (${response.status}): ${message}`);
  }

  return data;
};

export const sendLoginCodeEmail = async (email, code) => {
  const subject = "Your Login Code for Mavrauder";
  const text = `Your login code is: ${code}. It will expire in 10 minutes.`;
  const html = `
    <div>
      <p>Hi,</p>
      <p>Your login code is: <b>${code}</b>. It will expire in 10 minutes.</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject,
    text,
    html,
  });
};

export default sendEmail;
