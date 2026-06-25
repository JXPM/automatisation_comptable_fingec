// Coordonnées du cabinet utilisées dans la signature des e-mails.
// Persistées en localStorage : éditables depuis l'app sans toucher au code.

export interface CabinetInfo {
  adresse: string;
  telephone: string;
  ordre: string;
  contact: string;
}

const KEY = "fingec_cabinet";

export const DEFAULT_CABINET: CabinetInfo = {
  adresse: "6 rue Frédéric Chopin, 67118 Geispolsheim",
  telephone: "",
  ordre: "Cabinet membre de l'Ordre des Experts-Comptables d'Alsace",
  contact: "contact@fingec.fr | www.fingec.fr",
};

// Logo hébergé publiquement (indispensable pour qu'il s'affiche dans les e-mails).
// Auto-hébergé sur notre domaine (fichier `public/fingec-logo-full.png`) plutôt
// que sur un dépôt externe : plus fiable et maîtrisé.
export const CABINET_LOGO = "https://app.fingec.fr/fingec-logo-full.png";

export function getCabinet(): CabinetInfo {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_CABINET, ...JSON.parse(raw) } : DEFAULT_CABINET;
  } catch {
    return DEFAULT_CABINET;
  }
}

export function saveCabinet(info: CabinetInfo) {
  localStorage.setItem(KEY, JSON.stringify(info));
}
