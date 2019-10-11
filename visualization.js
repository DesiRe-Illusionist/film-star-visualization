const API_KEY = "77bcb8668e691d702f0e6870eb117283";

let started = false;
let textOn = true;
let input, greeting;
let song;
let gaussian;
let max_pos = 1;

const actorsManager = [];
const filmsManager = [];
const actorsInSimulation = [];
const filmsInSimulation = [];

function preload() {
    song = loadSound('The_Cosmos.mp3');

    STATIC_GENRE_MAP = {
        28: color(255, 0, 0), // "Action"
        16: color(255, 255, 102), // "Animated"
        99: color(0, 0, 255), //"Documentary"
        18: color(204,51,0), //"Drama"
        10751: color(0, 255, 0), // "Family"
        14: color(204, 0, 102), //"Fantasy"
        36: color(102, 153, 153), //"History"
        35: color(255, 255, 0), //"Comedy"
        10752: color(0, 102, 255), // "War"
        80: color(102, 0, 102), // "Crime"
        10402: color(0, 255, 255), //"Music"
        9648: color(102, 0, 255), //"Mystery"
        10749: color(255, 102, 204), //"Romance"
        878: color(51, 153, 255), //"Sci-Fi"
        27: color(102, 0, 204), //"Horror"
        10770: color(0, 204, 0), //"TV Movie"
        53: color(153, 0, 153), //"Thriller"
        37: color(255, 204, 0), // "Western"
        12: color(51, 153, 102), //"Adventure"
    }
}

function setup() {
    song.loop();

    createCanvas(windowWidth, windowHeight);
    background(0);
    imageMode(CENTER);
    blendMode(ADD);
    frameRate(10);

    //ask user for input
    input = createInput();
    input.position(50,50);
    
    button = createButton('start');
    button.position(input.x + input.width, input.y);
    button.mousePressed(start);
}

// start the visualization
function start() {
    let actorName = input.value();
    
    if (actorName != '') {
        spawnActorAndFilmsFromActorName(actorName);
    }

    button2 = createButton("Toggle Text");
    button2.position(input.x, input.y - input.height * 1.1);
    button2.mousePressed(toggleText);

    started = true;
}

function toggleText() {
    textOn = !textOn;
}

function draw() {
    clear();
    background(0);
    if (started) {

        input.hide();
        button.hide();
        actorsManager.forEach((actor, index) => {
            actor.drawActor();
            actor.updateActor(index);
            if (actor.posX > width) {
                actorsManager.splice(index, 1);
            }
        })

        filmsManager.forEach((film) => {
            film.drawFilm();
        })
    } else {
        textSize(17);
        text("Enter a Film Actor/Actress Name", input.x, input.y + input.height * 2);
        fill( 230, 230, 230);
    }
}

function keyTyped() {
    if (key === 'h') {
        noLoop();
    } else if (key === 'b') {
    value = 0;
    }
}

function keyReleased() {
    if (key === 'h') {
        loop();
    }
}

class Particle {
    constructor(side, size, red, green, blue, position) {
        this.image = createImage(side, side);
        this.side = side;
        this.size = size;
        this.posX = position.x;
        this.posY = position.y;
        this.red = red;
        this.green = green;
        this.blue = blue;
    }

    drawParticle() {
        const center = this.side / 2;
        const decay_rate = pow(10, this.size);

        this.image.loadPixels();
        for (var y = 0; y < this.side; y++) {
            for (var x = 0; x < this.side; x++) {
                var decay_factor = (sq(center - x) + sq(center - y))/decay_rate;
                var col = color(this.red/decay_factor, this.green/decay_factor, this.blue/decay_factor);
                this.image.set(x, y, col);
            }
        }
        this.image.updatePixels();
    }
}

class Actor extends Particle {
    constructor(name, films) {
        super(100, 1.5, random(100,200), random(100,200), random(100,200), createVector(0, 50 + random(0, height - 50)));
        super.drawParticle();
        this.name = name;
        this.unvisited_films = films;
        this.visited_films = [];
        
        
        this.speed = random(2, 3);
        this.velX = this.getVelocity().x;
        this.velY = this.getVelocity().y;
    }

    drawActor() {
        
          image(this.image, this.posX, this.posY);
          if(textOn) {
            textSize(20);
            fill (153,102,0);
            text(this.name, this.posX, this.posY);
          }
        
    }

    updateActor() {
        this.posX += this.velX;
        this.posY += this.velY;

        if (this.distFromTarget() <= 3) {
            if (this.unvisited_films[0].actorsToSpawn.length != 0) {
                const actorToSpawn = this.unvisited_films[0].actorsToSpawn[0];
                this.unvisited_films[0].actorsToSpawn.shift();
                this.unvisited_films[0].spawnedActors.push(actorToSpawn);
                spawnActorAndFilmsFromActorId(actorToSpawn, this.unvisited_films[0]);
                
                this.unvisited_films[0].grow();
            }

            this.visited_films.push(this.unvisited_films[0]);
            this.unvisited_films.shift();
            this.velX = this.getVelocity().x;
            this.velY = this.getVelocity().y;
            
        }
    }

    distFromTarget() {
        if (this.unvisited_films.length === 0) {
            return 100; // some none zero value
        }

        const xDist = this.unvisited_films[0].posX - this.posX;
        const yDist = this.unvisited_films[0].posY - this.posY;
        const dist = sqrt(sq(xDist) + sq(yDist));
        return dist;
    }

    getVelocity() {
        let yTarget;
        let xTarget;
        if (this.unvisited_films.length != 0) {
            yTarget = this.unvisited_films[0].posY;
            xTarget = this.unvisited_films[0].posX;
        } else {
            yTarget = random(height);
            xTarget = width;
        }

        const yDist = yTarget - this.posY;
        const xDist = xTarget - this.posX;
        
        const yDirection = yDist < 0 ? -1 : 1;

        const velY = sqrt(sq(this.speed) * sq(yDist) / (sq(yDist) + sq(xDist))) * yDirection;
        const velX = abs(velY * xDist / yDist);
        
        return createVector(velX, velY);
    }
}

class Film extends Particle {
    constructor(title, r, g, b, release_year, actorsToSpawn, popularity) {
        super(500, popularity, r, g, b, createVector(yearToCoordinate(release_year), 50 + random(0, height - 50)));
        super.drawParticle();
        this.title = title;
        this.release_year = release_year;
        this.spawnedActors = [];
        this.actorsToSpawn = actorsToSpawn;
    }

    drawFilm() {
        image(this.image, this.posX, this.posY);
        if (textOn) {
            textSize(20);
            fill (0,102,153);
            text(this.title, this.posX, this.posY);
        }
    }
    
    grow() {
      this.size = min(this.size * 1.2, 3);
      this.drawParticle();
    }
}

function spawnActorAndFilmsFromActorName(actorName) {
    const getActorUrl = 'https://api.themoviedb.org/3/search/person?include_adult=false&page=1&query=' + actorName + '&language=en-US&api_key=' + API_KEY;
    const callApi = async() => {
        const response = await fetch(getActorUrl);
        const people = await response.json();
        const chosenActor = chooseRandomActor(people, actorName);
        spawnActorAndFilmsFromActorId(chosenActor);
    }

    callApi();    
}

function spawnActorAndFilmsFromActorId(actor, parentFilm) {
    const filmsOfActorUrl = "https://api.themoviedb.org/3/person/" + actor.id + "/movie_credits?language=en-US&api_key=" + API_KEY;
    const callSynchronousApi = async() => {
        const response = await fetch(filmsOfActorUrl);
        const filmsOfActor = await response.json();
        const chosenFilms = typeof parentFilm === 'undefined' ? [] : [parentFilm];
        const capacity = int(random(1,3));
        const newActor = new Actor(actor.name, chosenFilms);

        if (filmsOfActor.cast.length <= capacity) {
            filmsOfActor.cast.forEach((film) => {
                if (!filmsInSimulation.includes(film.id)) {
                    createFilm(film, chosenFilms, newActor);
                }
            })
        } else {
            let i = 0
            while (i < capacity && filmsOfActor.cast.length > 0) {
                const filmIdx = int(random(filmsOfActor.cast.length));
                const film = filmsOfActor.cast[filmIdx];
                filmsOfActor.cast.splice(filmIdx, 1);
                i++;
                if (!filmsInSimulation.includes(film.id)) {
                    createFilm(film, chosenFilms, newActor);
                }
            }
        }

        actorsManager.push(newActor);
        actorsInSimulation.push(actor.id);
    }

    callSynchronousApi();
}

function createFilm(film, chosenFilms, actor) {
    const filmCreditsUrl = "https://api.themoviedb.org/3/movie/" + film.id + "/credits?api_key=" + API_KEY;

    const callSynchronousApi = async() => {
        const response = await fetch(filmCreditsUrl);
        const filmCredits = await response.json();

        const chosenActors = chooseRandomCastOfFilm(filmCredits.cast, int(random(1,3)));
        const color = getColorFromGenreList(film.genre_ids);
        const release_year = Number(film.release_date.substring(0, 4));
        const newFilm = new Film(film.title, red(color), green(color), blue(color), release_year, chosenActors, min(log(film.popularity+1), 2));

        insertFilmByYear(newFilm, chosenFilms)
        const vel = actor.getVelocity();
        actor.velX = vel.x;
        actor.velY = vel.y;
        filmsInSimulation.push(film.id);
        filmsManager.push(newFilm);
    }
    callSynchronousApi();
}

function chooseRandomActor(people, actorName) {
    let foundActor = false;
    let chosenActor;
    while (!foundActor) {
        if (people.results.length === 0) {
            // TO DO: figure out what to do when no actor found
            console.warn("No actor found for actor name [" + actorName + "].");
        }

        let actorIdx = int(random(people.results.length));
        if (people.results[actorIdx].known_for_department === "Acting" 
                && !actorsInSimulation.includes(people.results[actorIdx].id)) {

            chosenActor = people.results[actorIdx];
            foundActor = true;
        } else {
            people.results.splice(actorIdx, 1);
        }
    }

    return chosenActor;
}

function chooseRandomCastOfFilm(cast, capacity) {
    const chosenActors = [];
    if (cast.length <= capacity) {
        cast.forEach((actor) => {
            if (!actorsInSimulation.includes(actor.id)) {
                chosenActors.push({'id': actor.id, 'name': actor.name});
                actorsInSimulation.push(actor.id);
            }
        })
    } else {
        while (chosenActors.length < capacity && cast.length > 0) {
            const actorIdx = int(random(cast.length));
            const actor = cast[actorIdx];
            cast.splice(actorIdx, 1);
            if (!actorsInSimulation.includes(actor.id)) {
                chosenActors.push({'id': actor.id, 'name': actor.name});
                actorsInSimulation.push(actor.id);
            }
        }
    }
    return chosenActors;
}

function yearToCoordinate(year) {
    if (filmsManager.length === 0) {
        var mean
        if (year > 2000) {
            mean = 2000;
        } else if (year < 1940) {
            mean = 1940;
        } else {
            mean = year;
        }
        gaussian = new Gaussian(mean, 400);
        max_pos = gaussian.cdf(2019);

    }

    const relative_pos = gaussian.cdf(year) / max_pos;
    return width * relative_pos;
}

function getColorFromGenreList(genre_ids) {
    if (genre_ids.length === 0) {
        return color(100, 100, 100)
    }

    let r = 0;
    let g = 0;
    let b = 0;
    genre_ids.forEach((id) => {
        r += red(STATIC_GENRE_MAP[id]);
        g += green(STATIC_GENRE_MAP[id]);
        b += blue(STATIC_GENRE_MAP[id]);
    })
    const discount = max(r, g, b) / 255;
    r = r / discount;
    g = g / discount;
    b = b / discount;
    return color(r, g, b);
}

function insertFilmByYear(film, filmList) {
    if (filmList.length === 0) {
        filmList.push(film);
    } else {
        let i = 0;
        while (i < filmList.length && film.release_year > filmList[i].release_year) {
            i++;
        }
        filmList.splice(i, 0, film);
    }
}

// Gaussian functions - source: https://github.com/errcw/gaussian

// Complementary error function
// From Numerical Recipes in C 2e p221
var erfc = function(x) {
    var z = Math.abs(x);
    var t = 1 / (1 + z / 2);
    var r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 +
            t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 +
            t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 +
            t * (-0.82215223 + t * 0.17087277)))))))))
    return x >= 0 ? r : 2 - r;
};
    
// Models the normal distribution
var Gaussian = function(mean, variance) {
    if (variance <= 0) {
        throw new Error('Variance must be > 0 (but was ' + variance + ')');
    }
    this.mean = mean;
    this.variance = variance;
    this.standardDeviation = Math.sqrt(variance);
}

// Cumulative density function
Gaussian.prototype.cdf = function(x) {
    return 0.5 * erfc(-(x - this.mean) / (this.standardDeviation * Math.sqrt(2)));
};