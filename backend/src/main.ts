import { initRouter } from "./01rest/router.js";
import { config } from "./config.js";
import { usersRepo } from "./03db/repos/users.repo.js";
import bcrypt from "bcrypt";
import { migrate } from "./03db/migrate.js";

console.log("Environment variables loaded.", config);

async function bootstrap() {
  await migrate().catch((err) => {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  });

  if (config.ADMIN_USERNAME && config.ADMIN_PASSWORD) {
    const existingAdmin = await usersRepo.findByUsername(config.ADMIN_USERNAME);
    if (!existingAdmin) {
      console.log(`Creating default admin user: ${config.ADMIN_USERNAME}`);
      const hashedPassword = await bcrypt.hash(config.ADMIN_PASSWORD, 10);
      await usersRepo.create(config.ADMIN_USERNAME, hashedPassword, "admin");
    }
  }

  initRouter();
}

bootstrap().catch(console.error);
