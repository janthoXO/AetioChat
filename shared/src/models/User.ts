import z from "zod";

export const UserSchema = z.object({
  id: z.uuid(),
  username: z.string(),
  role: z.enum(["user", "admin"]),
});

export type User = z.infer<typeof UserSchema>;
