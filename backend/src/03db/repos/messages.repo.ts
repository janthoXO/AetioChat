import { db } from "../database.js";

export const messagesRepo = {
  async findByCaseAndUser(caseId: string, userId: string) {
    return db
      .selectFrom("messages")
      .selectAll()
      .where("case_id", "=", caseId)
      .where("user_id", "=", userId)
      .orderBy("created_at", "asc")
      .execute();
  },

  async findLatestMessagePerCase() {
    // using distinct on to get the last message for a combination of user_id and case_id
    // This allows us to find cases where the AI failed to respond
    return db
      .selectFrom("messages")
      .distinctOn(["case_id", "user_id"])
      .selectAll()
      .orderBy("case_id")
      .orderBy("user_id")
      .orderBy("created_at", "desc")
      .execute();
  },

  async create(message: {
    userId: string;
    caseId: string;
    role: "user" | "assistant";
    content: string;
  }) {
    return db
      .insertInto("messages")
      .values({
        user_id: message.userId,
        case_id: message.caseId,
        role: message.role,
        content: message.content,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  },
};
