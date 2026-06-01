import argparse
from pathlib import Path

from processor import (
    build_output,
    clean_data,
    compute_vat,
    detect_anomalies,
    load_file,
    validate,
)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Automatisation de préparation comptable TikTok / Shopify"
    )
    parser.add_argument("input", help="Chemin vers le fichier CSV ou Excel")
    parser.add_argument(
        "--country",
        choices=["France", "Non-France"],
        default="France",
        help="Pays utilisé pour la logique TVA",
    )
    parser.add_argument(
        "--output", default="output.xlsx", help="Chemin du fichier Excel de sortie"
    )
    args = parser.parse_args()

    raw = load_file(args.input)
    cleaned = clean_data(raw)
    with_vat = compute_vat(cleaned, args.country)
    out = build_output(with_vat)
    anomalies = detect_anomalies(cleaned, out, args.country)
    report = validate(out, anomalies)

    out.to_excel(args.output, index=False)
    print(f"Fichier généré : {Path(args.output).resolve()}")
    print("Rapport de validation :", report)
    if anomalies:
        print(f"Anomalies détectées : {len(anomalies)}")
        for a in anomalies:
            print(f"  [{a['severity']}] {a['code']} — {a['message']} ({len(a['rows'])} ligne(s))")


if __name__ == "__main__":
    main()
