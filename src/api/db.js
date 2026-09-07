// Lightweight local "backend": a browser-storage-backed data layer that mimics
// a simple document database (list / filter / create / update / delete / get)
// for every entity in the app. This keeps OmniDesk IT fully functional out of
// the box (npm install && npm run dev) with zero external services required.
//
// Swap `driver` below for a real API/DB client later without touching the
// rest of the app: every page only talks to src/api/entities.js.

import { v4 as uuid } from "uuid";
import { invalidate } from "@/lib/query-client";

const NS = "omnidesk_it_v1";

function readAll() {
  try {
    const raw = localStorage.getItem(NS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(data) {
  localStorage.setItem(NS, JSON.stringify(data));
}

function ensureCollection(data, name) {
  if (!data[name]) data[name] = [];
  return data[name];
}

export function makeCollection(name) {
  return {
    name,
    list(sort) {
      const data = readAll();
      const rows = [...ensureCollection(data, name)];
      return applySort(rows, sort);
    },
    filter(query = {}, sort) {
      const data = readAll();
      const rows = ensureCollection(data, name).filter((row) =>
        Object.entries(query).every(([k, v]) => {
          if (v === undefined) return true;
          if (Array.isArray(v)) return v.includes(row[k]);
          return row[k] === v;
        })
      );
      return applySort(rows, sort);
    },
    get(id) {
      const data = readAll();
      return ensureCollection(data, name).find((r) => r.id === id) || null;
    },
    create(fields) {
      const data = readAll();
      const rows = ensureCollection(data, name);
      const now = new Date().toISOString();
      const row = { id: uuid(), created_date: now, updated_date: now, ...fields };
      rows.push(row);
      writeAll(data);
      invalidate();
      return row;
    },
    update(id, fields) {
      const data = readAll();
      const rows = ensureCollection(data, name);
      const idx = rows.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      rows[idx] = { ...rows[idx], ...fields, updated_date: new Date().toISOString() };
      writeAll(data);
      invalidate();
      return rows[idx];
    },
    delete(id) {
      const data = readAll();
      data[name] = ensureCollection(data, name).filter((r) => r.id !== id);
      writeAll(data);
      invalidate();
      return true;
    },
    bulkCreate(items) {
      const data = readAll();
      const rows = ensureCollection(data, name);
      const now = new Date().toISOString();
      const created = items.map((fields) => ({
        id: uuid(),
        created_date: now,
        updated_date: now,
        ...fields,
      }));
      rows.push(...created);
      writeAll(data);
      invalidate();
      return created;
    },
    count() {
      const data = readAll();
      return ensureCollection(data, name).length;
    },
    clear() {
      const data = readAll();
      data[name] = [];
      writeAll(data);
      invalidate();
    },
  };
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

export function isSeeded() {
  const data = readAll();
  return !!data.__seeded__;
}

export function markSeeded() {
  const data = readAll();
  data.__seeded__ = true;
  writeAll(data);
}

export function resetDatabase() {
  localStorage.removeItem(NS);
}

export function exportDatabase() {
  return readAll();
}
