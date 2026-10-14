import { app } from "./app";
import { connectDb } from "./config/db";
import { env } from "./config/env";

connectDb()
  .then(() => app.listen(env.port, () => console.log(`API listening on http://localhost:${env.port}`)))
  .catch((err) => {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  });
