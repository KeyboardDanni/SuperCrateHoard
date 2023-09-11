export class Point {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

export function clamp(value: number, low: number, high: number) {
    return Math.max(Math.min(value, high), low);
}

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

export function fetchAndReadJson(path: string) {
    const promise = fetch(path).then((response) => {
        if (!response.ok) {
            throw Error(`HTTP response ${response.status}: ${response.statusText}`);
        }

        return response.json();
    });

    return promise;
}
