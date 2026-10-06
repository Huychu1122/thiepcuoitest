// Trang quản lý tất cả thiệp: chỉ mở khi đã đăng nhập
import { getStore } from "@netlify/blobs";
import { authed } from "../lib/auth.mjs";
import PAGE from "../lib/quanly.mjs";

export async function handle(req, cs) {
  if (!(await authed(req, cs))) return new Response(null, { status: 302, headers: { location: "/?next=%2Fquanly", "cache-control": "no-store" } });
  return new Response(PAGE, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "private, no-store", "x-frame-options": "DENY", "x-robots-tag": "noindex", "referrer-policy": "same-origin" } });
}
export default async (req) => handle(req, getStore({ name: "cauhinh", consistency: "strong" }));
export const config = { path: "/quanly" };
