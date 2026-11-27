/**
 * « Hamburger interdit » — décor dynamique : ciel de crépuscule rétro, néons qui clignotent, enseigne géante, panneaux barrés,
 * policiers et cloche, cuisine à quatre assiettes, grenier et rais de poussière, album et photo de Léa, effacement de Léa en blocs.
 * Seul le lieu où se trouve la caméra est dessiné (les lieux sont à ≥ 400 unités les uns des autres).
 */
import React, { useMemo } from "react";
import * as THREE from "three";
import type { V3 } from "../../geo";
import { Avatar, Bloc, type Teinte, type Tenue } from "../../avatar";
import { entre, lisse } from "../../maths";
import type { Acteur } from "../../ville/foule";
import { Faisceau, Lueur, OBJETS, Ombre, Tache, Zone, type DonneesConte, type EtatConte } from "../lib";
import {
  BANDEAUX_Z, BOUTIQUES, CUISINE, ECOLE, FEN_CUISINE, GEANTE, GRENIER, HAUT_LAMPE, HORLOGE, K_Z, LAMPE_CUISINE, LAMPES, NIVEAUX, PLAQUES, PORTANT, SALON, TABLE_BASSE, TABLE_POLICE, XF,
  gris, ryFacade, vm, zone, type Lieu,
} from "./monde";
import { Album, Bandeau, Burger, Cloche, CartableOuvert, EN_MAIN, Eclats, EnseigneGeante, FenetreDehors, Fourchette, HorlogeMur, Image, Manteau, MenuMural, NeonBoutique, Pancarte, PanneauEcole, PanneauRond, Papier, PhotoLea, Poussiere, Rais, Saisi, Suspension } from "./objets";
import { texPage } from "./toile";

export const cielHamburgerinterdit = (e?: EtatConte) => e?.ciel ?? "#2A1248";

const lieuDe = (p: V3): Lieu => (p[0] < -200 ? "cuisine" : p[0] > 200 ? "grenier" : p[2] > 200 ? "salon" : "rue");
type Ambiance = { niv: number; sepia: boolean };
function ambiance(lieu: Lieu, T: number, ev: Record<string, number>): Ambiance {
  if (lieu === "rue") return { niv: T >= ev.retour ? 3 : 0, sepia: false };
  if (lieu === "cuisine") {
    if (T >= ev.fb0 && T < ev.retour) return { niv: 2, sepia: true };
    return { niv: T >= ev.s4 ? 1 : 0, sepia: false };
  }
  if (lieu === "grenier") return { niv: T >= ev.s6 ? 2 : 0, sepia: false };
  return { niv: 2, sepia: false };
}
const TZ: Record<Lieu, Teinte> = { rue: [0.9, 0.84, 1.06], cuisine: [0.86, 0.78, 0.78], grenier: [1.0, 0.82, 0.6], salon: [1.0, 0.92, 0.82] };
const TA: Record<Lieu, Teinte> = { rue: [1.04, 0.98, 1.1], cuisine: [1.04, 0.98, 0.96], grenier: [1.06, 0.9, 0.72], salon: [1.04, 0.96, 0.88] };
const SEPIA_Z: Teinte = [1.18, 0.94, 0.68];
const SEPIA_A: Teinte = [1.22, 0.98, 0.74];
const NEUTRE_Z: Teinte = [0.92, 0.95, 1.02];
const NEUTRE_A: Teinte = [1.0, 1.0, 1.04];

// ------------------------------------------------------------------ Tenues décolorées / blanchies
const memoT = new WeakMap<Tenue, Map<string, Tenue>>();
function tenueFiltre(t: Tenue, cle: string, f: (h: string) => string): Tenue {
  let m = memoT.get(t);
  if (!m) memoT.set(t, (m = new Map()));
  let r = m.get(cle);
  if (!r) {
    r = { ...t };
    for (const k of Object.keys(t) as Array<keyof Tenue>) if (k !== "genre" && typeof t[k] === "string") (r as Record<string, string>)[k] = f(t[k] as string);
    m.set(cle, r);
  }
  return r;
}
const blanc = (h: string, w: number) => {
  const c = new THREE.Color(h);
  c.lerp(new THREE.Color("#FFFFFF"), w);
  return `#${c.getHexString()}`;
};
const relA = (a: Acteur, v: V3): V3 => {
  const e = a.echelle;
  return [a.p[0] + (v[0] * Math.cos(a.ry) + v[2] * Math.sin(a.ry)) * e, a.p[1] + v[1] * e, a.p[2] + (-v[0] * Math.sin(a.ry) + v[2] * Math.cos(a.ry)) * e];
};

// ------------------------------------------------------------------ Ciel de crépuscule rétro (dégradé violet → rose → orange)
const Crepuscule: React.FC<{ cam: V3; g: number }> = ({ cam, g }) => {
  const geo = useMemo(() => {
    const s = new THREE.SphereGeometry(700, 24, 16);
    const pos = s.getAttribute("position");
    const col = new Float32Array(pos.count * 3);
    const pal: Array<[number, string]> = [[-1, "#2B1650"], [-0.04, "#5A2E7A"], [0.0, "#FF8F7A"], [0.04, "#FF5C9A"], [0.2, "#A8409A"], [0.5, "#4A2488"], [1, "#1A0C3A"]];
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / 700;
      let k = 1;
      while (k < pal.length - 1 && y > pal[k][0]) k++;
      const a = pal[k - 1];
      const b = pal[k];
      const u = Math.min(1, Math.max(0, (y - a[0]) / (b[0] - a[0])));
      const c = new THREE.Color(gris(a[1], g)).lerp(new THREE.Color(gris(b[1], g)), u);
      col.set([c.r, c.g, c.b], i * 3);
    }
    s.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return s;
  }, [g]);
  return (
    <mesh geometry={geo} position={cam} renderOrder={-20}>
      <meshBasicMaterial vertexColors side={THREE.BackSide} depthWrite={false} fog={false} />
    </mesh>
  );
};

const RESTOS = new Set(["MILK BAR", "DINER", "CAFÉ", "GLACES", "HOT-DOGS", "PIZZA", "JUKEBOX"]);

// ------------------------------------------------------------------ RUE
const Rue: React.FC<{ T: number; cam: V3; niv: number; ev: Record<string, number>; data: DonneesConte }> = ({ T, cam, niv, ev }) => {
  const g = NIVEAUX[niv];
  const mort = niv === 3;
  const flick = (i: number) => (mort ? 0 : 0.8 + 0.2 * Math.sin(T * 6 + i * 2.1) * Math.sin(T * 1.7 + i));
  // enseigne géante : clignote au début, éteinte et grise dans le monde décoloré
  const etat: 0 | 1 | 2 = mort ? 2 : T < 1.4 && ((T > 0.36 && T < 0.46) || (T > 0.7 && T < 0.77) || (T > 1.02 && T < 1.06)) ? 0 : 1;
  const [tx, , tz] = TABLE_POLICE;
  const lampes = LAMPES.filter((l) => Math.hypot(l.p[0] - cam[0], l.p[2] - cam[2]) < 95);
  return (
    <>
      <Crepuscule cam={cam} g={g} />
      <Zone g={zone("rue", niv)} t={mort ? NEUTRE_Z : TZ.rue} />
      <EnseigneGeante p={GEANTE.p} w={GEANTE.w} h={GEANTE.h} etat={etat} luisant={etat === 1 ? 1 : 0} />
      {BANDEAUX_Z.map((z) => (
        <Bandeau key={z} z={z} g={mort} />
      ))}
      {BOUTIQUES.filter((b) => Math.abs(b.zc - cam[2]) < 80).map((b, i) => {
        const p = vm(b, [0, 6.1, 0.34]);
        return (
          <group key={b.nom}>
            <NeonBoutique p={p} ry={ryFacade(b.cote)} texte={b.nom} couleur={b.neon} w={Math.min(b.w * 0.62, 9)} h={1.25} luisant={flick(i)} g={mort} />
            {!mort && <Lueur p={vm(b, [b.fen[0][0], 2.6, 1.4])} s={9} c="#FFD9A0" o={0.3} />}
            {RESTOS.has(b.nom) && <Pancarte p={vm(b, [b.fen[0][0] + (b.nom === "DINER" ? 0 : 0.4), 2.7, 0.24])} ry={ryFacade(b.cote)} g={mort} s={b.nom === "DINER" ? 3.4 : 2.3} />}
          </group>
        );
      })}
      <MenuMural p={[-11.7, 2.55, 1.6]} ry={Math.PI / 2} g={mort} />
      {lampes.map((l) => {
        const [x, , z] = l.p;
        return (
          <group key={`${x}${z}`}>
            <Lueur p={[x, HAUT_LAMPE + 0.6, z]} s={mort ? 4 : 7.5} c={mort ? "#C8C8D0" : "#FFE2A0"} o={mort ? 0.25 : 0.6} />
            <Tache p={[x, 0.2, z]} s={[mort ? 9 : 13, mort ? 9 : 13]} c={mort ? "#C8C8D0" : "#FFD59A"} o={mort ? 0.14 : 0.34} />
            <Faisceau p={[x, HAUT_LAMPE + 0.3, z]} dir={[-l.cote * 0.2, -1, 0]} long={HAUT_LAMPE + 0.2} rayon={mort ? 3 : 4.2} c={mort ? "#C8C8D0" : "#FFC98A"} o={mort ? 0.03 : 0.07} />
            <PanneauRond p={[x - l.cote * 0.42, 5.3, z]} ry={-l.cote * (Math.PI / 2)} gris={mort} />
          </group>
        );
      })}
      {/* l'école : panneau, grille, pictogrammes, table des policiers, cartable, cloche */}
      <PanneauEcole p={[ECOLE.x0 - 0.3, 6.1, ECOLE.zc]} ry={-Math.PI / 2} g={mort} />
      {[-41, -35].map((z) => (
        <PanneauRond key={z} p={[XF - 0.2, 3.3, z]} ry={-Math.PI / 2} gris={mort} s={1.6} />
      ))}
      <CartableOuvert p={[tx, 1.9, tz - 0.9]} ry={-Math.PI / 2} burger={T < ev.sort} />
      {T >= ev.cloche - 0.2 && <Cloche p={[tx, 1.9 + 2.2 * (1 - lisse(entre(T, ev.cloche - 0.2, ev.cloche))), tz + 0.95]} />}
      {T >= ev.cloche && <Saisi p={[tx - 0.9, 1.9, tz + 0.95]} ry={-Math.PI / 2} />}
      {!mort && <Lueur p={[tx, 2.8, tz]} s={7} c="#FFE2B0" o={0.3} />}
    </>
  );
};

// ------------------------------------------------------------------ CUISINE
const Cuisine: React.FC<{ T: number; niv: number; sepia: boolean; ev: Record<string, number>; data: DonneesConte }> = ({ T, niv, sepia, ev, data }) => {
  const g = NIVEAUX[niv];
  const tz = sepia ? SEPIA_Z : TZ.cuisine;
  const mere = data.acteur("mere", T);
  const sur = T >= ev.assiettes - 0.4 && T < ev.assiettes + 6 && T >= ev.s4;
  return (
    <>
      <Zone g={zone("cuisine", niv)} t={tz} />
      <HorlogeMur p={HORLOGE} T={T} g={g} />
      <Suspension p={LAMPE_CUISINE} g={g} o={sepia ? 0.16 : 0.12} />
      <FenetreDehors p={[(FEN_CUISINE.x0 + FEN_CUISINE.x1) / 2, (FEN_CUISINE.y0 + FEN_CUISINE.y1) / 2, -K_Z - 0.14]} s={[FEN_CUISINE.x1 - FEN_CUISINE.x0, FEN_CUISINE.y1 - FEN_CUISINE.y0]} g={g} />
      <Tache p={[(FEN_CUISINE.x0 + FEN_CUISINE.x1) / 2, 0.12, -2.4]} s={[7, 5]} c={sepia ? "#FFC27A" : "#FF6FB5"} o={0.2} />
      {/* la mère pose ses couverts : fourchette et couteau sur son assiette */}
      {T >= ev.couverts && T < 1e9 && !(T >= ev.fb0) && mere && T < ev.entre + 0.1 && (
        <>
          <Fourchette p={[PLAQUES[0][0] - 0.92, PLAQUES[0][1] + 0.1, PLAQUES[0][2]]} r={[0, 0.1, 0]} />
          <Fourchette p={[PLAQUES[0][0] + 0.92, PLAQUES[0][1] + 0.1, PLAQUES[0][2]]} r={[0, -0.1, 0]} />
        </>
      )}
      {/* l'assiette de trop : un halo froid sur la quatrième place */}
      {sur && <Tache p={[PLAQUES[3][0], PLAQUES[3][1] + 0.05, PLAQUES[3][2]]} s={[2.6, 2.6]} c="#D8ECFF" o={0.28 + 0.06 * Math.sin(T * 3)} />}
      {sur && <Lueur p={[PLAQUES[3][0], PLAQUES[3][1] + 0.4, PLAQUES[3][2]]} s={2.6} c="#D8ECFF" o={0.16} />}
      {/* souvenir : le hamburger du petit garçon (croqué à partir de la morsure) */}
      {sepia && <BurgerSouvenir T={T} ev={ev} data={data} />}
    </>
  );
};
const BurgerSouvenir: React.FC<{ T: number; ev: Record<string, number>; data: DonneesConte }> = ({ T, ev, data }) => {
  const a = data.acteur("nFb", T);
  if (!a || T > ev.eff1) return null;
  const k = lisse(entre(T, ev.mord - 0.3, ev.mord));
  const p = relA(a, [0, mix(3.4, 3.62, k), mix(1.35, 0.62, k)]);
  return <Burger s={0.42} p={p} r={[mix(0, 0.5, k), a.ry, 0]} t={SEPIA_A} />;
};
/** Le burger du narrateur d'aujourd'hui : seul objet en couleurs ; il monte vers sa bouche quand il hésite. */
const BurgerFin: React.FC<{ T: number; ev: Record<string, number>; data: DonneesConte }> = ({ T, ev, data }) => {
  const a = data.acteur("nFin", T);
  if (!a) return null;
  const k = lisse(entre(T, ev.hesite - 0.4, ev.hesite + 1.5));
  const p = relA(a, [mix(-0.68, -0.3, k), mix(1.84, 2.02, k), mix(0.9, 0.78, k)]);
  return <Burger s={0.36} p={[p[0], p[1] + Math.sin(T * 1.3) * 0.01, p[2]]} r={[mix(0, 0.5, k), a.ry + 0.3, 0]} glow={0.45} />;
};
const mix = (a: number, b: number, k: number) => a + (b - a) * k;

// ------------------------------------------------------------------ GRENIER
const Grenier: React.FC<{ T: number; niv: number; ev: Record<string, number>; data: DonneesConte }> = ({ T, niv, ev, data }) => {
  const g = NIVEAUX[niv];
  const [PX, , PZ] = PORTANT;
  const n = data.acteur("nGren", T);
  const kPapier = entre(T, ev.papier, ev.papier + 0.9);
  return (
    <>
      <Zone g={zone("grenier", niv)} t={TZ.grenier} />
      <Rais o={(niv >= 2 ? 0.7 : 1) * (T < ev.emb - 0.15 ? 1 : T < ev.papier - 0.4 ? 0.45 : 0.3)} />
      <Poussiere T={T} n={90} centre={[400, 3.2, -1.5]} demi={[6.5, 3, 6.5]} />
      <Poussiere T={T + 5} n={40} centre={[398, 2.4, -4.0]} demi={[3, 2.2, 2.4]} couleur="#FFFFFF" taille={0.05} />
      <Manteau p={[PX, 2.75, PZ - 0.5]} t={[1.0, 0.86, 0.7]} emballage={T < ev.emb} g={0} />
      <Lueur p={[PX, 1.8, PZ + 1.0]} s={6} c="#FFC76A" o={0.18} />
      {n && T >= ev.papier - 0.1 && T < ev.s4 + 0.05 && <Papier p={relA(n, [0, 3.0, 1.0])} ry={n.ry + Math.PI} k={kPapier} chaud={T >= ev.chaud} />}
      {T > ev.flashLue && T < ev.flashLue + 0.2 && <Lueur p={[400, 3.2, 0.6]} s={34} c="#FFF3D2" o={0.5 * (1 - (T - ev.flashLue) / 0.2)} />}
      {void g}
    </>
  );
};

// ------------------------------------------------------------------ SALON
const CADRES: Array<[number, number, number]> = [[-5.4, 3.5, 0], [-3.2, 3.9, 1], [-1.0, 3.5, 2], [1.0, 3.9, 3], [3.2, 3.5, 4], [5.4, 3.9, 5]];
const Salon: React.FC<{ T: number; niv: number; ev: Record<string, number>; data: DonneesConte }> = ({ T, niv, ev, data }) => {
  const g = NIVEAUX[niv];
  const [, , SZ] = SALON;
  const n = data.acteur("nSalon", T);
  const ouvert = T >= ev.ouvre;
  const leve = T >= ev.leve;
  const k = lisse(entre(T, ev.leve, ev.leve + 0.7));
  const tourne = lisse(entre(T, ev.retourne, ev.retourne + 0.5));
  const cible = n ? relA(n, [0, 3.3, 1.0]) : ([0, 3, SZ] as V3);
  const depart: V3 = [-0.95, 1.72, TABLE_BASSE[2]];
  const pPhoto: V3 = [mix(depart[0], cible[0], k), mix(depart[1], cible[1], k), mix(depart[2], cible[2], k)];
  const f1 = entre(T, ev.t1a, ev.t1b);
  const f2 = entre(T, ev.t2a, ev.t2b);
  return (
    <>
      <Zone g={zone("salon", niv)} t={TZ.salon} />
      {CADRES.map(([x, y, i]) => (
        <group key={i}>
          <Bloc p={[x, y, SZ - 5.25]} s={[1.5, 1.9, 0.12]} c="#8A5A34" />
          <Image p={[x, y, SZ - 5.18]} s={[1.24, 1.59]} map={texPage(i as number)} />
        </group>
      ))}
      <Lueur p={[5.6, 5.1, SZ - 3.2]} s={10} c="#FFE2A8" o={0.5} />
      <Tache p={[0, 0.14, SZ + 0.6]} s={[11, 9]} c="#FFD9A0" o={0.3} />
      <Faisceau p={[5.6, 4.9, SZ - 3.2]} dir={[-0.3, -1, 0.3]} long={5} rayon={2.2} c="#FFE2A8" o={0.05} />
      <Album p={[0, TABLE_BASSE[1] + 0.14, TABLE_BASSE[2]]} T={T} ouvert={ouvert} flips={[ev.flip0, ev.flip1, ev.flip2, ev.flip3]} tFlip={0.34} leve={leve} />
      {leve && <PhotoLea p={pPhoto} r={[mix(-Math.PI / 2, -0.12, k), n ? n.ry + Math.PI : Math.PI, 0]} tourne={tourne} f1={f1} f2={f2} s={mix(0.6, 0.9, k)} />}
      {void g}
    </>
  );
};

// ------------------------------------------------------------------ Personnages
const Gens: React.FC<{ data: DonneesConte; T: number; frame: number; lieu: Lieu; cam: V3; amb: Ambiance; ev: Record<string, number> }> = ({ data, T, frame, lieu, cam, amb, ev }) => {
  const g = NIVEAUX[amb.niv];
  const tA = amb.niv === 3 ? NEUTRE_A : amb.sepia ? SEPIA_A : TA[lieu];
  const liste: Array<{ id: string; a: Acteur; d: number }> = [];
  for (const h of data.habitants) {
    const a = data.acteur(h.id, T);
    if (!a || lieuDe(a.p) !== lieu) continue;
    const d = Math.hypot(a.p[0] - cam[0], a.p[1] - cam[1], a.p[2] - cam[2]);
    if (d < 130) liste.push({ id: h.id, a, d });
  }
  liste.sort((u, v) => u.d - v.d);
  return (
    <>
      {liste.map(({ id, a, d }) => {
        let tenue = amb.niv > 0 ? tenueFiltre(a.tenue, `g${g}`, (h) => gris(h, g)) : a.tenue;
        let opacite = a.fantome ? 0.5 : 1;
        if (id === "lea") {
          const w = lisse(entre(T, ev.eff0, ev.eff0 + 0.8));
          if (w > 0) tenue = tenueFiltre(tenue, `b${w.toFixed(2)}`, (h) => blanc(h, w));
          opacite = 1 - lisse(entre(T, ev.eff0 + 0.55, ev.eff1));
          if (T > ev.eff1 + 0.05) return null;
        }
        const hy = 0.95 + (a.pose.y ?? 0) + 1.4;
        const cheveux = gris(a.tenue.cheveux, g);
        const mainD = a.objet ? (EN_MAIN[a.objet] ? EN_MAIN[a.objet](T, g) : OBJETS[a.objet]?.(T)) : undefined;
        return (
          <group key={id}>
            <Avatar p={a.p} ry={a.ry} pose={a.pose} tenue={tenue} emotion={a.emotion} frame={frame} graine={a.graine} teinte={tA} echelle={a.echelle} sansClin={a.sansClin} clinRapide={a.clinRapide} opacite={opacite} rx={a.rx} mainD={mainD}>
              {id === "lea" && (
                <>
                  <Bloc p={[0.6, hy - 0.2, -0.04]} s={[0.26, 0.78, 0.26]} c={cheveux} t={tA} />
                  <Bloc p={[-0.6, hy - 0.2, -0.04]} s={[0.26, 0.78, 0.26]} c={cheveux} t={tA} />
                  <Bloc p={[0.6, hy + 0.2, -0.04]} s={[0.32, 0.14, 0.32]} c={gris("#E0223D", g)} t={tA} />
                  <Bloc p={[-0.6, hy + 0.2, -0.04]} s={[0.32, 0.14, 0.32]} c={gris("#E0223D", g)} t={tA} />
                </>
              )}
              {id.startsWith("pol") && <Bloc p={[0.27, 2.02, 0.26]} s={[0.2, 0.2, 0.04]} c="#F6B81E" brut />}
            </Avatar>
            {d < 45 && a.rx === 0 && a.p[1] < 0.5 && !a.fantome && <Ombre x={a.p[0]} z={a.p[2]} y={a.p[1] + 0.075} r={0.85 * a.echelle} o={0.4} etire={1.3} angle={0} />}
          </group>
        );
      })}
    </>
  );
};

export const MondeHamburgerinterdit: React.FC<{ e: EtatConte; frame: number; data: DonneesConte }> = ({ e, frame, data }) => {
  const T = frame / 30;
  const cam = e.cam.pos;
  const lieu = lieuDe(cam);
  const ev = data.ev;
  const amb = ambiance(lieu, T, ev);
  const lea = data.acteur("lea", T);
  return (
    <>
      {lieu === "rue" && <Rue T={T} cam={cam} niv={amb.niv} ev={ev} data={data} />}
      {lieu === "cuisine" && <Cuisine T={T} niv={amb.niv} sepia={amb.sepia} ev={ev} data={data} />}
      {lieu === "grenier" && <Grenier T={T} niv={amb.niv} ev={ev} data={data} />}
      {lieu === "salon" && <Salon T={T} niv={amb.niv} ev={ev} data={data} />}
      <Gens data={data} T={T} frame={frame} lieu={lieu} cam={cam} amb={amb} ev={ev} />
      {lieu === "rue" && T >= ev.retour && <BurgerFin T={T} ev={ev} data={data} />}
      {lieu === "cuisine" && lea && <Eclats T={T} t0={ev.eff0 + 0.15} t1={ev.eff1 + 0.3} centre={[lea.p[0], lea.p[1] + 0.55, lea.p[2]]} echelle={lea.echelle * 1.1} />}
      {lieu === "cuisine" && T > ev.eff0 && T < ev.eff0 + 0.5 && <Lueur p={[lea?.p[0] ?? CUISINE[0], 1.9, lea?.p[2] ?? 2.3]} s={7} c="#FFFFFF" o={0.5 * (1 - (T - ev.eff0) / 0.5)} />}
    </>
  );
};
