export const xyz2crd = (pos: { x: number; y: number; z: number }) => {
  const coords =
    localStorage.getItem('map') === 'map002'
      ? [pos.x / 8 + 80, pos.z / 8 + 224]
      : [pos.x / 8 + 128, pos.z / 8 + 160];

  return coords;
};
