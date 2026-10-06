// Lưu, đọc, liệt kê, đóng/mở và xoá thiệp (Netlify Blobs). Chỉ chủ trang đã đăng nhập mới dùng được.
import { getStore } from "@netlify/blobs";
import { authed } from "../lib/auth.mjs";

const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const rand = (n, a = "abcdefghijkmnpqrstuvwxyz23456789") => Array.from(crypto.getRandomValues(new Uint8Array(n)), b => a[b % a.length]).join("");
const sha = async t => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t))), b => b.toString(16).padStart(2, "0")).join("");
const clip = (v, n) => String(v == null ? "" : v).slice(0, n);
const MAX = 5_500_000;
const okId = id => /^[a-z0-9]{6,16}$/.test(id);

async function count(ks, id, kind) {
  const L = (await ks.get(`${id}-${kind}`, { type: "json" })) || [];
  const yes = L.filter(x => x.type === "rsvp" && x.attend === "Có");
  return { rsvp: L.filter(x => x.type === "rsvp").length, yes: yes.length, people: yes.reduce((a, x) => a + (parseInt(x.count) || 1), 0), wish: L.filter(x => x.wish).length, last: L.length ? L[L.length - 1].t : 0 };
}

export async function handle(req, store, cs, hs, ks) {
  if (!(await authed(req, cs))) return json({ error: "Cần đăng nhập", login: true }, 401);
  const url = new URL(req.url);
  if (req.method === "GET") {
    if (url.searchParams.get("list")) {
      const { blobs } = await store.list();
      const items = [];
      for (const b of blobs) {
        if (!okId(b.key)) continue;
        const m = ((await store.getMetadata(b.key)) || {}).metadata || {};
        const mode = m.mode === "grad" ? "grad" : "wedding", kind = mode === "grad" ? "tn" : "c";
        items.push({ id: b.key, title: m.title || "Thiệp chưa đặt tên", mode, date: m.date || "", updated: m.updated || 0, created: m.created || m.updated || 0, off: !!m.off, stats: { c: await count(ks, b.key, "c"), tn: await count(ks, b.key, "tn") }, kind });
      }
      items.sort((a, b) => b.updated - a.updated);
      return json({ items });
    }
    const id = (url.searchParams.get("id") || "").toLowerCase();
    if (!okId(id)) return json({ error: "Thiếu mã thiệp" }, 400);
    const data = await store.get(id, { type: "json" });
    if (!data) return json({ error: "Không tìm thấy thiệp" }, 404);
    return json(data);
  }
  if (req.method === "DELETE") {
    const id = (url.searchParams.get("id") || "").toLowerCase();
    if (!okId(id)) return json({ error: "Thiếu mã thiệp" }, 400);
    await store.delete(id);
    for (const k of ["c", "tn"]) { await hs.delete(`${id}-${k}`); await ks.delete(`${id}-${k}`) }
    return json({ ok: true });
  }
  if (req.method === "POST") {
    const body = await req.text();
    if (body.length > MAX) return json({ error: "Thiệp quá nặng" }, 413);
    let p; try { p = JSON.parse(body) } catch { return json({ error: "Dữ liệu không đúng" }, 400) }
    if (p && (p.action === "off" || p.action === "on")) {
      const id = clip(p.id, 16).toLowerCase(); const r = okId(id) && await store.getWithMetadata(id, { type: "json" });
      if (!r) return json({ error: "Không tìm thấy thiệp" }, 404);
      await store.setJSON(id, r.data, { metadata: { ...r.metadata, off: p.action === "off" } });
      return json({ ok: true });
    }
    if (!p || typeof p.data !== "object") return json({ error: "Thiếu nội dung thiệp" }, 400);
    let id = clip(p.id, 16).toLowerCase(), key = p.key || "", old = null;
    if (id) old = await store.getMetadata(id);
    if (!id || !old) { do { id = rand(8) } while (await store.getMetadata(id)); key = rand(24) }
    else if (!key) key = rand(24);
    const prev = (old && old.metadata) || {}, mt = p.meta || {};
    await store.setJSON(id, p.data, { metadata: { kh: await sha(key), updated: Date.now(), created: prev.created || Date.now(), off: !!prev.off, title: clip(mt.title, 120), mode: mt.mode === "grad" ? "grad" : "wedding", date: clip(mt.date, 12) } });
    const h = p.html || {};
    for (const k of ["c", "tn"]) if (typeof h[k] === "string" && /^<!doctype html>/i.test(h[k].trimStart())) await hs.set(`${id}-${k}`, h[k].replaceAll("__BMID__", id), { metadata: {} });
    return json({ id, key });
  }
  return json({ error: "Không hỗ trợ" }, 405);
}

const S = n => getStore({ name: n, consistency: "strong" });
export default async (req) => handle(req, S("thiep"), S("cauhinh"), S("trang"), S("khach"));
export const config = { path: "/api/thiep" };
