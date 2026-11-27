#!/usr/bin/env bash
# Installe la voix locale (Piper, 100 % hors ligne ensuite) : environnement Python + modèle français « siwis ».
# Usage : bash scripts/installer-tts-local.sh
set -euo pipefail
cd "$(dirname "$0")/.."
python3 -m venv .venv-piper
.venv-piper/bin/pip install -q piper-tts onnx
if [ ! -f models/tts/vits-piper-fr_FR-siwis-medium/fr_FR-siwis-medium.onnx ]; then
  mkdir -p models/tts
  # modèle Piper français (licence : voir MODEL_CARD dans l'archive), paquet public du projet sherpa-onnx
  curl -fL -o models/tts/siwis.tar.bz2 https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-fr_FR-siwis-medium.tar.bz2
  tar xjf models/tts/siwis.tar.bz2 -C models/tts && rm models/tts/siwis.tar.bz2
fi
echo "TTS local prêt : .venv-piper + models/tts/vits-piper-fr_FR-siwis-medium"
