import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { usersRepo } from "@/03db/repos/users.repo.js";
import { config } from "@/config.js";
import z from "zod";

const router = express.Router();

router.use((_req, _res, next) => {
  /* #swagger.tags = ['Users'] */
  next();
});

const LoginDTOSchema = z.object({
  username: z.string(),
  password: z.string(),
});

router.post("/login", async (req, res) => {
  const body = LoginDTOSchema.safeParse(req.body);

  if (!body.success) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  const { username, password } = body.data;

  const user = await usersRepo.findByUsername(username);

  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    config.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
  });
});

export default router;
