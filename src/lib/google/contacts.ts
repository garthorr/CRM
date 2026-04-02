import { google } from "googleapis";
import { getGoogleClient } from "./client";
import { prisma } from "@/lib/prisma";

export interface GoogleContactImport {
  displayName: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
}

export async function listGoogleContacts(userId: string): Promise<GoogleContactImport[]> {
  const auth = await getGoogleClient(userId);
  const people = google.people({ version: "v1", auth });

  const results: GoogleContactImport[] = [];
  let pageToken: string | undefined;

  do {
    const resp = await people.people.connections.list({
      resourceName: "people/me",
      pageSize: 100,
      personFields: "names,emailAddresses,phoneNumbers",
      pageToken,
    });

    const connections = resp.data.connections ?? [];
    for (const person of connections) {
      const name = person.names?.[0];
      const email = person.emailAddresses?.[0]?.value ?? null;
      const phone = person.phoneNumbers?.[0]?.value ?? null;

      if (!name) continue;

      results.push({
        displayName: name.displayName ?? "",
        firstName: name.givenName ?? "",
        lastName: name.familyName ?? "",
        email,
        phone,
      });
    }

    pageToken = resp.data.nextPageToken ?? undefined;
  } while (pageToken);

  return results;
}

export async function importGoogleContacts(
  userId: string,
  selectedContacts: GoogleContactImport[]
): Promise<number> {
  let imported = 0;

  for (const gc of selectedContacts) {
    // Create Account
    const accountName = gc.lastName
      ? `${gc.lastName} Family`
      : gc.displayName;

    const account = await prisma.crmAccount.create({
      data: { name: accountName },
    });

    // Create Contact
    await prisma.contact.create({
      data: {
        accountId: account.id,
        type: "OTHER",
        firstName: gc.firstName || gc.displayName,
        lastName: gc.lastName || "",
        email: gc.email,
        phone: gc.phone,
      },
    });

    imported++;
  }

  return imported;
}
