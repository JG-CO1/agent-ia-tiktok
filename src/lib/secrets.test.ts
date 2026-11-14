/**
 * Tests des secrets locaux et de leur envoi vers GitHub, avec un FAUX `gh` (aucun appel réseau, aucun vrai dépôt)
 * et un .env temporaire (FM_ENV_FICHIER) : le vrai .env du projet n'est jamais touché.
 * Ce qui est prouvé : une valeur secrète ne passe QUE par l'entrée standard de gh, jamais par ses arguments
 * ni par l'affichage ; et `fm acces` ne montre jamais une clé.
 */
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import type { AddressInfo } from "node:net";
import os from "node:os";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fm-test-secrets-"));
process.env.FM_NO_JOURNAL = "1";
process.env.FM_ENV_FICHIER = path.join(tmp, ".env");
for (const n of ["ELEVENLABS_API_KEY", "ELEVENLABS_VOICE_ID", "YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN", "TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET", "TIKTOK_REFRESH_TOKEN", "TIKTOK_REDIRECT_URI", "FM_CLE_JETONS"]) {
  delete process.env[n];
}

// Faux gh : note ses arguments et son entrée standard, et sait lister ce qu'il a « reçu ».
const bin = path.join(tmp, "bin");
fs.mkdirSync(bin);
fs.writeFileSync(
  path.join(bin, "gh"),
  `#!/usr/bin/env node
const fs = require("fs"), p = require("path"), d = ${JSON.stringify(tmp)};
const a = process.argv.slice(2);
fs.appendFileSync(p.join(d, "gh-argv.log"), JSON.stringify(a) + "\\n");
const lire = (f) => (fs.existsSync(p.join(d, f)) ? fs.readFileSync(p.join(d, f), "utf8").split("\\n").filter(Boolean) : []);
if (a[0] === "secret" && a[1] === "set") {
  const v = fs.readFileSync(0, "utf8");
  fs.appendFileSync(p.join(d, "gh-stdin.log"), JSON.stringify([a[2], v]) + "\\n");
  fs.appendFileSync(p.join(d, "secrets.txt"), a[2] + "\\n");
  process.stderr.write("✓ Set Actions secret " + a[2] + "\\n");
} else if (a[0] === "variable" && a[1] === "set") {
  fs.appendFileSync(p.join(d, "variables.txt"), a[2] + "\\n");
} else if (a[1] === "list") {
  const noms = [...new Set(lire(a[0] === "secret" ? "secrets.txt" : "variables.txt"))];
  process.stdout.write(JSON.stringify(noms.map((name) => ({ name }))));
} else process.exit(2);
`,
  { mode: 0o755 },
);
process.env.PATH = `${bin}${path.delimiter}${process.env.PATH}`;

const { ecrireEnvLocal, lireEnvLocal, secretAleatoire, secretsGithub } = await import("./secrets");

let sortie = "";
const origine = { log: console.log, error: console.error };
function capturer() {
  sortie = "";
  console.log = (...a: unknown[]) => void (sortie += a.join(" ") + "\n");
  console.error = (...a: unknown[]) => void (sortie += a.join(" ") + "\n");
}
function relacher() {
  console.log = origine.log;
  console.error = origine.error;
}

after(() => {
  relacher();
  fs.rmSync(tmp, { recursive: true, force: true });
});

test(".env : créé depuis le modèle, ligne remplacée en gardant l'explication, valeurs spéciales protégées", () => {
  ecrireEnvLocal("YOUTUBE_REFRESH_TOKEN", "1//jeton-de-test_abc");
  ecrireEnvLocal("ELEVENLABS_API_KEY", "sk_avec#diese et espace");
  ecrireEnvLocal("NOUVELLE_VARIABLE", "x");
  const brut = fs.readFileSync(process.env.FM_ENV_FICHIER!, "utf8");
  assert.match(brut, /^YOUTUBE_REFRESH_TOKEN=1\/\/jeton-de-test_abc {3}# obtenu avec/m);
  assert.match(brut, /^ELEVENLABS_API_KEY="sk_avec#diese et espace"/m);
  assert.match(brut, /^TIKTOK_REDIRECT_URI=https:\/\/jg-co1\.github\.io/m, "les autres lignes du modèle sont conservées");
  const lu = lireEnvLocal();
  assert.equal(lu.YOUTUBE_REFRESH_TOKEN, "1//jeton-de-test_abc");
  assert.equal(lu.ELEVENLABS_API_KEY, "sk_avec#diese et espace");
  assert.equal(lu.NOUVELLE_VARIABLE, "x");
  assert.equal((fs.statSync(process.env.FM_ENV_FICHIER!).mode & 0o777).toString(8), "600");
  assert.throws(() => ecrireEnvLocal("X", 'a"b'), /refusée/);
  assert.throws(() => ecrireEnvLocal("X", "a\nb"), /refusée/);
});

test("clé aléatoire : 32 octets en base64, jamais affichée, pas de remplacement par accident", () => {
  capturer();
  try {
    secretAleatoire("FM_CLE_JETONS");
  } finally {
    relacher();
  }
  const v = lireEnvLocal().FM_CLE_JETONS;
  assert.equal(Buffer.from(v, "base64").length, 32);
  assert.ok(!sortie.includes(v), "la clé ne doit pas apparaître à l'écran");
  assert.throws(() => secretAleatoire("FM_CLE_JETONS"), /existe déjà/);
  secretAleatoire("FM_CLE_JETONS", { remplacer: true });
  assert.notEqual(lireEnvLocal().FM_CLE_JETONS, v);
});

test("envoi vers GitHub : valeurs par l'entrée standard seulement, jamais en argument ni à l'écran", () => {
  ecrireEnvLocal("TIKTOK_CLIENT_SECRET", "secret-tiktok-de-test");
  ecrireEnvLocal("ELEVENLABS_VOICE_ID", "voixA");
  const local = lireEnvLocal();
  capturer();
  let bilan;
  try {
    bilan = secretsGithub({ depot: "test/depot" });
  } finally {
    relacher();
  }
  assert.deepEqual(bilan.envoyes.sort(), ["ELEVENLABS_API_KEY", "FM_CLE_JETONS", "TIKTOK_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN"]);
  assert.deepEqual(bilan.variables, ["ELEVENLABS_VOICE_ID"]);
  assert.ok(!bilan.envoyes.includes("NOUVELLE_VARIABLE"), "seuls les noms attendus par les workflows partent");
  const argv = fs.readFileSync(path.join(tmp, "gh-argv.log"), "utf8");
  const recus = new Map(fs.readFileSync(path.join(tmp, "gh-stdin.log"), "utf8").trim().split("\n").map((l) => JSON.parse(l) as [string, string]));
  for (const nom of bilan.envoyes) {
    assert.equal(recus.get(nom), local[nom], `${nom} reçu intact par l'entrée standard`);
    assert.ok(!argv.includes(local[nom]), `${nom} ne doit jamais être un argument`);
    assert.ok(!sortie.includes(local[nom]), `${nom} ne doit jamais être affiché`);
  }
  assert.match(argv, /\["secret","set","TIKTOK_CLIENT_SECRET","--repo","test\/depot"\]/);
  assert.ok(bilan.manquants.includes("CLAUDE_CODE_OAUTH_TOKEN (ou ANTHROPIC_API_KEY)"));
  assert.ok(bilan.manquants.includes("YOUTUBE_CLIENT_ID") && !bilan.manquants.includes("YOUTUBE_REFRESH_TOKEN"));
});

test("vérification seule : rien n'est envoyé", () => {
  const avant = fs.readFileSync(path.join(tmp, "gh-stdin.log"), "utf8");
  capturer();
  try {
    const b = secretsGithub({ depot: "test/depot", verifier: true });
    assert.deepEqual(b.envoyes, []);
  } finally {
    relacher();
  }
  assert.equal(fs.readFileSync(path.join(tmp, "gh-stdin.log"), "utf8"), avant);
});

test("fm acces : offre et voix ElevenLabs lues, services absents signalés, aucune clé affichée", async () => {
  const cle = "sk_cle_acces_de_test";
  ecrireEnvLocal("ELEVENLABS_API_KEY", cle);
  const server = http.createServer((req, res) => {
    const ok = req.headers["xi-api-key"] === cle;
    res.writeHead(ok ? 200 : 401, { "Content-Type": "application/json" });
    if (!ok) return res.end("{}");
    if (req.url === "/v1/user/subscription") return res.end(JSON.stringify({ tier: "creator", character_count: 1200, character_limit: 100000 }));
    if (req.url === "/v1/voices/voixA") return res.end(JSON.stringify({ voice_id: "voixA", name: "Voix A" }));
    res.end("{}");
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  process.env.ELEVENLABS_BASE_URL = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  // (ne jamais détourner process.stdout : le lanceur de tests s'en sert pour remonter les résultats)
  const table = console.table;
  let tableau = "";
  console.table = (d: unknown) => void (tableau += JSON.stringify(d));
  capturer();
  try {
    const { verifierAcces } = await import("./acces");
    const lignes = await verifierAcces();
    const par = Object.fromEntries(lignes.map((l) => [l.service, l]));
    assert.equal(par.ElevenLabs.etat, "ok");
    assert.match(par.ElevenLabs.detail, /creator/);
    assert.equal(par.Voix.etat, "ok");
    assert.match(par.Voix.detail, /Voix A/);
    assert.equal(par.YouTube.etat, "absent");
    assert.match(par.YouTube.detail, /YOUTUBE_CLIENT_ID/);
    assert.equal(par.TikTok.etat, "absent");
    assert.equal(par.Chiffrement.etat, "ok");
    assert.ok(!JSON.stringify(lignes).includes(cle));
  } finally {
    console.table = table;
    relacher();
    server.close();
  }
  assert.match(tableau, /Voix A/, "le tableau est bien produit");
  assert.ok(!(tableau + sortie).includes(cle), "la clé ne doit jamais apparaître");
  assert.ok(!(tableau + sortie).includes(lireEnvLocal().FM_CLE_JETONS));
});
