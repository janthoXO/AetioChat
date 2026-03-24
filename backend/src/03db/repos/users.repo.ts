import { db } from "../database.js";

export const usersRepo = {
  async findByUsername(username: string) {
    return db
      .selectFrom("users")
      .selectAll()
      .where("username", "=", username)
      .executeTakeFirst();
  },

  async findById(id: string) {
    return db
      .selectFrom("users")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
  },

  async create(
    username: string,
    passwordHash: string,
    role: "user" | "admin" = "user"
  ) {
    return db
      .insertInto("users")
      .values({
        username,
        password_hash: passwordHash,
        role,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  },
};
