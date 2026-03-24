import type { UsersTable } from "../03db/schema.js";
import type { Insertable, Selectable } from "kysely";
import { z } from "zod";

export const UserSchema = z.object({
  id: z.uuid(),
  username: z.string(),
  role: z.enum(["user", "admin"]),
  password_hash: z.string(),
  createdAt: z.date(),
});

export type UserDomain = z.infer<typeof UserSchema>;

/**
 * Domain -> Entity
 */
export function userToEntity(domain: UserDomain): Insertable<UsersTable> {
  return {
    id: domain.id,
    username: domain.username,
    role: domain.role,
    password_hash: domain.password_hash,
    created_at: domain.createdAt.toISOString(),
  };
}

/**
 * Entity -> Domain
 */
export function userFromEntity(entity: Selectable<UsersTable>): UserDomain {
  return {
    id: entity.id,
    username: entity.username,
    role: entity.role as "user" | "admin",
    password_hash: entity.password_hash,
    createdAt: new Date(entity.created_at),
  };
}
