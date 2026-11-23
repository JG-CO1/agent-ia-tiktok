/**
 * Instagram Reels contre un FAUX serveur Graph local (aucun appel réel, aucun compte), dans les deux connexions :
 *  - « facebook » (Facebook Login for Business, graph.facebook.com/<version>, jeton d'utilisateur système) ;
 *  - « instagram » (ancien mode, graph.instagram.com, jeton renouvelé et chiffré).
 * Ces tests vérifient notre code ; la forme des réponses suit la documentation Meta et sera confirmée au premier essai réel.
 */
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import type { AddressInfo } from "node:net";
import os from "node:os";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fm-test-instagram-"));
process.env.FM_NO_JOURNAL = "1";
process.env.FM_ENV_FICHIER = path.join(tmp, ".env-absent");
process.env.FM_JETONS_DIR = path.join(tmp, "jetons");
for (const n of ["FM_CLE_JETONS", "INSTAGRAM_USER_ID", "INSTAGRAM_API_VERSION", "INSTAGRAM_APP_SECRET"]) delete process.env[n];

const IG_ANCIEN = "17841400000000001"; // ancien mode : ID renvoyé par /me
const IG_FB = "17841499999999999"; // connexion Facebook : ID fourni par INSTAGRAM_USER_ID
let requetes: Array<{ methode: string; chemin: string; params: URLSearchParams }> = [];
let etatsConteneur: string[] = [];
let server: http.Server;

function ancien(u: URL, req: http.IncomingMessage, params: URLSearchParams, json: (c: number, o: unknown) => void) {
  const jeton = params.get("access_token");
  if (u.pathname === "/refresh_access_token") {
    return jeton === "jeton-initial" && params.get("grant_type") === "ig_refresh_token"
      ? json(200, { access_token: "jeton-renouvele", token_type: "bearer", expires_in: 5184000 })
      : json(400, { error: { message: "Invalid OAuth access token" } });
  }
  if (jeton !== "jeton-renouvele") return json(401, { error: { message: "Invalid OAuth access token", code: 190 } });
  if (u.pathname === "/me") return json(200, { user_id: IG_ANCIEN, username: "studio.fantome", account_type: "MEDIA_CREATOR" });
  if (req.method === "POST" && u.pathname === `/${IG_ANCIEN}/media`) {
    if (params.get("media_type") !== "REELS" || !params.get("video_url")) return json(400, { error: { message: "media_type et video_url requis" } });
    return json(200, { id: "conteneur-1" });
  }
  if (u.pathname === "/conteneur-1") return json(200, { status_code: etatsConteneur.shift() ?? "FINISHED", status: "Finished" });
  if (u.pathname === "/conteneur-ko") return json(200, { status_code: "ERROR", status: "Error: Video format unsupported" });
  if (req.method === "POST" && u.pathname === `/${IG_ANCIEN}/media_publish`) {
    return params.get("creation_id") === "conteneur-1" ? json(200, { id: "media-9" }) : json(400, { error: { message: "conteneur inconnu" } });
  }
  if (u.pathname === "/media-9") return json(200, { permalink: "https://www.instagram.com/reel/AbC123/", media_product_type: "REELS" });
  if (u.pathname === "/media-9/insights") {
    return json(200, {
      data: [
        { name: "views", values: [{ value: 1200 }] },
        { name: "reach", total_value: { value: 900 } },
        { name: "likes", values: [{ value: 80 }] },
        { name: "comments", values: [{ value: 4 }] },
        { name: "shares", values: [{ value: 12 }] },
        { name: "saved", values: [{ value: 30 }] },
      ],
    });
  }
  json(404, { error: { message: `inconnu ${u.pathname}` } });
}

function facebook(u: URL, req: http.IncomingMessage, params: URLSearchParams, json: (c: number, o: unknown) => void) {
  const p = u.pathname.replace(/^\/v99\.0/, "");
  const jeton = params.get("access_token");
  if (jeton !== "jeton-systeme") return json(401, { error: { message: "Invalid OAuth access token", code: 190 } });
  const secret = process.env.INSTAGRAM_APP_SECRET;
  if (secret && params.get("appsecret_proof") !== crypto.createHmac("sha256", secret).update(jeton).digest("hex")) {
    return json(400, { error: { message: "Invalid appsecret_proof provided in the API argument", code: 100 } });
  }
  if (p === "/me/permissions") {
    return json(200, {
      data: [
        { permission: "instagram_basic", status: "granted" },
        { permission: "instagram_content_publish", status: "granted" },
        { permission: "instagram_manage_insights", status: "granted" },
        { permission: "pages_read_engagement", status: "declined" },
      ],
    });
  }
  if (p === "/me/accounts") return json(200, { data: [{ name: "Studio Fantôme", instagram_business_account: { id: IG_FB, username: "studio_fantomeia" } }, { name: "Autre page" }] });
  if (p === `/${IG_FB}`) return json(200, { id: IG_FB, username: "studio_fantomeia" });
  if (req.method === "POST" && p === `/${IG_FB}/media`) {
    if (params.get("media_type") !== "REELS" || !params.get("video_url")) return json(400, { error: { message: "media_type et video_url requis" } });
    return json(200, { id: "conteneur-fb" });
  }
  if (p === "/conteneur-fb") return json(200, { status_code: etatsConteneur.shift() ?? "FINISHED", status: "Finished" });
  if (req.method === "POST" && p === `/${IG_FB}/media_publish`) {
    return params.get("creation_id") === "conteneur-fb" ? json(200, { id: "media-fb" }) : json(400, { error: { message: "conteneur inconnu" } });
  }
  if (p === "/media-fb") return json(200, { permalink: "https://www.instagram.com/reel/FbX9/", media_product_type: "REELS" });
  if (p === "/media-fb/insights") return json(200, { data: [{ name: "views", values: [{ value: 300 }] }, { name: "likes", values: [{ value: 21 }] }] });
  json(404, { error: { message: `inconnu ${u.pathname}` } });
}

before(async () => {
  server = http.createServer((req, res) => {
    let corps = "";
    req.on("data", (d) => (corps += d));
    req.on("end", () => {
      const u = new URL(req.url ?? "/", "http://x");
      const params = req.method === "POST" ? new URLSearchParams(corps) : u.searchParams;
      requetes.push({ methode: req.method ?? "", chemin: u.pathname, params });
      const json = (code: number, o: unknown) => {
        res.writeHead(code, { "Content-Type": "application/json" });
        res.end(JSON.stringify(o));
      };
      (u.pathname.startsWith("/v99.0/") ? facebook : ancien)(u, req, params, json);
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  process.env.INSTAGRAM_API_BASE = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => {
  server.close();
  fs.rmSync(tmp, { recursive: true, force: true });
});

const ig = await import("./instagram");
const { chargerJetons } = await import("../lib/jetons");

// ---------------------------------------------------------------- ancien mode (connexion Instagram)

test("ancien mode : jeton renouvelé au premier usage, chiffré dans le magasin (jamais en clair)", async () => {
  process.env.INSTAGRAM_CONNEXION = "instagram";
  process.env.INSTAGRAM_ACCESS_TOKEN = "jeton-initial";
  assert.equal(await ig.jeton(), "jeton-renouvele");
  const brut = fs.readFileSync(path.join(tmp, "jetons", "instagram.json.enc"), "utf8");
  assert.ok(!brut.includes("jeton-renouvele") && !brut.includes("jeton-initial"));
  assert.equal(JSON.parse(brut).cle, "INSTAGRAM_ACCESS_TOKEN");
  assert.equal(chargerJetons<{ access_token: string }>("instagram")?.access_token, "jeton-renouvele");
  assert.deepEqual(await ig.compte(), { id: IG_ANCIEN, username: "studio.fantome", type: "MEDIA_CREATOR" });
});

test("ancien mode : conteneur REELS, attente, publication, lien ; conteneur en erreur sans publication", async () => {
  process.env.INSTAGRAM_CONNEXION = "instagram";
  requetes = [];
  etatsConteneur = ["IN_PROGRESS", "IN_PROGRESS"];
  const id = await ig.creerConteneur("https://github.com/o/r/releases/download/v/ep.mp4", "Légende #Claude", { partagerFil: true });
  const creation = requetes.find((r) => r.chemin === `/${IG_ANCIEN}/media`)!;
  assert.equal(creation.params.get("media_type"), "REELS");
  assert.equal(creation.params.get("caption"), "Légende #Claude");
  assert.equal(creation.params.get("share_to_feed"), "true");
  assert.equal(await ig.attendreConteneur(id, 5000, 5), "FINISHED");
  assert.deepEqual(await ig.publierConteneur(id), { id: "media-9", permalien: "https://www.instagram.com/reel/AbC123/" });
  requetes = [];
  await assert.rejects(() => ig.attendreConteneur("conteneur-ko", 5000, 5), /ERROR.*unsupported/);
  assert.ok(!requetes.some((r) => r.chemin.endsWith("/media_publish")));
  assert.deepEqual(await ig.statsReel("media-9"), { id: "media-9", vues: 1200, couverture: 900, likes: 80, commentaires: 4, partages: 12, enregistrements: 30 });
});

// ---------------------------------------------------------------- connexion Facebook (défaut des nouvelles apps)

function modeFacebook(o: { secretApp?: string } = {}) {
  process.env.INSTAGRAM_CONNEXION = "facebook";
  process.env.INSTAGRAM_ACCESS_TOKEN = "jeton-systeme";
  process.env.INSTAGRAM_USER_ID = IG_FB;
  process.env.INSTAGRAM_API_VERSION = "v99.0";
  if (o.secretApp) process.env.INSTAGRAM_APP_SECRET = o.secretApp;
  else delete process.env.INSTAGRAM_APP_SECRET;
}

test("connexion Facebook : version d'API dans l'URL, compte par son ID, jeton system-user jamais renouvelé", async () => {
  modeFacebook();
  requetes = [];
  assert.deepEqual(await ig.compte(), { id: IG_FB, username: "studio_fantomeia", type: "PROFESSIONNEL" });
  assert.ok(requetes.length > 0 && requetes.every((r) => r.chemin.startsWith("/v99.0/")), requetes.map((r) => r.chemin).join(" "));
  assert.ok(!requetes.some((r) => r.chemin.includes("refresh_access_token")), "aucun renouvellement en connexion Facebook");
  delete process.env.INSTAGRAM_API_VERSION;
  assert.equal(ig.versionGraph(), "v26.0", "version par défaut");
});

test("connexion Facebook : Reel publié avec l'ID configuré et appsecret_proof sur chaque appel", async () => {
  modeFacebook({ secretApp: "secret-app-de-test" });
  requetes = [];
  etatsConteneur = ["IN_PROGRESS"];
  const id = await ig.creerConteneur("https://github.com/o/r/releases/download/v/ep-instagram.mp4", "Légende");
  assert.equal(id, "conteneur-fb");
  assert.equal(await ig.attendreConteneur(id, 5000, 5), "FINISHED");
  assert.deepEqual(await ig.publierConteneur(id), { id: "media-fb", permalien: "https://www.instagram.com/reel/FbX9/" });
  const preuve = crypto.createHmac("sha256", "secret-app-de-test").update("jeton-systeme").digest("hex");
  assert.ok(requetes.every((r) => r.params.get("appsecret_proof") === preuve), "preuve du secret d'app sur chaque appel");
  assert.ok(!requetes.some((r) => r.chemin.endsWith("/me")), "pas de détour par /me : l'ID vient de INSTAGRAM_USER_ID");
  const s = await ig.statsReel("media-fb");
  assert.equal(s.vues, 300);
  assert.equal(s.likes, 21);
});

test("connexion Facebook : ID du compte retrouvé, permissions manquantes signalées, fm acces explicite", async () => {
  modeFacebook();
  assert.deepEqual(await ig.decouvrirComptes(), [{ page: "Studio Fantôme", id: IG_FB, username: "studio_fantomeia" }]);
  assert.deepEqual(await ig.permissionsManquantes(), { indispensables: ["pages_read_engagement"], facultatives: [] });

  const { verifierAcces } = await import("../lib/acces");
  const table = console.table;
  const log = console.log;
  console.table = () => undefined;
  console.log = () => undefined;
  try {
    const avecId = Object.fromEntries((await verifierAcces({ seulement: ["instagram"] })).map((l) => [l.service, l]));
    assert.equal(avecId.Instagram.etat, "ok");
    assert.match(avecId.Instagram.detail, /@studio_fantomeia/);
    assert.equal(avecId["Permissions IG"].etat, "erreur");
    assert.match(avecId["Permissions IG"].detail, /pages_read_engagement/);

    delete process.env.INSTAGRAM_USER_ID;
    const sansId = await verifierAcces({ seulement: ["instagram"] });
    assert.equal(sansId[0].etat, "absent");
    assert.match(sansId[0].detail, new RegExp(`@studio_fantomeia = ${IG_FB}`), "l'ID trouvé est proposé");
  } finally {
    console.table = table;
    console.log = log;
  }
});
