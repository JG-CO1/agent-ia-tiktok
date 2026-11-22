/** « La fenêtre de minuit » : assemblage du décor et des personnages pour une image donnée. */
import React from "react";
import { Avatar, TENUE_DAME, TENUE_JOUEUR, poseMarche, type Tenue } from "../avatar";
import { orbite } from "../maths";
import { Decor, ObjetTenu } from "./Decor";
import { T_AUBE, T_NUIT_ACTEUR, type Etat } from "./etat";

export { PLANS } from "./plans";
export type { PlanDef, Ctx } from "./plans";

const FIGURANT_A: Tenue = { genre: "figurant", peau: "#E6B98F", haut: "#C9483F", bas: "#2B2F45", chaussures: "#1A1A1A", cheveux: "#3A2A1E" };
const FIGURANT_B: Tenue = { genre: "figurant", peau: "#C99873", haut: "#3D7BD9", bas: "#3A3F4A", chaussures: "#1A1A1A", cheveux: "#C9A15A" };

export const cielMinuit = (e: Etat) => (e.heure === "nuit" ? "#111D46" : "#8EC8EC");

export const MondeMinuit: React.FC<{ e: Etat; frame: number }> = ({ e, frame }) => {
  const tExt = e.heure === "nuit" ? T_NUIT_ACTEUR : T_AUBE;
  const t = frame / 30;
  return (
    <>
      <Decor e={e} frame={frame} />
      {e.joueur && (
        <Avatar p={e.joueur.p} ry={e.joueur.ry} pose={e.joueur.pose} tenue={TENUE_JOUEUR} emotion={e.joueur.emotion} frame={frame} graine={1} teinte={e.joueur.teinte ?? tExt}>
          {e.joueur.tenu ? <ObjetTenu o={e.joueur.tenu} t={e.joueur.teinte ?? tExt} /> : null}
        </Avatar>
      )}
      {e.dame && <Avatar p={e.dame.p} ry={e.dame.ry} pose={e.dame.pose} tenue={TENUE_DAME} emotion={e.dame.emotion} frame={frame} graine={5} teinte={e.dame.teinte ?? tExt} />}
      {e.figurants &&
        [FIGURANT_A, FIGURANT_B].map((tenue, i) => {
          // deux petits avatars qui marchent sur le trottoir du fond de la place
          const a = (i ? 1.95 : 1.2) + (i ? -1 : 1) * t * 0.12;
          const p = orbite([0, 0, 0], 7.65, a, 0.14);
          return <Avatar key={i} p={p} ry={a + (i ? -1 : 1) * (Math.PI / 2)} pose={poseMarche(t * 7 + i * 2, 0.8)} tenue={tenue} frame={frame} graine={7 + i} teinte={tExt} />;
        })}
    </>
  );
};
