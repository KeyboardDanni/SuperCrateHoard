import { distance, lerp } from "../../engine/util";
import { Picture, Renderer } from "../../engine/graphics";
import { LevelTheme } from "../global/theme";

const NUM_PARTICLES = 100;
const PARTICLE_VELOCITY_BASE = 4;
const PARTICLE_VELOCITY = 28;
const PARTICLE_UPWARD_VELOCITY = 2;
const PARTICLE_GRAVITY = 0.125;
const PARTICLE_ANIMATION_SPEED_BASE = 0.25;
const PARTICLE_ANIMATION_SPEED = 0.75;
const PARTICLE_MAX_SPEED = 2;
const PARTICLE_MAX_SPEED_SLOW_RATE = 0.95;
const PARTICLE_JITTER = 0.25;

class Particle {
    x: number;
    y: number;
    oldX: number;
    oldY: number;
    velX: number;
    velY: number;
    frame: number;
    frameSpeed: number;

    constructor(x: number, y: number, angleBase: number, angleSpread: number) {
        this.x = x;
        this.y = y;
        this.oldX = x;
        this.oldY = y;

        const angle = angleBase + Math.random() * angleSpread;
        const vel = Math.random() * PARTICLE_VELOCITY + PARTICLE_VELOCITY_BASE;

        this.velX = Math.cos(angle) * vel;
        this.velY = -Math.sin(angle) * vel - PARTICLE_UPWARD_VELOCITY;

        this.frame = Math.random() * 5;
        this.frameSpeed = Math.random() * PARTICLE_ANIMATION_SPEED + PARTICLE_ANIMATION_SPEED_BASE;
    }

    tick() {
        this.oldX = this.x;
        this.oldY = this.y;

        this.velY += PARTICLE_GRAVITY;
        this.x += this.velX;
        this.y += this.velY;

        if (distance(this.velX, this.velY) > PARTICLE_MAX_SPEED) {
            this.velX *= PARTICLE_MAX_SPEED_SLOW_RATE;
            this.velY *= PARTICLE_MAX_SPEED_SLOW_RATE;

            const angle = Math.random() * 2 * Math.PI;
            const vel = Math.random() * PARTICLE_JITTER;

            this.velX += Math.cos(angle) * vel;
            this.velY += -Math.sin(angle) * vel;
        }

        this.frame = (this.frame + this.frameSpeed) % 5;
    }
}

export class Confetti {
    private picture: Picture;
    private theme: LevelTheme;
    private particles: Particle[];

    constructor(screenWidth: number, screenHeight: number, picture: Picture, theme: LevelTheme) {
        this.picture = picture;
        this.theme = theme;
        this.particles = [];

        for (let i = 0; i < NUM_PARTICLES; ++i) {
            this.particles.push(new Particle(0, screenHeight, Math.PI / 8, Math.PI / 2));
            this.particles.push(
                new Particle(screenWidth, screenHeight, (Math.PI * 3) / 8, Math.PI / 2)
            );
        }
    }

    tick() {
        for (const particle of this.particles) {
            particle.tick();
        }
    }

    draw(renderer: Renderer, lerpTime: number) {
        for (const particle of this.particles) {
            const frame = Math.floor(particle.frame) % 5;
            const x = lerp(particle.oldX, particle.x, lerpTime);
            const y = lerp(particle.oldY, particle.y, lerpTime);

            renderer.drawSprite(this.picture, this.theme.confetti[frame], x, y);
        }
    }
}
