export function lerp(a: number, b: number, ratio: number) {
    if (ratio <= 0) {
        return a;
    } else if (ratio >= 1) {
        return b;
    }

    return a + ratio * (b - a);
}

export function centered(inner: number, outer: number) {
    return (outer - inner) / 2;
}
