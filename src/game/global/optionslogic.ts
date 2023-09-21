import { Gameloop } from "../../engine/gameloop";
import { Picture } from "../../engine/graphics";
import { DrawLogic, Scene, TickLogic } from "../../engine/scene";
import { BMFont } from "../../engine/text";
import { centered } from "../../engine/util";
import { GameSingleton } from "../../game/singleton";
import { makeMenuScene } from "../../game/menu/menuscene";
import { Focusable, FocusableScene } from "./focus";

import * as titleAtlasJson from "../../res/TitleAtlas.json";
import * as fontDescriptor from "../../res/Pixel12x10.json";

const titleSlices = titleAtlasJson;

const FOCUS_PRIORITY_OPTIONS_MENU = 100;

enum TextAlignment {
    Left,
    Center,
}

interface Menu {
    width: number;
    height: number;
    buttons: ButtonItem[];
    labels: LabelItem[];
}

interface LabelItem {
    x: number;
    y: number;
    alignment: TextAlignment;
    text: (logic: OptionsLogic, gameloop: Gameloop<GameSingleton>) => string;
}

interface ButtonItem extends LabelItem {
    onActivate: (logic: OptionsLogic, gameloop: Gameloop<GameSingleton>) => void;
}

const OPTIONS_MENU_ITEMS: Menu = {
    width: 640,
    height: 192,
    buttons: [
        {
            x: 0,
            y: 96,
            text: () => "Continue",
            alignment: TextAlignment.Center,
            onActivate: (logic) => {
                logic.close();
            },
        },
        {
            x: 0,
            y: 128,
            text: () => "Main Menu",
            alignment: TextAlignment.Center,
            onActivate: (_logic, gameloop) => {
                gameloop.setScene(() => {
                    return makeMenuScene(gameloop.input());
                });
            },
        },
    ],
    labels: [
        {
            x: 16,
            y: 16,
            alignment: TextAlignment.Left,
            text: (_logic, gameloop) => {
                const singleton = gameloop.singleton;

                const collection = singleton.levels[singleton.currentCollection];

                if (!collection) {
                    return "";
                }

                const level = collection.levels[singleton.currentLevel];

                if (!level) {
                    return "";
                }

                let name = `Level ${singleton.currentLevel + 1}`;

                if (level.name) {
                    name += `: ${level.name}`;
                }

                return `${collection.name}\n${name}`;
            },
        },
    ],
};

export class OptionsLogic extends Focusable implements TickLogic, DrawLogic {
    private picture = new Picture("res/TitleAtlas.png");
    private font: BMFont;
    private isOpen = false;
    private cursorIndex = 0;
    private currentMenu = OPTIONS_MENU_ITEMS;

    constructor(scene: FocusableScene) {
        super(scene);

        this.font = new BMFont(fontDescriptor);

        scene.addEventHandler("openMenu", () => {
            this.open();
        });
    }

    open() {
        this.isOpen = true;
        this.currentMenu = OPTIONS_MENU_ITEMS;
        this.cursorIndex = 0;
    }

    close() {
        this.isOpen = false;
    }

    focusTick(gameloop: Gameloop<GameSingleton>, _scene: Scene): void {
        const input = gameloop.input();

        if (gameloop.input().justPressed("menu")) {
            this.close();
            return;
        }

        const action = input.autoRepeatNewest(["left", "right", "up", "down"]);

        switch (action) {
            case "up":
                this.cursorIndex--;
                break;
            case "down":
                this.cursorIndex++;
                break;
        }

        this.cursorIndex =
            (this.cursorIndex + this.currentMenu.buttons.length) % this.currentMenu.buttons.length;

        if (input.justPressed("accept")) {
            const item = this.currentMenu.buttons[this.cursorIndex];

            item.onActivate(this, gameloop);
        }
    }

    tick(_gameloop: Gameloop<GameSingleton>, _scene: Scene): void {
        if (!this.isOpen) {
            return;
        }

        this.keepActive(FOCUS_PRIORITY_OPTIONS_MENU);
    }

    draw(gameloop: Gameloop<GameSingleton>, _scene: Scene, _lerpTime: number): void {
        if (!this.isOpen) {
            return;
        }

        const renderer = gameloop.renderer();
        const [width, height] = [renderer.canvas().width, renderer.canvas().height];
        const menuWidth = this.currentMenu.width;
        const menuHeight = this.currentMenu.height;
        const startX = centered(menuWidth, width);
        const startY = centered(menuHeight, height);

        renderer.drawRect(startX, startY, menuWidth, menuHeight, "rgb(0, 0, 0, 0.7)");
        renderer.drawRectOutline(
            startX - 0.5,
            startY - 0.5,
            menuWidth,
            menuHeight,
            "rgb(224, 224, 224, 0.7)"
        );

        const drawText = (item: LabelItem, selected: boolean) => {
            let x = startX + item.x;
            const text = item.text(this, gameloop);

            if (item.alignment === TextAlignment.Center) {
                const textWidth = this.font.measureText(text);

                x += centered(textWidth, menuWidth);
            }

            this.font.drawText(renderer, text, x, startY + item.y, menuWidth - item.x, 1);

            if (selected) {
                renderer.drawSprite(
                    this.picture,
                    titleSlices.arrowRight,
                    x - 24,
                    startY + item.y - 4
                );
            }
        };

        for (const item of this.currentMenu.labels) {
            drawText(item, false);
        }

        for (let i = 0; i < this.currentMenu.buttons.length; ++i) {
            const item = this.currentMenu.buttons[i];
            drawText(item, this.cursorIndex === i);
        }
    }
}
