export class PictureData {
    private imageElement;
    
    constructor(source: string) {
        this.imageElement = new Image();
        this.imageElement.loading = "eager";
        this.imageElement.src = source;
    }

    image() {
        return this.imageElement;
    }

    async waitForLoad() {
        await this.imageElement.decode();
    }
}

export class Picture {
    private static dataCache: {[id: string]: PictureData} = {};
    private pictureData : PictureData;

    constructor(source: string) {
        if (!Picture.dataCache[source]) {
            let newData = new PictureData(source);

            Picture.dataCache[source] = newData;
        }

        this.pictureData = Picture.dataCache[source];
    }

    sharedData() {
        return this.pictureData;
    }

    static waitForLoad() {
        for (const data of Object.values(Picture.dataCache)) {
            data.waitForLoad();
        }
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

    constructor(canvasId: string) {
        this.mainCanvas = <HTMLCanvasElement>(
            document.getElementById(canvasId)
        );

        if (!this.mainCanvas || !this.mainCanvas.getContext) {
            throw new Error("Missing canvas");
        }

        const context = this.mainCanvas.getContext("2d");

        if (!context) {
            throw new Error("Could not create canvas context");
        }

        this.drawingContext = context;
    }

    drawBackgroundColor(r: number, g: number, b: number, a: number = 1.0) {
        this.drawingContext.fillStyle = `rgb(${r}, ${g}, ${b}, ${a})`;
        this.drawingContext.fillRect(-1, -1, this.mainCanvas.width + 2, this.mainCanvas.height + 2);
    }

    drawPicture(picture: Picture, x: number, y: number) {
        this.drawingContext.drawImage(picture.sharedData().image(), x, y);
    }

    drawSprite(picture: Picture, slice: PictureSlice, x: number, y: number) {
        this.drawingContext.drawImage(picture.sharedData().image(), slice.x, slice.y, slice.w, slice.h, x, y, slice.w, slice.h);
    }

    canvas() {
        return this.mainCanvas;
    }

    context() {
        return this.drawingContext;
    }
}
