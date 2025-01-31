const D90 = Math.PI * 0.5;
const D180 = Math.PI;
// const D270 = Math.PI * 1.5;
const D360 = Math.PI * 2;

/**
 * 直角坐标转经纬度
 * @param x
 * @param y
 * @param z
 * @returns 经纬度 `lat = [-90, 90]`, `lng = [0, 360)`
 */
export function xyz2latlnt(x: number, y: number, z: number): [number, number] {
  const absx = Math.abs(x);
  const absy = Math.abs(y);
  const absxy = Math.sqrt(absx * absx + absy * absy);

  const lat = Math.atan2(z, absxy);
  let lng = Math.atan2(y, x);
  if (lng < 0) lng += D360;

  return [lat, lng];
}

export enum Face {
  'FRONT',
  'BACK',
  'RIGHT',
  'LEFT',
  'UP',
  'DOWN',
}

/**
 * 获取立方体面坐标对应的经纬度
 * @param face 立方体面
 * @param u 对应的横坐标
 * @param v 对应的纵坐标
 */
export function uv2latlnt(face: Face, u: number, v: number) {
  switch (face) {
    case Face.FRONT:
      // FRONT
      return xyz2latlnt(-1, -u, v);
    case Face.BACK:
      // BACK
      return xyz2latlnt(1, u, v);
    case Face.RIGHT:
      // RIGHT
      return xyz2latlnt(u, -1, v);
    case Face.LEFT:
      // LEFT
      return xyz2latlnt(-u, 1, v);
    case Face.UP:
      // UP
      return xyz2latlnt(-v, -u, -1);
    case Face.DOWN:
      // DOWN
      return xyz2latlnt(v, -u, 1);
    // no defalut
  }
}

/**
 * 球面全景图转正方体六面图
 * @param image 球面全景图
 * @param face 输出的立方体面
 * @param size 输出图片大小
 */
export function sphereImage2boxImage(
  image: HTMLImageElement,
  face: Face,
  size?: number,
) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return Promise.reject();

  const width = image.width;
  const height = image.height;
  const outSize = size || Math.min(width / 4, height / 2);

  canvas.width = canvas.height = outSize;

  const coord2scale = (coord: number) => coord / (outSize / 2) - 1;
  const scale2width = (lng: number) => Math.floor((lng / D360) * width);
  const scale2height = (lat: number) => Math.floor((lat / D180) * height);

  for (let u = 0; u < outSize; u++) {
    for (let v = 0; v < outSize; v++) {
      const [lat, lng] = uv2latlnt(face, coord2scale(u), coord2scale(v));
      const w = scale2width(lng);
      const h = scale2height(lat + D90);
      context.drawImage(image, w, h, 1, 1, u, v, 1, 1);
    }
  }

  return canvas2image(canvas);
}

/**
 * 从 canvas 中导出图片
 */
export function canvas2image(canvas: HTMLCanvasElement) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return;

      const reader = new FileReader();
      reader.addEventListener('error', reject);
      reader.addEventListener('load', () => {
        const image = new Image();
        image.addEventListener('error', reject);
        image.addEventListener('load', () => resolve(image));
        image.src = reader.result as string;
      });
      reader.readAsDataURL(blob);
    });
  });
}
