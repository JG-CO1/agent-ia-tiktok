import { spawn } from "node:child_process";

/** Lance une commande et renvoie stdout/stderr ; lève une erreur si le code de sortie est non nul. */
export function run(cmd: string, args: string[], opts: { input?: string; cwd?: string } = {}): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd: opts.cwd, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    p.stdout.on("data", (d) => (stdout += d));
    p.stderr.on("data", (d) => (stderr += d));
    p.on("error", reject);
    p.on("close", (code) => (code === 0 ? resolve({ stdout, stderr }) : reject(new Error(`${cmd} a échoué (${code}) : ${stderr.slice(-800)}`))));
    if (opts.input !== undefined) p.stdin.end(opts.input);
    else p.stdin.end();
  });
}
