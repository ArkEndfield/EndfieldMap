export const xyz2crd = (pos: {x: number, y: number, z: number}) => {
    return [pos.x * 16 / 128 + 80, pos.z * 16 / 128 + 224]
}