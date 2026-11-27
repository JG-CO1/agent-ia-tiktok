/** Petites pièces de décor propres à « messages » (arbres en blocs aux couleurs réglables) + rappels du socle commun. */
import { Batisseur, type V3 } from "../../geo";

export { cloture, lampadaire, maisonSimple } from "../../minuit/monde";

/** Arbre en blocs : tronc brun, trois gros cubes de feuillage (couleurs réglables : normal ou bonbon). */
export function arbreVoxel(b: Batisseur, x: number, z: number, s = 1, c1 = "#3FB36A", c2 = "#5AD18F", ry = 0.3) {
  b.dans([x, 0, z], ry, () => {
    b.boite([0, 1.0 * s, 0], [0.55 * s, 2.0 * s, 0.55 * s], "#8A5A36");
    b.boite([0, 3.0 * s, 0], [2.6 * s, 2.3 * s, 2.6 * s], c1);
    b.boite([0.25 * s, 4.5 * s, -0.15 * s], [1.7 * s, 1.5 * s, 1.7 * s], c2);
    b.boite([-1.2 * s, 2.7 * s, 0.6 * s], [1.0 * s, 1.1 * s, 1.0 * s], c2);
  });
}
export type { V3 };
