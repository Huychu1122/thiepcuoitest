// Đăng nhập trang thiết kế: một mật khẩu của chủ trang, phiên lưu trong cookie ký HMAC.
const enc = new TextEncoder();
const hex = b => Array.from(new Uint8Array(b), x => x.toString(16).padStart(2, "0")).join("");
export const rand = (n, a = "abcdefghijkmnpqrstuvwxyz23456789ABCDEFGHJKLMNPQRSTUVWXYZ") => Array.from(crypto.getRandomValues(new Uint8Array(n)), b => a[b % a.length]).join("");
const envPass = () => { try { return (globalThis.Netlify && Netlify.env.get("BM_MATKHAU")) || process.env.BM_MATKHAU || "" } catch { return "" } };
const COOKIE = "bm_s", DAYS = 60;

async function hmac(secret, msg) {
  const k = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", k, enc.encode(msg)));
}
async function pbkdf(pass, salt) {
  const k = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveBits"]);
  return hex(await crypto.subtle.deriveBits({ name: "PBKDF2", salt: enc.encode(salt), iterations: 120000, hash: "SHA-256" }, k, 256));
}
const same = (a, b) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0 };

async function secret(cs) { let s = await cs.get("secret"); if (!s) { s = rand(48); await cs.set("secret", s, { metadata: {} }) } return s }
async function stored(cs) { return await cs.get("pass", { type: "json" }) }
async function version(cs) { const e = envPass(); if (e) return "env" + (await pbkdf(e, "v")).slice(0, 8); const p = await stored(cs); return p ? p.hash.slice(0, 12) : "" }

export async function isSetup(cs) { return !!envPass() || !!(await stored(cs)) }
export async function checkPass(cs, pass) {
  pass = String(pass || ""); const e = envPass();
  if (e) return same(pass, e);
  const p = await stored(cs); if (!p) return false;
  return same(await pbkdf(pass, p.salt), p.hash);
}
export async function setPass(cs, pass) { const salt = rand(16); await cs.setJSON("pass", { salt, hash: await pbkdf(String(pass), salt) }, { metadata: {} }) }

export async function sessionCookie(cs) {
  const exp = Date.now() + DAYS * 864e5, sig = await hmac(await secret(cs), `s.${exp}.${await version(cs)}`);
  return `${COOKIE}=${exp}.${sig}; Path=/; Max-Age=${DAYS * 86400}; HttpOnly; Secure; SameSite=Lax`;
}
export const clearCookie = `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
export async function authed(req, cs) {
  const m = (req.headers.get("cookie") || "").match(/(?:^|;\s*)bm_s=(\d+)\.([a-f0-9]{64})/);
  if (!m || +m[1] < Date.now()) return false;
  const v = await version(cs); if (!v) return false;
  return same(m[2], await hmac(await secret(cs), `s.${m[1]}.${v}`));
}

// Chặn dò mật khẩu: sai 8 lần trong 15 phút thì khoá 15 phút theo địa chỉ IP
export async function tooMany(cs, ip) { const r = await cs.get("fail:" + ip, { type: "json" }); return !!(r && r.n >= 8 && Date.now() - r.t < 15 * 60e3) }
export async function noteFail(cs, ip) { const k = "fail:" + ip, r = await cs.get(k, { type: "json" }); const fresh = !r || Date.now() - r.t > 15 * 60e3; await cs.setJSON(k, { n: fresh ? 1 : r.n + 1, t: fresh ? Date.now() : r.t }, { metadata: {} }) }
export async function clearFail(cs, ip) { try { await cs.delete("fail:" + ip) } catch {} }
export const clientIp = (req, ctx) => (ctx && ctx.ip) || req.headers.get("x-nf-client-connection-ip") || req.headers.get("x-forwarded-for") || "?";
