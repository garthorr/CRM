import { google } from "googleapis";
import { getGoogleClient } from "./client";
import { prisma } from "@/lib/prisma";

export async function syncGmailThreads(userId: string) {
  const auth = await getGoogleClient(userId);
  const gmail = google.gmail({ version: "v1", auth });

  // Collect all contact emails grouped by accountId
  const contacts = await prisma.contact.findMany({
    where: { email: { not: null } },
    select: { email: true, accountId: true },
  });

  const emailToAccountId = new Map<string, string>();
  for (const contact of contacts) {
    if (contact.email) {
      emailToAccountId.set(contact.email.toLowerCase(), contact.accountId);
    }
  }

  if (emailToAccountId.size === 0) return { synced: 0 };

  // Fetch recent threads
  const threadsResp = await gmail.users.threads.list({
    userId: "me",
    maxResults: 100,
    q: "newer_than:30d",
  });

  const threads = threadsResp.data.threads ?? [];
  let synced = 0;

  for (const thread of threads) {
    if (!thread.id) continue;

    const threadData = await gmail.users.threads.get({
      userId: "me",
      id: thread.id,
      format: "metadata",
      metadataHeaders: ["From", "To", "Subject", "Date"],
    });

    const messages = threadData.data.messages ?? [];
    if (messages.length === 0) continue;

    // Collect all email addresses from the thread
    const allEmails = new Set<string>();
    let subject = "";
    let snippet = "";
    let lastDate: Date | null = null;

    for (const msg of messages) {
      const headers = msg.payload?.headers ?? [];
      for (const h of headers) {
        if (h.name === "From" || h.name === "To") {
          const emails = extractEmails(h.value ?? "");
          emails.forEach((e) => allEmails.add(e.toLowerCase()));
        }
        if (h.name === "Subject" && !subject) subject = h.value ?? "";
        if (h.name === "Date" && !lastDate) {
          const d = new Date(h.value ?? "");
          if (!isNaN(d.getTime())) lastDate = d;
        }
      }
      if (!snippet) snippet = msg.snippet ?? "";
    }

    // Find matching accountId
    let matchedAccountId: string | null = null;
    for (const email of allEmails) {
      const accountId = emailToAccountId.get(email);
      if (accountId) {
        matchedAccountId = accountId;
        break;
      }
    }

    if (!matchedAccountId) continue;

    // Upsert thread
    const upsertedThread = await prisma.emailThread.upsert({
      where: { gmailThreadId: thread.id },
      create: {
        accountId: matchedAccountId,
        gmailThreadId: thread.id,
        subject,
        snippet,
        lastMessageDate: lastDate,
        unread: false,
      },
      update: {
        snippet,
        lastMessageDate: lastDate,
        updatedAt: new Date(),
      },
    });

    // Upsert messages (metadata only — no full body fetch for performance)
    for (const msg of messages) {
      if (!msg.id) continue;
      const headers = msg.payload?.headers ?? [];
      const getHeader = (name: string) =>
        headers.find((h) => h.name === name)?.value ?? null;

      await prisma.emailMessage.upsert({
        where: { gmailMessageId: msg.id },
        create: {
          threadId: upsertedThread.id,
          gmailMessageId: msg.id,
          from: getHeader("From"),
          to: getHeader("To"),
          subject: getHeader("Subject"),
          snippet: msg.snippet ?? null,
          sentAt: (() => {
            const d = new Date(getHeader("Date") ?? "");
            return isNaN(d.getTime()) ? null : d;
          })(),
        },
        update: { snippet: msg.snippet ?? null },
      });
    }

    synced++;
  }

  return { synced };
}

function extractEmails(header: string): string[] {
  const matches = header.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g);
  return matches ?? [];
}
