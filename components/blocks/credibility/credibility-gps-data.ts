export const GPS_BRANDS = [
  { name: "Adidas", file: "adidas.svg", width: 5 },
  { name: "DoorDash", file: "doordash.svg", width: 10 },
  { name: "Square", file: "square.webp", width: 10 },
  { name: "Synthesia", file: "synthesia.svg", width: 12 },
  { name: "Deel", file: "deel.svg", width: 7 },
  { name: "MUBI", file: "mubi.webp", width: 8 },
  { name: "Reformation", file: "reformation.svg", width: 14 },
] as const;

/** Shared by the visible 3D path and each logo's dot. */
export function gpsOrbitPoint(angle: number, compact: boolean) {
  return {
    x: Math.cos(angle) * (compact ? 0.35 : 0.39),
    y: Math.sin(angle) * (compact ? 0.33 : 0.32) + Math.cos(angle) * 0.045,
    depth: Math.sin(angle),
  };
}

// One world-space transform for the WebGL paths and their DOM logo waypoints.
// Rotate around Y, X, then Z; keep the wordmarks upright for legibility.
export function gpsOrbitMatrix(pointer: { x: number; y: number }) {
  const yaw = pointer.x * 0.16;
  const pitch = pointer.y * 0.14;
  const roll = -pointer.x * 0.045;
  const cy = Math.cos(yaw),
    sy = Math.sin(yaw);
  const cx = Math.cos(pitch),
    sx = Math.sin(pitch);
  const cz = Math.cos(roll),
    sz = Math.sin(roll);
  return [
    cz * cy - sz * sx * sy,
    sz * cy + cz * sx * sy,
    -cx * sy,
    0,
    -sz * cx,
    cz * cx,
    sx,
    0,
    cz * sy + sz * sx * cy,
    sz * sy - cz * sx * cy,
    cx * cy,
    0,
    0,
    0,
    0,
    1,
  ];
}

export function projectGpsOrbit(
  point: ReturnType<typeof gpsOrbitPoint>,
  aspect: number,
  matrix: number[],
) {
  const x = point.x * aspect * 7.5;
  const y = -point.y * 7.5;
  const z = point.depth * 1.6;
  return {
    x: (matrix[0] * x + matrix[4] * y + matrix[8] * z) / (aspect * 7.5),
    y: -(matrix[1] * x + matrix[5] * y + matrix[9] * z) / 7.5,
    depth: Math.max(
      -1,
      Math.min(1, (matrix[2] * x + matrix[6] * y + matrix[10] * z) / 1.6),
    ),
  };
}

export const gpsLogoScale = (depth: number) => 0.66 + depth * 0.34;

/** Equal screen-space arc lengths, so an ellipse doesn't bunch up the logos. */
export function createGpsOrbit(width: number, height: number) {
  const segments = 720;
  const compact = width < 700;
  const lengths = new Float64Array(segments + 1);
  let previous = gpsOrbitPoint(0, compact);
  for (let i = 1; i <= segments; i++) {
    const point = gpsOrbitPoint((i / segments) * Math.PI * 2, compact);
    lengths[i] =
      lengths[i - 1] +
      Math.hypot(
        (point.x - previous.x) * width,
        (point.y - previous.y) * height,
      );
    previous = point;
  }
  return (index: number, elapsed: number) => {
    const distance =
      ((index / GPS_BRANDS.length + elapsed / 42 + 0.66) % 1) *
      lengths[segments];
    let low = 0,
      high = segments;
    while (high - low > 1) {
      const mid = (low + high) >>> 1;
      if (lengths[mid] < distance) low = mid;
      else high = mid;
    }
    const progress =
      (distance - lengths[low]) / Math.max(0.001, lengths[high] - lengths[low]);
    return gpsOrbitPoint(((low + progress) / segments) * Math.PI * 2, compact);
  };
}
