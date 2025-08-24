// Create image optimization utility
export const optimizeImageUrl = (url, width = 800, quality = 60) => {
  if (url.includes('unsplash.com')) {
    return url
      .replace(/w=\d+/, `w=${width}`)
      .replace(/q=\d+/, `q=${quality}`)
      .replace('auto=format', 'auto=format&fm=webp');
  }
  return url;
};

export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};