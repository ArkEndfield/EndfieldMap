export const xyz2crd = (pos: {x: number, y: number, z: number}, map = 'map001') => {
    return map === 'map001' ? [pos.x / 8 + 128, pos.z / 8 + 160] : [pos.x / 8 + 80, pos.z / 8 + 224]
}