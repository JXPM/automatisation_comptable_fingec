import argparse
import pandas as pd
from src.processor import load_file, clean_data, compute_vat, build_output, validate


def main() -> None:
    parser = argparse.ArgumentParser(description="Automatisation de préparation comptable TikTok / Shopify")
    parser.add_argument("input", help="Chemin vers le fichier CSV ou Excel")
    parser.add_argument("--country", choices=["France", "Non-France"], default="France", help="Pays utilisé pour la logique TVA")
    parser.add_argument("--output", default="output.xlsx", help="Chemin du fichier Excel de sortie")
    args = parser.parse_args()

    df = load_file(args.input)
    df = clean_data(df)
    df = compute_vat(df, args.country)
    out = build_output(df)
    report = validate(out)

    out.to_excel(args.output, index=False)
    print(f"Fichier généré : {args.output}")
    print("Rapport de validation :", report)


if __name__ == "__main__":
    main()
