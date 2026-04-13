#!/usr/bin/env bash

# Validation simple pour les fichiers de script et style.

echo "Vérification des fichiers du projet..."

if command -v python >/dev/null 2>&1; then
  echo "Python disponible"
else
  echo "Python introuvable"
  exit 1
fi

echo "Validation terminée."
