/**
 * Instagram Reels contre un FAUX serveur Graph local (aucun appel réel, aucun compte) : ces tests vérifient notre
 * code (renouvellement et chiffrement du jeton, conteneur REELS, attente, publication, statistiques, erreurs).
 * La forme des réponses suit la documentation Meta ; le premier essai réel la confirmera.
 */
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import type { AddressInfo } from "node:net";
import os from "node:os";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fm-test-instagram-"));
process.env.FM_NO_JOURNAL = "1";
process.env.FM_ENV_FICHIER = path.join(tmp, ".env-absent");
process.env.FM_JETONS_DIR = path.join(tmp, "jetons");
process.env.INSTAGRAM_ACCESS_TOKEN = "jeton-initial";
delete process.env.FM_CLE_JETONS;

const IG_ID = "17841400000000001";
let requetes: Array<{ methode: string; chemin: string; params: URLSearchParams }> = [];
let etatsConteneur: string[] = [];
let server: http.Server;

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
      const jeton = params.get("access_token");
      if (u.pathname === "/refresh_access_token") {
        return jeton === "jeton-initial" && params.get("grant_type") === "ig_refresh_token"
          ? json(200, { access_token: "jeton-renouvele", token_type: "bearer", expires_in: 5184000 })
          : json(400, { error: { message: "Invalid OAuth access token" } });
      }
      if (jeton !== "jeton-renouvele") return json(401, { error: { message: "Invalid OAuth access token", code: 190 } });
      if (u.pathname === "/me") return json(200, { user_id: IG_ID, username: "studio.fantome", account_type: "MEDIA_CREATOR" });
      if (req.method === "POST" && u.pathname === `/${IG_ID}/media`) {
        if (params.get("media_type") !== "REELS" || !params.get("video_url")) return json(400, { error: { message: "media_type et video_url requis" } });
        return json(200, { id: "conteneur-1" });
      }
      if (u.pathname === "/conteneur-1") return json(200, { status_code: etatsConteneur.shift() ?? "FINISHED", status: "Finished: Media has been uploaded" });
      if (u.pathname === "/conteneur-ko") return json(200, { status_code: "ERROR", status: "Error: Video format unsupported" });
      if (req.method === "POST" && u.pathname === `/${IG_ID}/media_publish`) {
        return params.get("creation_id") === "conteneur-1" ? json(200, { id: "media-9" }) : json(400, { error: { message: "conteneur inconnu" } });
      }
      if (u.pathname === "/media-9") return json(200, { permalink: "https://www.instagram.com/reel/AbC123/", media_product_type: "REELS", like_count: 80, comments_count: 4 });
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

test("jeton : renouvelé au premier usage, chiffré dans le magasin (jamais en clair)", async () => {
  assert.equal(await ig.jeton(), "jeton-renouvele");
  const brut = fs.readFileSync(path.join(tmp, "jetons", "instagram.json.enc"), "utf8");
  assert.ok(!brut.includes("jeton-renouvele") && !brut.includes("jeton-initial"));
  assert.equal(JSON.parse(brut).cle, "INSTAGRAM_ACCESS_TOKEN");
  assert.equal(chargerJetons<{ access_token: string }>("instagram")?.access_token, "jeton-renouvele");
});

test("compte : identifiant et type professionnel", async () => {
  assert.deepEqual(await ig.compte(), { id: IG_ID, username: "studio.fantome", type: "MEDIA_CREATOR" });
});

test("Reel : conteneur REELS avec URL publique et légende, attente, publication, lien", async () => {
  requetes = [];
  etatsConteneur = ["IN_PROGRESS", "IN_PROGRESS"];
  const id = await ig.creerConteneur("https://github.com/o/r/releases/download/v/ep.mp4", "Légende #Claude", { partagerFil: true });
  assert.equal(id, "conteneur-1");
  const creation = requetes.find((r) => r.chemin === `/${IG_ID}/media`)!;
  assert.equal(creation.params.get("media_type"), "REELS");
  assert.equal(creation.params.get("video_url"), "https://github.com/o/r/releases/download/v/ep.mp4");
  assert.equal(creation.params.get("caption"), "Légende #Claude");
  assert.equal(creation.params.get("share_to_feed"), "true");
  assert.equal(await ig.attendreConteneur(id, 5000, 5), "FINISHED");
  assert.equal(requetes.filter((r) => r.chemin === "/conteneur-1").length, 3, "attend tant que IN_PROGRESS");
  assert.deepEqual(await ig.publierConteneur(id), { id: "media-9", permalien: "https://www.instagram.com/reel/AbC123/" });
});

test("conteneur en erreur : échec explicite, rien n'est publié", async () => {
  requetes = [];
  await assert.rejects(() => ig.attendreConteneur("conteneur-ko", 5000, 5), /ERROR.*unsupported/);
  assert.ok(!requetes.some((r) => r.chemin.endsWith("/media_publish")));
});

test("statistiques d'un Reel : vues, couverture, interactions", async () => {
  assert.deepEqual(await ig.statsReel("media-9"), { id: "media-9", vues: 1200, couverture: 900, likes: 80, commentaires: 4, partages: 12, enregistrements: 30 });
});
