/** Orthographe française via hunspell (fr_FR) + lexique technique du média (config/lexique.txt). */
import fs from "node:fs";
import path from "node:path";
import { run } from "../lib/exec";
import { CONFIG_DIR } from "../lib/paths";

function lexicon(): Set<string> {
  const f = path.join(CONFIG_DIR, "lexique.txt");
  if (!fs.existsSync(f)) return new Set();
  return new Set(
    fs
      .readFileSync(f, "utf8")
      .split("\n")
      .map((l) => l.trim().toLowerCase())
      .filter((l) => l && !l.startsWith("#")),
  );
}

/** Renvoie les mots inconnus (hors lexique), à relire par l'agent ou un humain. */
export async function spellCheck(text: string, extra: string[] = []): Promise<string[]> {
  const lex = lexicon();
  for (const w of extra) for (const part of w.split(/[^\p{L}\p{N}-]+/u)) if (part) lex.add(part.toLowerCase());
  const words = text
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[@#][\p{L}\p{N}_.]+/gu, " ")
    .split(/[^\p{L}\p{N}'’._/-]+/u)
    .flatMap((w) => w.split(/['’]/))
    .map((w) => w.replace(/^[._/-]+|[._/-]+$/g, ""))
    .filter((w) => w.length > 2 && !/\d/.test(w) && !/[._/]/.test(w) && !/^[A-Z]{2,6}s?$/.test(w) && !lex.has(w.toLowerCase()));
  const uniq = [...new Set(words)];
  if (uniq.length === 0) return [];
  try {
    const { stdout } = await run("hunspell", ["-d", "fr_FR", "-i", "utf-8", "-l"], { input: uniq.join("\n") });
    return [...new Set(stdout.split("\n").map((w) => w.trim()).filter(Boolean))].filter((w) => !lex.has(w.toLowerCase()));
  } catch {
    return ["(hunspell indisponible : apt-get install hunspell hunspell-fr)"];
  }
}
