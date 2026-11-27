/**
 * « Tout ce que j'envoie par message devient réel… » — décor dynamique : bulles de chat 3D avec de vrais textes, pluie de
 * bonbons, vague rose qui réécrit la rue, boulangerie et maison qui se dissolvent bloc par bloc, chien en blocs, téléphone,
 * mains qui se pixellisent, fil de la conversation (colonne de bulles géantes) et bouton « Supprimer » du vide blanc.
 * Seul le lieu où se trouve la caméra est dessiné (les lieux sont à plus de 400 unités les uns des autres).
 */
import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import type { V3 } from "../../geo";
import { Avatar, Bloc, type Teinte } from "../../avatar";
import { Ombre, Tache, Zone, type DonneesConte, type EtatConte } from "../lib";
import { alea, borne, entre, freine, lisse, mel } from "../../maths";
import type { Acteur } from "../../ville/foule";
import { OBJETS } from "../lib";
import { CH, FIL, FEN, GAZON_LOPES, VIDE, Y_TOP, construireMessages } from "./monde";
import { EDIFICES } from "./edifices";
import { IDS_PASSANTS, IDS_SCRIPT, LOPES, SAM_V, T_SAM } from "./histoire";
import { Bulle, Chien, Eclats, EdificeDyn, Lueur2, MainPixel, Nuages, Parapluie, Pastille, Plan, Pluie, Pouce, PoucePixel, PremierBonbon, Soleil, TelProp, texBouton, texPanneau, type EtatChien } from "./objets";

export const cielMessages = (e?: EtatConte) => e?.ciel ?? "#9ED4FF";

type Lieu = "chambre" | "rue" | "vide";
const lieuDe = (p: V3): Lieu => (p[0] < -200 ? "chambre" : p[2] > 400 ? "vide" : "rue");
const mel3 = (a: V3, b: V3, k: number): V3 => [mel(a[0], b[0], k), mel(a[1], b[1], k), mel(a[2], b[2], k)];
const [X] = CH;
const [VX, , VZ] = VIDE;

const M1 = "Il pleut des bonbons.";
const M2 = "Le chien de ma voisine est guéri.";
const M3 = "Tout redevient comme avant.";

// ------------------------------------------------------------------ Position du téléphone dans les mains de Sam
function repere(a: Acteur, v: V3): V3 {
  const e = a.echelle;
  return [a.p[0] + (v[0] * Math.cos(a.ry) + v[2] * Math.sin(a.ry)) * e, a.p[1] + v[1] * e, a.p[2] + (-v[0] * Math.sin(a.ry) + v[2] * Math.cos(a.ry)) * e];
}
type EtatTel = { actif: boolean; saisie: string; envoyes: string[]; clavier: boolean; pression: number };
function etatTel(T: number, ev: Record<string, number>, mot: (s: number, k: number) => number): EtatTel {
  const rien: EtatTel = { actif: false, saisie: "", envoyes: [], clavier: false, pression: -1 };
  if (T >= mot(0, 8) - 0.1 && T < mot(0, 12) - 0.02) return rien; // il baisse le téléphone : gros plan sur son visage
  if (T < ev.bubFly + 0.1) return { actif: true, saisie: T < ev.envoi ? M1 : "", envoyes: T >= ev.envoi ? [M1] : [], clavier: T < ev.envoi + 0.05, pression: -1 };
  if (T >= mot(2, 0) - 0.1 && T < mot(2, 18)) {
    const k = entre(T, ev.tape3, ev.gueri - 0.25);
    const typing = T < ev.gueri;
    const n = Math.ceil(k * M2.length);
    return { actif: true, saisie: typing ? M2.slice(0, n) : "", envoyes: typing ? [M1] : [M1, M2], clavier: typing, pression: typing ? Math.floor(T * 13) % 26 : -1 };
  }
  if (T >= ev.tape4 && T < ev.imp - 0.05) {
    const k = entre(T, ev.tape4 + 0.1, ev.envoi4 - 0.1);
    const typing = T < ev.envoi4;
    const n = Math.ceil(k * M3.length);
    return { actif: true, saisie: typing ? M3.slice(0, n) : "", envoyes: typing ? [M1, M2] : [M1, M2, M3], clavier: typing, pression: typing ? Math.floor(T * 17) % 26 : -1 };
  }
  return rien;
}

// ------------------------------------------------------------------ Tint (teintes)
const TZ: Record<Lieu, Teinte> = { chambre: [1.0, 0.98, 1.04], rue: [1.0, 0.99, 1.03], vide: [1.0, 1.0, 1.02] };
const TA: Record<Lieu, Teinte> = { chambre: [1.0, 0.95, 0.98], rue: [1.0, 0.96, 1.0], vide: [0.7, 0.76, 1.0] };
const SIL: Teinte = [0.16, 0.17, 0.28];

// ------------------------------------------------------------------ Zones avec découpe (vague rose)
const ZoneClip: React.FC<{ g: THREE.BufferGeometry; t: Teinte; plan: THREE.Plane }> = ({ g, t, plan }) => (
  <mesh geometry={g}>
    <meshBasicMaterial vertexColors color={new THREE.Color().setRGB(t[0], t[1], t[2])} clippingPlanes={[plan]} />
  </mesh>
);
const Ombres: React.FC<{ g: THREE.BufferGeometry; op: number; clip?: THREE.Plane }> = ({ g, op, clip }) => (
  <mesh geometry={g} renderOrder={1}>
    <meshBasicMaterial vertexColors transparent opacity={op} depthWrite={false} side={THREE.DoubleSide} clippingPlanes={clip ? [clip] : undefined} />
  </mesh>
);

// ------------------------------------------------------------------ Chien : états
function etatChien(T: number, ev: Record<string, number>): EtatChien {
  const malade = T < ev.gueri ? 1 : 0;
  const tb = T - ev.bondit;
  const cx = -9.7;
  const cz = 19.6;
  let p: V3 = [-9.4, 0, 20.4];
  let ry = Math.PI / 2;
  let saut = 0;
  let assis = 0;
  if (T >= ev.gueri && T < ev.bondit) {
    p = [-9.6, 0, 20.2];
    saut = 0.1 * Math.sin((T - ev.gueri) * 30);
  } else if (tb >= 0) {
    if (tb < 2.6) {
      const a = tb * 3.2;
      p = [cx + Math.cos(a) * 1.5, 0, cz + Math.sin(a) * 1.4];
      ry = -a + Math.PI / 2 + Math.PI;
      saut = Math.abs(Math.sin(tb * 7)) * 1.0;
    } else {
      p = [-9.6, 0, 19.2];
      ry = -Math.PI / 2 + 0.2;
      assis = lisse(entre(T, ev.maison0 + 1.4, ev.maison0 + 2.0));
      saut = tb < 3.2 ? Math.abs(Math.sin(tb * 7)) * 0.5 * (1 - (tb - 2.6) / 0.6) : 0;
    }
  }
  const queue = T >= ev.gueri ? T * 18 : T * 1.2;
  return { p, ry, malade, saut, queue, assis, tete: malade ? 0.0 : Math.sin(T * 2.3) * 0.25 };
}

// ------------------------------------------------------------------ Poussière de pixels dans le vide (repères de vitesse)
const Poussiere: React.FC<{ T: number; n: number; zone: { x: [number, number]; y: [number, number]; z: [number, number] }; coul?: string }> = ({ T, n, zone, coul = "#BFD6FF" }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: coul }), [coul]);
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    for (let i = 0; i < n; i++) {
      const r = (k: number) => alea(i * 9 + k * 23);
      dummy.position.set(mel(zone.x[0], zone.x[1], r(1)) + Math.sin(T * 0.6 + i) * 0.4, mel(zone.y[0], zone.y[1], r(2)) + Math.sin(T * 0.5 + i * 1.7) * 0.5, mel(zone.z[0], zone.z[1], r(3)));
      dummy.rotation.set(T * r(4), T * r(5), 0);
      dummy.scale.setScalar(0.18 + r(6) * 0.5);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geo, mat, n]} frustumCulled={false} />;
};

// ------------------------------------------------------------------ Personnages
type Vis = { id: string; a: Acteur; d: number };
const Gens: React.FC<{ data: DonneesConte; T: number; frame: number; lieu: Lieu; cam: V3; ev: Record<string, number>; tz: Teinte; silhouette: boolean; parapluies: boolean }> = ({ data, T, frame, lieu, cam, ev, tz, silhouette, parapluies }) => {
  const liste: Vis[] = [];
  for (const id of [...IDS_SCRIPT, ...IDS_PASSANTS]) {
    const a = data.acteur(id, T);
    if (!a || lieuDe(a.p) !== lieu) continue;
    const d = Math.hypot(a.p[0] - cam[0], a.p[1] - cam[1], a.p[2] - cam[2]);
    if (d < 170) liste.push({ id, a, d });
  }
  const teinte = silhouette ? SIL : tz;
  return (
    <>
      {liste.map(({ id, a }) => {
        let op = a.fantome ? 0.5 : 1;
        if (id === "lopes") op = 1 - lisse(entre(T, ev.voisine0, ev.voisine0 + 0.8));
        if (op < 0.03) return null;
        if (id === "lopes" && T > ev.voisine0 && (frame % 3 === 0) && T < ev.voisine0 + 0.8) op *= 0.5;
        const mainD = a.objet && OBJETS[a.objet] ? OBJETS[a.objet](T) : undefined;
        const alea1 = alea(id.length * 7 + id.charCodeAt(id.length - 1));
        const coul = ["#FF5C9E", "#FFD23F", "#4FC8FF", "#7DFF9E", "#B07CFF"][Math.floor(alea1 * 5) % 5];
        return (
          <group key={id}>
            <Avatar p={a.p} ry={a.ry} pose={a.pose} tenue={a.tenue} emotion={a.emotion} frame={frame} graine={a.graine} teinte={teinte} echelle={a.echelle} sansClin={a.sansClin} clinRapide={a.clinRapide} opacite={op} rx={a.rx} mainD={mainD} />
            {!a.fantome && a.rx === 0 && op > 0.5 && !silhouette && <Ombre x={a.p[0]} z={a.p[2]} y={a.p[1] + 0.075} r={0.85 * a.echelle} o={0.45} etire={1.35} />}
            {parapluies && IDS_PASSANTS.includes(id) && <Parapluie p={a.p} echelle={a.echelle} coul={coul} t={tz} />}
          </group>
        );
      })}
    </>
  );
};

// ------------------------------------------------------------------ Le monde
export const MondeMessages: React.FC<{ e: EtatConte; frame: number; data: DonneesConte }> = ({ e, frame, data }) => {
  const zones = useMemo(() => construireMessages(), []);
  const gl = useThree((s) => s.gl);
  useLayoutEffect(() => {
    gl.localClippingEnabled = true;
  }, [gl]);
  const T = frame / 30;
  const cam = e.cam.pos;
  const lieu = lieuDe(cam);
  const ev = data.ev;
  const mot = data.mot;
  const silhouette = e.ambiance === "silhouette";

  // ---------------- téléphone de Sam (partout où il tape)
  const sam = data.acteur("sam", T);
  const tel = etatTel(T, ev, mot);
  const telFace = !!(e as EtatConte & { telFace?: boolean }).telFace; // gros plan : l'écran est tourné vers la caméra
  const telP = sam && tel.actif && lieuDe(sam.p) === lieu ? repere(sam, [0, 1.8, 0.86]) : null;
  const telNode =
    sam && telP ? (
      <TelProp p={telP} ry={telFace ? sam.ry : sam.ry + Math.PI + 0.4} tilt={telFace ? 0.1 : -0.3} s={0.8 * sam.echelle} id="sam" saisie={tel.saisie} envoyes={tel.envoyes} clavier={tel.clavier} pression={tel.pression} lueur={0.45}>
        {T < ev.envoi + 1.4 && <Pouce T={T} envoi={ev.envoi} peau={T_SAM.peau} />}
      </TelProp>
    ) : null;

  const gens = <Gens data={data} T={T} frame={frame} lieu={lieu} cam={cam} ev={ev} tz={TA[lieu]} silhouette={silhouette} parapluies={lieu === "rue" && T > ev.pluie0 - 0.4 && T < ev.vision0 - 0.2} />;

  // =================================================================== CHAMBRE
  if (lieu === "chambre") {
    const W: V3 = [X + 0.6, 2.35, -4.55];
    const H1: V3 = [X + 1.5, 3.55, -2.4];
    const ecran = telP ?? repere(data.acteur("sam", ev.envoi) ?? ({ p: [0, 0, 0], ry: 0, echelle: 1 } as Acteur), [0, 1.8, 0.86]);
    const k1 = lisse(entre(T, ev.envoi, ev.envoi + 0.8));
    const vol = lisse(entre(T, ev.bubFly, ev.eclat));
    const volK = Math.pow(vol, 2.2);
    let bp: V3;
    let bs: number;
    if (T < ev.bubFly) {
      bp = mel3(ecran, H1, k1);
      bp = [bp[0], bp[1] + Math.sin(T * 2.2) * 0.07 * k1, bp[2]];
      bs = 0.05 + 0.95 * freine(entre(T, ev.envoi, ev.envoi + 0.7));
    } else {
      bp = mel3(H1, W, volK);
      bs = 1 + 0.15 * volK;
    }
    const bulleVisible = T >= ev.envoi && T < ev.eclat;
    const flash = Math.max(0, 1 - entre(T, ev.eclat, ev.eclat + 0.7));
    const bleu = T < ev.eclat ? 0.5 : 0.12;
    return (
      <>
        <group position={cam}>
          <Soleil dir={[-120, 90, -170]} couleur="#FFE9A8" halo="#FFD0A0" taille={26} />
          <Nuages T={T} couleur="#FFFFFF" />
        </group>
        <Zone g={zones.chambre} t={TZ.chambre} />
        <Zone g={zones.dehors} t={TZ.chambre} />
        {/* lumière bleue de l'écran sur le sol et les murs */}
        {telP && <Tache p={[sam ? sam.p[0] : X, 0.14, sam ? sam.p[2] - 0.8 : 0]} s={[6.5, 6.5]} c="#6FB4FF" o={0.4} />}
        {telP && <Lueur2 p={[telP[0], telP[1] + 0.2, telP[2]]} s={9} c="#6FB4FF" o={bleu} />}
        <Tache p={[X + 1.1, 0.14, -3.8]} s={[4.4, 5.4]} c="#FFF3C0" o={0.28} />
        <Lueur2 p={[X + 0.6, 2.4, -4.7]} s={8} c="#FFF0B8" o={0.35 + flash * 0.65} />
        {bulleVisible && <Bulle p={bp} w={4.0} h={1.42} texte={M1} type="bleue" s={bs} cam={cam} lueur={0.55} />}
        <Eclats p={W} T={T} t0={ev.eclat} n={46} rayon={3.4} dur={1.3} taille={0.3} graine={1} monte={0.8} />
        <Eclats p={W} T={T} t0={ev.eclat + 0.05} n={20} rayon={1.6} dur={0.9} taille={0.18} couleurs={["#FFFFFF", "#FFE066"]} graine={2} monte={0.4} />
        {/* la première sphère de bonbon, puis la pluie */}
        <PremierBonbon T={T} t0={ev.candy0} x={[X + 0.9, 0, -9.2]} hauteur={13} taille={1.15} />
        <Pluie T={T} t0={ev.pluie0} cam={[X, 0, -12]} boite={[70, 44]} n={150} haut={15} vit={9} rampe={1.4} taille={0.9} zMax={-5.6} graine={3} />
        {telNode}
        {gens}
      </>
    );
  }

  // =================================================================== VIDE
  if (lieu === "vide") {
    const sub = e.ambiance === "silhouette";
    const blanc = sub ? 0.0 : 0.0;
    void blanc;
    const pan = lisse(entre(T, ev.pan, ev.pan + 0.4));
    const panS = pan * (1 + 0.06 * Math.sin(pan * Math.PI));
    const swell = lisse(entre(T, ev.bouton0, ev.bouton0 + 2.0));
    const S = 1 + 3.3 * swell + 0.03 * Math.sin(T * 4);
    const pulse = 0.5 + 0.2 * Math.sin(T * 4);
    const fantomes = T >= ev.parents ? 1 : 0;
    const sam = data.acteur("sam", T);
    const bPos = (b: (typeof FIL)[number]): V3 => [VX + b.cote * (3.1 + (b.w - 9) * 0.25), b.y, VZ + (b.z ?? 0)];
    const lueurPlan = T >= ev.haut - 0.5;
    return (
      <>
        <Zone g={zones.vide} t={TZ.vide} />
        <Poussiere T={T} n={170} zone={{ x: [-26, 26], y: [-12, Y_TOP + 28], z: [VZ - 14, VZ + 26] }} />
        {/* fil de la conversation : bulles géantes (les plus récentes en bas) */}
        {FIL.map((b, i) => (
          <Bulle key={i} p={bPos(b)} w={b.w} h={b.h} texte={b.texte} type={b.type} ry={0} barres={b.lisible ? undefined : b.lignes} lueur={b.lisible ? 0.25 : 0.1} />
        ))}
        <Pastille p={[VX, 1.8, VZ]} w={7} h={1.5} texte="Aujourd'hui" />
        <Pastille p={[VX, 60, VZ]} w={8} h={1.6} texte="Il y a 8 ans" />
        <Pastille p={[VX, 80, VZ]} w={8.6} h={1.6} texte="Il y a 12 ans" />
        {/* bulles pâles de fond et de premier plan : parallaxe, vertige */}
        {Array.from({ length: 14 }, (_, i) => (
          <Bulle key={`f${i}`} p={[VX + (i % 2 ? 17 : -17) + ((i * 7) % 5), 6 + i * 9.5, VZ - 30 - (i % 3) * 8]} w={22} h={7 + (i % 3) * 2} type={i % 3 === 0 ? "grise" : "bleue"} barres={2 + (i % 2)} opacite={0.42} ry={0} />
        ))}
        {Array.from({ length: 9 }, (_, i) => (
          <Bulle key={`g${i}`} p={[VX + (i % 2 ? 11 : -11) + ((i * 3) % 4), 14 + i * 11.5, VZ + 10]} w={10} h={3.6} type={i % 2 ? "grise" : "verte"} barres={2} opacite={0.2} ry={0} />
        ))}
        {/* le tout premier message : énorme, au bout du fil */}
        <Pastille p={[VX, Y_TOP + 19.2, VZ - 9]} w={10.5} h={2.0} texte="Il y a 15 ans" />
        <Pastille p={[VX - 10.5, Y_TOP + 17.4, VZ - 9]} w={9.5} h={1.7} texte="Maman → Papa" fond="#FFE3B8" encre="#7A4A20" />
        <Bulle p={[VX, Y_TOP + 11.2, VZ - 9]} w={34} h={12} texte="Je voudrais un fils parfait." type="bleue" ry={0} lueur={0.5} epaisseur={0.8} />
        {lueurPlan && <Lueur2 p={[VX, Y_TOP + 10, VZ - 12]} s={90} c="#FFFFFF" o={0.5} />}
        {/* silhouettes translucides des parents (souvenir) : halo chaud derrière */}
        {fantomes > 0 && <Lueur2 p={[VX - 4.7, Y_TOP + 2.8, VZ - 5.4]} s={20} c="#FFB870" o={0.8} />}
        {/* le panneau de confirmation et les deux boutons */}
        <Plan p={[VX, Y_TOP + 5.6, VZ + 2]} w={12} h={5.4} tex={texPanneau("Supprimer ce message ?", "Cette action est définitive.", 12, 5.4)} s={panS} opacite={pan} />
        {pan > 0.01 && (
          <>
            <group position={[VX - 3.3, Y_TOP + 1.2, VZ + 3.2]} scale={pan}>
              <Bloc p={[0, 0, 0]} s={[5.4, 2.2, 1.4]} c="#C4C8D6" />
              <Bloc p={[0, -1.0, 0]} s={[5.6, 0.4, 1.5]} c="#8E94A8" />
              <Plan p={[0, 0, 0.71]} w={5.2} h={1.95} tex={texBouton("Annuler", "#C4C8D6", "#2A3045", 5.2, 1.95)} />
            </group>
            <group position={[VX + 3.3, Y_TOP + 0.1, VZ + 3.2]} scale={pan * S}>
              <Lueur2 p={[0, 1.1, -0.6]} s={12} c="#FF3B3B" o={pulse} />
              <Bloc p={[0, 1.1, 0]} s={[5.4, 2.2, 1.4]} c="#E53935" />
              <Bloc p={[0, 0.1, 0]} s={[5.6, 0.4, 1.5]} c="#9A1C1C" />
              <Plan p={[0, 1.1, 0.71]} w={5.2} h={1.95} tex={texBouton("Supprimer", "#E53935", "#FFFFFF", 5.2, 1.95)} />
            </group>
          </>
        )}
        {gens}
        {sam && T >= ev.pixel0 && (
          <>
            <MainPixel a={sam} cote={-1} T={T} t0={ev.pixel0} frame={frame} seg={Math.min(4, 1 + Math.floor((T - ev.pixel0) / 1.2))} />
            <MainPixel a={sam} cote={1} T={T} t0={ev.pixel0 + 0.2} frame={frame} seg={Math.min(3, 1 + Math.floor((T - ev.pixel0) / 1.8))} />
          </>
        )}
        {T >= ev.pixel0 + 0.7 && T < ev.vision0 && <PoucePixel p={[VX + 3.3, Y_TOP + 3.9, VZ + 4.6]} T={T} frame={frame} peau={T_SAM.peau} s={1.7} k={entre(T, ev.pixel0 + 0.7, ev.pixel0 + 1.2)} />}
        <Eclats p={[SAM_V[0], SAM_V[1] + 1.5, SAM_V[2]]} T={T} t0={ev.pixel0 + 1.5} n={10} rayon={1.2} dur={1.6} taille={0.12} graine={5} monte={1.6} />
        {/* le sol et les nuages de lumière : rien d'autre que du blanc */}
        <group position={cam}>
          <Lueur2 p={[0, 40, -200]} s={500} c="#FFFFFF" o={0.65} ordre={-10} />
        </group>
      </>
    );
  }

  // =================================================================== RUE
  const avant = T < ev.rose;
  const vision = T >= ev.vision0;
  const front = mel(-120, 120, lisse(entre(T, ev.rose, ev.rose + 1.9)));
  const apres = T >= ev.rose + 1.95 && !vision;
  const vague = !avant && !apres && !vision;
  const rose = !avant && !vision;
  const planN = new THREE.Plane(new THREE.Vector3(0, 0, 1), -front); // reste normal : z > front
  const planR = new THREE.Plane(new THREE.Vector3(0, 0, -1), front); // devient rose : z < front
  const ch = etatChien(T, ev);
  const tz = TZ.rue;
  const regleB = { t0: ev.boul0, dur: 1.5, tR: ev.vision0, durR: 0.9 };
  const regleM = { t0: ev.maison0, dur: 1.6, tR: ev.vision0 + 0.45, durR: 0.9 };
  const rainK = T >= ev.pluie0 && T < ev.vision0;

  // bulles de la rue
  const bul = (e as EtatConte & { bul?: Partial<Record<"b3" | "g1" | "g2" | "g1b", V3>> }).bul ?? {};
  const bulles: React.ReactNode[] = [];
  const phone: V3 | null = sam ? repere(sam, [0, 1.9, 0.86]) : null;
  if (sam && phone) {
    // 3e message : « Le chien de ma voisine est guéri. » monte du téléphone, flotte, puis s'abat sur le chien et éclate
    const H3: V3 = [-9.0, 5.6, 14.4];
    const D3: V3 = [-9.5, 2.6, 20.4];
    if (T >= ev.bub3 && T < ev.gueri) {
      const k = lisse(entre(T, ev.bub3, ev.bub3 + 0.7));
      const dive = Math.pow(entre(T, ev.gueri - 0.5, ev.gueri), 2);
      let p = mel3(phone, H3, k);
      p = mel3(p, D3, dive);
      p = [p[0], p[1] + Math.sin(T * 2.4) * 0.1 * k, p[2]];
      bulles.push(<Bulle key="b3" p={p} w={8.6} h={2.8} texte={M2} type="bleue" s={(0.06 + 0.94 * freine(k)) * (1 - 0.4 * dive)} cam={cam} lueur={0.5} />);
    }
    // 4e message : « Tout redevient comme avant. » part dans le ciel
    if (T >= ev.envoi4 && T < ev.envoi4 + 1.0) {
      const u = entre(T, ev.envoi4, ev.envoi4 + 1.0);
      const p = mel3(phone, [-12, 14, 6], Math.pow(u, 1.4));
      bulles.push(<Bulle key="b4" p={p} w={8.2} h={2.7} texte={M3} type="bleue" s={Math.max(0.05, 1 - 0.8 * u)} cam={cam} lueur={0.4} opacite={1 - Math.pow(u, 2)} />);
    }
    // réponses système (grises)
    const G1: V3 = bul.g1 ?? [-9.6, 5.4, 9.0];
    const G2: V3 = bul.g2 ?? [-9.6, 5.2, 13.4];
    if (T >= ev.rep1 && T < ev.imp) {
      const u = entre(T, ev.rep1, ev.rep1 + 0.35);
      bulles.push(<Bulle key="g0" p={G1} w={4.6} h={2.2} type="grise" points={T} s={0.2 + 0.8 * freine(u)} cam={cam} lueur={0.2} />);
    }
    if (T >= ev.imp && T < ev.rep2) {
      const u = entre(T, ev.imp, ev.imp + 0.3);
      bulles.push(<Bulle key="g1" p={G1} w={6.6} h={2.4} texte="Impossible." type="grise" s={0.22 + 0.27 * freine(u)} cam={cam} lueur={0.25} />);
    }
    if (T >= ev.rep2 && T < ev.monte0) {
      const u = entre(T, ev.rep2, ev.rep2 + 0.4);
      bulles.push(<Bulle key="g2" p={G2} w={9.8} h={3.7} texte="Un seul message peut être supprimé." type="grise" s={0.4 + 0.65 * freine(u)} cam={cam} lueur={0.25} />);
      bulles.push(<Bulle key="g1b" p={bul.g1b ?? [-9.6, 9.0, 9.0]} w={5.6} h={2.1} texte="Impossible." type="grise" s={0.9} cam={cam} opacite={0.6} />);
    }
  }
  const sunDir: V3 = [-210, 46, -150];
  const nuage = rose ? "#FFD7EC" : "#FFFFFF";

  return (
    <>
      <group position={cam}>
        <Soleil dir={sunDir} couleur={rose ? "#FFD0A0" : "#FFF2B0"} halo={rose ? "#FF9ACB" : "#FFE0A0"} taille={rose ? 42 : 34} />
        <Nuages T={T} couleur={nuage} />
      </group>
      {/* sol, maisons, arbres : état normal, vague rose, ou rose (la vague balaie la rue d'un bout à l'autre) */}
      {(avant || vision) && (
        <>
          <Zone g={zones.rue} t={tz} />
          <Ombres g={zones.ombres} op={0.45} />
        </>
      )}
      {apres && (
        <>
          <Zone g={zones.rueRose} t={tz} />
          <Ombres g={zones.ombresRose} op={0.5} />
        </>
      )}
      {vague && (
        <>
          <ZoneClip g={zones.rue} t={tz} plan={planN} />
          <ZoneClip g={zones.rueRose} t={tz} plan={planR} />
          <Ombres g={zones.ombres} op={0.4} clip={planN} />
          <Ombres g={zones.ombresRose} op={0.38} clip={planR} />
          <mesh position={[0, 12, front]} renderOrder={7}>
            <planeGeometry args={[90, 26]} />
            <meshBasicMaterial color="#FFE3F6" transparent opacity={0.4} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
          </mesh>
        </>
      )}
      {EDIFICES.map((ed) => (
        <EdificeDyn key={ed.id} ed={ed} T={T} frame={frame} regle={ed.id === "boulangerie" ? regleB : regleM} frontZ={front} t={tz} rose={rose} />
      ))}
      {/* le chien */}
      <Chien e={ch} t={tz} />
      {T >= ev.gueri && T < ev.gueri + 1.2 && <Eclats p={[-9.6, 2.2, 20.2]} T={T} t0={ev.gueri} n={34} rayon={2.8} dur={1.2} taille={0.24} couleurs={["#FFE066", "#FFFFFF", "#7FC4FF"]} graine={4} monte={1.6} />}
      {T < ev.gueri && <Lueur2 p={[-9.6, 2.2, 20.2]} s={4.2} c="#9AAA70" o={0.18} />}
      {/* la maison de la voisine s'efface : la lueur de la réécriture */}
      {T >= ev.voisine0 - 0.1 && T < ev.voisine0 + 1.2 && <Eclats p={[LOPES[0], 2.2, LOPES[2]]} T={T} t0={ev.voisine0} n={30} rayon={2.4} dur={1.2} taille={0.22} graine={6} monte={2.0} />}
      {rainK && <Pluie T={T} t0={ev.pluie0} cam={cam} boite={[44, 56]} n={230} haut={30} vit={11} rampe={1.6} taille={0.95} xBorne={[-12, 12]} graine={7} />}
      {bulles}
      {telNode}
      {gens}
    </>
  );
};
void FEN;
void borne;
