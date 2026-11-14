/** Journal des opérations : console + fichier JSONL quotidien (data/journal/AAAA-MM-JJ.jsonl). */
import fs from "node:fs";
import path from "node:path";
import { DATA_DIR } from "./paths";

type Level = "info" | "ok" | "warn" | "erreur";
const COLORS: Record<Level, string> = { info: "\x1b[36m", ok: "\x1b[32m", warn: "\x1b[33m", erreur: "\x1b[31m" };

export function log(level: Level, etape: string, message: string, extra?: Record<string, unknown>) {
  const now = new Date();
  const line = { date: now.toISOString(), niveau: level, etape, message, ...(extra ?? {}) };
  const prefix = `${COLORS[level]}[${etape}]\x1b[0m`;
  (level === "erreur" ? console.error : console.log)(`${prefix} ${message}`);
  if (process.env.FM_NO_JOURNAL) return; // tests : ne pas écrire dans data/journal
  try {
    const dir = path.join(DATA_DIR, "journal");
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(path.join(dir, `${now.toISOString().slice(0, 10)}.jsonl`), JSON.stringify(line) + "\n");
  } catch {
    /* le journal ne doit jamais faire échouer une commande */
  }
}

export class FmError extends Error {
  constructor(
    message: string,
    public readonly etape = "erreur",
  ) {
    super(message);
  }
}
