const API_KEY = "77bcb8668e691d702f0e6870eb117283";

let started = false;
let input, greeting;
let actorsManager = [];
let filmsManager = [];

function setup() {
    createCanvas(windowWidth, windowHeight);
    background(0);
    imageMode(CENTER);
    blendMode(ADD);
    frameRate(60);

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
        const getAcotUrl = 'https://api.themoviedb.org/3/search/person?include_adult=false&page=1&query=' + actorName + '&language=en-US&api_key=' + API_KEY;
        loadJSON(getAcotUrl, spawnNewActorAndFilms)
    }

    started = true;
}

function draw() {
    clear();
    background(0);
    if (started) {
        actorsManager.forEach((actor) => {
            // console.log(actor);
            actor.drawActor();
            actor.updateActor();
        })

        filmsManager.forEach((film) => {
            // console.log(film);
            film.drawFilm();
        })
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
        super(100, 1.5, random(100,255), random(100,255), random(100,255), createVector(100, 100));
        super.drawParticle();
        this.name = name;
        this.unvisited_films = films;
        this.visited_films = [];
        this.velX = 1;
        this.velY = this.getYVelocity();
    }

    drawActor() {
        image(this.image, this.posX, this.posY);
    }

    updateActor() {
        this.posX += this.velX;
        this.posY += this.velY;

        if (this.distFromTarget() <= 1) {
            console.log("actor hit film");
            console.log(actorsManager);
            this.visited_films.push(this.unvisited_films[0]);
            this.unvisited_films.shift();
            this.velY = this.getYVelocity();
            console.log(actorsManager);
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

    getYVelocity() {
        let yTarget;
        let xTarget;
        if (this.unvisited_films.length != 0) {
            yTarget = this.unvisited_films[0].posY;
            xTarget = this.unvisited_films[0].posX;
        } else {
            yTarget = random(height);
            xTarget = width;
        }
        const velY = this.velX * (yTarget - this.posY) / (xTarget - this.posX);
        return velY
    }
}

class Film extends Particle {
    constructor(title, r, g, b, release_year) {
        super(600, 2.5, r, g, b, createVector(yearToCoordinate(release_year), random(300, height-300)));
        super.drawParticle();
        this.title = title;
        this.release_year =  release_year;
    }

    drawFilm() {
        image(this.image, this.posX, this.posY);
    }
}

function spawnNewActorAndFilms(people) {
    const chosenActor = chooseRandomActor(people);
    getFilmsOfActor(chosenActor.id, chosenActor.name);
}

function chooseRandomActor(people) {
    let foundActor = false;
    let chosenActor;
    while (!foundActor) {
        if (people.results.length === 0) {
            // TO DO: figure out what to do when no actor found
            console.error("No actor found.")
        }

        let actorIdx = int(random(people.results.length));
        if (people.results[actorIdx].known_for_department === "Acting") {
            chosenActor = people.results[actorIdx];
            foundActor = true;
        } else {
            people.results.splice(actorIdx);
        }
    }

    return chosenActor;
}

// actorID: ID of actor
// actorName: name of the actor
// return List of length 3 of film JSON objects
function getFilmsOfActor(actorID, actorName) {
    const filmsOfActorUrl = "https://api.themoviedb.org/3/person/" + actorID + "/movie_credits?language=en-US&api_key=" + API_KEY;

    const callSynchronousApi = async() => {
        const response = await fetch(filmsOfActorUrl);
        const filmsOfActor = await response.json();
        const chosenFilms = chooseRandomFilms(filmsOfActor, 3);
        const newActor = new Actor(actorName, chosenFilms);
        actorsManager.push(newActor); 
    }

    callSynchronousApi();
}

function chooseRandomFilms(films, capacity) {
    const chosenFilms = [];
    const existingReleaseYears = [];
    if (films.cast.length <= capacity) {
        films.cast.forEach((film) => {
            const newFilm = createFilmObj(film);
            if (!existingReleaseYears.includes(newFilm.release_year)) {
                // For each actor, show at most one film per year (avoid vertical movement)
                chosenFilms.push(newFilm);
                existingReleaseYears.push(newFilm.release_year)
            }
        })
    } else {
        while (chosenFilms.length < capacity && films.cast.length > 0) {
            const filmIdx = int(random(films.cast.length));
            const newFilm = createFilmObj(films.cast[filmIdx]);
            if (!existingReleaseYears.includes(newFilm.release_year)) {
                chosenFilms.push(newFilm);
                existingReleaseYears.push(newFilm.release_year)
            }
            films.cast.splice(filmIdx);
        }
    }

    chosenFilms.sort((film_a, film_b) => {return film_a.release_year - film_b.release_year});
    return chosenFilms;
}

function createFilmObj(film) {
    const color = getColorFromGenreList(film.genre_ids);
    const release_year = Number(film.release_date.substring(0, 4));
    const newFilm = new Film(film.title, red(color), green(color), blue(color), release_year);
    filmsManager.push(newFilm);
    return newFilm;
}

// get details of a film such as genre, popularity, etc.
// filmID: id of film
// return film details JSON: https://developers.themoviedb.org/3/movies/get-movie-details
function getFilmDetails(filmID) {
    let url = "https://api.themoviedb.org/3/movie/" + filmID + "?api_key=" + API_KEY;
    
    const syncCallUrl = async () => {
          const response = await fetch(url);
          const filmDetails = await response.json();         
          return filmDetails;
      }
    
    syncCallUrl();
}

function yearToCoordinate(year) {
    if (year < 1895 || year > 2019) {
        return 0;
    }

    const coordinate = (width - 400) * (year - 1895)/124; // 124 = 2019 - 1895
    return 200 + coordinate;
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

    return color(genreSum % 255, genreSum / 255, 10)
}
