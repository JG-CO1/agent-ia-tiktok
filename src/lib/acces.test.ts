/** Contrôle ElevenLabs : une panne passagère ne doit jamais passer pour une clé refusée (et inversement). */
import assert from "node:assert/strict";
import { test } from "node:test";
import { lireReponseEL } from "./acces";
import { messageErreur } from "./log";

test("5xx et 429 : panne passagère, la clé n'est pas mise en cause", () => {
  for (const status of [500, 502, 503, 429]) {
    const r = lireReponseEL(status, "<html>Bad Gateway</html>");
    assert.equal(r.panne, `HTTP ${status}`);
    assert.equal(r.refus, null);
    assert.equal(r.permission, null);
  }
});

test("401 clé invalide : refus, pas une panne", () => {
  const r = lireReponseEL(401, JSON.stringify({ detail: { status: "invalid_api_key", message: "Invalid API key" } }));
  assert.equal(r.refus, "Invalid API key");
  assert.equal(r.panne, null);
});

test("401 permission manquante : permission relevée, la clé reste reconnue", () => {
  const texte = JSON.stringify({
    detail: { status: "missing_permissions", message: "The API key you used is missing the permission text_to_speech to execute this operation." },
  });
  const r = lireReponseEL(401, texte);
  assert.equal(r.permission, "text_to_speech");
  assert.equal(r.refus, null);
  assert.equal(r.panne, null);
});

test("400 texte vide : clé et permission de synthèse acceptées", () => {
  const r = lireReponseEL(400, JSON.stringify({ detail: { status: "invalid_text", message: "Text must not be empty" } }));
  assert.deepEqual([r.panne, r.refus, r.permission], [null, null, null]);
});

test("messageErreur : cause réseau et délai dépassé lisibles", () => {
  assert.equal(messageErreur(new TypeError("fetch failed", { cause: { code: "ECONNRESET" } })), "fetch failed : ECONNRESET");
  const delai = new Error("The operation was aborted due to timeout");
  delai.name = "TimeoutError";
  assert.equal(messageErreur(delai), "délai dépassé");
  assert.equal(messageErreur("texte"), "texte");
});
