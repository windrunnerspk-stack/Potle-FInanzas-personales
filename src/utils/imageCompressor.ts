/**
 * Utilidad de compresión ultra-ligera en el cliente para fotos de facturas.
 * Reduce fotos móviles de 5MB-15MB a menos de 45KB mediante canvas HTML5,
 * evitando saturar la cuota de almacenamiento de localStorage y optimizando la velocidad.
 */
export async function comprimirImagen(
  fileOrDataUrl: File | string,
  maxWidth = 750,
  maxHeight = 750,
  calidad = 0.55
): Promise<string> {
  return new Promise((resolve) => {
    let srcUrl = '';
    let isBlobUrl = false;

    if (typeof fileOrDataUrl === 'string') {
      srcUrl = fileOrDataUrl;
    } else {
      srcUrl = URL.createObjectURL(fileOrDataUrl);
      isBlobUrl = true;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width <= 0 || height <= 0) {
          resolve(srcUrl);
          return;
        }

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: false });

        if (!ctx) {
          resolve(srcUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const comprimida = canvas.toDataURL('image/jpeg', calidad);

        if (isBlobUrl) {
          URL.revokeObjectURL(srcUrl);
        }

        resolve(comprimida);
      } catch (e) {
        console.warn('Fallback compresión:', e);
        resolve(srcUrl);
      }
    };

    img.onerror = () => {
      resolve(srcUrl);
    };

    img.src = srcUrl;
  });
}
