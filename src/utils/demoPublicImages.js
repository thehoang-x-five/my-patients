const publicImageModules = import.meta.glob(
  "../../public/*.{jpg,jpeg,png,webp,avif}",
  { eager: true, import: "default" }
);

const excludedImageNames = new Set([
  "avata.png",
  "favicon.ico",
  "loc.png",
  "vite.svg",
]);

function getFileName(path) {
  return String(path || "").split("/").pop() || "";
}

function sortByFileName([pathA], [pathB]) {
  const fileA = getFileName(pathA).toLowerCase();
  const fileB = getFileName(pathB).toLowerCase();

  const numberA = Number.parseInt(fileA, 10);
  const numberB = Number.parseInt(fileB, 10);
  const hasNumberA = Number.isFinite(numberA);
  const hasNumberB = Number.isFinite(numberB);

  if (hasNumberA && hasNumberB) return numberA - numberB;
  if (hasNumberA) return -1;
  if (hasNumberB) return 1;
  return fileA.localeCompare(fileB);
}

const demoPublicImages = Object.entries(publicImageModules)
  .filter(([path]) => !excludedImageNames.has(getFileName(path).toLowerCase()))
  .sort(sortByFileName)
  .map(([, url]) => url)
  .filter(Boolean);

function hashString(value) {
  const text = String(value || "").trim();
  if (!text) return 0;

  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function getDemoPublicImage(item, fallbackKey = "") {
  if (!demoPublicImages.length) return null;

  const key =
    item?.maNhanVien ||
    item?.maNhanSu ||
    item?.tenDangNhap ||
    item?.username ||
    item?.maPhong ||
    item?.id ||
    item?.room?.id ||
    item?.room?.number ||
    item?.hoTen ||
    item?.name ||
    item?.tenKhoa ||
    item?.deptName ||
    fallbackKey;

  const index = hashString(key) % demoPublicImages.length;
  return demoPublicImages[index];
}

export function getDemoPublicImages() {
  return demoPublicImages;
}
