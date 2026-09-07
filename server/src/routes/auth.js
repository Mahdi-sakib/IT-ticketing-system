import { Router } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { listCollectionRaw, createItem } from "../store.js";
import { signToken, requireAuth } from "../auth.js";

const router = Router();

function sanitizeUser(doc) {
  const { password, password_hash, ...safe } = doc;
  return safe;
}

router.post("/register", async (req, res) => {
  const { email, password, full_name, department, location, phone } = req.body || {};
  if (!email || !password || !full_name) {
    return res.status(400).json({ error: "full_name, email, and password are required." });
  }
  const users = await listCollectionRaw("users");
  const exists = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (exists) return res.status(409).json({ error: "An account with this email already exists." });

  const now = new Date().toISOString();
  const created = await createItem("users", {
    id: uuid(),
    created_date: now,
    updated_date: now,
    full_name,
    email: email.toLowerCase(),
    password,
    role: "employee",
    department: department || "",
    location: location || "",
    phone: phone || "",
    employee_id: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
    disabled: false,
  });

  const token = signToken(created);
  res.status(201).json({ token, user: created });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password are required." });

  const users = await listCollectionRaw("users");
  const found = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!found || !found.password_hash) {
    return res.status(401).json({ error: "Invalid email or password." });
  }
  const valid = await bcrypt.compare(password, found.password_hash);
  if (!valid) return res.status(401).json({ error: "Invalid email or password." });
  if (found.disabled) {
    return res.status(403).json({ error: "This account has been disabled. Contact your IT administrator." });
  }

  const token = signToken(found);
  res.json({ token, user: sanitizeUser(found) });
});

router.get("/me", requireAuth, async (req, res) => {
  const users = await listCollectionRaw("users");
  const found = users.find((u) => u.id === req.userId);
  if (!found) return res.status(404).json({ error: "User not found." });
  res.json({ user: sanitizeUser(found) });
});

export default router;
