import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import collectionRoutes from "./routes/collections.js";
import { countAll } from "./store.js";
import { seedDatabase } from "./seed.js";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api", collectionRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error." });
});

const PORT = process.env.PORT || 4000;

async function start() {
  const count = await countAll();
  if (count === 0) {
    console.log("Empty database — seeding demo data...");
    await seedDatabase();
    console.log("Seed complete.");
  }
  app.listen(PORT, () => console.log(`OmniDesk IT API listening on http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
