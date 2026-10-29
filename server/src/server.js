import "dotenv/config";
import http from "http";
import app from "./app.js";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  const server = http.createServer(app); // Socket.io will attach to this later
  server.listen(PORT, () => console.log(`SquadFund API running on port ${PORT}`));
}

start().catch((err) => {
  console.error("Failed to start:", err.message);
  process.exit(1);
});
