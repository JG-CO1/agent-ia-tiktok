/**
 * Magasin de jetons chiffré (data/jetons/*.json.enc, versionné dans un dépôt PUBLIC) : ce qui est prouvé ici,
 * c'est qu'aucun jeton n'est lisible en clair, que la bonne clé est utilisée pour chaque service, qu'une clé
 * changée ou absente donne « pas de jeton » (repli sur le secret) au lieu d'une erreur, et que le code collé par
 * la personne est bien extrait quelle que soit la forme copiée.
 */
import { after, test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fm-test-jetons-"));
process.env.FM_NO_JOURNAL = "1";
process.env.FM_ENV_FICHIER = path.join(tmp, ".env-absent");
process.env.FM_JETONS_DIR = path.join(tmp, "jetons");
for (const n of ["FM_CLE_JETONS", "TIKTOK_CLIENT_SECRET", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN"]) delete process.env[n];

const { chargerJetons, extraireCode, fichierJetons, jetonsPresents, sauverJetons } = await import("./jetons");
const { refreshToken } = await import("../publish/youtube");

after(() => fs.rmSync(tmp, { recursive: true, force: true }));
const enveloppe = (s: "youtube" | "tiktok") => JSON.parse(fs.readFileSync(fichierJetons(s), "utf8")) as { v: number; cle: string; data: string };

test("sans aucune clé : rien n'est écrit", () => {
  assert.equal(sauverJetons("tiktok", { refresh_token: "x" }), false);
  assert.equal(jetonsPresents("tiktok"), false);
});

test("TikTok : clé dérivée du client secret, jeton illisible en clair, clé changée = pas de jeton", () => {
  process.env.TIKTOK_CLIENT_SECRET = "secret-tiktok-de-test-1234567890";
  const jetons = { refresh_token: "rft.JETON-TIKTOK-EN-CLAIR", access_token: "act.ACCES" };
  assert.equal(sauverJetons("tiktok", jetons), true);
  const brut = fs.readFileSync(fichierJetons("tiktok"), "utf8");
  assert.ok(!brut.includes("JETON-TIKTOK-EN-CLAIR") && !brut.includes("ACCES"), "aucun jeton en clair dans le fichier");
  assert.equal(enveloppe("tiktok").cle, "TIKTOK_CLIENT_SECRET");
  assert.deepEqual(chargerJetons("tiktok"), jetons);
  process.env.TIKTOK_CLIENT_SECRET = "un-autre-secret";
  assert.equal(chargerJetons("tiktok"), null);
});

test("TikTok : FM_CLE_JETONS prioritaire quand il existe ; sans lui, le fichier n'est pas lu", () => {
  process.env.FM_CLE_JETONS = crypto.randomBytes(32).toString("base64");
  sauverJetons("tiktok", { refresh_token: "r2" });
  assert.equal(enveloppe("tiktok").cle, "FM_CLE_JETONS");
  assert.deepEqual(chargerJetons("tiktok"), { refresh_token: "r2" });
  const cle = process.env.FM_CLE_JETONS;
  delete process.env.FM_CLE_JETONS;
  assert.equal(chargerJetons("tiktok"), null);
  process.env.FM_CLE_JETONS = cle;
});

test("ancien format TikTok (base64 brut, clé FM_CLE_JETONS) toujours lisible", () => {
  const k = crypto.scryptSync(process.env.FM_CLE_JETONS!, "studio-fantome", 32);
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", k, iv);
  const enc = Buffer.concat([c.update(JSON.stringify({ refresh_token: "ancien" }), "utf8"), c.final()]);
  fs.writeFileSync(fichierJetons("tiktok"), Buffer.concat([iv, c.getAuthTag(), enc]).toString("base64"));
  assert.deepEqual(chargerJetons("tiktok"), { refresh_token: "ancien" });
});

test("YouTube : toujours la clé dérivée de YOUTUBE_CLIENT_SECRET ; le secret GitHub reste prioritaire", () => {
  process.env.YOUTUBE_CLIENT_SECRET = "GOCSPX-secret-de-test";
  assert.equal(sauverJetons("youtube", { refresh_token: "1//stocke" }), true);
  assert.equal(enveloppe("youtube").cle, "YOUTUBE_CLIENT_SECRET", "jamais FM_CLE_JETONS, absent des étapes YouTube");
  assert.equal(refreshToken(), "1//stocke");
  process.env.YOUTUBE_REFRESH_TOKEN = "1//secret-github";
  assert.equal(refreshToken(), "1//secret-github");
  delete process.env.YOUTUBE_REFRESH_TOKEN;
});

test("code collé : seul, adresse de retour, commande proposée, entre apostrophes", () => {
  assert.equal(extraireCode("4/0AVGzR1abc"), "4/0AVGzR1abc");
  assert.equal(extraireCode("http://127.0.0.1:8765/?state=ab12&code=4%2F0AVGzR1abc&scope=https%3A%2F%2Fwww.googleapis.com"), "4/0AVGzR1abc");
  assert.equal(extraireCode("  https://jg-co1.github.io/agent-ia-tiktok/tiktok-callback.html?code=Xy*9!kL&scopes=user.info.basic&state=1 "), "Xy*9!kL");
  assert.equal(extraireCode("npm run fm -- auth tiktok --code 'Xy*9!kL'"), "Xy*9!kL");
  assert.equal(extraireCode("'Xy*9!kL'"), "Xy*9!kL");
  assert.equal(extraireCode("abc%zz"), "abc%zz", "un % isolé ne fait pas échouer");
});
