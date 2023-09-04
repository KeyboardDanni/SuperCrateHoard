export class PictureData {
    private static numLoading = 0;
    private imageElement;

    constructor(source: string) {
        this.imageElement = new Image();
        this.imageElement.loading = "eager";
        PictureData.numLoading++;
        this.imageElement.onload = () => {
            PictureData.numLoading--;
        };
        this.imageElement.src = source;
    }

    image() {
        return this.imageElement;
    }

    static itemsLoading() {
        return this.numLoading;
    }
}

export class Picture {
    private static dataCache: { [id: string]: PictureData } = {};
    private pictureData: PictureData;

    constructor(source: string) {
        if (!Picture.dataCache[source]) {
            const newData = new PictureData(source);

            Picture.dataCache[source] = newData;
        }

        this.pictureData = Picture.dataCache[source];
    }

    sharedData() {
        return this.pictureData;
    }

    isLoaded() {
        return this.pictureData.image().complete;
    }

    static allLoaded() {
        return PictureData.itemsLoading() <= 0;
    }
}

export class PictureSlice {
    x: number;
    y: number;
    w: number;
    h: number;

    constructor(x: number, y: number, w: number, h: number) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
}

export class Renderer {
    private mainCanvas: HTMLCanvasElement;
    private drawingContext: CanvasRenderingContext2D;
    private alreadyWarned: { [id: string]: boolean } = {};

    constructor(canvasId: string) {
        this.mainCanvas = <HTMLCanvasElement>document.getElementById(canvasId);

        if (!this.mainCanvas || !this.mainCanvas.getContext) {
            throw new Error("Missing canvas");
        }

        const context = this.mainCanvas.getContext("2d");

        if (!context) {
            throw new Error("Could not create canvas context");
        }

        this.drawingContext = context;

        document.addEventListener("keydown", (event) => {
            if (event.altKey && event.code == "Enter" && !event.repeat) {
                this.toggleFullscreen();
            }
        });
    }

    private checkPictureLoaded(picture: Picture) {
        const src = picture.sharedData().image().src;

        if (!picture.isLoaded()) {
            if (!this.alreadyWarned[src]) {
                this.alreadyWarned[src] = true;
                console.warn(`Drawing unloaded picture: "${src}"`);
            }

            return false;
        }

        return true;
    }

    drawBackgroundColor(r: number, g: number, b: number, a: number = 1.0) {
        this.drawingContext.fillStyle = `rgb(${r}, ${g}, ${b}, ${a})`;
        this.drawingContext.fillRect(
            -1,
            -1,
            this.mainCanvas.width + 2,
            this.mainCanvas.height + 2
        );
    }

    drawPicture(picture: Picture, x: number, y: number) {
        if (this.checkPictureLoaded(picture)) {
            this.drawingContext.drawImage(picture.sharedData().image(), x, y);
        }
    }

    drawSprite(picture: Picture, slice: PictureSlice, x: number, y: number) {
        if (this.checkPictureLoaded(picture)) {
            this.drawingContext.drawImage(
                picture.sharedData().image(),
                slice.x,
                slice.y,
                slice.w,
                slice.h,
                Math.round(x),
                Math.round(y),
                slice.w,
                slice.h
            );
        }
    }

    drawText(
        text: string,
        x: number,
        y: number,
        font: string,
        style: string,
        maxWidth = -1
    ) {
        this.drawingContext.font = font;
        this.drawingContext.fillStyle = style;

        const metrics = this.drawingContext.measureText(" ");
        const lineHeight = Math.ceil(
            (metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent) *
                1.1
        );

        if (maxWidth > 0) {
            text = this.computeWordWrap(text, maxWidth);
        }

        const lines = text.split("\n");

        for (const line of lines) {
            this.drawingContext.fillText(line, x, y);
            y += lineHeight;
        }
    }

    computeWordWrap(text: string, maxWidth: number) {
        let wrapped = "";
        const words = text.split(" ");
        let currentLine = words[0] ?? "";

        for (let i = 1; i < words.length; ++i) {
            const word = words[i];
            const metrics = this.drawingContext.measureText(
                currentLine + " " + word
            );

            if (metrics.width > maxWidth) {
                wrapped += currentLine + "\n";
                currentLine = word;
            } else {
                currentLine += " " + word;
            }
        }
        wrapped += currentLine;

        return wrapped;
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.mainCanvas.requestFullscreen({ navigationUI: "hide" });
        } else {
            document.exitFullscreen();
        }
    }

    canvas() {
        return this.mainCanvas;
    }

    context() {
        return this.drawingContext;
    }
}
