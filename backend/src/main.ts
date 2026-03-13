import { initRouter } from "./01rest/router.js";
import { config } from "./config.js";

console.log("Environment variables loaded.", config);

initRouter();
