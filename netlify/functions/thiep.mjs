// Lưu và đọc thiệp (Netlify Functions + Netlify Blobs). Chỉ chủ trang đã đăng nhập mới đọc, lưu được.
import { getStore } from "@netlify/blobs";
import { authed } from "../lib/auth.mjs";

const json = (o, s = 200, h = {}) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...h } });
const rand = (n, a = "abcdefghijkmnpqrstuvwxyz23456789") => Array.from(crypto.getRandomValues(new Uint8Array(n)), b => a[b % a.length]).join("");
const sha = async t => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t))), b => b.toString(16).padStart(2, "0")).join("");
const MAX = 5_500_000; // dữ liệu + hai trang thiệp (không kể ảnh, ảnh lưu riêng)

export async function handle(req, store, cs, hs) {
  if (!(await authed(req, cs))) return json({ error: "Cần đăng nhập", login: true }, 401);
  const url = new URL(req.url);
  if (req.method === "GET") {
    const id = (url.searchParams.get("id") || "").toLowerCase();
    if (!/^[a-z0-9]{6,16}$/.test(id)) return json({ error: "Thiếu mã thiệp" }, 400);
    const data = await store.get(id, { type: "json" });
    if (!data) return json({ error: "Không tìm thấy thiệp" }, 404);
    return json(data);
  }
  if (req.method === "POST") {
    const body = await req.text();
    if (body.length > MAX) return json({ error: "Thiệp quá nặng" }, 413);
    let p; try { p = JSON.parse(body) } catch { return json({ error: "Dữ liệu không đúng" }, 400) }
    if (!p || typeof p.data !== "object") return json({ error: "Thiếu nội dung thiệp" }, 400);
    let id = (p.id || "").toLowerCase(), key = p.key || "";
    if (id) {
      const meta = await store.getMetadata(id);
      if (!meta || !key || meta.metadata.kh !== await sha(key)) return json({ error: "Không có quyền sửa thiệp này" }, 403);
    } else {
      do { id = rand(8) } while (await store.getMetadata(id));
      key = rand(24);
    }
    await store.setJSON(id, p.data, { metadata: { kh: await sha(key), updated: Date.now() } });
    const h = p.html || {};
    for (const k of ["c", "tn"]) if (typeof h[k] === "string" && /^<!doctype html>/i.test(h[k].trimStart())) await hs.set(`${id}-${k}`, h[k], { metadata: {} });
    return json({ id, key });
  }
  return json({ error: "Không hỗ trợ" }, 405);
}

export default async (req) => handle(req, getStore({ name: "thiep", consistency: "strong" }), getStore({ name: "cauhinh", consistency: "strong" }), getStore({ name: "trang", consistency: "strong" }));
export const config = { path: "/api/thiep" };
