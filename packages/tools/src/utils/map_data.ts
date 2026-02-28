export const calculateDistance = (coordinate1: number[], coordinate2: number[]) => {
  const x1 = coordinate1[0];
  const y1 = coordinate1[1];
  const x2 = coordinate2[0];
  const y2 = coordinate2[1];
  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
};

export const calculateXYZDistance = (
  xyz1: { x: number; y: number; z: number },
  xyz2: { x: number; y: number; z: number }
) => {
  return Math.sqrt(Math.pow(xyz1.x - xyz2.x, 2) + Math.pow(xyz1.z - xyz2.z, 2));
};
