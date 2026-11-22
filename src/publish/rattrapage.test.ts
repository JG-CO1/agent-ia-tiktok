/** Rattrapage Instagram : choix des épisodes et cadence (1 Reel par intervalle). Aucun appel réseau. */
import { test } from "node:test";
import assert from "node:assert/strict";
process.env.FM_NO_JOURNAL = "1";
import { eligibleRattrapage, rattrapagePermis } from "./publish";
import type { Episode } from "../schema/episode";

const ep = (statut: string, tiktok?: string, instagram?: string) =>
  ({ statut, diffusion: { tiktok: tiktok ? { statut: tiktok } : undefined, instagram: instagram ? { statut: instagram } : undefined } }) as unknown as Episode;

test("éligible : publié sur TikTok (PUBLISH_COMPLETE) et pas encore en Reel", () => {
  assert.equal(eligibleRattrapage(ep("publie", "PUBLISH_COMPLETE")), true);
  assert.equal(eligibleRattrapage(ep("publie", "PUBLISH_COMPLETE", "erreur")), true);
  assert.equal(eligibleRattrapage(ep("publie", "PUBLISH_COMPLETE", "conteneur")), true);
});

test("non éligible : déjà en Reel, brouillon TikTok non publié, ou épisode pas encore publié", () => {
  assert.equal(eligibleRattrapage(ep("publie", "PUBLISH_COMPLETE", "publie")), false);
  assert.equal(eligibleRattrapage(ep("publie", "SEND_TO_USER_INBOX")), false);
  assert.equal(eligibleRattrapage(ep("programme", "PUBLISH_COMPLETE")), false);
  assert.equal(eligibleRattrapage(ep("publie")), false);
});

test("cadence : 1 Reel par heure, avec 10 min de marge pour les passages horaires", () => {
  const t = Date.parse("2026-11-22T15:17:00Z");
  assert.equal(rattrapagePermis([], 60, t), true);
  assert.equal(rattrapagePermis([undefined], 60, t), true);
  assert.equal(rattrapagePermis(["2026-11-22T14:17:40Z"], 60, t), true); // 59 min : passage horaire suivant
  assert.equal(rattrapagePermis(["2026-11-22T14:50:00Z"], 60, t), false); // 27 min : trop tôt
  assert.equal(rattrapagePermis(["2026-11-22T13:00:00Z", "2026-11-22T15:00:00Z"], 60, t), false); // le plus récent compte
});
