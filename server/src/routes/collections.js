import { Router } from "express";
import {
  ALL_COLLECTIONS, bootstrap, createItem, updateItem, deleteItem, bulkCreateItems, wipeAll,
} from "../store.js";
import { requireAuth } from "../auth.js";
import { seedDatabase } from "../seed.js";

const router = Router();

function assertKnownCollection(req, res, next) {
  if (!ALL_COLLECTIONS.includes(req.params.name)) {
    return res.status(404).json({ error: `Unknown collection "${req.params.name}".` });
  }
  next();
}

// Public — the login screen (and the app's initial cache fill) needs this
// before a session exists. Passwords are never included (see store.js).
router.get("/bootstrap", async (req, res) => {
  res.json(await bootstrap());
});

router.post("/collections/:name", requireAuth, assertKnownCollection, async (req, res) => {
  const created = await createItem(req.params.name, req.body);
  res.status(201).json(created);
});

router.post("/collections/:name/bulk", requireAuth, assertKnownCollection, async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  const created = await bulkCreateItems(req.params.name, items);
  res.status(201).json(created);
});

router.patch("/collections/:name/:id", requireAuth, assertKnownCollection, async (req, res) => {
  const updated = await updateItem(req.params.name, req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: "Not found." });
  res.json(updated);
});

router.delete("/collections/:name/:id", requireAuth, assertKnownCollection, async (req, res) => {
  const ok = await deleteItem(req.params.name, req.params.id);
  if (!ok) return res.status(404).json({ error: "Not found." });
  res.status(204).end();
});

// Wipes all demo data and reseeds — used by Admin > System Settings.
router.post("/reset", requireAuth, async (req, res) => {
  await wipeAll();
  await seedDatabase();
  res.json({ ok: true });
});

export default router;
