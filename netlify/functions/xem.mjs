// Trang thiệp của khách: chỉ có thiệp, không có công cụ thiết kế
import { getStore } from "@netlify/blobs";

const page = (t, s) => new Response(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${t}</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f6f1ea;color:#3a332c;font:16px/1.6 system-ui,sans-serif;text-align:center;padding:24px}h1{font-weight:500;font-size:22px}</style></head><body><div><h1>${t}</h1><p>Link thiệp có thể đã bị gõ sai hoặc thiệp đã bị xoá. Bạn liên hệ người gửi để lấy lại link nhé.</p></div></body></html>`, { status: s, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });

export async function handle(req, hs) {
  const m = new URL(req.url).pathname.match(/^\/(c|tn)\/([a-z0-9]{6,16})\/?$/i);
  if (!m) return page("Không tìm thấy thiệp", 404);
  const html = await hs.get(`${m[2].toLowerCase()}-${m[1].toLowerCase()}`);
  if (!html) return page("Không tìm thấy thiệp", 404);
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=60", "x-robots-tag": "noindex", "referrer-policy": "no-referrer" } });
}
export default async (req) => handle(req, getStore({ name: "trang", consistency: "strong" }));
export const config = { path: ["/c/*", "/tn/*"] };
