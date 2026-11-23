/** Hashtags par plateforme et état des brouillons TikTok (page des légendes à copier). */
import assert from "node:assert/strict";
import { test } from "node:test";
import type { Episode } from "../schema/episode";
import { aideBrouillonTikTok, etatTikTok, urlPageLegendes } from "./legendes";
import { finalDescription, hashtagsPour } from "./review";

const ep = (format: string, hashtags: string[]) => ({ format, publication: { hashtags } }) as unknown as Episode;

test("TikTok : 5 hashtags — base de la chaîne, format, sujet le plus précis, découverte éducative", () => {
  const t = hashtagsPour(ep("decouverte", ["#claude", "#claudecode", "#ia", "#opensource", "#skill"]), "tiktok");
  assert.deepEqual(t, ["#claudeai", "#ia", "#astuce", "#claudecode", "#apprendresurtiktok"]);
});

test("YouTube et Instagram : 2 tags de sujet, pas de tag TikTok ; format business et actu", () => {
  assert.deepEqual(hashtagsPour(ep("business", ["#claude", "#claudecode", "#freelance", "#ia"]), "youtube"), ["#claudeai", "#ia", "#business", "#claudecode", "#freelance"]);
  assert.deepEqual(hashtagsPour(ep("actu", ["#Anthropic", "#IA", "#Physique"]), "instagram"), ["#claudeai", "#ia", "#actu", "#anthropic", "#physique"]);
});

test("hashtags nettoyés : sans doublon, sans accent ni espace, jamais plus de 5", () => {
  const t = hashtagsPour(ep("actu", ["#Nouveauté", "nouveauté", "#agents IA", "#claude", "#ia", "#x", "#cloud", "#data"]), "youtube");
  assert.deepEqual(t, ["#claudeai", "#ia", "#actu", "#nouveaute", "#agentsia"]);
  assert.equal(new Set(t).size, t.length);
});

test("état TikTok : brouillon envoyé = à publier, publié = publiée, pas encore envoyé = à venir", () => {
  const d = (statut?: string) => ({ diffusion: statut ? { tiktok: { publish_id: "p", mode: "brouillon", statut } } : {} }) as unknown as Episode;
  assert.equal(etatTikTok(d("SEND_TO_USER_INBOX")), "a_publier");
  assert.equal(etatTikTok(d("PUBLISH_COMPLETE")), "publiee");
  assert.equal(etatTikTok(d("PROCESSING_UPLOAD")), "a_publier"); // envoyé, arrivée pas encore confirmée
  assert.equal(etatTikTok(d("FAILED")), "a_venir");
  assert.equal(etatTikTok(d()), "a_venir");
});

const complet = (format: string) =>
  ({
    id: "2026-11-23-1-essai",
    format,
    sources: [{ id: "s1", titre: "Source", url: "https://exemple.test/page" }],
    publication: { description_tiktok: "Un skill Claude Code qui fait une synthèse. Tu l'essaies ?", description_youtube: "Description YouTube.", hashtags: ["#claudecode", "#skill"] },
  }) as unknown as Episode;

test("TikTok reçoit la même description qu'Instagram : texte, mention d'indépendance, hashtags (sans sources)", () => {
  const tt = finalDescription(complet("decouverte"), "tiktok");
  assert.equal(
    tt,
    "Un skill Claude Code qui fait une synthèse. Tu l'essaies ?\n\nMédia indépendant, non affilié à Anthropic. Claude est une marque d'Anthropic.\n\n#claudeai #ia #astuce #claudecode #apprendresurtiktok",
  );
  const ig = finalDescription(complet("decouverte"), "instagram");
  assert.equal(ig.split("\n\n").slice(0, 2).join("\n\n"), tt.split("\n\n").slice(0, 2).join("\n\n"));
  assert.equal(tt.includes("https://"), false);
  assert.equal(tt.length <= 2200, true);
  assert.equal(finalDescription(complet("decouverte"), "youtube").includes("Sources :\n• Source : https://exemple.test/page"), true);
});

test("commentaire de publication : description TikTok à coller, avec le lien direct vers la page", () => {
  const avant = process.env.GITHUB_REPOSITORY;
  try {
    delete process.env.GITHUB_REPOSITORY;
    assert.equal(urlPageLegendes("x"), null);
    assert.equal(aideBrouillonTikTok(complet("actu")).includes("github.io"), false);
    process.env.GITHUB_REPOSITORY = "JG-CO1/agent-ia-tiktok";
    assert.equal(urlPageLegendes("2026-11-23-1-essai"), "https://jg-co1.github.io/agent-ia-tiktok/legendes.html#2026-11-23-1-essai");
    const bloc = aideBrouillonTikTok(complet("actu"));
    assert.equal(bloc.includes("https://jg-co1.github.io/agent-ia-tiktok/legendes.html#2026-11-23-1-essai"), true);
    assert.equal(bloc.includes("```text\n" + finalDescription(complet("actu"), "tiktok") + "\n```"), true);
  } finally {
    if (avant === undefined) delete process.env.GITHUB_REPOSITORY;
    else process.env.GITHUB_REPOSITORY = avant;
  }
});
