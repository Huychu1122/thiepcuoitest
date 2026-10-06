// Đăng nhập, tạo mật khẩu lần đầu, đổi mật khẩu, đăng xuất cho trang thiết kế
import { getStore } from "@netlify/blobs";
import { isSetup, checkPass, setPass, sessionCookie, clearCookie, authed, tooMany, noteFail, clearFail, clientIp } from "../lib/auth.mjs";

const json = (o, s = 200, h = {}) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...h } });

export async function handle(req, cs, ctx) {
  if (req.method === "GET") return json({ setup: await isSetup(cs), in: await authed(req, cs) });
  if (req.method !== "POST") return json({ error: "Không hỗ trợ" }, 405);
  let p; try { p = await req.json() } catch { return json({ error: "Dữ liệu không đúng" }, 400) }
  const ip = clientIp(req, ctx), a = p && p.action;
  if (a === "logout") return json({ ok: true }, 200, { "set-cookie": clearCookie });
  if (await tooMany(cs, ip)) return json({ error: "Nhập sai quá nhiều lần. Đợi 15 phút rồi thử lại." }, 429);
  if (a === "setup") {
    if (await isSetup(cs)) return json({ error: "Trang đã có mật khẩu. Hãy đăng nhập." }, 409);
    if (String(p.pass || "").length < 6) return json({ error: "Mật khẩu cần ít nhất 6 ký tự" }, 400);
    await setPass(cs, p.pass);
    return json({ ok: true }, 200, { "set-cookie": await sessionCookie(cs) });
  }
  if (a === "login") {
    if (!(await checkPass(cs, p.pass))) { await noteFail(cs, ip); return json({ error: "Sai mật khẩu" }, 401) }
    await clearFail(cs, ip);
    return json({ ok: true }, 200, { "set-cookie": await sessionCookie(cs) });
  }
  if (a === "change") {
    if (!(await authed(req, cs))) return json({ error: "Cần đăng nhập" }, 401);
    if (!(await checkPass(cs, p.pass))) { await noteFail(cs, ip); return json({ error: "Mật khẩu cũ không đúng" }, 401) }
    if (String(p.newPass || "").length < 6) return json({ error: "Mật khẩu mới cần ít nhất 6 ký tự" }, 400);
    await setPass(cs, p.newPass);
    return json({ ok: true }, 200, { "set-cookie": await sessionCookie(cs) });
  }
  return json({ error: "Không hỗ trợ" }, 400);
}

export default async (req, ctx) => handle(req, getStore({ name: "cauhinh", consistency: "strong" }), ctx);
export const config = { path: "/api/vao" };
