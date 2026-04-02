import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

export async function getGoogleClient(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      googleAccessToken: true,
      googleRefreshToken: true,
      googleTokenExpiry: true,
    },
  });

  if (!user.googleRefreshToken) {
    throw new Error("No Google refresh token. User must sign in with Google.");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
  );

  oauth2Client.setCredentials({
    access_token: user.googleAccessToken,
    refresh_token: user.googleRefreshToken,
    expiry_date: user.googleTokenExpiry?.getTime(),
  });

  // Auto-persist refreshed tokens
  oauth2Client.on("tokens", async (tokens) => {
    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(tokens.access_token && { googleAccessToken: tokens.access_token }),
        ...(tokens.refresh_token && { googleRefreshToken: tokens.refresh_token }),
        ...(tokens.expiry_date && { googleTokenExpiry: new Date(tokens.expiry_date) }),
      },
    });
  });

  return oauth2Client;
}
