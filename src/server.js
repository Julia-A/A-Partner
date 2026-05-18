import dns from "node:dns";
dns.setServers(["1.1.1.1", "1.0.0.1"]); // Cloudflare DNS
// dns.setServers(["8.8.8.8", "8.8.4.4"]); // Google DNS (alternative)

import { connectDB } from "./config/db.js";
import { createApp } from "./app.js";

const PORT = process.env.PORT;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("No MongoDB uri as an environment variable");
  process.exit(1);
}

await connectDB(MONGODB_URI);

const app = createApp();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
