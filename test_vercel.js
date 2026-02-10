const https = require("https");

const BASE = "https://rustyn-ai-one.vercel.app";

function req(method, path, body, headers) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const opts = {
      hostname: url.hostname,
      path: url.pathname,
      method,
      headers: { ...headers },
    };
    if (body) {
      const data = JSON.stringify(body);
      opts.headers["Content-Type"] = "application/json";
      opts.headers["Content-Length"] = Buffer.byteLength(data);
    }
    const r = https.request(opts, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => {
        try {
          resolve({ s: res.statusCode, b: JSON.parse(d) });
        } catch (e) {
          resolve({ s: res.statusCode, b: { raw: d } });
        }
      });
    });
    r.on("error", reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

async function run() {
  let r, token;
  let pass = 0;
  let fail = 0;

  function check(name, ok, status) {
    const result = ok ? "PASS" : "FAIL";
    if (ok) pass++;
    else fail++;
    console.log(`${result}  ${name} (${status})`);
  }

  console.log("=== Rustyn AI Backend - Vercel Deployment Tests ===");
  console.log(`Target: ${BASE}\n`);

  // 1
  r = await req("GET", "/");
  check("TEST 1  Health check", r.s === 200 && r.b.success, r.s);

  // 2
  r = await req("GET", "/api/auth/health");
  check("TEST 2  Auth health", r.s === 200 && r.b.success, r.s);

  // 3
  r = await req("POST", "/api/auth/login", {
    username: "rustyn",
    password: "rustyn@2025",
  });
  check("TEST 3  Login correct creds", r.s === 200 && r.b.success, r.s);
  token = r.b.data?.token || "";
  if (token) {
    console.log("        Token: " + token.substring(0, 40) + "...");
  }

  // 4
  r = await req("POST", "/api/auth/login", {
    username: "rustyn",
    password: "wrong",
  });
  check("TEST 4  Login wrong password", r.s === 401, r.s);

  // 5
  r = await req("POST", "/api/auth/login", {
    username: "nobody",
    password: "rustyn@2025",
  });
  check("TEST 5  Login wrong username", r.s === 401, r.s);

  // 6
  r = await req("POST", "/api/auth/login", {});
  check("TEST 6  Login empty body", r.s === 400, r.s);

  // 7
  r = await req("POST", "/api/auth/login", { username: "rustyn" });
  check("TEST 7  Login missing password", r.s === 400, r.s);

  // 8
  r = await req("GET", "/api/auth/verify", null, {
    Authorization: "Bearer " + token,
  });
  check("TEST 8  Verify valid token", r.s === 200 && r.b.success, r.s);

  // 9
  r = await req("GET", "/api/auth/profile", null, {
    Authorization: "Bearer " + token,
  });
  check(
    "TEST 9  Profile with token",
    r.s === 200 && r.b.data?.user?.role === "admin",
    r.s
  );

  // 10
  r = await req("GET", "/api/auth/verify");
  check("TEST 10 Verify no token", r.s === 401, r.s);

  // 11
  r = await req("GET", "/api/auth/verify", null, {
    Authorization: "Bearer invalidtoken123",
  });
  check("TEST 11 Verify bad token", r.s === 401, r.s);

  // 12
  r = await req("GET", "/api/auth/verify", null, { Authorization: token });
  check("TEST 12 Verify no Bearer prefix", r.s === 401, r.s);

  // 13
  r = await req("POST", "/api/auth/logout", null, {
    Authorization: "Bearer " + token,
  });
  check("TEST 13 Logout", r.s === 200 && r.b.success, r.s);

  // 14
  r = await req("GET", "/api/nonexistent");
  check("TEST 14 404 unknown route", r.s === 404, r.s);

  // 15
  r = await req("GET", "/api/auth/profile");
  check("TEST 15 Profile without auth", r.s === 401, r.s);

  console.log(
    `\n=== RESULTS: ${pass} passed, ${fail} failed out of 15 ===`
  );
  process.exit(fail > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
