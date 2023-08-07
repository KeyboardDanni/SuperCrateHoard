export function lerp(a : number, b : number, ratio : number) {
    return a + ratio * (b - a);
}