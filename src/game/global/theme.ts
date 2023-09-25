import { Picture, PictureSlice } from "../../engine/graphics";

export interface LevelTheme {
    wall: PictureSlice[];
    floor: PictureSlice[];
    dropzone: PictureSlice[];
    playerDown: PictureSlice[];
    playerRight: PictureSlice[];
    playerLeft: PictureSlice[];
    playerUp: PictureSlice[];
    playerHmm: PictureSlice;
    playerWin: PictureSlice;
    playerHead: PictureSlice;
    crate: PictureSlice[];
    confetti: PictureSlice[];
}

export interface PictureSlicePair {
    picture: Picture;
    slices: LevelTheme;
}
