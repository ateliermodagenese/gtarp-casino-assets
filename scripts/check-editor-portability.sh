#!/bin/bash
#
# check-editor-portability.sh
#
# EM PALAVRAS SIMPLES: roda esse script pra confirmar que o editor
# nao depende de nada do casino. Se passar, pode copiar pra outro
# projeto.
#
# TECNICAMENTE: grep recursivo nos paths do editor procurando
# imports proibidos. Falha (exit 1) se achar qualquer um.
#
# USO: bash scripts/check-editor-portability.sh
#

set -e

EDITOR_PATHS=(
  "components/editor"
  "app/editor"
  "app/api/editor"
  "editor.config.ts"
)

# Imports proibidos (deps do casino que nao podem aparecer no editor)
FORBIDDEN_IMPORTS=(
  "@/components/casino"
  "@/contexts/CasinoContext"
  "@/hooks/use-casino"
  "@/lib/games"
)

echo "Verificando portabilidade do editor..."
echo ""

ANY_VIOLATION=0

for forbidden in "${FORBIDDEN_IMPORTS[@]}"; do
  for path in "${EDITOR_PATHS[@]}"; do
    if [ -e "$path" ]; then
      if grep -rn "from \"$forbidden" "$path" 2>/dev/null | grep -v "^Binary file" > /tmp/editor-portability-check.txt; then
        if [ -s /tmp/editor-portability-check.txt ]; then
          echo "ERRO: import proibido encontrado:"
          echo "  Pattern: $forbidden"
          echo "  Em: $path"
          cat /tmp/editor-portability-check.txt
          echo ""
          ANY_VIOLATION=1
        fi
      fi
    fi
  done
done

rm -f /tmp/editor-portability-check.txt

if [ $ANY_VIOLATION -eq 0 ]; then
  echo "OK: editor portavel — zero deps do casino encontradas"
  echo ""
  echo "Pra copiar pra outro projeto:"
  echo "  1. cp -r app/editor components/editor app/api/editor editor.config.ts <novo-projeto>/"
  echo "  2. cp scripts/check-editor-portability.sh <novo-projeto>/scripts/"
  echo "  3. Instalar deps: npm i react-konva konva use-image react-konva-utils zustand zundo"
  echo "  4. Editar EDITOR_TARGETS no editor.config.ts pra refletir alvos do novo projeto"
  exit 0
else
  echo ""
  echo "FALHA: editor nao esta portavel. Remova os imports listados acima."
  exit 1
fi
