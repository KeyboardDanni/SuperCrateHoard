/*! *****************************************************************************

Copyright (C) 2023 Danni

Permission to use, copy, modify, and/or distribute this software for any purpose 
with or without fee is hereby granted, provided that the above copyright notice 
and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED “AS IS” AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH 
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND 
FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, 
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS 
OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER 
TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF 
THIS SOFTWARE.

This software incorporates code from third-party libraries. In distributed
copies of the software, these license notices are listed below.

***************************************************************************** */

import "reflect-metadata";

import { GameSingleton } from "./game/singleton";
import { Gameloop } from "./engine/gameloop";
import { makeMenuScene } from "./game/menu/menuscene";

window.onload = function init() {
    const gameloop = new Gameloop("game_surface", new GameSingleton());
    const input = gameloop.input();

    input.addAction("left", ["ArrowLeft", "KeyA"]);
    input.addAction("right", ["ArrowRight", "KeyD"]);
    input.addAction("up", ["ArrowUp", "KeyW"]);
    input.addAction("down", ["ArrowDown", "KeyS"]);
    input.addAction("menu", ["Backspace", "Escape"]);
    input.addAction("accept", ["Enter", "Space"]);
    input.addAction("undo", ["KeyZ"]);
    input.addAction("redo", ["KeyX"]);

    gameloop.setScene(() => {
        return makeMenuScene(gameloop);
    });

    gameloop.run();
};
