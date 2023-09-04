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

export function stringListToString(lines: string[]) {
    if (lines.length <= 0) {
        return "";
    }

    let text = "";

    for (const line of lines) {
        text += line + "\n";
    }

    return text.slice(0, -1);
}
