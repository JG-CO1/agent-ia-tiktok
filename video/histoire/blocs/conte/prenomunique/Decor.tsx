/**
 * « Dans cette ville, tout le monde s'appelle Alex… » — décor dynamique : étiquettes ALEX / NOÉ sur chaque poitrine,
 * foule en phase, trente élèves dont les têtes se tournent d'un bloc, compteur à diodes de la mairie, nuit sodium,
 * hall glacé de cabines de verre (brume au sol, néons, faisceaux), sosie qui ouvre les yeux, plaque « NOÉ » qui s'allume,
 * reflet de Noé dans la vitre, buée. Seul le lieu où se trouve la caméra est dessiné (lieux à plus de 400 unités).
 */
import React, { useMemo } from "react";
import * as THREE from "three";
import type { V3 } from "../../geo";
import { Avatar, Bloc, HANCHE, type Pose, type Tenue, type Teinte } from "../../avatar";
import { halo, type Emotion } from "../../textures";
import { Ciel, Faisceau, Lueur, Ombre, Tache, Zone, visibles, type DonneesConte, type EtatConte } from "../lib";
import { entre, lisse, mel } from "../../maths";
import { texCompteur, texEnseigne, texEtiquette, texPlaque, texTableau, type VarianteTableau } from "./toile";
import { poseCrie, poseDormeur, poseEleve, poseEleveRaide, poseGele, poseMains, poseMange } from "./poses";
import { poseDebout } from "../../avatar";
import { BOUL, BOUT, CABINES, CAB_SOSIE, CAB_VOISIN, CLASSE, CLASSE_DIM, COUR, LAMPES, MAIRIE_Z, MAISONS, NUIT, PORTE_MAIRIE, SIEGES, SIEGE_NOE, SIEGE_VOISIN, SIGNE, SOUS, TABLEAU, TABLES_COUR, construirePrenomunique, FENETRE_X, occupant } from "./monde";
import { T_MAITRESSE, T_NOE, T_PROF, echelleAlex, nomDe, tenueAlex } from "./histoire";

export const cielPrenomunique = (e?: EtatConte) => e?.ciel ?? "#5BB8F5";

type Lieu = "ville" | "nuit" | "classe" | "cour" | "sous";
export const lieuDe = (p: V3): Lieu => (p[2] > 1000 ? "sous" : p[2] > 300 ? "nuit" : p[0] < -250 ? "classe" : p[0] > 250 ? "cour" : "ville");
const addV = (o: V3, p: V3): V3 => [o[0] + p[0], o[1] + p[1], o[2] + p[2]];

const TEINTE_ZONE: Record<Lieu, Teinte> = {
  ville: [1.32, 1.3, 1.24],
  nuit: [0.1, 0.14, 0.34],
  classe: [1.12, 1.1, 1.03],
  cour: [1.3, 1.28, 1.22],
  sous: [0.95, 1.04, 1.1],
};
const TEINTE_ACTEUR: Record<Lieu, Teinte> = {
  ville: [1.18, 1.16, 1.08],
  nuit: [0.42, 0.5, 0.88],
  classe: [1.08, 1.06, 1.0],
  cour: [1.16, 1.14, 1.06],
  sous: [0.92, 1.04, 1.1],
};

// ------------------------------------------------------------------ Personnage « lite » : tout ce qu'il faut pour le dessiner
export type Lite = { id: string; p: V3; ry: number; pose: Pose; emotion: Emotion; tenue: Tenue; echelle: number; rx?: number; opacite?: number; graine?: number; sansClin?: boolean; nom?: string; meches?: boolean; sash?: boolean };

const Perso: React.FC<{ l: Lite; frame: number; t: Teinte }> = ({ l, frame, t }) => {
  const tex = l.nom ? texEtiquette(l.nom) : null;
  const gris = Math.min(1, (t[0] + t[1] + t[2]) / 3 + 0.22);
  const encre = useMemo(() => new THREE.Color().setRGB(gris, gris, gris), [gris]);
  const [lacet, tang] = l.pose.tete ?? [0, 0];
  return (
    <Avatar p={l.p} ry={l.ry} pose={l.pose} tenue={l.tenue} emotion={l.emotion} frame={frame} graine={l.graine ?? 0} teinte={t} echelle={l.echelle} sansClin={l.sansClin} rx={l.rx ?? 0} opacite={l.opacite ?? 1}>
      <group position={[0, HANCHE + (l.pose.y ?? 0), 0]} rotation={[l.pose.torse ?? 0, 0, 0]}>
        {l.sash && (
          <group position={[0, 0.5, 0.255]} rotation={[0, 0, 0.62]}>
            {(["#2442C8", "#FFFFFF", "#E03232"] as const).map((c, i) => (
              <Bloc key={c} p={[(i - 1) * 0.075, 0, 0]} s={[0.075, 1.2, 0.03]} c={c} t={t} />
            ))}
          </group>
        )}
        {tex && (
          <mesh position={[0, 0.66, 0.278]}>
            <planeGeometry args={[0.62, 0.245]} />
            <meshBasicMaterial map={tex} color={encre} transparent opacity={l.opacite ?? 1} depthWrite={false} />
          </mesh>
        )}
        {l.meches && (
          <group position={[0, 1.0, 0]} rotation={[tang, lacet, 0, "YXZ"]}>
            <Bloc p={[-0.27, 0.98, 0.08]} s={[0.24, 0.3, 0.28]} c="#E8702A" t={t} r={[0.2, 0, 0.45]} />
            <Bloc p={[0.02, 1.08, 0.14]} s={[0.22, 0.32, 0.26]} c="#F08030" t={t} r={[0.15, 0, -0.1]} />
            <Bloc p={[0.28, 1.0, 0.02]} s={[0.24, 0.28, 0.28]} c="#E8702A" t={t} r={[0, 0.3, -0.5]} />
            <Bloc p={[-0.08, 1.0, -0.3]} s={[0.3, 0.26, 0.24]} c="#D4561C" t={t} r={[-0.3, 0, 0.2]} />
            <Bloc p={[0.38, 0.72, 0.36]} s={[0.2, 0.26, 0.1]} c="#E8702A" t={t} r={[0, 0, -0.5]} />
          </group>
        )}
      </group>
    </Avatar>
  );
};

/** Personnage lointain : quatre blocs et la pastille blanche de l'étiquette. */
const Sil: React.FC<{ l: Lite; t: Teinte }> = ({ l, t }) => {
  const dy = l.pose.y ?? 0;
  return (
    <group position={l.p} rotation={[l.rx ?? 0, l.ry, 0, "YXZ"]} scale={l.echelle}>
      <Bloc p={[0, 0.5, 0]} s={[0.7, 1.0, 0.4]} c={l.tenue.bas} t={t} />
      <Bloc p={[0, 1.45 + dy, 0]} s={[0.92, 1.0, 0.46]} c={l.tenue.haut} t={t} />
      {l.nom && <Bloc p={[0, 1.62 + dy, 0.25]} s={[0.56, 0.24, 0.05]} c={l.nom === "ALEX" ? "#FFFFFF" : "#CFE0FF"} t={t} />}
      <Bloc p={[0, 2.35 + dy, 0]} s={[0.8, 0.8, 0.8]} c={l.tenue.peau} t={t} />
      <Bloc p={[0, 2.8 + dy, -0.02]} s={[0.88, 0.22, 0.88]} c={l.tenue.cheveux} t={t} />
    </group>
  );
};

/** Dessine une liste de personnages : les plus proches en détail, les autres en silhouette ; ombres dures courtes. */
const Gens: React.FC<{ liste: Lite[]; cam: V3; frame: number; t: Teinte; nbDetail?: number; ombres?: boolean; opaciteOmbre?: number }> = ({ liste, cam, frame, t, nbDetail = 16, ombres = true, opaciteOmbre = 0.5 }) => {
  const tri = liste
    .map((l) => ({ l, d: Math.hypot(l.p[0] - cam[0], l.p[1] - cam[1], l.p[2] - cam[2]) }))
    .sort((a, b) => a.d - b.d);
  return (
    <>
      {tri.map(({ l, d }, i) => (
        <group key={l.id}>
          {i < nbDetail ? <Perso l={l} frame={frame} t={t} /> : <Sil l={l} t={t} />}
          {ombres && d < 120 && (l.rx ?? 0) === 0 && (l.opacite ?? 1) > 0.6 && <Ombre x={l.p[0]} z={l.p[2]} y={l.p[1] + 0.09} r={0.7 * l.echelle} o={opaciteOmbre} etire={1.2} />}
        </group>
      ))}
    </>
  );
};

/** Halo qui ignore le brouillard (balises lumineuses vues de loin). */
const Phare: React.FC<{ p: V3; s: number; c: string; o: number }> = ({ p, s, c, o }) => (
  <sprite position={p} scale={[s, s, 1]} renderOrder={5}>
    <spriteMaterial map={halo()} color={c} transparent opacity={o} depthWrite={false} fog={false} />
  </sprite>
);

/** Plan texturé (enseigne, plaque, tableau) tourné autour de Y. */
const Plan: React.FC<{ p: V3; w: number; h: number; tex: THREE.Texture; ry?: number; clair?: boolean; o?: number }> = ({ p, w, h, tex, ry = 0, clair = false, o = 1 }) => (
  <mesh position={p} rotation={[0, ry, 0]} renderOrder={2}>
    <planeGeometry args={[w, h]} />
    <meshBasicMaterial map={tex} transparent={o < 1} opacity={o} toneMapped={false} color={clair ? "#FFFFFF" : "#FFFFFF"} />
  </mesh>
);

/** Panneau à diodes : une texture mémorisée par valeur affichée. */
const Compteur: React.FC<{ p: V3; w: number; h: number; n: number; flash: number }> = ({ p, w, h, n, flash }) => (
  <>
    <mesh position={p} renderOrder={2}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={texCompteur(n)} toneMapped={false} />
    </mesh>
    <Lueur p={[p[0], p[1], p[2] + 1.2]} s={24} c="#FFB52E" o={0.28 + flash * 0.4} />
  </>
);

// ------------------------------------------------------------------ Salle de classe : les élèves (calculés à la main, à l'instant T)
const tourne = (T: number, ev: Record<string, number>) => lisse(entre(T, ev.tourne, ev.tourne + 0.2)) * (1 - lisse(entre(T, ev.retour, ev.retour + 0.35)));
function eleves(T: number, ev: Record<string, number>): Lite[] {
  const out: Lite[] = [];
  const turn = tourne(T, ev);
  const noeTurn = lisse(entre(T, ev.noeTourne, ev.noeTourne + 0.5)) * (1 - lisse(entre(T, ev.retour, ev.retour + 0.4)));
  SIEGES.forEach(([x, z], k) => {
    const noe = k === SIEGE_NOE;
    const voisin = k === SIEGE_VOISIN;
    if (voisin && T > ev.voisinDisp) return;
    const cherche = noe ? -0.95 * lisse(entre(T, ev.voisinDisp + 0.1, ev.voisinDisp + 0.7)) * (1 - lisse(entre(T, ev.maitDisp + 0.4, ev.maitDisp + 0.9))) : 0;
    const cherche2 = noe ? Math.PI * 0.9 * lisse(entre(T, ev.noeChercheA, ev.noeChercheA + 0.5)) * (1 - lisse(entre(T, ev.noeChercheB, ev.noeChercheB + 0.5))) : 0;
    const lacet = noe ? Math.PI * 0.93 * noeTurn + cherche + cherche2 : Math.PI * 0.95 * turn;
    const tang = mel(0.3, 0.02, Math.max(turn, noe ? Math.max(noeTurn, cherche2 / (Math.PI * 0.9)) : 0));
    const pose = poseEleveRaide(T, lacet, k);
    pose.tete = [lacet, tang];
    // la tête qui se baisse sur le pupitre quand la classe travaille
    const emo: Emotion = noe ? (noeTurn > 0.5 ? "effraye" : "inquiet") : turn > 0.5 ? "vide" : "neutre";
    out.push({ id: `e${k}`, p: addV(CLASSE, [x, 0, z]), ry: Math.PI, pose, emotion: emo, tenue: noe ? T_NOE : tenueAlex(k), echelle: noe ? 0.88 : 0.85 + (k % 3) * 0.01, graine: 0, sansClin: !noe, nom: noe ? "NOÉ" : "ALEX", meches: noe });
  });
  return out;
}
/** Le professeur : au tableau d'abord, puis au fond de la classe quand il crie « Alex ! ». */
function profClasse(T: number, ev: Record<string, number>): Lite {
  const fond = T >= ev.cri - 0.9;
  const crie = T >= ev.cri && T < ev.cri + 0.55;
  return {
    id: "prof",
    p: addV(CLASSE, fond ? [T < ev.cri + 0.9 ? 0 : -3.4, 0, 5.5] : [-1.0, 0.24, -CLASSE_DIM.D + 1.5]),
    ry: fond ? Math.PI : -0.6,
    pose: fond ? (crie ? poseCrie(T) : poseDebout(T, 0.4)) : poseDebout(T, 0.4),
    emotion: fond ? (crie ? "surpris" : "colere") : "neutre",
    tenue: T_PROF,
    echelle: 1.1,
    nom: "ALEX",
    graine: 1.3,
  };
}
const maitresse = (T: number, ev: Record<string, number>): Lite | null =>
  T < ev.maitDisp + 0.25 && T > ev.maitDisp - 1.4
    ? { id: "maitresse", p: addV(CLASSE, [2.4, 0.24, -CLASSE_DIM.D + 1.6]), ry: 0.2, pose: poseDebout(T, 0.9), emotion: "neutre", tenue: T_MAITRESSE, echelle: 1.02, nom: "ALEX", graine: 0.9, opacite: T < ev.maitDisp ? 1 : 1 - (T - ev.maitDisp) / 0.25 }
    : null;

// ------------------------------------------------------------------ Cour : trois rangées d'Alex qui mangent en cadence ; Noé, seul
function cantine(T: number): Lite[] {
  const out: Lite[] = [];
  let n = 0;
  for (const zt of TABLES_COUR) {
    for (const xt of [-9.5, 9.5]) {
      for (const s of [-1, 1]) {
        for (let i = 0; i < 5; i++) {
          const k = n++;
          out.push({ id: `c${k}`, p: addV(COUR, [xt + (i - 2) * 2.5, 0, zt + s * 1.55]), ry: s > 0 ? Math.PI : 0, pose: poseMange(T), emotion: "vide", tenue: tenueAlex(k), echelle: 0.85 + (k % 3) * 0.01, graine: 0, sansClin: true, nom: "ALEX" });
        }
      }
    }
  }
  out.push({ id: "profC", p: addV(COUR, [0.4, 0, -17.2]), ry: 0, pose: poseDebout(T, 0.4), emotion: "neutre", tenue: T_PROF, echelle: 1.1, nom: "ALEX", graine: 1.3 });
  out.push({ id: "noeC", p: addV(COUR, [-14.5, 0, 4.05]), ry: 0, pose: { ...poseEleve(T, 0, 0.18), tete: [Math.sin(T * 0.6) * 0.35, 0.12] }, emotion: "inquiet", tenue: T_NOE, echelle: 0.88, nom: "NOÉ", meches: true });
  return out;
}

// ------------------------------------------------------------------ Sous-sol : occupants des cabines, plaques, brume
const ES = 0.98;
function occupants(T: number, ev: Record<string, number>): Lite[] {
  const out: Lite[] = [];
  CABINES.forEach((c, i) => {
    const sosie = i === CAB_SOSIE;
    const p = addV(SOUS, occupant(c));
    const reveille = sosie ? lisse(entre(T, ev.reveil, ev.reveil + 0.7)) : 0;
    const base = poseDormeur(T, i * 0.7);
    const pose: Pose = sosie ? { ...base, tete: [Math.sin(T * 3) * 0.12 * reveille, 0.2 * (1 - reveille)], brasD: { ...base.brasD, x: base.brasD.x - 0.35 * reveille } } : base;
    const k = sosie ? CAB_VOISIN : i; // le sosie est EXACTEMENT identique au voisin (mêmes cheveux, même taille)
    out.push({ id: `o${i}`, p, ry: c.ry, pose, emotion: sosie && T >= ev.reveil ? "vide" : "dort", tenue: tenueAlex(k), echelle: ES * (echelleAlex(k) / 1), graine: i, sansClin: true, nom: "ALEX" });
  });
  // le vrai Noé, endormi dans la dernière cabine (même visage, même coiffure, même t-shirt que Noé)
  out.push({ id: "noeDort", p: addV(SOUS, [BOUT[0], 0.55, BOUT[2] + 0.3]), ry: 0, pose: poseDormeur(T, 0.3), emotion: "dort", tenue: T_NOE, echelle: 0.9, sansClin: true, nom: "NOÉ", meches: true });
  return out;
}

const Brume: React.FC<{ T: number; cam: V3 }> = ({ T, cam }) => {
  const nuages: React.ReactNode[] = [];
  for (let z = 14; z > -112; z -= 9) {
    if (Math.abs(SOUS[2] + z - cam[2]) > 110) continue;
    const k = Math.round(z);
    nuages.push(<Tache key={`t${k}`} p={[Math.sin(T * 0.25 + k) * 1.2, 0.35 + (k % 2) * 0.1, SOUS[2] + z]} s={[17, 15]} c="#D6F8FF" o={0.2} />);
    if (z > -90) nuages.push(<Lueur key={`l${k}`} p={[Math.sin(T * 0.2 + k * 0.7) * 3, 1.4, SOUS[2] + z - 3]} s={17} c="#C8F4FF" o={0.08} />);
  }
  return <>{nuages}</>;
};

// ------------------------------------------------------------------ Le monde
export const MondePrenomunique: React.FC<{ e: EtatConte; frame: number; data: DonneesConte }> = ({ e, frame, data }) => {
  const zones = useMemo(() => construirePrenomunique(), []);
  const T = frame / 30;
  const cam = e.cam.pos;
  const lieu = lieuDe(cam);
  const ev = data.ev;
  const tz = TEINTE_ZONE[lieu];
  const ta = TEINTE_ACTEUR[lieu];

  // ---- habitants (marcheurs, formation, nuit, hall) : toujours filtrés par distance et par instant de présence
  const masque = (id: string): boolean => {
    if (id.startsWith("m") && id !== "maireV" && id !== "maireN" && id !== "maireSS" && id !== "maire2") return T > 9.6; // la foule en marche ne sort que dans la scène 1
    if (id === "maireN") return T > ev.maireDoor + 0.45;
    if (id === "noeN") return T > ev.maireDoor + 1.0;
    if (id === "maireSS") return T > ev.surprend - 3.6;
    if (id === "noeSS") return T > ev.maireDoor + 4.0;
    if (id === "noeV") return T > 9.6;
    if (id === "noeFond") return T < ev.copie0;
    return false;
  };
  const liste = visibles(data, T, cam, 150).filter((v) => !masque(v.id));
  const lites: Lite[] = liste.map(({ id, a }) => ({
    id,
    p: a.p,
    ry: a.ry,
    pose: a.pose,
    emotion: a.emotion,
    tenue: a.tenue,
    echelle: a.echelle,
    rx: a.rx,
    graine: a.graine,
    sansClin: a.sansClin,
    nom: nomDe(id),
    meches: id.startsWith("noe"),
    sash: id.startsWith("maire"),
  }));

  // =================================================================== CLASSE
  if (lieu === "classe") {
    const els = eleves(T, { ...ev, retour: ev.retour });
    const gens: Lite[] = [...els, profClasse(T, ev)];
    const m = maitresse(T, ev);
    if (m) gens.push(m);
    const variante: VarianteTableau = T < ev.mardi ? "maths" : T < ev.jeudi ? "mardi" : "jeudi";
    return (
      <>
        <group position={cam}>
          <Ciel etoiles={false} />
        </group>
        <Zone g={zones.classe} t={tz} />
        <Plan p={addV(CLASSE, TABLEAU.p)} w={TABLEAU.w} h={TABLEAU.h} tex={texTableau(variante)} />
        {[-4.2, 0, 4.2].map((z) => (
          <group key={z}>
            <Faisceau p={addV(CLASSE, [CLASSE_DIM.W - 0.4, 3.6, z])} dir={[-0.8, -0.55, 0.25]} long={9} rayon={1.9} c="#FFE9A0" o={0.06} />
            <Lueur p={addV(CLASSE, [CLASSE_DIM.W - 0.8, 2.9, z])} s={7} c="#FFF0B0" o={0.35} />
          </group>
        ))}
        <Gens liste={gens} cam={cam} frame={frame} t={ta} nbDetail={36} ombres opaciteOmbre={0.35} />
      </>
    );
  }

  // =================================================================== COUR
  if (lieu === "cour") {
    const gens = cantine(T);
    return (
      <>
        <group position={cam}>
          <Phare p={[-60, 150, -300]} s={120} c="#FFF6C8" o={0.9} />
        </group>
        <Zone g={zones.cour} t={tz} />
        <Gens liste={gens} cam={cam} frame={frame} t={ta} nbDetail={22} ombres opaciteOmbre={0.5} />
      </>
    );
  }

  // =================================================================== SOUS-SOL
  if (lieu === "sous") {
    const occ = occupants(T, ev);
    const gens: Lite[] = [...occ, ...lites];
    // reflet de Noé dans la vitre de la dernière cabine (symétrie par rapport au plan de la vitre)
    const vitreZ = SOUS[2] + BOUT[2] + 2.0;
    const noeF = lites.find((l) => l.id === "noeFond");
    // Noé, de face (il vient de voir son propre visage) : figé, puis les mains devant les yeux, puis il regarde son t-shirt
    if (T >= ev.visage && T < ev.copie0) {
      const regardeTShirt = T >= ev.prenom - 0.06;
      const pose: Pose = T < ev.mains ? poseGele(T) : regardeTShirt ? { ...poseDebout(T, 0.2), tete: [0, 0.62], torse: 0.12 } : poseMains(T, 0.2);
      gens.push({ id: "noeFace", p: addV(SOUS, [-1.2, 0.55, -100.6]), ry: 0, pose, emotion: regardeTShirt ? "surpris" : "effraye", tenue: T_NOE, echelle: 0.9, nom: "NOÉ", meches: true, sansClin: true });
    }
    const reflet: Lite | null = noeF ? { ...noeF, id: "reflet", p: [noeF.p[0], noeF.p[1], 2 * vitreZ - noeF.p[2]], ry: Math.PI - noeF.ry, opacite: 0.5, nom: undefined, meches: true } : null;
    const lueur = lisse(entre(T, ev.plaque, ev.plaque + 0.35));
    const buee = lisse(entre(T, ev.prenom, ev.prenom + 3.5)) * (0.55 + 0.1 * Math.sin(T * 1.8));
    const rev = T >= ev.reveil;
    const givre = 1 - lisse(entre(T, ev.givre0, ev.givre1));
    const sosieP = addV(SOUS, occupant(CABINES[CAB_SOSIE]));
    const cz = cam[2];
    return (
      <>
        <group position={[0, 0, 0]}>
          <Zone g={zones.sous} t={tz} />
          <mesh geometry={zones.verre} renderOrder={6}>
            <meshBasicMaterial vertexColors transparent opacity={0.17} depthWrite={false} side={THREE.DoubleSide} color={new THREE.Color().setRGB(tz[0], tz[1], tz[2])} />
          </mesh>
        </group>
        {/* plaques : « ALEX » sur chaque cabine ; la dernière reste éteinte jusqu'à ce que le nom soit dit */}
        {CABINES.map((c, i) => (
          <group key={i} position={addV(SOUS, c.p)} rotation={[0, c.ry, 0]}>
            <Plan p={[0, 4.5, 0.09]} w={2.9} h={0.68} tex={texPlaque("ALEX")} />
            {i === CAB_SOSIE ? (
              <>
                <Lueur p={[1.1, 3.98, 0.4]} s={rev ? 2.6 + Math.sin(T * 14) * 0.4 : 0.1} c="#FF3B2E" o={rev ? 0.9 : 0} />
              </>
            ) : null}
          </group>
        ))}
        <group position={[BOUT[0], 0, SOUS[2] + BOUT[2] + 2.0]}>
          <Plan p={[0, 4.5, 0.09]} w={3.1} h={0.76} tex={texPlaque("NOÉ", true)} o={lueur} />
          <mesh position={[0, 4.5, 0.085]}>
            <planeGeometry args={[3.1, 0.76]} />
            <meshBasicMaterial color="#12303C" transparent opacity={1 - lueur} depthWrite={false} />
          </mesh>
          {lueur > 0.01 && <Lueur p={[0, 4.5, 0.6]} s={5 + 2 * (1 - lueur)} c="#FFD25A" o={0.3 * lueur} />}
          {/* givre : la vitre est opaque jusqu'à « Dedans, un garçon dormait » */}
          {givre > 0.01 && (
            <mesh position={[0, 2.2, 0.08]} renderOrder={8}>
              <planeGeometry args={[3.55, 3.4]} />
              <meshBasicMaterial color="#F4E7B8" transparent opacity={0.97 * givre} depthWrite={false} />
            </mesh>
          )}
          {/* buée sur la vitre : quelqu'un respire derrière */}
          {buee > 0.01 && (
            <mesh position={[0, 2.2, 0.06]} renderOrder={8}>
              <planeGeometry args={[3.3, 3.2]} />
              <meshBasicMaterial map={halo()} color="#EAFBFF" transparent opacity={buee * 0.5} depthWrite={false} />
            </mesh>
          )}
        </group>
        {/* lumière froide : faisceaux des plafonniers, balise de la dernière cabine, brume au sol */}
                {cz - (SOUS[2] + BOUT[2] + 4) > 14 && <Phare p={addV(SOUS, [0, 3.2, BOUT[2] + 4])} s={22} c="#FFD98A" o={0.2} />}
        {cz - (SOUS[2] + BOUT[2] + 5.4) > 10 && <Lueur p={addV(SOUS, [0, 2.4, BOUT[2] + 5.4])} s={8} c="#FFE9A6" o={0.1 + 0.15 * lueur} />}
        <Phare p={addV(SOUS, [0, 5.4, 25])} s={14} c="#FFB44A" o={0.7} />
        <Brume T={T} cam={cam} />
        {/* le sosie s'éveille : éclat froid sur son visage */}
        {rev && T < ev.reveil + 1.4 && <Lueur p={[sosieP[0] + 2.6, sosieP[1] + 1.4, sosieP[2]]} s={4} c="#D8FBFF" o={0.25 * (1 - (T - ev.reveil) / 1.4)} />}
        <Gens liste={gens} cam={cam} frame={frame} t={ta} nbDetail={14} ombres={false} />
        {reflet && T > ev.plaque - 9 && <Perso l={reflet} frame={frame} t={[0.7, 1.0, 1.15]} />}
      </>
    );
  }

  // =================================================================== VILLE (jour ou nuit : la même ville)
  const nuit = lieu === "nuit";
  const dec: V3 = nuit ? NUIT : [0, 0, 0];
  const compteur = Math.round(144 * lisse(entre(T, ev.compte0, ev.compte1)));
  const nCompte = T < ev.compte0 ? 144 : compteur;
  const flashC = Math.max(0, 1 - entre(T, ev.compte1, ev.compte1 + 0.6)) * (T >= ev.compte1 ? 1 : 0);
  const lamps = LAMPES.filter((p) => Math.hypot(p[0] - (cam[0] - dec[0]), p[2] - (cam[2] - dec[2])) < 140);
  return (
    <>
      <group position={cam}>
        {nuit ? <Ciel lune={[-70, 140, -300]} rayonLune={26} /> : <Phare p={[-50, 170, -300]} s={150} c="#FFF6C8" o={0.85} />}
      </group>
      <group position={dec}>
        <Zone g={zones.ville} t={tz} />
        {/* panneaux et enseignes (toujours lisibles) */}
        <Plan p={[0, 9.2, 22.38]} w={14} h={1.75} tex={texEnseigne("BIENVENUE À ALEXVILLE", "#18C2B3", "#FFFFFF", 1024, 128)} />
        <Plan p={[0, 16.9, MAIRIE_Z + 6.8]} w={9} h={2.3} tex={texEnseigne("MAIRIE", "#18C2B3", "#FFFFFF", 512, 128)} />
        <group position={[BOUL.x, 0, BOUL.z]} rotation={[0, -Math.PI / 2, 0]}>
          <Plan p={[-1.6, 4.7, 0.1]} w={7.4} h={1.0} tex={texEnseigne("BOULANGERIE", "#F0A91C", "#FFFFFF", 1024, 140)} />
        </group>
        {!nuit && <Compteur p={SIGNE.p} w={SIGNE.w} h={SIGNE.h} n={nCompte} flash={flashC} />}
        {nuit && (
          <>
            <Compteur p={SIGNE.p} w={SIGNE.w} h={SIGNE.h} n={144} flash={0} />
            {/* fenêtres : toutes allumées à l'identique */}
            {MAISONS.map((md, i) => (
              <group key={i} position={md.p} rotation={[0, md.ry, 0]}>
                <mesh position={[FENETRE_X(md), 2.6, 0.085]}>
                  <planeGeometry args={[2.1, 1.7]} />
                  <meshBasicMaterial color="#FFC25A" fog={false} />
                </mesh>
              </group>
            ))}
            {/* la porte de la mairie s'ouvre : lumière chaude */}
            <mesh position={[0, 3.2, MAIRIE_Z + 0.55]}>
              <planeGeometry args={[5.2, 6.0]} />
              <meshBasicMaterial color="#FFC25A" transparent opacity={lisse(entre(T, ev.maireDoor - 0.1, ev.maireDoor + 0.2))} />
            </mesh>
            <Lueur p={[0, 3.6, MAIRIE_Z + 2.2]} s={16} c="#FFB44A" o={0.55 * lisse(entre(T, ev.maireDoor - 0.1, ev.maireDoor + 0.3))} />
            <Tache p={[0, 1.7, PORTE_MAIRIE[2] - 1.0]} s={[10, 12]} c="#FFB44A" o={0.5 * lisse(entre(T, ev.maireDoor - 0.1, ev.maireDoor + 0.3))} />
          </>
        )}
        {nuit &&
          lamps.map((p, i) => {
            const s = p[0] < 0 ? 1 : -1;
            return (
              <group key={i}>
                <Lueur p={[p[0] + s * 1.35, 5.6, p[2]]} s={10} c="#FFB454" o={0.75} />
                <Faisceau p={[p[0] + s * 1.35, 5.6, p[2]]} dir={[s * 0.15, -1, 0]} long={5.6} rayon={3.4} c="#FFB454" o={0.1} />
                <Tache p={[p[0] + s * 2.2, 0.16, p[2]]} s={[14, 14]} c="#FF9E3D" o={0.5} />
              </group>
            );
          })}
      </group>
      <Gens liste={lites} cam={cam} frame={frame} t={ta} nbDetail={nuit ? 10 : 22} ombres={!nuit} opaciteOmbre={0.55} />
    </>
  );
};
