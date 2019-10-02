
function setup() {
    createCanvas(windowWidth, windowHeight);
    background(0);
    actor = new Actor('velocity');
    film = new Film();


}


let next = 0;
function draw() {
    if (millis() > next) {
        actor.drawActor();

        film.drawFilm();

        next = millis() + 50;
    }
}

class Particle {
    constructor(side, size, redLow, redHigh, greenLow, greenHigh, blueLow, blueHigh, position) {
        this.image = createImage(side, side);
        this.side = side;
        this.size = size;
        this.posX = position.x;
        this.posY = position.y;
        this.redLow = redLow;
        this.redHigh = redHigh;
        this.greenLow = greenLow;
        this.greenHigh = greenHigh;
        this.blueLow = blueLow;
        this.blueHigh = blueHigh;
    }

    drawParticle() {
        const center = this.side / 2;
        const decay_rate = pow(10, this.size);
        const red = random(this.redLow, this.redHigh);
        const green = random(this.greenLow, this.greenHigh);
        const blue = random(this.blueLow, this.blueHigh);

        this.image.loadPixels();
        for (var y = 0; y < this.side; y++) {
            for (var x = 0; x < this.side; x++) {
                var decay_factor = (sq(center - x) + sq(center - y))/decay_rate;
                var col = color(red/decay_factor, green/decay_factor, blue/decay_factor);
                this.image.set(x, y, col);
            }
        }
        this.image.updatePixels();
        // image(this.image, this.posX, this.posY);
    }
}

class Actor extends Particle {
    constructor(velocity) {
        super(100, 1.5, 100, 255, 0, 100, 0, 100, createVector(100, 100));
        this.velocity = createVector(1, 1);
    }

    drawActor() {
        super.drawParticle();
        this.posX += this.velocity.x;
        this.posY += this.velocity.y;
        image(this.image, this.posX, this.posY);
    }
}

class Film extends Particle {
    constructor() {
        super(400, 3, 100, 255, 100, 255, 100, 255, createVector(500, 300));
    }

    drawFilm() {
        super.drawParticle();
        image(this.image, this.posX, this.posY);
    }
}