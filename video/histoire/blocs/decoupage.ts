/**
 * Découpage d'un récit « blocs » en plans calés sur les MOTS de la narration (et non sur des durées fixes) :
 * avec la vraie voix, chaque plan démarre exactement quand son mot-repère est prononcé.
 * Module sans dépendance (utilisable par le rendu et par les scripts de contrôle).
 */
export type Mot = { texte: string; debut: number; fin: number; scene: number };
export type Minutage = { duree: number; mots: Mot[]; scenes: Array<{ debut: number; fin: number }>; voix: string | null; musique?: string | null; /** durée minimale de la vidéo (61,5 s par défaut ; 0 pour un format court) */ dureeMin?: number };
export type RecitBlocs = { id: string; titre: string; scenes: Array<{ texte: string }>; cloture: string; format?: string; mise_en_scene?: string; episode?: string };

/** Un plan : scène (indice), mot-repère (indice du mot dans la scène), et `continu` s'il prolonge le plan précédent sans coupe. */
export type Repere = { id: string; scene: number; mot: number; continu?: boolean };
export type PlanMinute<T extends Repere = Repere> = { def: T; debut: number; fin: number; index: number };

/** Durée minimale de la vidéo finie (la plateforme demande plus d'une minute). */
export const DUREE_MIN = 61.5;
/** Durée réellement rendue : celle de la narration, jamais moins que DUREE_MIN. */
export const dureeBlocs = (m: Minutage) => Math.max(m.duree, m.dureeMin ?? DUREE_MIN);

/** Avance de la coupe sur le mot (la coupe arrive juste avant que le mot soit prononcé). */
const AVANCE = 0.06;

/** Instant où le mot `k` de la scène `scene` commence (repli proportionnel si le minutage ne correspond pas). */
export function tempsMot(recit: RecitBlocs, m: Minutage, scene: number, k: number): number {
  const mots = m.mots.filter((w) => w.scene === scene);
  if (mots.length && k < mots.length) return mots[Math.max(0, k)].debut;
  const b = m.scenes[scene] ?? { debut: 0, fin: m.duree };
  const n = Math.max(1, recit.scenes[scene]?.texte.split(/\s+/).filter(Boolean).length ?? 1);
  return b.debut + ((b.fin - b.debut) * Math.min(k, n)) / n;
}

/** Place chaque plan dans le temps. Un plan trop court (< 0,7 s) est absorbé par le précédent. */
export function decouper<T extends Repere>(recit: RecitBlocs, m: Minutage, plans: T[]): PlanMinute<T>[] {
  const fin = dureeBlocs(m);
  const out: PlanMinute<T>[] = [];
  let coupe = 0; // instant de la dernière coupe franche
  plans.forEach((def) => {
    const prec = out[out.length - 1];
    let debut = prec ? Math.max(0, tempsMot(recit, m, def.scene, def.mot) - AVANCE) : 0;
    if (prec && !def.continu && debut - coupe < 0.7) return; // garde-fou : jamais de plan-éclair
    if (prec) {
      debut = Math.max(debut, prec.debut + 0.1);
      prec.fin = debut;
    }
    if (!def.continu) coupe = debut;
    out.push({ def, debut, fin, index: out.length });
  });
  return out;
}

export function planCourant<T extends Repere>(plans: PlanMinute<T>[], t: number): PlanMinute<T> {
  for (let i = plans.length - 1; i >= 0; i--) if (t >= plans[i].debut) return plans[i];
  return plans[0];
}

// ------------------------------------------------------------------ Sous-titres : un seul mot à la fois
export type MotAffiche = { texte: string; debut: number; fin: number };
/**
 * Prépare les mots à afficher : guillemets retirés, ponctuation seule rattachée au mot précédent
 * (« quelqu'un ? »), virgules et points retirés, majuscules.
 */
export function motsAffiches(mots: Mot[]): MotAffiche[] {
  const out: MotAffiche[] = [];
  for (const m of mots) {
    const brut = m.texte.replace(/[«»"“”]/g, "").trim();
    if (!brut) continue;
    if (/^[?!:;.,…]+$/.test(brut)) {
      const prec = out[out.length - 1];
      if (prec) {
        const fort = brut.replace(/[^?!]/g, "");
        if (fort && !/[?!]$/.test(prec.texte)) prec.texte += ` ${fort}`;
        prec.fin = Math.max(prec.fin, m.fin);
      }
      continue;
    }
    const nu = brut.replace(/[.,;:…]+$/g, "");
    // le gimmick « HUSS » s'écrit toujours « HUSS! » (jamais traduit, jamais d'espace avant le point d'exclamation)
    const texte = /^huss[!.]?$/i.test(nu) ? "HUSS!" : nu.replace(/([?!])$/, " $1").replace(/\s+/g, " ");
    out.push({ texte: texte.toLocaleUpperCase("fr-FR"), debut: m.debut, fin: m.fin });
  }
  return out;
}
