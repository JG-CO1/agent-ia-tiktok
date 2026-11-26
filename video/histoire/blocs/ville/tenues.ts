/** Tenues de la ville : le joueur, les fêtards (couleurs qui tournent) et les métiers (facteur, boulanger, policier, maire). */
import type { Tenue } from "../avatar";

export const PEAU = ["#E6B98F", "#C99873", "#D9AE8B", "#B58463", "#F0C8A0"];
export const base = (haut: string, bas: string, peau: string, cheveux: string, extra: Partial<Tenue> = {}): Tenue => ({ genre: "figurant", peau, haut, bas, chaussures: "#1A1A1A", cheveux, ...extra });
export const TENUE_SPORTIF: Tenue = { genre: "sportif", peau: "#E6B98F", haut: "#F49A32", bas: "#1689E8", bas2: "#E6B98F", chaussures: "#FFFFFF", cheveux: "#252525", bandeau: "#FFFFFF" };
const FETARDS: Array<[string, string, string]> = [
  ["#E0546B", "#2B2F45", "#F5D142"],
  ["#3D7BD9", "#3A3F4A", "#E0546B"],
  ["#8E5BD0", "#2E3A52", "#4DD0A8"],
  ["#F2C230", "#403A4F", "#8E5BD0"],
  ["#43B58A", "#2B2F45", "#F08A3C"],
  ["#E86BA5", "#33364A", "#3D7BD9"],
  ["#F08A3C", "#2B2F45", "#43B58A"],
];
const CHEVEUX = ["#3A2A1E", "#C9A15A", "#252525", "#7A3B22", "#D8D8D8", "#5B3A8C"];
export const fetard = (i: number, chapeau = true): Tenue => {
  const [haut, bas, ch] = FETARDS[i % FETARDS.length];
  return base(haut, bas, PEAU[i % PEAU.length], CHEVEUX[(i * 5) % CHEVEUX.length], chapeau ? { chapeau: ch } : {});
};
export const TENUE_FACTEUR = base("#2F5DA8", "#252A3A", PEAU[0], "#3A2A1E", { casquette: "#2F5DA8", sac: "#C9A15A" });
export const TENUE_BOULANGER = base("#F2EFE8", "#8A7A62", PEAU[2], "#3A2A1E", { tablier: "#FFFFFF", casquette: "#FFFFFF" });
export const TENUE_POLICIER = base("#2A4F9C", "#1C2540", PEAU[1], "#252525", { casquette: "#1C2540", echarpe: "#F2C230" });
export const TENUE_MAIRE = base("#7A2E4D", "#2B2B3A", PEAU[3], "#D8D8D8", { echarpe: "#F2C230", chapeau: "#F5D142" });

