// Lưu ảnh và nhạc của thiệp, đặt tên theo nội dung (trùng nội dung thì dùng lại)
import { getStore } from "@netlify/blobs";

const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json; charset=utf-8" } });
const MAX = 5_500_000;
const OK = /^(image\/(jpeg|png|webp|gif|svg\+xml)|audio\/(mpeg|mp3|mp4|aac|ogg|wav|x-m4a|webm))$/;

export async function handle(req, store) {
  const url = new URL(req.url);
  if (req.method === "GET") {
    const id = url.searchParams.get("id") || "";
    if (!/^[a-f0-9]{24}$/.test(id)) return new Response("Not found", { status: 404 });
    const r = await store.getWithMetadata(id, { type: "arrayBuffer" });
    if (!r) return new Response("Not found", { status: 404 });
    return new Response(r.data, { headers: { "content-type": r.metadata.type || "application/octet-stream", "cache-control": "public, max-age=31536000, immutable" } });
  }
  if (req.method === "POST") {
    const type = (req.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!OK.test(type)) return json({ error: "Chỉ nhận ảnh hoặc nhạc" }, 415);
    const buf = await req.arrayBuffer();
    if (!buf.byteLength || buf.byteLength > MAX) return json({ error: "File quá nặng (tối đa 5 MB)" }, 413);
    const h = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", buf)), b => b.toString(16).padStart(2, "0")).join("").slice(0, 24);
    if (!(await store.getMetadata(h))) await store.set(h, buf, { metadata: { type } });
    return json({ id: h });
  }
  return json({ error: "Không hỗ trợ" }, 405);
}

export default async (req) => handle(req, getStore({ name: "anh", consistency: "strong" }));
export const config = { path: "/api/anh" };
