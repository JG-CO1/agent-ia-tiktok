#!/usr/bin/env python3
"""
Contrôle de synchronisation voix ↔ sous-titres SANS service externe : pour chaque mot qui suit une vraie pause (≥ 0,15 s),
on cherche dans l'audio de la voix l'instant où l'énergie remonte (attaque) et on le compare au début de mot du minutage
(qui pilote les sous-titres). Usage : .venv-piper/bin/python scripts/verifier-synchro.py <id> [<id>…]
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

SR = 16000
for id_ in sys.argv[1:]:
    d = Path("histoires/sorties") / id_
    m = json.loads((d / "minutage.json").read_text())
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(d / "voix.mp3"), "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True).stdout
    a = np.frombuffer(raw, np.int16).astype(float) / 32768
    e = np.sqrt(np.convolve(a * a, np.ones(160) / 160, "same"))  # énergie sur 10 ms
    seuil = 0.08 * e.max()
    mots = [w for w in m["mots"] if w["fin"] > w["debut"]]
    ecarts = []
    for p, w in zip(mots, mots[1:]):
        if w["debut"] - p["fin"] >= 0.15:
            i0 = int(max(0, w["debut"] - 0.25) * SR)
            i1 = int((w["debut"] + 0.25) * SR)
            seg = e[i0:i1]
            idx = np.argmax(seg > seuil) if (seg > seuil).any() else None
            if idx is not None and seg[0] < seuil:  # on cherche une vraie attaque après un silence
                ecarts.append(abs((i0 + idx) / SR - w["debut"]))
    ec = np.array(ecarts)
    ok = np.mean(e[: int(mots[0]["debut"] * SR) + 1] < seuil) if len(mots) else 0
    print(f"{id_} : {len(ec)} attaques comparées, écart médian {np.median(ec):.3f} s, p95 {np.percentile(ec, 95):.3f} s, max {ec.max():.3f} s")
