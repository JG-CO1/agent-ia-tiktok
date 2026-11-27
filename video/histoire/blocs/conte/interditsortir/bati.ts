/**
 * Bâtisseur propre à « Interdit de sortir » : même principe que blocs/geo.ts (toutes les pièces fixes fusionnées en
 * une géométrie à couleurs de sommets) mais avec un éclairage « cuit » plus dramatique : soleil rasant orange d'un
 * côté, ombre violette de l'autre, plusieurs variantes d'éclairage (coucher de soleil, crépuscule, nuit) calculées
 * sur les mêmes triangles, ombres longues projetées au sol, et symétrie miroir exacte (la ville jumelle).
 */
import * as THREE from "three";
import type { V3 } from "../../geo";

export type Variante = {
  /** direction DU soleil (vers lui), normalisée à la construction */
  L: V3;
  soleil: [number, number, number];
  ambiant: [number, number, number];
  /** gain de lumière avec l'altitude (le haut des murs accroche la dernière lumière) */
  hauteur: number;
};

const boiteUnite = new THREE.BoxGeometry(1, 1, 1).toNonIndexed();
const cache = new Map<string, THREE.BufferGeometry>();
function memo(cle: string, f: () => THREE.BufferGeometry): THREE.BufferGeometry {
  let g = cache.get(cle);
  if (!g) {
    const brut = f();
    g = brut.index ? brut.toNonIndexed() : brut;
    cache.set(cle, g);
  }
  return g;
}
const couleurs = new Map<string, THREE.Color>();
function lin(hex: string): THREE.Color {
  let c = couleurs.get(hex);
  if (!c) {
    c = new THREE.Color(hex);
    couleurs.set(hex, c);
  }
  return c;
}
/** Nuance d'une couleur hexadécimale (facteur k sur chaque canal sRVB). */
export function nuance(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)));
  const r = f((n >> 16) & 255);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export type Occulteur = { pts: Array<[number, number]>; h: number };

export class Bati {
  private pos: number[] = [];
  private base: number[] = []; // une couleur (r, g, b) par triangle, déjà multipliée par `lum`
  private nor: number[] = []; // une normale par triangle
  private cy: number[] = []; // altitude du centre de chaque triangle
  private pile: THREE.Matrix4[] = [new THREE.Matrix4()];
  occulteurs: Occulteur[] = [];
  /** true : pièces lumineuses (aucun éclairage cuit, couleur telle quelle) */
  constructor(public brut = false) {}

  private get m() {
    return this.pile[this.pile.length - 1];
  }

  dans(p: V3, ry: number, f: () => void) {
    const local = new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(1, 1, 1));
    this.pile.push(this.m.clone().multiply(local));
    f();
    this.pile.pop();
  }
  /** Repère réfléchi : z' = zc − z (la ville jumelle est le miroir exact de la première). */
  miroirZ(zc: number, f: () => void) {
    const mi = new THREE.Matrix4().makeTranslation(0, 0, zc).multiply(new THREE.Matrix4().makeScale(1, 1, -1));
    this.pile.push(this.m.clone().multiply(mi));
    f();
    this.pile.pop();
  }

  geo(g: THREE.BufferGeometry, couleur: string, local?: THREE.Matrix4, lum = 1) {
    const M = local ? this.m.clone().multiply(local) : this.m;
    const reflechi = M.determinant() < 0;
    const p = g.getAttribute("position");
    const c = lin(couleur);
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const d = new THREE.Vector3();
    const n = new THREE.Vector3();
    const e1 = new THREE.Vector3();
    const e2 = new THREE.Vector3();
    for (let i = 0; i < p.count; i += 3) {
      a.fromBufferAttribute(p, i).applyMatrix4(M);
      if (reflechi) {
        b.fromBufferAttribute(p, i + 2).applyMatrix4(M);
        d.fromBufferAttribute(p, i + 1).applyMatrix4(M);
      } else {
        b.fromBufferAttribute(p, i + 1).applyMatrix4(M);
        d.fromBufferAttribute(p, i + 2).applyMatrix4(M);
      }
      n.crossVectors(e1.subVectors(b, a), e2.subVectors(d, a)).normalize();
      this.pos.push(a.x, a.y, a.z, b.x, b.y, b.z, d.x, d.y, d.z);
      this.base.push(c.r * lum, c.g * lum, c.b * lum);
      this.nor.push(n.x, n.y, n.z);
      this.cy.push((a.y + b.y + d.y) / 3);
    }
  }

  boite(p: V3, s: V3, couleur: string, r?: V3, lum = 1) {
    const m = new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(r?.[0] ?? 0, r?.[1] ?? 0, r?.[2] ?? 0)), new THREE.Vector3(...s));
    this.geo(boiteUnite, couleur, m, lum);
  }
  cylindre(p: V3, rayon: number, h: number, couleur: string, seg = 10, rayonHaut = rayon, lum = 1) {
    const g = memo(`cyl${seg}-${(rayonHaut / rayon).toFixed(3)}`, () => new THREE.CylinderGeometry(rayonHaut / rayon, 1, 1, seg));
    this.geo(g, couleur, new THREE.Matrix4().compose(new THREE.Vector3(p[0], p[1] + h / 2, p[2]), new THREE.Quaternion(), new THREE.Vector3(rayon, h, rayon)), lum);
  }
  cone(p: V3, rayon: number, h: number, couleur: string, seg = 6, ry = 0, lum = 1) {
    const g = memo(`cone${seg}`, () => new THREE.ConeGeometry(1, 1, seg));
    this.geo(g, couleur, new THREE.Matrix4().compose(new THREE.Vector3(p[0], p[1] + h / 2, p[2]), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(rayon, h, rayon)), lum);
  }
  /** Prisme triangulaire (toit en pignon) : base `w` sur x posée en `p`, hauteur `h`, profondeur `d` centrée sur z. */
  pignon(p: V3, w: number, h: number, d: number, couleur: string, lum = 1) {
    const g = memo("pignon", () => {
      const sh = new THREE.Shape();
      sh.moveTo(-0.5, 0);
      sh.lineTo(0.5, 0);
      sh.lineTo(0, 1);
      sh.closePath();
      const e = new THREE.ExtrudeGeometry(sh, { depth: 1, bevelEnabled: false });
      e.translate(0, 0, -0.5);
      return e;
    });
    this.geo(g, couleur, new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion(), new THREE.Vector3(w, h, d)), lum);
  }
  /** Quadrilatère plat (a, b, c, d dans l'ordre). */
  quad(a: V3, b: V3, c: V3, d: V3, couleur: string, lum = 1) {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...d], 3));
    this.geo(g, couleur, undefined, lum);
    g.dispose();
  }

  /** Déclare un volume qui projette une ombre au sol (boîte de centre `p`, taille `s`, lacet local `ry`). */
  occulte(p: V3, s: V3, ry = 0) {
    const c = Math.cos(ry);
    const sn = Math.sin(ry);
    const pts: Array<[number, number]> = [];
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as Array<[number, number]>) {
      const lx = sx * s[0] * 0.5;
      const lz = sz * s[2] * 0.5;
      const v = new THREE.Vector3(p[0] + lx * c + lz * sn, 0, p[2] - lx * sn + lz * c).applyMatrix4(this.m);
      pts.push([v.x, v.z]);
    }
    this.occulteurs.push({ pts, h: s[1] });
  }

  get triangles() {
    return this.cy.length;
  }

  /** Géométrie avec une couleur de sommets par variante d'éclairage : `couleurs` = [variante][...]. */
  construire(variantes: Variante[]): { g: THREE.BufferGeometry; variantes: Float32Array[] } {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.pos, 3));
    const n = this.cy.length;
    const out: Float32Array[] = variantes.map((v) => {
      const L = new THREE.Vector3(...v.L).normalize();
      const col = new Float32Array(n * 9);
      for (let i = 0; i < n; i++) {
        const br = this.base[i * 3];
        const bg = this.base[i * 3 + 1];
        const bb = this.base[i * 3 + 2];
        let r = br;
        let gg = bg;
        let b = bb;
        if (!this.brut) {
          const k = Math.max(0, this.nor[i * 3] * L.x + this.nor[i * 3 + 1] * L.y + this.nor[i * 3 + 2] * L.z);
          const hf = Math.max(0.55, 1 + v.hauteur * Math.max(-1, Math.min(1, this.cy[i] / 24)));
          r = br * (v.ambiant[0] + v.soleil[0] * k) * hf;
          gg = bg * (v.ambiant[1] + v.soleil[1] * k) * hf;
          b = bb * (v.ambiant[2] + v.soleil[2] * k) * hf;
        }
        for (let j = 0; j < 3; j++) {
          col[i * 9 + j * 3] = r;
          col[i * 9 + j * 3 + 1] = gg;
          col[i * 9 + j * 3 + 2] = b;
        }
      }
      return col;
    });
    g.setAttribute("color", new THREE.BufferAttribute(out[0], 3));
    g.computeBoundingSphere();
    return { g, variantes: out };
  }

  /** Ombres longues au sol (polygones sombres) pour une direction de soleil donnée. */
  ombres(L: V3, y = 0.08, longMax = 46): THREE.BufferGeometry {
    const l = new THREE.Vector3(...L).normalize();
    const pos: number[] = [];
    for (const o of this.occulteurs) {
      const k = Math.min(longMax, o.h / Math.max(0.08, l.y)) / Math.max(0.0001, Math.hypot(l.x, l.z));
      const dx = -l.x * k * Math.hypot(l.x, l.z);
      const dz = -l.z * k * Math.hypot(l.x, l.z);
      const tous: Array<[number, number]> = [...o.pts, ...o.pts.map(([x, z]) => [x + dx, z + dz] as [number, number])];
      const h = enveloppe(tous);
      for (let i = 1; i < h.length - 1; i++) pos.push(h[0][0], y, h[0][1], h[i][0], y, h[i][1], h[i + 1][0], y, h[i + 1][1]);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    return g;
  }
}

/** Enveloppe convexe (chaîne monotone). */
function enveloppe(pts: Array<[number, number]>): Array<[number, number]> {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o: [number, number], a: [number, number], b: [number, number]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const bas: Array<[number, number]> = [];
  for (const q of p) {
    while (bas.length >= 2 && cr(bas[bas.length - 2], bas[bas.length - 1], q) <= 0) bas.pop();
    bas.push(q);
  }
  const haut: Array<[number, number]> = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (haut.length >= 2 && cr(haut[haut.length - 2], haut[haut.length - 1], q) <= 0) haut.pop();
    haut.push(q);
  }
  bas.pop();
  haut.pop();
  return bas.concat(haut);
}
