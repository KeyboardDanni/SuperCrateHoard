export interface Position {
    x: number;
    y: number;
}

export function clamp(value: number, low: number, high: number) {
    return Math.max(Math.min(value, high), low);
}

export function distance(deltaX: number, deltaY: number) {
    return Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
}

export function lerp(start: number, end: number, ratio: number) {
    if (ratio <= 0) {
        return start;
    } else if (ratio >= 1) {
        return end;
    }

    return start + ratio * (end - start);
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
