#!/usr/bin/env bash
# Régénère le DOCX du Dossier Professionnel depuis le Markdown.
# Applique la mise en forme imposée : Calibri 12, interligne 1,5, justifié,
# titres <= 16, sommaire cliquable, images de docs/images/ embarquées.
#
# Usage :  cd docs && ./build-docx.sh
# Prérequis : pandoc, python3 + python-docx (pip install python-docx).
set -euo pipefail
cd "$(dirname "$0")"

SRC="DOSSIER-PROFESSIONNEL.md"
OUT="DOSSIER-PROFESSIONNEL.docx"

pandoc "$SRC" -o "$OUT" --toc --toc-depth=3

python3 - "$OUT" <<'PY'
import sys, docx
from docx.shared import Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH as A
from docx.oxml.ns import qn

path = sys.argv[1]
doc = docx.Document(path)

normal = doc.styles["Normal"]
normal.font.name = "Calibri"; normal.font.size = Pt(12)
rpr = normal.element.get_or_add_rPr(); rfonts = rpr.get_or_add_rFonts()
for a in ("w:ascii", "w:hAnsi", "w:cs"): rfonts.set(qn(a), "Calibri")
normal.paragraph_format.line_spacing = 1.5
normal.paragraph_format.alignment = A.JUSTIFY

for name, sz in {"Heading 1": 16, "Heading 2": 14, "Heading 3": 13, "Title": 16}.items():
    try:
        st = doc.styles[name]; st.font.name = "Calibri"; st.font.size = Pt(sz)
    except KeyError:
        pass

for p in doc.paragraphs:
    sn = p.style.name or ""
    p.paragraph_format.line_spacing = 1.5
    if not (sn.startswith("Heading") or sn.startswith("Title") or sn.startswith("TOC")):
        p.alignment = A.JUSTIFY

doc.save(path)
print("DOCX régénéré :", path)
PY
echo "OK -> $OUT"
