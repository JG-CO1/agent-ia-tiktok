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

// ---------- Tableaux tirés par Ecto ----------
import { planPulls, pullProgress, pullTransform, PULL_DURATION } from "./pull";

test("traction : arrivée complète, galère non monotone, rebond borné", () => {
  for (const st of ["facile", "rapide", "galere"] as const) {
    assert.equal(pullProgress(st, 0), 0);
    assert.equal(pullProgress(st, PULL_DURATION[st]), 1);
    for (let t = 0; t <= PULL_DURATION[st]; t++) assert.ok(pullProgress(st, t) <= 1.2 && pullProgress(st, t) >= 0);
  }
  let recule = false;
  for (let t = 1; t <= PULL_DURATION.galere; t++) if (pullProgress("galere", t) < pullProgress("galere", t - 1) - 1e-6) recule = true;
  assert.ok(recule, "la carte doit glisser en arrière pendant la galère");
});

test("traction : planification déterministe, jamais la même direction deux fois d'affilée", () => {
  const tl = demoTl();
  assert.deepEqual(tl.pulls, demoTl().pulls);
  assert.ok(tl.pulls.length >= 2);
  for (let i = 1; i < tl.pulls.length; i++) assert.notEqual(tl.pulls[i].dir, tl.pulls[i - 1].dir);
  for (const p of tl.pulls) assert.ok(Math.abs(pullTransform(p, p.from + p.dur).x) + Math.abs(pullTransform(p, p.from + p.dur).y) === 0);
  const scenes = Array.from({ length: 7 }, (_, i) => ({ index: i, type: "liste", from: i * 150, duration: 150 }));
  const styles = new Set(planPulls(scenes, 3).map((p) => p.style));
  assert.ok(styles.has("galere") && styles.has("rapide") && styles.has("facile"));
});

test("traction : un seul bruitage, à la mise en place du tableau", () => {
  const tl = demoTl();
  for (const p of tl.pulls) {
    const land = p.from + p.dur;
    const dans = tl.sfx.filter((c) => c.frame >= p.from - 11 && c.frame <= land + 6);
    assert.equal(dans.length, 1, `scène ${p.scene} : ${dans.map((c) => c.son + "@" + c.frame).join(", ")}`);
    assert.equal(dans[0].frame, land);
  }
});

// ---------- Moteur d'idées et d'accroches ----------
import { classerHooks, classerIdees, noterHook, noterIdee, POIDS_IDEE, type Idee } from "../veille/scoring";

const idee = (o: Partial<Idee> = {}): Idee => ({
  titre: "t",
  categorie: "E",
  scores: { viral: 8, originalite: 7, utilite: 8, curiosite: 8, partage: 6, sauvegarde: 6, demonstration: 9, actualite: 7 },
  source: "https://example.com",
  date_source: "2026-11-20",
  verifiee: true,
  ...o,
});

test("idées : pondération = 100, calcul exact, garde-fous de vérité et de fraîcheur", () => {
  assert.equal(Object.values(POIDS_IDEE).reduce((a, b) => a + b, 0), 100);
  const now = Date.parse("2026-11-26");
  const max = noterIdee(idee({ scores: { viral: 10, originalite: 10, utilite: 10, curiosite: 10, partage: 10, sauvegarde: 10, demonstration: 10, actualite: 10 } }), now);
  assert.equal(max.score, 100);
  assert.ok(max.retenable);
  assert.equal(noterIdee(idee({ verifiee: false }), now).retenable, false);
  assert.equal(noterIdee(idee({ source: undefined }), now).retenable, false);
  assert.equal(noterIdee(idee({ nouveaute: true, date_source: "2026-10-01" }), now).retenable, false);
  assert.equal(noterIdee(idee({ nouveaute: true, date_source: "2026-11-20" }), now).retenable, true);
  assert.ok(noterIdee(idee({ demonstration_realisable: false }), now).score <= 70);
  const l = classerIdees([idee({ titre: "faible", verifiee: false }), idee({ titre: "ok" })], now);
  assert.equal(l[0].titre, "ok");
});

test("hooks : précision et enjeu récompensés ; ouvertures bannies, hyperboles, promesses de gains sanctionnées", () => {
  const bon = noterHook("Tu peux *voir* en direct ce que fait Claude Code.");
  const mou = noterHook("Un outil incroyable pour développer.");
  const gains = noterHook("Gagne 5 000 € par mois avec Claude.");
  assert.ok(bon.score > mou.score);
  assert.ok(mou.alertes.some((a) => a.includes("ouverture bannie")));
  assert.ok(mou.alertes.some((a) => a.includes("hyperbole")));
  assert.ok(gains.alertes.some((a) => a.includes("gains")));
  assert.ok(gains.score < 40);
  assert.equal(classerHooks(["Un truc", "Tu peux automatiser ça avec Claude Code."])[0].texte.startsWith("Tu peux"), true);
});

// ---------------------------------------------------------------- personnalité d'Ecto (colère, accessoires, lancer)
import {
  ACCESSOIRE_DEFS,
  FALL_FRAMES,
  actionAt,
  apparition,
  fumeeAt,
  flammesAt,
  lancerAt,
  LANCER,
  niveauAt,
  pointImpact,
  propAt,
  rageAt,
  tonsDesScenes,
  tremblement,
} from "./colere";
import ectoDemo from "../../video/demo/ecto-personnalite.json" with { type: "json" };

test("colère : monte en quelques images, retombe d'un coup, fumée proportionnelle, flammes seulement en furie", () => {
  const keys = [
    { frame: 10, niveau: 1 as const },
    { frame: 100, niveau: 2 as const },
    { frame: 200, niveau: 0 as const },
  ];
  assert.equal(rageAt(keys, 5), 0);
  assert.ok(rageAt(keys, 18) > 0.4 && rageAt(keys, 18) < 1);
  assert.equal(rageAt(keys, 60), 1);
  assert.equal(rageAt(keys, 130), 2);
  assert.equal(rageAt(keys, 200 + FALL_FRAMES), 0, "retour au calme quasi instantané");
  assert.equal(niveauAt(keys, 150), 2);
  assert.equal(flammesAt(keys, 60), 0, "pas de flammes à l'état 2");
  assert.ok(flammesAt(keys, 130) > 0.8);
  assert.ok(fumeeAt(keys, 130) > fumeeAt(keys, 60) && fumeeAt(keys, 60) > 0, "plus il est en colère, plus il y a de fumée");
  assert.ok(fumeeAt(keys, 205) > 0 && fumeeAt(keys, 240) === 0, "la fumée se dissipe après le retour au calme");
  const t = tremblement(2, 33);
  assert.ok(Math.abs(t.x) <= 1.01 && Math.abs(t.y) <= 1.01);
  assert.deepEqual(tremblement(0, 33), { x: 0, y: 0, rot: 0 });
});

test("accessoires : apparition en pop, cycle d'actions, bibliothèque cohérente", () => {
  const ev = [
    { frame: 50, accessoire: "the" as const },
    { frame: 300, accessoire: "doudou" as const },
  ];
  assert.equal(propAt(ev, 10).accessoire, null);
  assert.equal(propAt(ev, 60).accessoire, "the");
  assert.equal(propAt(ev, 60).age, 10);
  const p = propAt(ev, 302);
  assert.equal(p.accessoire, "doudou");
  assert.equal(p.parti?.accessoire, "the", "le thé qu'il range disparaît en quelques images");
  assert.ok(apparition(0) === 0 && apparition(30) === 1);
  const def = ACCESSOIRE_DEFS.the;
  const vals = Array.from({ length: def.cycle }, (_, k) => actionAt(def, 18 + k));
  assert.ok(Math.max(...vals) === 1 && Math.min(...vals) === 0, "il boit puis repose la tasse");
  assert.ok(Object.values(ACCESSOIRE_DEFS).length >= 10);
  assert.equal(ACCESSOIRE_DEFS.plaid.lancable, false);
});

test("lancer : armement, vol, impact ; point d'impact stable et dans l'image", () => {
  const l = [{ frame: 100, accessoire: "the" as const, impact: "brise" as const, seed: 5 }];
  assert.equal(lancerAt(l, 80), null);
  assert.equal(lancerAt(l, 95)?.phase, "armement");
  assert.equal(lancerAt(l, 100)?.phase, "vol");
  assert.equal(lancerAt(l, 100 + LANCER.vol)?.phase, "impact");
  assert.equal(lancerAt(l, 100 + LANCER.vol + LANCER.fx), null);
  const p = pointImpact(5);
  assert.deepEqual(p, pointImpact(5));
  assert.ok(p.x > 300 && p.x < 800 && p.y > 600 && p.y < 1100);
});

test("ton de voix : découle de la colère, se prolonge, le ton explicite l'emporte", () => {
  const tons = tonsDesScenes([
    {},
    { fantome: { colere: "furie" } },
    { fantome: { colere: "calme", accessoire: "the" } },
    {},
    { fantome: { colere: "enerve" } },
    { ton: "normal", fantome: { colere: "calme" } },
  ]);
  assert.deepEqual(tons, ["normal", "furie", "doux", "doux", "enerve", "normal"]);
});

test("épisode de démonstration d'Ecto : trois niveaux, plusieurs accessoires, lancer avec vitre brisée, planification cohérente", () => {
  const ep = EpisodeSchema.parse(ectoDemo);
  const tl = buildTimeline(ep, estimatedVoice(ep), { channel: { nom: "N", handle: "H", promesse: "P" }, voiceSrc: "", assetsBase: "x" });
  const niveaux = new Set(tl.fx.rage.map((k) => k.niveau));
  assert.ok(niveaux.has(0) && niveaux.has(1) && niveaux.has(2));
  assert.ok(new Set(tl.fx.props.filter((p) => p.accessoire).map((p) => p.accessoire)).size >= 4);
  assert.ok(tl.fx.lancers.some((l) => l.impact === "brise"));
  // un lancer part de la main : l'accessoire tenu est retiré à l'image du lâcher
  for (const l of tl.fx.lancers) assert.equal(propAt(tl.fx.props, l.frame).accessoire, null);
  // sons : le lancer, l'impact, les objets et le soupir ; aucun bruit pendant la colère (tension, grognement, fumée, flammes)
  const sons = new Set(tl.sfx.map((c) => c.son));
  for (const s of ["lancer", "verre", "poof", "soupir"] as const) assert.ok(sons.has(s), `son ${s}`);
  for (const s of ["agacement", "tension", "fumee", "flamme"] as const) assert.ok(!sons.has(s), `pas de son ${s} pendant la colère`);
  // jamais de rafale : deux sons séparés d'au moins 10 images
  const f = tl.sfx.map((c) => c.frame).sort((a, b) => a - b);
  for (let i = 1; i < f.length; i++) assert.ok(f[i] - f[i - 1] >= 10);
});

test("lancer impossible : sans accessoire tenu ou avec un accessoire non lançable, il est signalé et ignoré", () => {
  const base = EpisodeSchema.parse(ectoDemo);
  const faux = structuredClone(base);
  faux.scenes[1].fantome = { colere: "calme", accessoire: "plaid" };
  faux.scenes[4].temps_forts = [{ sur_mot: "FRÉROT", lancer: "brise" }];
  const tl = buildTimeline(faux, estimatedVoice(faux), { channel: { nom: "N", handle: "H", promesse: "P" }, voiceSrc: "", assetsBase: "x" });
  assert.equal(tl.fx.lancers.length, 1, "seul le lancer du doudou (scène 8) subsiste");
});
