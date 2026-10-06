// Trang thiết kế: chỉ trả về khi đã đăng nhập, không nằm trong thư mục công khai
import { getStore } from "@netlify/blobs";
import { authed } from "../lib/auth.mjs";
import STUDIO from "../lib/studio.mjs";

export async function handle(req, cs) {
  const url = new URL(req.url);
  if (!(await authed(req, cs))) return new Response(null, { status: 302, headers: { location: "/?next=" + encodeURIComponent(url.pathname + url.search), "cache-control": "no-store" } });
  return new Response(STUDIO, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "private, no-store", "x-frame-options": "DENY", "x-robots-tag": "noindex", "referrer-policy": "same-origin" } });
}
export default async (req) => handle(req, getStore({ name: "cauhinh", consistency: "strong" }));
export const config = { path: "/studio" };
