/** Hashtags par plateforme et état des brouillons TikTok (page des légendes à copier). */
import assert from "node:assert/strict";
import { test } from "node:test";
import type { Episode } from "../schema/episode";
import { etatTikTok } from "./legendes";
import { hashtagsPour } from "./review";

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

test("état TikTok : brouillon arrivé = à publier, publié = publiée, sinon à venir", () => {
  const d = (statut?: string) => ({ diffusion: statut ? { tiktok: { publish_id: "p", mode: "brouillon", statut } } : {} }) as unknown as Episode;
  assert.equal(etatTikTok(d("SEND_TO_USER_INBOX")), "a_publier");
  assert.equal(etatTikTok(d("PUBLISH_COMPLETE")), "publiee");
  assert.equal(etatTikTok(d("PROCESSING_UPLOAD")), "a_venir");
  assert.equal(etatTikTok(d()), "a_venir");
});
