const API_KEY = "77bcb8668e691d702f0e6870eb117283";

let started = false;
let textOn = true;
let input, greeting;
let song;


const actorsManager = [];
const filmsManager = [];
const actorsInSimulation = [];
const filmsInSimulation = [];

function preload() {
    song = loadSound('The_Cosmos.mp3');
}

function setup() {
    song.loop();

    createCanvas(windowWidth, windowHeight);
    background(0);
    imageMode(CENTER);
    blendMode(ADD);
    frameRate(40);

    //ask user for input
    input = createInput();
    input.position(50,50);
    
    button = createButton('generate');
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

function draw() {
    clear();
    background(0);
    if (started) {
        input.hide();
        button.hide();
        actorsManager.forEach((actor, index) => {
            // console.log(actor);
            actor.drawActor();
            actor.updateActor(index);
            if (actor.posX > width) {
                actorsManager.splice(index, 1);
            }
        })

        filmsManager.forEach((film, index) => {
            // console.log(film);
            film.drawFilm();
            // if (film.actorsToSpawn.length === 0) {
            //     filmsManager.splice(index, 1);
            // }
        })
    } else {
        textSize(17);
        text("Enter a Name", input.x, input.y + input.height * 2);
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
        
        
        this.speed = random(2,3);
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

        if (this.distFromTarget() <= 2) {
            if (this.unvisited_films[0].actorsToSpawn.length != 0) {
                const actorToSpawn = this.unvisited_films[0].actorsToSpawn[0];
                this.unvisited_films[0].actorsToSpawn.shift();
                this.unvisited_films[0].spawnedActors.push(actorToSpawn);
                spawnActorAndFilmsFromActorId(actorToSpawn, this.unvisited_films[0]);
                
                this.unvisited_films[0].grow();
                
                console.log("actor [" + this.name + "] hit film [" + this.unvisited_films[0].title + "] and spawned actor [" + actorToSpawn.name + "]");
                console.log(actorsManager);
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
        const dist = sq(xDist) + sq(yDist);
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
        super(600, popularity, r, g, b, createVector(yearToCoordinate(release_year), 50 + random(0, height - 50)));
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

// actorID: ID of actor
// actorName: name of the actor
// return List of length 3 of film JSON objects
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
            console.error("No actor found for actor name [" + actorName + "].");
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
    let oldFilmBorder = width * 0.10;
    let coordinate;
    
    
    if (year < 1940 || year > 2019) {
       coordinate = oldFilmBorder * (year - 1890) / 60;      
    } else {
      coordinate = (width - oldFilmBorder) * (year - 1940)/79; // 79 = 2019 - 1940
    }
    return 50 + coordinate;
}

function getColorFromGenreList(genre_ids) {
    // TO DO: think about how to convert genre_ids to color
    if (genre_ids.length === 0) {
        return color(100, 100, 100)
    }

    var genreSum = 0;
    genre_ids.forEach((id) => {
        genreSum += id;
    })
    return color(genreSum % 120, genreSum / 255, genre_ids.length * 20);
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

function toggleText() {
    textOn = !textOn;
}