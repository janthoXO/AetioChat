import { UserDTOSchema as UserDTOSchemaShared } from "shared/index.js";
import type { UserDomain } from "../02models/User.js";
import type z from "zod";

export const UserDTOSchema = UserDTOSchemaShared;

export type UserDTO = z.infer<typeof UserDTOSchema>;

export function userToDTO(domain: UserDomain): UserDTO {
  return {
    id: domain.id,
    username: domain.username,
    role: domain.role,
  };
}
