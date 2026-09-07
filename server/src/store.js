// Generic document-store helpers over the single `Item` table (see
// prisma/schema.prisma). Every OmniDesk IT entity — tickets, users, assets,
// etc. — is a "collection" of JSON documents here, mirroring the shape the
// frontend cache (src/api/db.js) expects.
import bcrypt from "bcryptjs";
import { prisma } from "./prisma.js";

const ALL_COLLECTIONS = [
  "users", "tickets", "ticket_comments", "ticket_history", "assets",
  "knowledge_base", "major_incidents", "notifications", "problems",
  "change_requests", "configuration_items", "service_requests",
  "sla_policies", "csat_responses", "automation_rules", "audit_logs",
];

function rowToDoc(row) {
  return JSON.parse(row.data);
}

// Never let a password (or its hash) leave the server.
function sanitize(collection, doc) {
  if (collection !== "users") return doc;
  const { password, password_hash, ...safe } = doc;
  return safe;
}

async function hashPasswordIfPresent(collection, doc) {
  if (collection !== "users" || !doc.password) return doc;
  const { password, ...rest } = doc;
  return { ...rest, password_hash: await bcrypt.hash(password, 10) };
}

export async function listCollection(collection) {
  const rows = await prisma.item.findMany({ where: { collection } });
  return rows.map(rowToDoc).map((doc) => sanitize(collection, doc));
}

// Only used internally by auth routes — includes the password hash.
export async function listCollectionRaw(collection) {
  const rows = await prisma.item.findMany({ where: { collection } });
  return rows.map(rowToDoc);
}

export async function bootstrap() {
  const out = {};
  for (const name of ALL_COLLECTIONS) {
    out[name] = await listCollection(name);
  }
  return out;
}

export async function createItem(collection, doc) {
  const prepared = await hashPasswordIfPresent(collection, doc);
  await prisma.item.create({
    data: { id: prepared.id, collection, data: JSON.stringify(prepared) },
  });
  return sanitize(collection, prepared);
}

export async function bulkCreateItems(collection, docs) {
  const prepared = await Promise.all(docs.map((d) => hashPasswordIfPresent(collection, d)));
  await prisma.item.createMany({
    data: prepared.map((d) => ({ id: d.id, collection, data: JSON.stringify(d) })),
  });
  return prepared.map((d) => sanitize(collection, d));
}

export async function updateItem(collection, id, fields) {
  const existing = await prisma.item.findUnique({ where: { id } });
  if (!existing || existing.collection !== collection) return null;
  const current = rowToDoc(existing);
  const merged = await hashPasswordIfPresent(collection, { ...current, ...fields });
  merged.updated_date = new Date().toISOString();
  await prisma.item.update({ where: { id }, data: { data: JSON.stringify(merged) } });
  return sanitize(collection, merged);
}

export async function deleteItem(collection, id) {
  const existing = await prisma.item.findUnique({ where: { id } });
  if (!existing || existing.collection !== collection) return false;
  await prisma.item.delete({ where: { id } });
  return true;
}

export async function countAll() {
  return prisma.item.count();
}

export async function wipeAll() {
  await prisma.item.deleteMany({});
}

export { ALL_COLLECTIONS };
