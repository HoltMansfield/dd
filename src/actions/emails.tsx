import StripeWelcomeEmail from "@/react-email/emails/stripe-welcome";
import { Resend } from "resend";

export const sendWelcomeEmail = async (email: string) => {
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: "no-reply@classAcampW.com",
    to: email,
    subject: "Welocome to Class Action Camping World",
    react: <StripeWelcomeEmail />,
  });
};
