/**
 * La créature : silhouette gigantesque en blocs noirs et gris, sans visage, aux bras trop longs. Squelette calculé
 * (cinématique inverse à deux segments pour les jambes et le bras tendu), dessiné en blocs orientés dans le repère
 * du monde. Aucune lumière : aplats sombres qui se détachent sur le brouillard pâle.
 */
import React from "react";
import * as THREE from "three";
import type { V3 } from "../../geo";
import { Bloc, type Teinte } from "../../avatar";
import { Lueur, Ombre } from "../lib";

export type EtatCreature = {
  /** pieds au sol (x, z), altitude du sol y, lacet (0 = regarde vers +z) */
  x: number;
  z: number;
  y?: number;
  ry: number;
  /** phase de marche (rad) et amplitude 0..1 (0 = immobile) */
  phi: number;
  marche: number;
  /** tête : lacet, tangage */
  tete: [number, number];
  /** bras droit tendu vers une cible monde (k = 0 : le long du corps) */
  bras?: { cible: V3; k: number; roulis?: number };
  /** échelle (hauteur ≈ 3,9 × s) */
  s?: number;
};
export const ECHELLE_CREATURE = 3.6;
/** Demi-pas en unités du monde (la phase avance de distance / PAS). */
export const PAS = 2.5;

const COUL = { corps: "#0F1015", cotes: "#22242D", bras: "#191B22", main: "#4E5360", tete: "#4B505D", pied: "#0A0B0E" };

const v3 = (a: V3) => new THREE.Vector3(a[0], a[1], a[2]);
const Z_AXE = new THREE.Vector3(0, 0, 1);

/** Segment (bloc) entre deux points du monde, épaisseur w × h, orienté selon l'axe a→b. */
export const Seg: React.FC<{ a: THREE.Vector3; b: THREE.Vector3; w: number; h: number; c: string; t: Teinte; up?: THREE.Vector3 }> = ({ a, b, w, h, c, t, up }) => {
  const d = new THREE.Vector3().subVectors(b, a);
  const L = Math.max(0.01, d.length());
  const m = new THREE.Matrix4().lookAt(new THREE.Vector3(0, 0, 0), d.clone().normalize(), up ?? new THREE.Vector3(0, 1, 0));
  const q = new THREE.Quaternion().setFromRotationMatrix(m);
  const mid = a.clone().add(b).multiplyScalar(0.5);
  return (
    <group position={mid.toArray()} quaternion={q}>
      <Bloc s={[w, h, L]} c={c} t={t} />
    </group>
  );
};
/** Bloc à orientation libre (base x, y, z données). */
export const BlocB: React.FC<{ p: THREE.Vector3; ex: THREE.Vector3; ey: THREE.Vector3; ez: THREE.Vector3; s: V3; c: string; t: Teinte }> = ({ p, ex, ey, ez, s, c, t }) => {
  const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(ex, ey, ez));
  return (
    <group position={p.toArray()} quaternion={q}>
      <Bloc s={s} c={c} t={t} />
    </group>
  );
};

/** Deux segments (os) entre `a` et `g` : renvoie le coude, qui plie du côté de `pole`. */
export function coude(a: THREE.Vector3, g: THREE.Vector3, l1: number, l2: number, pole: THREE.Vector3): { e: THREE.Vector3; g: THREE.Vector3 } {
  const d = new THREE.Vector3().subVectors(g, a);
  let L = d.length();
  const u = d.clone().normalize();
  const max = l1 + l2 - 0.001;
  const gg = L > max ? a.clone().addScaledVector(u, max) : g.clone();
  L = Math.min(L, max);
  const x = (l1 * l1 - l2 * l2 + L * L) / (2 * L);
  const h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
  const pv = pole.clone().addScaledVector(u, -pole.dot(u));
  if (pv.lengthSq() < 1e-6) pv.set(0, -1, 0);
  pv.normalize();
  return { e: a.clone().addScaledVector(u, x).addScaledVector(pv, h), g: gg };
}

/** Positions de la main droite (monde) quand le bras est tendu vers `cible` : renvoie aussi le coude. */
export function squelette(c: EtatCreature) {
  const S = c.s ?? ECHELLE_CREATURE;
  const y0 = c.y ?? 0;
  const R = new THREE.Matrix4().makeRotationY(c.ry);
  const W = (v: THREE.Vector3Like): THREE.Vector3 => new THREE.Vector3(v.x, v.y, v.z).multiplyScalar(S).applyMatrix4(R).add(new THREE.Vector3(c.x, y0, c.z));
  const bob = 0.05 * Math.cos(2 * c.phi) * c.marche;
  const lean = 0.06 + 0.05 * c.marche;
  const P = new THREE.Vector3(0, 1.55 + bob, 0);
  const C = new THREE.Vector3(0, P.y + 1.05, lean + 0.06);
  const Ne = new THREE.Vector3(0, C.y + 0.6, C.z + 0.14);
  // tête (lacet, tangage) autour du cou
  const [tl, tt] = c.tete;
  const Hd = new THREE.Vector3(Math.sin(tl) * 0.2, Ne.y + 0.55 + Math.cos(tt) * 0.1, Ne.z + 0.18 + Math.sin(tt) * 0.2);
  const SL = new THREE.Vector3(-0.78, C.y + 0.42, C.z - 0.02);
  const SR = new THREE.Vector3(0.78, C.y + 0.42, C.z - 0.02);
  // jambes : hanche → cheville (balancier + levée du pied), genou plié vers l'avant
  const jambes = [-1, 1].map((s) => {
    const ph = c.phi + (s > 0 ? Math.PI : 0);
    const hip = new THREE.Vector3(s * 0.34, P.y - 0.1, 0);
    const foot = new THREE.Vector3(s * 0.34, 0.12 + 0.34 * Math.max(0, Math.cos(ph)) * c.marche, (PAS / S) * Math.sin(ph) * c.marche);
    const k = coude(hip, foot, 0.95, 0.98, new THREE.Vector3(0, 0, 1));
    return { hip, knee: k.e, foot: k.g };
  });
  // bras : au repos pendent (mains près du sol) ; tendu : IK vers la cible
  const pend = (s: number, ph: number): THREE.Vector3 => new THREE.Vector3(s * 0.84, 0.36 + 0.07 * Math.sin(ph * 1.7), 0.2 - Math.sin(ph + (s > 0 ? Math.PI : 0)) * 0.34 * c.marche);
  const kb = c.bras ? c.bras.k : 0;
  const bras = [{ s: -1, S: SL }, { s: 1, S: SR }].map(({ s, S: sh }) => {
    let g = pend(s, c.phi);
    if (s === -1 && c.bras && kb > 0) {
      const loc = new THREE.Vector3(...c.bras.cible).sub(new THREE.Vector3(c.x, y0, c.z)).applyMatrix4(new THREE.Matrix4().makeRotationY(-c.ry)).multiplyScalar(1 / S);
      g = g.clone().lerp(loc, kb);
    }
    const pole = new THREE.Vector3(s * 0.25, 0, -1).lerp(new THREE.Vector3(s * 0.7, -0.6, -0.1), s === -1 ? kb : 0);
    const k = coude(sh, g, 1.5, 1.55, pole);
    return { sh, elbow: k.e, hand: k.g };
  });
  return { S, P, C, Ne, Hd, SL, SR, jambes, bras, W, R };
}

/** Main géante : paume plate et quatre longs doigts, dans un repère libre (ex = sens des doigts, ez = normale de la paume). */
export const MainGeante: React.FC<{ p: THREE.Vector3; ex: THREE.Vector3; ey: THREE.Vector3; ez: THREE.Vector3; s: number; t: Teinte; ecart?: number; plie?: number }> = ({ p, ex, ey, ez, s, t, ecart = 1, plie = 0 }) => {
  const doigts = [-1.5, -0.5, 0.5, 1.5];
  const long = [0.58, 0.76, 0.8, 0.62];
  const mk = (v: V3) => ex.clone().multiplyScalar(v[0]).addScaledVector(ey, v[1]).addScaledVector(ez, v[2]).multiplyScalar(s).add(p);
  return (
    <>
      <BlocB p={mk([0.3, 0, 0])} ex={ex} ey={ey} ez={ez} s={[0.68 * s, 0.62 * s, 0.2 * s]} c={COUL.main} t={t} />
      {doigts.map((d, i) => {
        const L = long[i];
        const a = d * 0.12 * ecart;
        const exd = ex.clone().multiplyScalar(Math.cos(a)).addScaledVector(ey, Math.sin(a));
        const eyd = ey.clone().multiplyScalar(Math.cos(a)).addScaledVector(ex, -Math.sin(a));
        const base = mk([0.62, d * 0.155 * ecart, 0]);
        // deux phalanges : la seconde se plie vers la normale (griffe)
        const p1 = base.clone().addScaledVector(exd, (L / 2) * s * 0.55);
        const ex2 = exd.clone().multiplyScalar(Math.cos(plie)).addScaledVector(ez, Math.sin(plie));
        const p2 = base.clone().addScaledVector(exd, L * 0.55 * s).addScaledVector(ex2, (L / 2) * 0.5 * s);
        return (
          <React.Fragment key={i}>
            <BlocB p={p1} ex={exd} ey={eyd} ez={ez} s={[L * 0.55 * s, 0.17 * s, 0.14 * s]} c={COUL.main} t={t} />
            <BlocB p={p2} ex={ex2} ey={eyd} ez={ez} s={[L * 0.5 * s, 0.15 * s, 0.13 * s]} c={COUL.main} t={t} />
          </React.Fragment>
        );
      })}
      <BlocB p={mk([0.12, -0.48, 0])} ex={ex.clone().multiplyScalar(0.8).addScaledVector(ey, -0.6).normalize()} ey={ey} ez={ez} s={[0.4 * s, 0.14 * s, 0.12 * s]} c={COUL.main} t={t} />
    </>
  );
};

export const Creature: React.FC<{ c: EtatCreature; t: Teinte; ombre?: boolean }> = ({ c, t, ombre = true }) => {
  const k = squelette(c);
  const { S, P, C, Ne, Hd, SL, jambes, bras, W, R } = k;
  const ez = new THREE.Vector3(0, 0, 1).applyMatrix4(R);
  const y0 = c.y ?? 0;
  const tendu = !!c.bras && c.bras.k > 0.02;
  // repère de la main : doigts le long de l'avant-bras ; main plaquée sur la vitre (doigts dans le plan de la vitre, vers −x)
  const repere = (elbow: THREE.Vector3, hand: THREE.Vector3, vitre: number) => {
    const avant = new THREE.Vector3().subVectors(hand, elbow).normalize();
    const exh = avant.clone().lerp(new THREE.Vector3(-0.93, -0.36, 0), vitre).normalize();
    const n = ez.clone().lerp(new THREE.Vector3(0, 0, 1), vitre).normalize();
    const eyh = new THREE.Vector3().crossVectors(n, exh).normalize();
    const ezh = new THREE.Vector3().crossVectors(exh, eyh).normalize();
    return { exh, eyh, ezh };
  };
  return (
    <>
      {ombre && <Ombre x={c.x} z={c.z} y={y0 + 0.09} r={2.6 * (S / 3.6)} o={0.38} etire={1.5} />}
      {/* bassin, ventre, cage thoracique, épaules, cou (repère local du corps, mis à l'échelle) */}
      <group position={[c.x, y0, c.z]} rotation={[0, c.ry, 0]} scale={S}>
        <Bloc p={[0, P.y + 0.05, 0]} s={[0.86, 0.5, 0.5]} c={COUL.corps} t={t} />
        <Bloc p={[0, P.y + 0.5, 0.05]} s={[0.66, 0.7, 0.42]} c={COUL.cotes} t={t} />
        <Bloc p={[0, C.y + 0.05, C.z]} s={[1.12, 0.95, 0.56]} c={COUL.corps} t={t} />
        {[-0.28, 0.0, 0.28].map((dy) => (
          <Bloc key={dy} p={[0, C.y + 0.05 + dy, C.z + 0.29]} s={[1.0, 0.07, 0.04]} c={COUL.cotes} t={t} />
        ))}
        <Bloc p={[0, SL.y, C.z]} s={[1.9, 0.3, 0.5]} c={COUL.cotes} t={t} />
        <Bloc p={[0, Ne.y - 0.1, Ne.z - 0.05]} s={[0.3, 0.42, 0.3]} c={COUL.bras} t={t} />
      </group>
      {/* tête lisse, sans visage */}
      <group position={W(Hd).toArray()} rotation={[c.tete[1] * 0.8, c.ry + c.tete[0], 0, "YXZ"]} scale={S}>
        <Bloc s={[0.62, 0.86, 0.6]} c={COUL.tete} t={t} />
        <Bloc p={[0, 0.5, -0.02]} s={[0.56, 0.18, 0.54]} c={COUL.tete} t={[t[0] * 0.85, t[1] * 0.85, t[2] * 0.85]} />
      </group>
      {/* jambes */}
      {jambes.map((j, i) => {
        const a = W(j.hip);
        const kn = W(j.knee);
        const f = W(j.foot);
        return (
          <React.Fragment key={i}>
            <Seg a={a} b={kn} w={0.36 * S} h={0.36 * S} c={COUL.corps} t={t} />
            <Seg a={kn} b={f} w={0.28 * S} h={0.28 * S} c={COUL.bras} t={t} />
            <group position={f.clone().add(ez.clone().multiplyScalar(0.28 * S)).toArray()} rotation={[0, c.ry, 0]}>
              <Bloc p={[0, 0.06 * S, 0]} s={[0.46 * S, 0.2 * S, 0.9 * S]} c={COUL.pied} t={t} />
            </group>
          </React.Fragment>
        );
      })}
      {/* bras trop longs, mains grises aux longs doigts */}
      {bras.map((b, i) => {
        const sh = W(b.sh);
        const el = W(b.elbow);
        const ha = W(b.hand);
        const gele = i === 0 && tendu;
        const f = repere(el, ha, gele ? Math.min(1, (c.bras?.k ?? 0) * 1.6) : 0);
        return (
          <React.Fragment key={i}>
            <Seg a={sh} b={el} w={0.27 * S} h={0.27 * S} c={COUL.bras} t={t} />
            <Seg a={el} b={ha} w={0.22 * S} h={0.22 * S} c={COUL.bras} t={t} />
            <MainGeante p={ha} ex={f.exh} ey={f.eyh} ez={f.ezh} s={S * 0.55} t={t} ecart={gele ? 1.5 : 0.7} plie={gele ? 0.35 : 0.1} />
          </React.Fragment>
        );
      })}
      {/* haleine de brume autour des pieds */}
      {ombre && <Lueur p={[c.x, y0 + 1.4, c.z]} s={14 * (S / 3.6)} c="#8C9AB8" o={0.18} />}
    </>
  );
};
