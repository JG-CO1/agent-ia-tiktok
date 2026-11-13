/**
 * Contrat d'un épisode (episode.json).
 * Écrit par l'agent (Claude Code), validé ici, lu par le moteur vidéo, le contrôle qualité et la publication.
 * Règle d'or : toute affirmation factuelle est reliée à une source ET à une citation exacte de cette source.
 */
import { z } from "zod";
import { EXPRESSIONS } from "../../video/ghost/face";
import { ANCHORS, GESTURES } from "../../video/ghost/performance";

export const FORMATS = ["decouverte", "business", "actu", "tutoriel"] as const;
export const CRENEAUX = ["matin", "midi", "soir"] as const;
export const TRANSITIONS = ["coupe", "glisse", "zoom", "flash", "balayage"] as const;
export const SONS = ["whoosh", "pop", "ding", "clic", "swoosh-bas", "impact"] as const;
export const STATUTS = [
  "brouillon", // script en cours
  "redige", // episode.json complet
  "verifie", // fact-check passé
  "voix", // voix générée
  "rendu", // vidéo rendue
  "qc_ok", // contrôle qualité passé
  "en_revue", // envoyé pour approbation
  "approuve",
  "programme",
  "publie",
  "rejete",
  "echec",
] as const;

const anchorKeys = Object.keys(ANCHORS) as [keyof typeof ANCHORS, ...(keyof typeof ANCHORS)[]];

export const SourceSchema = z.object({
  id: z.string().regex(/^s\d+$/, "id de source : s1, s2…"),
  url: z.url(),
  titre: z.string().min(3),
  type: z.enum(["officielle", "github", "documentation", "presse", "communaute"]),
  /** Date de publication de l'information (YYYY-MM-DD) si connue. */
  date_publication: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  /** Date à laquelle la source a été consultée (ISO). */
  consultee_le: z.string(),
});

export const AffirmationSchema = z.object({
  id: z.string().regex(/^a\d+$/, "id d'affirmation : a1, a2…"),
  /** L'affirmation telle qu'elle est dite ou affichée dans la vidéo (français). */
  texte: z.string().min(5),
  source: z.string(),
  /** Extrait mot pour mot de la source qui prouve l'affirmation (langue d'origine). Vérifié par `fm verifier`. */
  citation: z.string().min(8),
  /**
   * a_verifier -> (fm verifier : citation retrouvée mot pour mot) citation_ok
   * -> (sous-agent vérificateur : la citation prouve bien l'affirmation) verifiee | rejetee
   */
  statut: z.enum(["a_verifier", "citation_ok", "verifiee", "rejetee"]).default("a_verifier"),
  note: z.string().optional(),
});

export const DirectionFantomeSchema = z.object({
  position: z.enum(anchorKeys).optional(),
  expression: z.enum(EXPRESSIONS).optional(),
  geste: z.enum(GESTURES).optional(),
  regard: z.enum(["camera", "haut", "bas", "gauche", "droite"]).optional(),
});

/** Temps fort déclenché quand un mot précis est prononcé. */
export const TempsFortSchema = DirectionFantomeSchema.extend({
  sur_mot: z.string().min(1),
  son: z.enum(SONS).optional(),
});

const sceneBase = {
  id: z.string().min(1),
  /**
   * Texte prononcé pendant la scène (français). Mettre *entre astérisques* les mots à mettre en valeur
   * dans les sous-titres. Les astérisques ne sont pas prononcés.
   */
  voix: z.string().min(2),
  fantome: DirectionFantomeSchema.optional(),
  temps_forts: z.array(TempsFortSchema).max(6).optional(),
  transition: z.enum(TRANSITIONS).optional(),
  /** Identifiants des sources affichées en badge pendant la scène. */
  sources: z.array(z.string()).optional(),
};

const Icone = z.string().max(32).optional(); // nom d'icône lucide (ex. "Rocket", "Terminal")

export const SceneSchema = z.discriminatedUnion("type", [
  z.object({
    ...sceneBase,
    type: z.literal("accroche"),
    titre: z.string().min(2).max(60),
    surligne: z.array(z.string()).max(3).optional(),
    sur_titre: z.string().max(40).optional(),
  }),
  z.object({
    ...sceneBase,
    type: z.literal("titre"),
    titre: z.string().max(60),
    sur_titre: z.string().max(40).optional(),
    icone: Icone,
  }),
  z.object({
    ...sceneBase,
    type: z.literal("repo"),
    nom: z.string().regex(/^[\w.-]+\/[\w.-]+$/, "format owner/repo"),
    description: z.string().max(160),
    etoiles: z.number().int().nonnegative().optional(),
    langage: z.string().max(24).optional(),
    licence: z.string().max(24).optional(),
    mis_a_jour: z.string().optional(),
    points: z.array(z.string().max(60)).max(3).optional(),
  }),
  z.object({
    ...sceneBase,
    type: z.literal("terminal"),
    titre: z.string().max(40).optional(),
    lignes: z
      .array(
        z.object({
          type: z.enum(["cmd", "sortie", "commentaire", "succes"]),
          texte: z.string().max(70),
          sur_mot: z.string().optional(),
        }),
      )
      .min(1)
      .max(9),
  }),
  z.object({
    ...sceneBase,
    type: z.literal("code"),
    fichier: z.string().max(40).optional(),
    langage: z.string().max(16).default("text"),
    code: z.string().max(900),
    surligner: z.array(z.number().int().positive()).max(4).optional(),
  }),
  z.object({
    ...sceneBase,
    type: z.literal("etapes"),
    titre: z.string().max(50).optional(),
    etapes: z
      .array(
        z.object({ titre: z.string().max(40), detail: z.string().max(70).optional(), icone: Icone, sur_mot: z.string().optional() }),
      )
      .min(2)
      .max(4),
  }),
  z.object({
    ...sceneBase,
    type: z.literal("liste"),
    titre: z.string().max(50).optional(),
    items: z
      .array(
        z.object({
          texte: z.string().max(60),
          icone: Icone,
          etat: z.enum(["ok", "non", "neutre"]).optional(),
          sur_mot: z.string().optional(),
        }),
      )
      .min(2)
      .max(5),
  }),
  z.object({
    ...sceneBase,
    type: z.literal("comparaison"),
    titre: z.string().max(50).optional(),
    gauche: z.object({ nom: z.string().max(24), points: z.array(z.string().max(40)).min(1).max(4) }),
    droite: z.object({ nom: z.string().max(24), points: z.array(z.string().max(40)).min(1).max(4) }),
  }),
  z.object({
    ...sceneBase,
    type: z.literal("chiffre"),
    valeur: z.number(),
    decimales: z.number().int().min(0).max(2).default(0),
    prefixe: z.string().max(4).optional(),
    suffixe: z.string().max(12).optional(),
    legende: z.string().max(70),
  }),
  z.object({
    ...sceneBase,
    type: z.literal("citation"),
    texte: z.string().max(220),
    auteur: z.string().max(60),
  }),
  z.object({
    ...sceneBase,
    type: z.literal("capture"),
    /** Fichier image dans le dossier de l'épisode (assets/…), produit par `fm capture`. */
    image: z.string(),
    legende: z.string().max(70).optional(),
    zoom: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1), echelle: z.number().min(1).max(3) }).optional(),
    surlignage: z
      .object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1), l: z.number().min(0).max(1), h: z.number().min(0).max(1) })
      .optional(),
  }),
  z.object({
    ...sceneBase,
    type: z.literal("cta"),
    titre: z.string().max(50),
    sous_titre: z.string().max(70).optional(),
    action: z.enum(["abonne", "commente", "partage", "enregistre"]).default("abonne"),
  }),
]);

export const AssetSchema = z.object({
  fichier: z.string(),
  /** Origine : généré par nos outils, capture d'écran d'une page publique, fichier sous licence fournie… */
  origine: z.enum(["genere", "capture", "licence"]),
  url: z.string().optional(),
  licence: z.string().optional(),
  note: z.string().optional(),
});

export const EpisodeSchema = z
  .object({
    version: z.literal(1),
    id: z.string().regex(/^\d{4}-\d{2}-\d{2}-[123]-[a-z0-9-]{3,60}$/, "format AAAA-MM-JJ-<1|2|3>-slug"),
    creneau: z.enum(CRENEAUX),
    /** Date/heure de publication prévue (ISO avec fuseau, ex. 2026-11-14T09:00:00+01:00). */
    publication_prevue: z.string(),
    format: z.enum(FORMATS),
    sujet: z.string().min(5),
    angle: z.string().min(10),
    /** Le hook des 2 premières secondes (doit ouvrir la voix de la première scène). */
    accroche: z.string().min(5).max(140),
    sources: z.array(SourceSchema).min(1),
    affirmations: z.array(AffirmationSchema),
    scenes: z.array(SceneSchema).min(3).max(14),
    assets: z.array(AssetSchema).default([]),
    publication: z.object({
      titre: z.string().min(10).max(95),
      description_youtube: z.string().max(4800),
      description_tiktok: z.string().max(2000),
      hashtags: z.array(z.string().regex(/^#[\p{L}\p{N}_]+$/u)).min(2).max(8),
      tags_youtube: z.array(z.string().max(30)).max(15).default([]),
    }),
    statut: z.enum(STATUTS).default("brouillon"),
    /** État de diffusion, rempli uniquement à partir des réponses des API (jamais supposé). */
    diffusion: z
      .object({
        revue: z.object({ issue: z.number().optional(), url: z.string().optional(), release: z.string().optional() }).optional(),
        youtube: z
          .object({
            id: z.string(),
            url: z.string(),
            statut: z.enum(["prive_revue", "programme", "public", "supprime", "erreur"]),
            programme_pour: z.string().optional(),
            verifie_le: z.string().optional(),
            erreur: z.string().optional(),
          })
          .optional(),
        tiktok: z
          .object({
            publish_id: z.string(),
            mode: z.enum(["brouillon", "direct"]),
            statut: z.string(),
            post_id: z.string().optional(),
            verifie_le: z.string().optional(),
            erreur: z.string().optional(),
          })
          .optional(),
      })
      .default({}),
    journal: z
      .array(z.object({ date: z.string(), etape: z.string(), message: z.string() }))
      .default([]),
  })
  .superRefine((ep, ctx) => {
    const ids = new Set(ep.sources.map((s) => s.id));
    for (const a of ep.affirmations) {
      if (!ids.has(a.source)) ctx.addIssue({ code: "custom", message: `affirmation ${a.id} : source inconnue ${a.source}` });
    }
    for (const sc of ep.scenes) {
      for (const s of sc.sources ?? []) {
        if (!ids.has(s)) ctx.addIssue({ code: "custom", message: `scène ${sc.id} : source inconnue ${s}` });
      }
    }
    const first = ep.scenes[0];
    if (first.type !== "accroche") ctx.addIssue({ code: "custom", message: "la première scène doit être de type 'accroche'" });
    const last = ep.scenes[ep.scenes.length - 1];
    if (last.type !== "cta") ctx.addIssue({ code: "custom", message: "la dernière scène doit être de type 'cta'" });
    const norm = (t: string) => t.replace(/\*/g, "").replace(/\s+/g, " ").trim().toLowerCase();
    if (!norm(first.voix).startsWith(norm(ep.accroche).slice(0, 25))) {
      ctx.addIssue({ code: "custom", message: "l'accroche doit correspondre au début de la voix de la première scène" });
    }
    const seen = new Set<string>();
    for (const sc of ep.scenes) {
      if (seen.has(sc.id)) ctx.addIssue({ code: "custom", message: `id de scène dupliqué : ${sc.id}` });
      seen.add(sc.id);
    }
  });

export type Episode = z.infer<typeof EpisodeSchema>;
export type Scene = z.infer<typeof SceneSchema>;
export type SceneType = Scene["type"];
export type Source = z.infer<typeof SourceSchema>;
export type Affirmation = z.infer<typeof AffirmationSchema>;
export type TempsFort = z.infer<typeof TempsFortSchema>;
export type Format = (typeof FORMATS)[number];
export type Son = (typeof SONS)[number];

/** Texte complet de la narration (sans astérisques), tel qu'envoyé à la synthèse vocale. */
export function narration(ep: Pick<Episode, "scenes">): string {
  return ep.scenes.map((s) => s.voix.replace(/\*/g, "").trim()).join(" ");
}
