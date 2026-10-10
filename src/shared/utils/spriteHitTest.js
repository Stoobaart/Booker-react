// Maps a pointer position to a pixel of the image file. The rect and the pointer are both
// viewport coords, so this holds at any game scale, transform or sprite-sheet frame.
export const toImagePixel = (rect, imageWidth, imageHeight, clientX, clientY) => {
  const x = Math.floor(((clientX - rect.left) / rect.width) * imageWidth);
  const y = Math.floor(((clientY - rect.top) / rect.height) * imageHeight);
  if (x < 0 || y < 0 || x >= imageWidth || y >= imageHeight) return null;
  return [x, y];
};

const alphaMaps = new Map();

const getAlphaMap = (img) => {
  const key = img.currentSrc || img.src;
  if (!alphaMaps.has(key)) {
    let map = null;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const context = canvas.getContext('2d');
      context.drawImage(img, 0, 0);
      map = context.getImageData(0, 0, canvas.width, canvas.height);
    } catch {
      // No canvas (jsdom) or a cross-origin image: fall back to the whole rectangle
    }
    alphaMaps.set(key, map);
  }
  return alphaMaps.get(key);
};

// True when the pointer is over a drawn pixel of the image rather than its transparent surround
export const isSpriteHit = (img, clientX, clientY) => {
  if (!img?.naturalWidth) return true;
  const map = getAlphaMap(img);
  if (!map) return true;
  const pixel = toImagePixel(img.getBoundingClientRect(), map.width, map.height, clientX, clientY);
  if (!pixel) return false;
  const [x, y] = pixel;
  return map.data[(y * map.width + x) * 4 + 3] > 0;
};
