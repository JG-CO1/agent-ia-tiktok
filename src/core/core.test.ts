/** Tests de la logique déterministe critique : `npm test`. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { findWord, normalizeWord, tokenizeScenes } from "./text";
import { buildTimeline } from "./timeline";
import { estimatedVoice } from "./demo";
import { publicationIso } from "../publish/schedule";
import { normalizeForMatch } from "../verify/verify";
import { editorialLint } from "../qc/editorial";
import { EpisodeSchema, type Episode } from "../schema/episode";
import demo from "../../video/demo/episode-demo.json" with { type: "json" };
import { paginate } from "../../video/components/captionPages";

test("découpage : emphase, ponctuation française rattachée, nombres regroupés", () => {
  const t = tokenizeScenes(["Tu utilises *Claude Code* ? Il dépasse les 190 000 étoiles."]);
  assert.deepEqual(
    t.map((x) => x.display),
    ["Tu", "utilises", "Claude", "Code ?", "Il", "dépasse", "les", "190 000", "étoiles."],
  );
  assert.deepEqual(t.filter((x) => x.emphasis).map((x) => x.display), ["Claude", "Code ?"]);
});

test("recherche de mots : accents, casse et élisions", () => {
  const t = tokenizeScenes(["Un dossier d'instructions et l'API, puis la vidéo."]).map((x) => ({ display: x.display, scene: x.scene }));
  assert.equal(findWord(t, 0, "instructions"), 2);
  assert.equal(findWord(t, 0, "l'API"), 4);
  assert.equal(findWord(t, 0, "video"), 7);
  assert.equal(findWord(t, 0, "absent"), -1);
  assert.equal(normalizeWord("Qu'est-ce"), "est-ce");
});

test("horaires Europe/Paris (hiver, été, jour du changement d'heure)", () => {
  assert.equal(publicationIso("2026-11-14", "09:00", "Europe/Paris"), "2026-11-14T09:00:00+01:00");
  assert.equal(publicationIso("2026-07-14", "19:00", "Europe/Paris"), "2026-07-14T19:00:00+02:00");
  assert.equal(publicationIso("2026-03-29", "09:00", "Europe/Paris"), "2026-03-29T09:00:00+02:00");
});

test("citations : Markdown neutralisé de façon identique côté source et citation", () => {
  const page = normalizeForMatch("that power [Claude's document capabilities](https://x.y) in the [`skills/docx`](./skills/docx) folder");
  assert.ok(page.includes(normalizeForMatch("that power Claude’s document capabilities in the skills/docx folder")));
});

function demoEpisode(): Episode {
  return EpisodeSchema.parse(JSON.parse(JSON.stringify(demo)));
}

test("règles éditoriales : intros interdites, promesses irréalistes, fausses nouveautés", () => {
  const ep = demoEpisode();
  ep.scenes[1].voix = "Bonjour à tous, aujourd'hui on va voir comment gagner 5000 € par mois avec ce nouveau skill.";
  const msgs = editorialLint(ep).filter((i) => i.bloquant).map((i) => i.message);
  assert.ok(msgs.some((m) => m.includes("Introduction interdite")));
  assert.ok(msgs.some((m) => m.includes("Promesse irréaliste")));
  assert.ok(msgs.some((m) => m.includes("nouveauté")));
});

test("timeline : scènes contiguës, mots croissants, repères calés", () => {
  const ep = demoEpisode();
  const tl = buildTimeline(ep, estimatedVoice(ep), { channel: { nom: "x", handle: "@x", promesse: "p" }, voiceSrc: "", assetsBase: "x" });
  assert.equal(tl.scenes[0].from, 0);
  for (let i = 1; i < tl.scenes.length; i++) assert.ok(tl.scenes[i].from > tl.scenes[i - 1].from);
  for (let i = 1; i < tl.words.length; i++) assert.ok(tl.words[i].from >= tl.words[i - 1].from);
  const term = tl.scenes.find((s) => s.type === "terminal")!;
  assert.equal(term.reveals.length, 4);
  assert.ok(tl.durationInFrames > tl.scenes[tl.scenes.length - 1].from);
});

test("sous-titres : pages de 3 mots maximum, sans chevauchement, tous les mots affichés", () => {
  const ep = demoEpisode();
  const tl = buildTimeline(ep, estimatedVoice(ep), { channel: { nom: "x", handle: "@x", promesse: "p" }, voiceSrc: "", assetsBase: "x" });
  const pages = paginate(tl.words);
  assert.ok(pages.every((p) => p.words.length <= 3));
  for (let i = 1; i < pages.length; i++) assert.ok(pages[i - 1].to <= pages[i].from, `chevauchement page ${i}`);
  assert.equal(pages.reduce((n, p) => n + p.words.length, 0), tl.words.length);
});

test("citations : espace avant la ponctuation et entités HTML hexadécimales", async () => {
  const { htmlToText } = await import("../verify/verify");
  const page = normalizeForMatch(htmlToText("<p><strong>Version</strong> : Claude Code v2.1.323 or later</p><p>it isn&#x27;t open</p>"));
  assert.ok(page.includes(normalizeForMatch("Version: Claude Code v2.1.323 or later")));
  assert.ok(page.includes(normalizeForMatch("it isn't open")));
});

test("pages HTML : les gros blocs de configuration JSON ne sont pas conservés", async () => {
  const { htmlToText } = await import("../verify/verify");
  const blob = JSON.stringify(Object.fromEntries(Array.from({ length: 40 }, (_, i) => [`cle${i}`, `valeur ${i}`])));
  const t = htmlToText(`<p>Texte utile</p>\n${blob}\n<p>Suite</p>`);
  assert.ok(t.includes("Texte utile") && t.includes("Suite"));
  assert.ok(!t.includes("cle12"));
});

test("identité affichée : le nom si les @ diffèrent, le @ s'il est commun à toutes les plateformes", async () => {
  const { chaine, signatureVideo } = await import("../lib/config");
  const c = chaine();
  const avec = (handles: { youtube: string | null; tiktok: string | null; instagram: string | null }) => signatureVideo({ ...c, nom: "Studio Fantôme", handles });
  assert.equal(avec({ youtube: "@PIlot-IA", tiktok: "@pilote.ia", instagram: null }), "Studio Fantôme");
  assert.equal(avec({ youtube: "@Pilote.IA", tiktok: "@pilote.ia", instagram: "@pilote.ia" }), "@Pilote.IA", "même @ (casse ignorée)");
  assert.equal(avec({ youtube: null, tiktok: null, instagram: null }), "Studio Fantôme");
});
