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
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;

    constructor() {
        this.canvas = <HTMLCanvasElement>(
            document.getElementById("game_surface")
        );

        if (!this.canvas || !this.canvas.getContext) {
            throw new Error("Missing canvas");
        }

        const context = this.canvas.getContext("2d");

        if (!context) {
            throw new Error("Could not create canvas context");
        }

        this.context = context;
    }

    drawBackgroundColor(r: number, g: number, b: number, a: number = 1.0) {
        this.context.fillStyle = `rgb(${r}, ${g}, ${b}, ${a})`;
        this.context.fillRect(-1, -1, this.canvas.width + 2, this.canvas.height + 2);
    }

    drawPicture(picture: Picture, x: number, y: number) {
        this.context.drawImage(picture.sharedData().image(), x, y);
    }

    drawSprite(picture: Picture, slice: PictureSlice, x: number, y: number) {
        this.context.drawImage(picture.sharedData().image(), slice.x, slice.y, slice.w, slice.h, x, y, slice.w, slice.h);
    }

    canvasRaw() {
        return this.canvas;
    }

    contextRaw() {
        return this.context;
    }
}
