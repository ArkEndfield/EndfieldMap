export const xyz2crd = (pos: {x: number, y: number, z: number}) => {
    return localStorage.getItem('map') === 'map002' ? [pos.x / 8 + 80, pos.z / 8 + 224] : [pos.x / 8 + 128, pos.z / 8 + 160]
}