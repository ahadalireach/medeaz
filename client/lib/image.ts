/**
 * Resize/compress an image File into a small base64 data URL.
 *
 * Avatars are stored inline (base64) and posted to the API. Vercel's
 * serverless functions cap request bodies at ~4.5MB, so an unscaled photo
 * (a 3MB image becomes ~4MB of base64) is rejected with a 400. Downscaling
 * to a modest max dimension keeps the payload tiny and avoids the error.
 *
 * @param file      the selected image file
 * @param maxSize   max width/height in px (default 512)
 * @param quality   JPEG quality 0-1 (default 0.85)
 */
export function fileToResizedDataUrl(
  file: File,
  maxSize = 512,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to load image"));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          // Fallback: return the original data URL if canvas is unavailable
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        // PNGs with transparency lose it here, but avatars are opaque; JPEG
        // gives the smallest payload.
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
