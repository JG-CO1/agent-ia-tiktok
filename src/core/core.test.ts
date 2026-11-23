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

// ---------- Caméra dynamique ----------
import { buildCameraPlan, cameraAt, musicGain, CAMERA_LIMITS } from "../../video/camera/camera";

function demoTl() {
  const ep = EpisodeSchema.parse(demo);
  return buildTimeline(ep, estimatedVoice(ep), {
    channel: { nom: "t", handle: "t", promesse: "t" },
    voiceSrc: "",
    assetsBase: "x",
    musicSrc: "musique/ambiance-studio.m4a",
  });
}

test("caméra : bornée, jamais de bord vide, mouvements consécutifs différents", () => {
  const tl = demoTl();
  const plan = buildCameraPlan(tl);
  for (let i = 1; i < plan.segments.length; i++) assert.notEqual(plan.segments[i].kind, plan.segments[i - 1].kind);
  for (let f = 0; f < tl.durationInFrames; f++) {
    const c = cameraAt(plan, f, { x: 300 + (f % 400), y: 1100, s: 1 });
    assert.ok(c.scale >= 1 && c.scale <= CAMERA_LIMITS.scaleMax, `zoom ${c.scale} @${f}`);
    assert.ok(Math.abs(c.tx) <= ((c.scale - 1) * 1080) / 2, `tx @${f}`);
    assert.ok(Math.abs(c.ty) <= ((c.scale - 1) * 1920) / 2, `ty @${f}`);
    assert.ok(Math.abs(c.rot) <= CAMERA_LIMITS.rotMax);
  }
});

test("caméra : déterministe et jamais immobile plus de ~1,5 s", () => {
  const tl = demoTl();
  const plan = buildCameraPlan(tl);
  assert.deepEqual(cameraAt(plan, 100), cameraAt(buildCameraPlan(tl), 100));
  let still = 0;
  let worst = 0;
  let prev = cameraAt(plan, 0);
  for (let f = 1; f < tl.durationInFrames; f++) {
    const c = cameraAt(plan, f);
    const d = Math.abs(c.scale - prev.scale) * 1000 + Math.abs(c.tx - prev.tx) + Math.abs(c.ty - prev.ty);
    still = d < 0.01 ? still + 1 : 0;
    worst = Math.max(worst, still);
    prev = c;
  }
  assert.ok(worst < 45, `immobile ${worst} images`);
});

test("musique : la voix reste prioritaire et le gain est borné", () => {
  const tl = demoTl();
  for (let f = 0; f < tl.durationInFrames; f += 7) {
    const g = musicGain(tl, f);
    assert.ok(g >= 0 && g <= 1.6);
  }
});

test("intro : aucun effet sonore avant la fin de la première scène", () => {
  const tl = demoTl();
  const end = tl.scenes[1].from;
  assert.ok(tl.sfx.every((c) => c.frame >= end), "effet sonore dans l'intro");
  assert.ok(tl.sfx.length > 0, "les effets du reste de la vidéo sont conservés");
});
