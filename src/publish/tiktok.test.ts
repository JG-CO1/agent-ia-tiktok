/** Identifiants TikTok de 19 chiffres : lus exacts, et rapprochement des anciens identifiants arrondis. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { jsonGrandsEntiers, trouverVideo } from "./tiktok";

test("les identifiants de 19 chiffres restent exacts (chaînes), les petits nombres restent des nombres", () => {
  const j = jsonGrandsEntiers('{"data":{"status":"PUBLISH_COMPLETE","publicaly_available_post_id":[7709488525883871234, 7709488663184395111]}}');
  assert.deepEqual(j.data.publicaly_available_post_id, ["7709488525883871234", "7709488663184395111"]);
  const v = jsonGrandsEntiers('{"view_count": 205, "cursor": 1700000000000, "id": "7709488525883871234", "x": [1, 2]}');
  assert.equal(v.view_count, 205);
  assert.equal(v.cursor, 1700000000000);
  assert.equal(v.id, "7709488525883871234");
  assert.deepEqual(v.x, [1, 2]);
});

test("une vidéo se retrouve par son identifiant exact ou par l'identifiant arrondi enregistré autrefois", () => {
  const exact = "7709488525883871234";
  const arrondi = String(Number(exact)); // ce que l'ancien code enregistrait
  assert.notEqual(arrondi, exact);
  const videos = [{ id: "7709488663184395111" }, { id: exact }];
  assert.equal(trouverVideo(videos, exact)?.id, exact);
  assert.equal(trouverVideo(videos, arrondi)?.id, exact);
  assert.equal(trouverVideo(videos, "123"), undefined);
});
