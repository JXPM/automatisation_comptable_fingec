// Redimensionne une image (fichier choisi par l'utilisateur) en un petit carré
// encodé en data URL JPEG, prêt à être stocké tel quel en base. On reste léger
// (256 px, qualité 0,85) : quelques dizaines de Ko, suffisant pour un avatar.

const AVATAR_SIZE = 256;
const MAX_INPUT_BYTES = 8 * 1024 * 1024; // 8 Mo en entrée (avant redimensionnement)

export async function fileToAvatarDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Le fichier doit être une image.");
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("Image trop lourde (8 Mo max).");
  }

  const bitmap = await loadImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Impossible de traiter l'image.");

  // Recadrage centré « cover » : on remplit le carré sans déformer.
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);

  return canvas.toDataURL("image/jpeg", 0.85);
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image illisible."));
    };
    img.src = url;
  });
}
