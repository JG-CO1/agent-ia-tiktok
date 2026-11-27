/**
 * Tests de la chaîne voix contre un FAUX serveur ElevenLabs local : aucun appel réseau réel, aucun crédit.
 * Ils vérifient notre code (requêtes, minutage, reprises, fichiers), pas le comportement réel de l'API :
 * la forme des réponses est celle documentée par ElevenLabs, à confirmer au premier essai réel.
 */
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import type { AddressInfo } from "node:net";
import os from "node:os";
import path from "node:path";
import { EpisodeSchema, type Episode } from "../schema/episode";
import { tokenizeScenes } from "../core/text";
import { episodeDir } from "../lib/paths";
import { FmError } from "../lib/log";
import { generateVoice, synthesize } from "./voice";
import { essaiVoix, voixAjouter, voixBibliotheque, voixInfos } from "./essai";
import demo from "../../video/demo/episode-demo.json" with { type: "json" };

process.env.FM_NO_JOURNAL = "1";
process.env.ELEVENLABS_API_KEY = "cle-de-test";
process.env.ELEVENLABS_VOICE_ID = "voixA";

const TEST_ID = "2000-01-01-3-test-voix";
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fm-test-voix-"));
let server: http.Server;
let requetes: string[] = [];
let corps: Array<Record<string, unknown>> = [];

const mp3 = (secondes: number) =>
  execFileSync("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", `sine=frequency=220:duration=${secondes.toFixed(2)}`, "-c:a", "libmp3lame", "-b:a", "64k", "-f", "mp3", "pipe:1"], {
    maxBuffer: 30 * 1024 * 1024,
  });

function episode(): Episode {
  return EpisodeSchema.parse({ ...JSON.parse(JSON.stringify(demo)), id: TEST_ID });
}

before(async () => {
  fs.mkdirSync(episodeDir(TEST_ID), { recursive: true });
  server = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (d) => (raw += d));
    req.on("end", () => {
      const url = req.url ?? "";
      const body = raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
      requetes.push(`${req.method} ${url}`);
      if (body) corps.push(body);
      const json = (code: number, o: unknown) => {
        res.writeHead(code, { "Content-Type": "application/json" });
        res.end(JSON.stringify(o));
      };
      if (req.headers["xi-api-key"] !== "cle-de-test") return json(401, { detail: { status: "invalid_api_key" } });
      const m = url.match(/^\/v1\/text-to-speech\/([^/?]+)(\/with-timestamps)?\?/);
      if (req.method === "POST" && m && body) {
        const modele = String(body.model_id);
        const texte = String(body.text);
        if (modele === "modele-sans-langue" && body.language_code) return json(400, { detail: { message: "This model does not support language_code" } });
        const audio = mp3(Math.max(0.5, texte.length * 0.05));
        if (!m[2]) {
          res.writeHead(200, { "Content-Type": "audio/mpeg" });
          return res.end(audio);
        }
        if (modele === "modele-sans-minutage") return json(200, { audio_base64: audio.toString("base64"), alignment: null, normalized_alignment: null });
        const chars = texte.split("");
        return json(200, {
          audio_base64: audio.toString("base64"),
          alignment: {
            characters: chars,
            character_start_times_seconds: chars.map((_, i) => +(i * 0.05).toFixed(3)),
            character_end_times_seconds: chars.map((_, i) => +((i + 1) * 0.05).toFixed(3)),
          },
          normalized_alignment: null,
        });
      }
      if (req.method === "GET" && url === "/v1/models") {
        return json(200, [
          { model_id: "modele-ok", name: "Modèle OK", can_do_text_to_speech: true, languages: [{ language_id: "fr" }] },
          { model_id: "transcription", name: "Transcription", can_do_text_to_speech: false },
        ]);
      }
      if (req.method === "GET" && url.startsWith("/v2/voices")) return json(404, { detail: "retiré" });
      if (req.method === "GET" && url === "/v1/voices/voixA") return json(200, { voice_id: "voixA", name: "Voix A" });
      if (req.method === "GET" && url.startsWith("/v1/shared-voices?")) {
        return json(200, {
          voices: [
            { public_owner_id: "proprio1", voice_id: "voixB", name: "Hugo — conteur", gender: "male", age: "young", accent: "parisian", language: "fr", use_case: "social_media", cloned_by_count: 1234, description: "Voix vive" },
          ],
          has_more: false,
        });
      }
      const ajout = url.match(/^\/v1\/voices\/add\/([^/]+)\/([^/?]+)$/);
      if (req.method === "POST" && ajout) {
        if (ajout[2] !== "voixB") return json(400, { detail: { message: "voice_not_found" } });
        return json(200, { voice_id: "voixB" });
      }
      if (req.method === "GET" && url === "/v1/voices") return json(200, { voices: [{ voice_id: "voixA", name: "Voix A", category: "premade", labels: { gender: "female", use_case: "social media" } }] });
      json(404, { detail: `inconnu ${url}` });
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  process.env.ELEVENLABS_BASE_URL = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => {
  server.close();
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.rmSync(episodeDir(TEST_ID), { recursive: true, force: true });
});

test("synthèse : minutage par caractère renvoyé, audio écrit, langue demandée", async () => {
  requetes = [];
  corps = [];
  const out = path.join(tmp, "a.mp3");
  const texte = "Bonjour le monde.";
  const al = await synthesize(texte, out, { voiceId: "voixA", model: "modele-ok" });
  assert.ok(al);
  assert.equal(al.characters.length, texte.length);
  assert.ok(fs.statSync(out).size > 500);
  assert.deepEqual(requetes, ["POST /v1/text-to-speech/voixA/with-timestamps?output_format=mp3_44100_128"]);
  assert.equal(corps[0].language_code, "fr");
  assert.equal(corps[0].model_id, "modele-ok");
});

test("synthèse : si le modèle refuse language_code, nouvel essai sans", async () => {
  corps = [];
  const al = await synthesize("Bonjour le monde.", path.join(tmp, "b.mp3"), { voiceId: "voixA", model: "modele-sans-langue" });
  assert.ok(al);
  assert.equal(corps.length, 2);
  assert.equal(corps[0].language_code, "fr");
  assert.equal(corps[1].language_code, undefined);
});

test("synthèse : sans minutage, erreur explicite en production et audio conservé pour les essais", async () => {
  const out = path.join(tmp, "c.mp3");
  await assert.rejects(
    () => synthesize("Bonjour le monde.", out, { voiceId: "voixA", model: "modele-sans-minutage" }),
    (e: unknown) => e instanceof FmError && /minutage/.test(e.message) && /modele-sans-minutage/.test(e.message),
  );
  const al = await synthesize("Bonjour le monde.", out, { voiceId: "voixA", model: "modele-sans-minutage", exigerMinutage: false });
  assert.equal(al, null);
  assert.ok(fs.statSync(out).size > 500);
});

test("synthèse : une erreur d'authentification n'est pas réessayée", async () => {
  requetes = [];
  process.env.ELEVENLABS_API_KEY = "mauvaise-cle";
  try {
    await assert.rejects(() => synthesize("Bonjour.", path.join(tmp, "d.mp3"), { voiceId: "voixA", model: "modele-ok" }), /401/);
    assert.equal(requetes.length, 1);
  } finally {
    process.env.ELEVENLABS_API_KEY = "cle-de-test";
  }
});

test("voix d'un épisode : minutage mot à mot, enveloppe et fichiers traités", async () => {
  const ep = episode();
  const timing = await generateVoice(ep);
  const attendus = tokenizeScenes(ep.scenes.map((s) => s.voix)).length;
  assert.equal(timing.fournisseur, "elevenlabs");
  assert.equal(timing.qualite_production, true);
  assert.equal(timing.mots.length, attendus);
  assert.equal(timing.mots[0].debut, 0);
  for (let i = 1; i < timing.mots.length; i++) assert.ok(timing.mots[i].debut >= timing.mots[i - 1].debut, `mot ${i} hors ordre`);
  assert.ok(timing.mots.every((m) => m.fin >= m.debut));
  assert.ok(timing.duree > 5);
  assert.ok(timing.enveloppe.length > 100 && timing.enveloppe.some((v) => v > 0.5));
  assert.ok(fs.existsSync(path.join(episodeDir(TEST_ID), "voix.wav")));
  assert.ok(fs.existsSync(path.join(episodeDir(TEST_ID), "voix.json")));
});

test("essai de voix : un fichier par voix × modèle et un rapport lisible", async () => {
  const ep = episode();
  const rapport = await essaiVoix(ep, { voix: ["voixA"], modeles: ["modele-ok", "modele-sans-minutage"], scenes: 2, sortie: tmp });
  assert.equal(rapport.length, 2);
  assert.ok(rapport[0].minutage.startsWith("oui"), rapport[0].minutage);
  assert.ok(rapport[1].minutage.startsWith("non"), rapport[1].minutage);
  assert.ok(path.basename(rapport[0].fichier!).startsWith("Voix-A-voixA__modele-ok"), `nom de fichier lisible : ${rapport[0].fichier}`);
  for (const l of rapport) {
    assert.equal(l.erreur, undefined);
    assert.ok(l.duree_s && l.duree_s > 1);
    assert.ok(fs.existsSync(path.resolve(l.fichier!)));
  }
  const fichier = JSON.parse(fs.readFileSync(path.join(tmp, ep.id, "rapport.json"), "utf8"));
  assert.equal(fichier.essais.length, 2);
  assert.ok(fichier.extrait.length > 20 && fichier.extrait.length < 600);
});

test("modèles et voix : repli sur l'API v1 quand la v2 est absente", async () => {
  requetes = [];
  const lignes: string[] = [];
  const origine = console.log;
  console.log = (...a: unknown[]) => void lignes.push(a.join(" "));
  try {
    await voixInfos();
  } finally {
    console.log = origine;
  }
  const sortie = lignes.join("\n");
  assert.ok(sortie.includes("modele-ok") && sortie.includes("français : oui"));
  assert.ok(!sortie.includes("transcription"), "les modèles sans synthèse vocale sont masqués");
  assert.ok(sortie.includes("voixA") && sortie.includes("Voix A"));
  assert.ok(requetes.includes("GET /v2/voices?page_size=100") && requetes.includes("GET /v1/voices"));
});

test("Voice Library : filtres transmis, liste écrite, ajout d'une voix au compte", async () => {
  requetes = [];
  const fichier = path.join(tmp, "bibliotheque.json");
  const lignes: string[] = [];
  const origine = console.log;
  console.log = (...a: unknown[]) => void lignes.push(a.join(" "));
  let voix;
  try {
    voix = await voixBibliotheque({ langue: "fr", genre: "male", usage: "social_media", nombre: 5, fichier });
  } finally {
    console.log = origine;
  }
  const appel = requetes.find((r) => r.startsWith("GET /v1/shared-voices?"))!;
  const q = new URLSearchParams(appel.split("?")[1]);
  assert.equal(q.get("language"), "fr");
  assert.equal(q.get("gender"), "male");
  assert.equal(q.get("use_cases"), "social_media");
  assert.equal(q.get("page_size"), "5");
  assert.equal(voix.length, 1);
  assert.ok(lignes.join("\n").includes("voix-ajouter proprio1 voixB"), "la commande d'ajout est proposée");
  assert.equal(JSON.parse(fs.readFileSync(fichier, "utf8")).voix[0].voice_id, "voixB");

  corps = [];
  assert.equal(await voixAjouter("proprio1", "voixB", "Ecto Hugo"), "voixB");
  assert.equal(corps.at(-1)?.new_name, "Ecto Hugo");
  await assert.rejects(() => voixAjouter("proprio1", "inconnue"), /refusé \(400\)/);
});

import { etiquettesTon } from "./voice";
test("nuances de jeu : la colère monte de phrase en phrase et à chaque virgule, le calme après un cri commence par un soupir", () => {
  const t = (s: string) => s.split(" ").map((spoken) => ({ spoken }));
  const furie = etiquettesTon("furie", t("MAIS TU LE FAIS EXPRÈS OU QUOI, FRÉROT ?!"), false);
  assert.equal(furie.get(0), "[angry]");
  assert.equal(furie.get(7), "[shouting]", "après la virgule, il crie");
  const deux = etiquettesTon("furie", t("Dis-moi ça ! MAIS RÉVEILLE-TOI !"), false);
  assert.equal(deux.get(0), "[angry]");
  assert.equal(deux.get(3), "[angry][shouting]", "la dernière phrase est la plus intense");
  assert.equal(etiquettesTon("enerve", t("Tu l'as installé, au moins ?"), false).get(0), "[annoyed]");
  assert.equal(etiquettesTon("doux", t("Bon... pardon mon reuf."), true).get(0), "[sighs] [calm]");
  assert.equal(etiquettesTon("doux", t("Voilà."), false).get(0), "[calm]");
  assert.equal(etiquettesTon("normal", t("Salut."), false).size, 0);
});
