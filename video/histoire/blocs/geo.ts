/**
 * Bâtisseur de décors « capture de jeu en blocs » : toutes les pièces fixes d'une zone (quartier, salon,
 * chambre…) sont fusionnées en UNE géométrie à couleurs de sommets. L'éclairage est « cuit » : chaque face
 * reçoit une teinte plate selon son orientation (pas d'ombres portées, pas de lumière volumétrique), puis la
 * zone entière est teintée d'un coup (nuit, aube, pièce éclairée ou éteinte) par la couleur du matériau.
 */
import * as THREE from "three";

export type V3 = [number, number, number];

/** Direction de la lumière « de jeu » (vient de face, légèrement à gauche et d'en haut). */
const LUMIERE = new THREE.Vector3(-0.2, 0.7, 0.75).normalize();

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

export class Batisseur {
  private pos: number[] = [];
  private col: number[] = [];
  private pile: THREE.Matrix4[] = [new THREE.Matrix4()];
  /** Lacet du repère d'ombrage intérieur (les faces d'une pièce sont ombrées dans le repère de la maison). */
  private lacets: number[] = [0];
  /** true : ombrage d'intérieur (plafonnier imaginaire), false : ombrage d'extérieur (LUMIERE). */
  interieur = false;

  constructor(interieur = false) {
    this.interieur = interieur;
  }

  private get m() {
    return this.pile[this.pile.length - 1];
  }

  /** Exécute `f` dans un repère déplacé en `p` et tourné de `ry` autour de la verticale. */
  dans(p: V3, ry: number, f: () => void) {
    const local = new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(1, 1, 1));
    this.pile.push(this.m.clone().multiply(local));
    this.lacets.push(this.lacets[this.lacets.length - 1] + ry);
    f();
    this.pile.pop();
    this.lacets.pop();
  }

  private teinte(n: THREE.Vector3): number {
    if (!this.interieur) return 0.58 + 0.46 * Math.max(0, n.dot(LUMIERE));
    const a = -this.lacets[this.lacets.length - 1];
    const nx = n.x * Math.cos(a) + n.z * Math.sin(a);
    const nz = -n.x * Math.sin(a) + n.z * Math.cos(a);
    if (n.y > 0.5) return 1;
    if (n.y < -0.5) return 0.74;
    if (Math.abs(nx) > Math.abs(nz)) return 0.83;
    return nz > 0 ? 0.95 : 0.9;
  }

  /** Ajoute une géométrie quelconque (triangles), transformée par `local`, d'une couleur unie. */
  geo(g: THREE.BufferGeometry, couleur: string, local?: THREE.Matrix4, lum = 1) {
    const M = local ? this.m.clone().multiply(local) : this.m;
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
      b.fromBufferAttribute(p, i + 1).applyMatrix4(M);
      d.fromBufferAttribute(p, i + 2).applyMatrix4(M);
      n.crossVectors(e1.subVectors(b, a), e2.subVectors(d, a)).normalize();
      const k = this.teinte(n) * lum;
      this.pos.push(a.x, a.y, a.z, b.x, b.y, b.z, d.x, d.y, d.z);
      for (let j = 0; j < 3; j++) this.col.push(c.r * k, c.g * k, c.b * k);
    }
  }

  /** Boîte centrée en `p`, de taille `s`, tournée (x, y, z) si besoin. */
  boite(p: V3, s: V3, couleur: string, r?: V3, lum = 1) {
    const m = new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(r?.[0] ?? 0, r?.[1] ?? 0, r?.[2] ?? 0)), new THREE.Vector3(...s));
    this.geo(boiteUnite, couleur, m, lum);
  }

  /** Cylindre vertical (poteaux, troncs, pots) : `p` est le centre de la base. */
  cylindre(p: V3, rayon: number, h: number, couleur: string, seg = 8, rayonHaut = rayon) {
    const g = memo(`cyl${seg}`, () => new THREE.CylinderGeometry(1, 1, 1, seg));
    const gg = rayonHaut === rayon ? g : memo(`cyl${seg}-${(rayonHaut / rayon).toFixed(3)}`, () => new THREE.CylinderGeometry(rayonHaut / rayon, 1, 1, seg));
    this.geo(gg, couleur, new THREE.Matrix4().compose(new THREE.Vector3(p[0], p[1] + h / 2, p[2]), new THREE.Quaternion(), new THREE.Vector3(rayon, h, rayon)));
  }

  /** Cône / pyramide low-poly (collines, sapins) : `p` est le centre de la base. */
  cone(p: V3, rayon: number, h: number, couleur: string, seg = 6, ry = 0) {
    const g = memo(`cone${seg}`, () => new THREE.ConeGeometry(1, 1, seg));
    this.geo(g, couleur, new THREE.Matrix4().compose(new THREE.Vector3(p[0], p[1] + h / 2, p[2]), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(rayon, h, rayon)));
  }

  /** Boule low-poly à facettes (feuillages, buissons, collines arrondies). */
  boule(p: V3, s: V3, couleur: string, detail = 0, ry = 0) {
    const g = memo(`ico${detail}`, () => new THREE.IcosahedronGeometry(1, detail));
    this.geo(g, couleur, new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(...s)));
  }

  /** Prisme triangulaire (pignon de maison) : base `w` sur x posée en `p`, hauteur `h`, profondeur `d` centrée sur z. */
  pignon(p: V3, w: number, h: number, d: number, couleur: string) {
    const sh = new THREE.Shape();
    sh.moveTo(-w / 2, 0);
    sh.lineTo(w / 2, 0);
    sh.lineTo(0, h);
    sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false });
    g.translate(0, 0, -d / 2);
    const ng = g.index ? g.toNonIndexed() : g;
    this.geo(ng, couleur, new THREE.Matrix4().makeTranslation(p[0], p[1], p[2]));
    g.dispose();
  }

  /** Quadrilatère plat (a, b, c, d dans l'ordre) ; `haut` force la face vers le haut. */
  quad(a: V3, b: V3, c: V3, d: V3, couleur: string, lum = 1) {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...d], 3));
    this.geo(g, couleur, undefined, lum);
    g.dispose();
  }

  /** Disque horizontal (place ronde) : centre `p`. */
  disque(p: V3, rayon: number, couleur: string, seg = 40) {
    const g = memo(`disque${seg}`, () => {
      const c = new THREE.CircleGeometry(1, seg);
      c.rotateX(-Math.PI / 2);
      return c;
    });
    this.geo(g, couleur, new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion(), new THREE.Vector3(rayon, 1, rayon)));
  }

  /**
   * Anneau horizontal surélevé (trottoir autour de la place), ouvert côté +z sur un demi-angle `ouverture`
   * (là où la rue arrive). Dessus à la hauteur `y`, bordure intérieure et extérieure verticales.
   */
  anneau(centre: V3, r0: number, r1: number, y: number, couleur: string, bordure: string, ouverture = 0, seg = 44) {
    const [cx, , cz] = centre;
    const pt = (r: number, a: number, h: number): V3 => [cx + r * Math.sin(a), h, cz + r * Math.cos(a)];
    const a0 = ouverture;
    const a1 = 2 * Math.PI - ouverture;
    for (let i = 0; i < seg; i++) {
      const u = a0 + ((a1 - a0) * i) / seg;
      const v = a0 + ((a1 - a0) * (i + 1)) / seg;
      this.quad(pt(r0, u, y), pt(r1, u, y), pt(r1, v, y), pt(r0, v, y), couleur);
      this.quad(pt(r0, v, y), pt(r0, v, 0), pt(r0, u, 0), pt(r0, u, y), bordure, 1.15);
      this.quad(pt(r1, u, y), pt(r1, u, 0), pt(r1, v, 0), pt(r1, v, y), bordure, 1.15);
    }
  }

  get triangles() {
    return this.pos.length / 9;
  }

  construire(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(this.col, 3));
    g.computeBoundingSphere();
    return g;
  }
}

/** Passe un point du repère local d'un objet (position `o`, lacet `ry`) au repère du monde. */
export function versMonde(o: V3, ry: number, p: V3): V3 {
  const c = Math.cos(ry);
  const s = Math.sin(ry);
  return [o[0] + p[0] * c + p[2] * s, o[1] + p[1], o[2] - p[0] * s + p[2] * c];
}
