window.onload = function init() {
    const canvas = <HTMLCanvasElement>document.getElementById("game_surface");

    if (canvas === null || !canvas.getContext) {
        throw new Error("Missing canvas");
    }

    const context = canvas.getContext("2d");

    if (context === null) {
        throw new Error("Missing canvas context");
    }

    context.fillStyle = "rgb(128, 128, 128)";
    context.fillRect(64, 64, 256, 256);
};
