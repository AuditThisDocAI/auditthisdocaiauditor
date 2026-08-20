import { db } from './index.ts';
import { users, forensicAudits } from './schema.ts';
import { eq, desc } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, displayName?: string) {
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
        displayName: displayName || null,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          displayName: displayName || null,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Database getOrCreateUser failed:", error);
    throw new Error("Failed to synchronize user account.", { cause: error });
  }
}

export async function saveForensicAuditRecord(data: {
  userId: string;
  documentName: string;
  documentType: string;
  riskScore: number;
  riskLevel: string;
  summary: string;
  discrepancies?: any;
  forensicSignals?: any;
  recommendations?: any;
  metadata?: any;
}) {
  try {
    const result = await db.insert(forensicAudits)
      .values(data)
      .returning();
    return result[0];
  } catch (error) {
    console.error("Database saveForensicAuditRecord failed:", error);
    throw new Error("Failed to save audit record to Cloud SQL.", { cause: error });
  }
}

export async function getUserAuditRecords(userId: string) {
  try {
    return await db.select()
      .from(forensicAudits)
      .where(eq(forensicAudits.userId, userId))
      .orderBy(desc(forensicAudits.createdAt));
  } catch (error) {
    console.error("Database getUserAuditRecords failed:", error);
    throw new Error("Failed to fetch audit records.", { cause: error });
  }
}
