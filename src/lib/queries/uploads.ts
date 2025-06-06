import "server-only";
import { desc } from "drizzle-orm";

import type { UserWithUploads } from "~/app/admin/summary/page.types";

import { db } from "~/db";
import { userTable } from "~/db/schema";

// Fetch users and their uploads using relational queries
export async function getUsersWithUploads(): Promise<UserWithUploads[]> {
  try {
    const users = await db.query.userTable.findMany({
      orderBy: [desc(userTable.createdAt)],
      with: {
        uploads: true,
      },
    }) as UserWithUploads[];
    return users;
  } catch (error) {
    console.error("Failed to fetch users with uploads:", error);
    return [];
  }
}
