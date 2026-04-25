import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env.js";

const client = new OAuth2Client(env.googleClientId);

export const verifyGoogleCredential = async (credential) => {
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: env.googleClientId
  });

  const payload = ticket.getPayload();

  if (!payload?.email || !payload?.email_verified || !payload?.sub) {
    throw new Error("Google email is not verified");
  }

  return {
    email: payload.email.toLowerCase(),
    name: payload.name,
    sub: payload.sub
  };
};
