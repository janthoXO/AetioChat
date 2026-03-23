import z from "zod";
export const UserSchema = z.object({
    id: z.string().uuid(),
    username: z.string(),
});
//# sourceMappingURL=User.js.map