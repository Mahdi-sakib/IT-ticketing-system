// A thin in-memory cache in front of the real OmniDesk IT backend
// (server/ — Express + Prisma + SQLite). The whole dataset is fetched once
// via bootstrap() and kept here; list/filter/get/count read it directly and
// synchronously (same contract every page already relied on), while
// create/update/delete/bulkCreate update the cache immediately (so the UI
// reacts instantly) and persist to the server in the background.
//
// This keeps src/api/entities.js and every page that imports it unchanged —
// only this file, the auth flow, and the app's startup sequence needed to
// change to go from localStorage to a real server + database.
import { v4 as uuid } from "uuid";
import { invalidate } from "@/lib/query-client";
import { getToken } from "@/api/authToken";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

let cache = {};

async function api(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function bootstrap() {
  cache = await api("/bootstrap");
}

function ensureCollection(name) {
  if (!cache[name]) cache[name] = [];
  return cache[name];
}

function applySort(rows, sort) {
  if (!sort) return rows;
  const desc = sort.startsWith("-");
  const key = desc ? sort.slice(1) : sort;
  return [...rows].sort((a, b) => {
    if (a[key] < b[key]) return desc ? 1 : -1;
    if (a[key] > b[key]) return desc ? -1 : 1;
    return 0;
  });
}

// The `users` collection never keeps a plaintext password in the client
// cache, even transiently after an optimistic update — only the server
// (which hashes it) ever sees it.
function stripSecrets(name, row) {
  if (name !== "users" || !row) return row;
  const { password, password_hash, ...safe } = row;
  return safe;
}

function warnSyncFailure(action, err) {
  console.error(`OmniDesk IT: failed to sync ${action} with the server.`, err);
}

export function makeCollection(name) {
  return {
    name,
    list(sort) {
      return applySort([...ensureCollection(name)], sort);
    },
    filter(query = {}, sort) {
      const rows = ensureCollection(name).filter((row) =>
        Object.entries(query).every(([k, v]) => {
          if (v === undefined) return true;
          if (Array.isArray(v)) return v.includes(row[k]);
          return row[k] === v;
        })
      );
      return applySort(rows, sort);
    },
    get(id) {
      return ensureCollection(name).find((r) => r.id === id) || null;
    },
    create(fields) {
      const now = new Date().toISOString();
      const row = { id: uuid(), created_date: now, updated_date: now, ...fields };
      ensureCollection(name).push(stripSecrets(name, row));
      invalidate();
      api(`/collections/${name}`, { method: "POST", body: JSON.stringify(row) }).catch((err) =>
        warnSyncFailure(`create on "${name}"`, err)
      );
      return row;
    },
    update(id, fields) {
      const rows = ensureCollection(name);
      const idx = rows.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      const merged = { ...rows[idx], ...fields, updated_date: new Date().toISOString() };
      rows[idx] = stripSecrets(name, merged);
      invalidate();
      api(`/collections/${name}/${id}`, { method: "PATCH", body: JSON.stringify(fields) }).catch((err) =>
        warnSyncFailure(`update on "${name}"`, err)
      );
      return rows[idx];
    },
    delete(id) {
      cache[name] = ensureCollection(name).filter((r) => r.id !== id);
      invalidate();
      api(`/collections/${name}/${id}`, { method: "DELETE" }).catch((err) =>
        warnSyncFailure(`delete on "${name}"`, err)
      );
      return true;
    },
    bulkCreate(items) {
      const now = new Date().toISOString();
      const created = items.map((fields) => ({ id: uuid(), created_date: now, updated_date: now, ...fields }));
      ensureCollection(name).push(...created.map((row) => stripSecrets(name, row)));
      invalidate();
      api(`/collections/${name}/bulk`, { method: "POST", body: JSON.stringify({ items: created }) }).catch((err) =>
        warnSyncFailure(`bulk create on "${name}"`, err)
      );
      return created;
    },
    count() {
      return ensureCollection(name).length;
    },
    clear() {
      cache[name] = [];
      invalidate();
    },
  };
}

// Injects a row the server already persisted (e.g. a user created via
// /api/auth/register) directly into the cache, without re-POSTing it.
export function absorb(name, row) {
  ensureCollection(name).push(stripSecrets(name, row));
  invalidate();
}

export async function resetDatabase() {
  await api("/reset", { method: "POST" });
  await bootstrap();
  invalidate();
}
