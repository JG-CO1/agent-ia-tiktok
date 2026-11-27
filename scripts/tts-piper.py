#!/usr/bin/env python3
"""
Voix locale (Piper, hors ligne) avec minutage mot à mot EXACT (alignement phonème → échantillons du modèle).

Entrée (stdin, JSON) : {"scenes": [{"texte": "...", "rythme": 1.0}], "sortie": "voix-brute.wav",
                        "reglages": {"length_scale": 1.0, "noise_scale": 0.75, "noise_w_scale": 0.9,
                                     "pause_phrase": 0.34, "pause_virgule": 0.12, "pause_scene": 0.22}}
Sortie (stdout, JSON) : {"mots": [{"texte", "debut", "fin", "scene"}], "duree": s}
« rythme » < 1 = diction plus rapide pour la scène (accélération avant le twist), > 1 = plus lente.
Chaque phrase est synthétisée séparément : on connaît exactement ses mots écrits, et les groupes de phonèmes séparés par
l'espace du modèle donnent le début/fin de chaque mot. Si les nombres diffèrent (mot composé), répartition proportionnelle
aux lettres DANS la phrase (erreur < 0,1 s).
"""
import json
import re
import sys
import wave
from pathlib import Path

import numpy as np
from piper import PiperVoice, SynthesisConfig

RACINE = Path(__file__).resolve().parent.parent
MODELE = RACINE / "models" / "tts" / "vits-piper-fr_FR-siwis-medium"
SR = 22050
PONCT = re.compile(r"^[«»\"“”?!:;.,…\-–—()]+$")


def phrases(texte: str) -> list[str]:
    """Découpe en phrases (après . ! ? …), guillemets fermants conservés avec la phrase."""
    morceaux = re.split(r"(?<=[.!?…])\s+(?=[«\"“A-ZÀÂÉÈÊÎÔÙÛÇ0-9])", texte.strip())
    return [m for m in morceaux if m.strip()]


def main() -> None:
    spec = json.load(sys.stdin)
    reg = {"length_scale": 1.0, "noise_scale": 0.75, "noise_w_scale": 0.9, "pause_phrase": 0.34, "pause_virgule": 0.12, "pause_scene": 0.22}
    reg.update(spec.get("reglages") or {})
    voix = PiperVoice.load(
        str(MODELE / "fr_FR-siwis-medium.onnx"),
        config_path=str(MODELE / "fr_FR-siwis-medium.onnx.json"),
        espeak_data_dir=str(MODELE / "espeak-ng-data"),
        include_alignments=True,
    )
    audio: list[np.ndarray] = []
    mots: list[dict] = []
    t = 0.0

    def silence(d: float) -> None:
        nonlocal t
        if d > 0:
            audio.append(np.zeros(int(d * SR), dtype=np.int16))
            t += d

    for si, sc in enumerate(spec["scenes"]):
        rythme = float(sc.get("rythme", 1.0))
        cfg = SynthesisConfig(length_scale=reg["length_scale"] * rythme, noise_scale=reg["noise_scale"], noise_w_scale=reg["noise_w_scale"])
        for ph in phrases(sc["texte"]):
            jetons = ph.split()
            # mots « vrais » (ceux qui se prononcent) et ponctuation seule (« ? », « » »…), rattachée au mot précédent
            vrais = [j for j in jetons if not PONCT.match(j)]
            groupes: list[tuple[int, int]] = []
            morceaux: list[np.ndarray] = []
            decalage = 0
            for chunk in voix.synthesize(ph, cfg, include_alignments=True):
                al = chunk.phoneme_alignments
                if not al:
                    raise SystemExit("alignement indisponible (installer le paquet « onnx »)")
                pos = 0
                debut = None
                fin = 0
                for a in al:
                    n = int(a.num_samples)
                    if a.phoneme in ("^", "$"):
                        pos += n
                        continue
                    if a.phoneme == " ":
                        if debut is not None:
                            groupes.append((decalage + debut, decalage + fin))
                            debut = None
                        pos += n
                        continue
                    if debut is None:
                        debut = pos
                    pos += n
                    fin = pos
                if debut is not None:
                    groupes.append((decalage + debut, decalage + fin))
                morceaux.append(chunk.audio_int16_array)
                decalage += len(chunk.audio_int16_array)
            pcm = np.concatenate(morceaux)
            if len(groupes) != len(vrais):
                base = groupes[0][0] if groupes else 0
                total = (groupes[-1][1] - base) if groupes else len(pcm)
                lettres = sum(len(x) for x in vrais) or 1
                cur = 0
                groupes = []
                for tok in vrais:
                    d = base + total * cur / lettres
                    cur += len(tok)
                    groupes.append((int(d), int(base + total * cur / lettres)))
            gi = 0
            dernier_fin = t
            for tok in jetons:
                if PONCT.match(tok):
                    mots.append({"texte": tok, "debut": dernier_fin, "fin": dernier_fin, "scene": si})
                else:
                    d, f = groupes[gi]
                    gi += 1
                    dernier_fin = t + f / SR
                    mots.append({"texte": tok, "debut": t + d / SR, "fin": dernier_fin, "scene": si})
            audio.append(pcm)
            t += len(pcm) / SR
            silence(reg["pause_phrase"] if re.search(r"[.!?…][»\"”]?$", jetons[-1]) else reg["pause_virgule"])
        silence(reg["pause_scene"])

    pcm = np.concatenate(audio)
    sortie = Path(spec["sortie"])
    with wave.open(str(sortie), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    json.dump({"mots": mots, "duree": len(pcm) / SR}, sys.stdout)


if __name__ == "__main__":
    main()
