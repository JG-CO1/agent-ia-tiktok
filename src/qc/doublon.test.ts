/** Doublons : une page de changelog ne bloque pas les versions suivantes, un même sujet reste refusé. */
import assert from "node:assert/strict";
import { test } from "node:test";
import type { Episode } from "../schema/episode";
import { estSourceJournal, trouverDoublon } from "./doublon";

const CHANGELOG = "https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md";
const NPM = "https://registry.npmjs.org/@anthropic-ai/claude-code";
const DEPOT = "https://github.com/heygen-com/hyperframes";
const T0 = Date.parse("2026-11-27T12:00:00Z");

const ep = (id: string, urls: string[], citations: string[]) =>
  ({ id, sources: urls.map((url, i) => ({ id: `s${i + 1}`, url })), affirmations: citations.map((citation, i) => ({ id: `a${i + 1}`, citation })) }) as unknown as Episode;

const v327 = ep("2026-11-19-1-claude-code-mcp-add-json-status", [CHANGELOG, NPM], [
  "api:npm:@anthropic-ai/claude-code@2.1.327:publie=2026-11-17",
  "Added `claude mcp add-json <name> -` to read the server's JSON from stdin",
]);
const historique = [
  { id: v327.id, date: "2026-11-19T09:00:00+01:00", sources: [CHANGELOG, NPM] },
  { id: "2026-11-22-3-hyperframes-html-vers-video", date: "2026-11-22T19:00:00+01:00", sources: [DEPOT] },
];
const charger = (id: string) => (id === v327.id ? v327 : null);

test("pages « journal » : changelog, notes de version, releases, registre npm ; pas un dépôt ni une release précise", () => {
  for (const u of [CHANGELOG, NPM, "https://code.claude.com/docs/en/changelog", "https://platform.claude.com/docs/en/release-notes/overview", "https://github.com/a/b/releases", "https://www.npmjs.com/package/x"]) {
    assert.equal(estSourceJournal(u), true, u);
  }
  for (const u of [DEPOT, "https://github.com/a/b/releases/tag/v1.2.3", "https://www.anthropic.com/news/un-article", "https://platform.claude.com/docs/en/models/fable-5-2/whats-new-fable-5-2", "pas une url"]) {
    assert.equal(estSourceJournal(u), false, u);
  }
});

test("nouvelle version de Claude Code : même changelog, autre entrée → pas un doublon (cas réel du 26/11)", () => {
  const v332 = ep("2026-11-26-3-claude-code-2-1-332-skills-mcp", [CHANGELOG, NPM], [
    "api:npm:@anthropic-ai/claude-code@2.1.332:publie=2026-11-24",
    "Added skills from MCP servers (beta). They show as `server:skill` in the `/` menu; other skills keep their names",
  ]);
  assert.equal(trouverDoublon(v332, historique, charger, T0), null);
});

test("même entrée du changelog ou même version : doublon", () => {
  const redite = ep("2026-11-28-3-encore-add-json", [CHANGELOG], ["Added `claude mcp add-json <name> -`   to read the server's JSON from stdin"]);
  assert.equal(trouverDoublon(redite, historique, charger, T0)?.id, v327.id);
  const memeVersion = ep("2026-11-28-3-status-2-1-327", [CHANGELOG, NPM], ["api:npm:@anthropic-ai/claude-code@2.1.327:publie=2026-11-17", "Added a list in `/status`"]);
  assert.match(trouverDoublon(memeVersion, historique, charger, T0)?.detail ?? "", /même entrée de journal/);
});

test("même dépôt (page de sujet) : doublon, même avec d'autres citations", () => {
  const d = trouverDoublon(ep("2026-11-30-1-hyperframes-bis", [DEPOT], ["autre phrase du README"]), historique, charger, T0);
  assert.equal(d?.id, "2026-11-22-3-hyperframes-html-vers-video");
  assert.match(d?.detail ?? "", /même source principale/);
});

test("hors des 60 jours, le même épisode, ou une source commune seulement en 3e position : pas de doublon", () => {
  const plusTard = T0 + 70 * 86400e3;
  assert.equal(trouverDoublon(ep("2027-02-01-1-hyperframes", [DEPOT], []), historique, charger, plusTard), null);
  assert.equal(trouverDoublon(ep("2026-11-22-3-hyperframes-html-vers-video", [DEPOT], []), historique, charger, T0), null);
  assert.equal(trouverDoublon(ep("2026-11-30-2-autre", ["https://exemple.test/a", "https://exemple.test/b", DEPOT], []), historique, charger, T0), null);
});
