import z from "zod";

export const UserDTOSchema = z.object({
  id: z.uuid(),
  username: z.string(),
  role: z.enum(["user", "admin"]),
});

export type UserDTO = z.infer<typeof UserDTOSchema>;
