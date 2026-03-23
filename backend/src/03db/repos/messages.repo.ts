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
