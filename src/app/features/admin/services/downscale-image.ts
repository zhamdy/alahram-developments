/**
 * Shrinks an image in the browser before it is uploaded.
 *
 * Uploads were stored as the originals the user picked: the homepage alone
 * referenced 81.6 MB across 48 files, individually 2.2–4.2 MB PNGs, and nothing
 * anywhere resized them. The Workers runtime cannot run sharp, so the resize has
 * to happen either here or in a paid image service.
 *
 * Never throws: an upload that cannot be shrunk is uploaded as-is.
 */
const MAX_WIDTH = 1600;
const QUALITY = 0.82;

// Formats where re-encoding would lose something the format is chosen for.
const SKIP_TYPES = ['image/svg+xml', 'image/gif'];

export async function downscaleImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || SKIP_TYPES.includes(file.type)) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_WIDTH / bitmap.width);

    // Already small enough, and re-encoding a WebP again only loses quality.
    if (scale === 1 && file.type === 'image/webp') {
      bitmap.close();
      return file;
    }

    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      bitmap.close();
      return file;
    }
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, 'image/webp', QUALITY),
    );
    if (!blob || blob.size >= file.size) {
      return file;
    }

    return new File([blob], replaceExtension(file.name, 'webp'), {
      type: 'image/webp',
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}

function replaceExtension(name: string, extension: string): string {
  const base = name.replace(/\.[^.]+$/, '');
  return `${base}.${extension}`;
}
