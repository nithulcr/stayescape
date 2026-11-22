import { imageConstraints } from "../config.ts";

type ImageMime = (typeof imageConstraints.acceptedTypes)[number];

export type ValidatedImage = {
  bytes: Uint8Array;
  contentType: ImageMime;
  extension: string;
  fileName: string;
  width: number | null;
  height: number | null;
};

export type ImageValidationResult =
  | { ok: true; image: ValidatedImage }
  | { ok: false; error: string };

const imageExtensions: Record<ImageMime, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

function ascii(bytes: Uint8Array, start: number, end: number) {
  let value = "";
  for (let index = start; index < end && index < bytes.length; index += 1) {
    value += String.fromCharCode(bytes[index]);
  }
  return value;
}

function uint16(bytes: Uint8Array, offset: number) {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function uint24Le(bytes: Uint8Array, offset: number) {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}

function detectMime(bytes: Uint8Array): ImageMime | null {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length > 8 &&
    bytes[0] === 0x89 &&
    ascii(bytes, 1, 4) === "PNG" &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (bytes.length > 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") {
    return "image/webp";
  }
  if (bytes.length > 12 && ascii(bytes, 4, 8) === "ftyp") {
    const brand = ascii(bytes, 8, 12);
    if (brand === "avif" || brand === "avis" || ascii(bytes, 8, 16).startsWith("avif")) {
      return "image/avif";
    }
  }
  return null;
}

function jpegDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  let offset = 2;
  const sofMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  while (offset < bytes.length - 9) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    while (bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset];
    offset += 1;
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (marker === 0xd9 || offset + 2 > bytes.length) break;
    const segmentLength = uint16(bytes, offset);
    if (sofMarkers.has(marker)) {
      return { height: uint16(bytes, offset + 3), width: uint16(bytes, offset + 5) };
    }
    if (segmentLength < 2) break;
    offset += segmentLength;
  }
  return null;
}

function webpDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  const chunk = ascii(bytes, 12, 16);
  if (chunk === "VP8X" && bytes.length >= 30) {
    return { width: uint24Le(bytes, 24) + 1, height: uint24Le(bytes, 27) + 1 };
  }
  if (chunk === "VP8L" && bytes.length >= 25) {
    const bits = bytes[21] | (bytes[22] << 8) | (bytes[23] << 16) | (bytes[24] << 24);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (chunk === "VP8 ") {
    for (let index = 20; index < bytes.length - 10; index += 1) {
      if (bytes[index] === 0x9d && bytes[index + 1] === 0x01 && bytes[index + 2] === 0x2a) {
        return { width: uint16(bytes, index + 6) & 0x3fff, height: uint16(bytes, index + 8) & 0x3fff };
      }
    }
  }
  return null;
}

export async function validateImageUpload(file: File): Promise<ImageValidationResult> {
  if (file.size === 0) {
    return { ok: false, error: "The selected image is empty." };
  }
  if (file.size > imageConstraints.maxBytes) {
    return { ok: false, error: "Images must be 5 MB or smaller." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const contentType = detectMime(bytes);
  if (!contentType || !imageConstraints.acceptedTypes.includes(contentType)) {
    return { ok: false, error: "Use a valid JPG, PNG, WebP or AVIF image." };
  }
  if (file.type && file.type !== contentType) {
    return { ok: false, error: "The image type does not match its contents." };
  }

  let width: number | null = null;
  let height: number | null = null;
  if (contentType === "image/jpeg") {
    const dimensions = jpegDimensions(bytes);
    width = dimensions?.width ?? null;
    height = dimensions?.height ?? null;
    if (!width || !height) {
      return { ok: false, error: "The JPG image could not be read." };
    }
  } else if (contentType === "image/png" && bytes.length >= 24) {
    width = uint16(bytes, 16);
    height = uint16(bytes, 20);
    if (!width || !height) {
      return { ok: false, error: "The PNG image could not be read." };
    }
  } else if (contentType === "image/webp") {
    const dimensions = webpDimensions(bytes);
    width = dimensions?.width ?? null;
    height = dimensions?.height ?? null;
    if (!width || !height) {
      return { ok: false, error: "The WebP image could not be read." };
    }
  }

  const extension = imageExtensions[contentType];
  const fileName =
    file.name
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9._-]+/g, "_")
      .replace(/^\.+/, "")
      .slice(0, 120) || `image.${extension}`;

  return {
    ok: true,
    image: { bytes, contentType, extension, fileName, width, height },
  };
}
