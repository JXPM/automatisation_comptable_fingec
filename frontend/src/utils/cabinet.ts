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
  adresse: "12 rue Exemple, 67000 Strasbourg",
  telephone: "",
  ordre: "Cabinet membre de l'Ordre des Experts-Comptables d'Alsace",
  contact: "contact@fingec.fr | www.fingec.fr",
};

// Logo hébergé publiquement (indispensable pour qu'il s'affiche dans les e-mails).
export const CABINET_LOGO = "https://raw.githubusercontent.com/fingec/fingec-assets/refs/heads/main/fing.png";

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
