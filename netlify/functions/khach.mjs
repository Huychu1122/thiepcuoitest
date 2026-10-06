// Khách xác nhận tham dự và gửi lời chúc ngay trên thiệp (lưu trong Netlify Blobs, không cần Google Form)
import { getStore } from "@netlify/blobs";
import { authed, clientIp } from "../lib/auth.mjs";

const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const clip = (v, n) => String(v == null ? "" : v).replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);
const okId = id => /^[a-z0-9]{6,16}$/.test(id), okKind = k => k === "c" || k === "tn";

export async function handle(req, ks, ts, cs, ctx) {
  const url = new URL(req.url);
  if (req.method === "GET") {
    const id = (url.searchParams.get("id") || "").toLowerCase(), kind = url.searchParams.get("kind") || "c";
    if (url.searchParams.get("all")) {
      if (!(await authed(req, cs))) return json({ error: "Cần đăng nhập" }, 401);
      if (!okId(id)) return json({ error: "Thiếu mã thiệp" }, 400);
      const out = {};
      for (const k of ["c", "tn"]) out[k] = (await ks.get(`${id}-${k}`, { type: "json" })) || [];
      return json(out);
    }
    if (!okId(id) || !okKind(kind)) return json({ wishes: [] });
    const list = (await ks.get(`${id}-${kind}`, { type: "json" })) || [];
    return json({ wishes: list.filter(x => x.wish && !x.hide).slice(-200).reverse().map(x => ({ n: x.name, w: x.wish, t: x.t })) });
  }
  if (req.method !== "POST") return json({ error: "Không hỗ trợ" }, 405);
  const body = await req.text(); if (body.length > 8000) return json({ error: "Quá dài" }, 413);
  let p; try { p = JSON.parse(body) } catch { return json({ error: "Dữ liệu không đúng" }, 400) }
  const id = clip(p.id, 16).toLowerCase(), kind = p.kind;
  if (!okId(id) || !okKind(kind)) return json({ error: "Thiếu mã thiệp" }, 400);
  const key = `${id}-${kind}`;
  if (p.action === "hide" || p.action === "show" || p.action === "delete") {
    if (!(await authed(req, cs))) return json({ error: "Cần đăng nhập" }, 401);
    const list = (await ks.get(key, { type: "json" })) || [];
    const next = p.action === "delete" ? list.filter(x => x.t !== p.t) : list.map(x => x.t === p.t ? { ...x, hide: p.action === "hide" } : x);
    await ks.setJSON(key, next, { metadata: {} });
    return json({ ok: true });
  }
  if (!(await ts.getMetadata(id))) return json({ error: "Không tìm thấy thiệp" }, 404);
  const name = clip(p.name, 80); if (!name) return json({ error: "Thiếu tên" }, 400);
  const type = p.type === "rsvp" ? "rsvp" : "wish", wish = clip(p.wish, 600);
  if (type === "wish" && !wish) return json({ error: "Thiếu lời chúc" }, 400);
  // chống gửi dồn: mỗi máy tối đa 15 lần mỗi giờ cho một thiệp
  const ip = clientIp(req, ctx), rk = `rl-${id}-${ip}`, rl = (await ks.get(rk, { type: "json" })) || { n: 0, t: Date.now() };
  const fresh = Date.now() - rl.t > 3600e3; if (!fresh && rl.n >= 15) return json({ error: "Bạn gửi nhiều quá, thử lại sau nhé" }, 429);
  await ks.setJSON(rk, fresh ? { n: 1, t: Date.now() } : { n: rl.n + 1, t: rl.t }, { metadata: {} });
  const list = (await ks.get(key, { type: "json" })) || [];
  if (list.length >= 3000) return json({ error: "Sổ đã đầy" }, 507);
  list.push({ t: Date.now(), type, name, attend: clip(p.attend, 30), event: clip(p.event, 60), count: clip(p.count, 4), wish });
  await ks.setJSON(key, list, { metadata: {} });
  return json({ ok: true });
}

export default async (req, ctx) => handle(req, getStore({ name: "khach", consistency: "strong" }), getStore({ name: "thiep", consistency: "strong" }), getStore({ name: "cauhinh", consistency: "strong" }), ctx);
export const config = { path: "/api/khach" };
