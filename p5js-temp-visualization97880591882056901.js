const API_KEY = "77bcb8668e691d702f0e6870eb117283";

let started = false;
let input, greeting;

const actorsManager = [];
const filmsManager = [];
const actorsInSimulation = [];
const filmsInSimulation = [];

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
        spawnActorAndFilmsFromActorName(actorName);
    }

    started = true;
}

function draw() {
    clear();
    background(0);
    if (started) {
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
        super(100, 1.5, random(100,255), random(100,255), random(100,255), createVector(0, random(height)));
        super.drawParticle();
        this.name = name;
        this.unvisited_films = films;
        this.visited_films = [];
        
        
        this.speed = 300;
        this.timeToReach = this.calculateTimeToReach();
        this.velX = this.getXVelocity();
        this.velY = this.getYVelocity();
    }

    drawActor() {
        
          image(this.image, this.posX, this.posY);
          textSize(20);
          fill (153,102,0);
          text(this.name, this.posX, this.posY);
        
    }

    updateActor() {
        this.posX += this.velX;
        this.posY += this.velY;

        if (this.distFromTarget() <= 1) {
            if (this.unvisited_films[0].actorsToSpawn.length != 0) {
                const actorToSpawn = this.unvisited_films[0].actorsToSpawn[0];
                this.unvisited_films[0].actorsToSpawn.shift();
                this.unvisited_films[0].spawnedActors.push(actorToSpawn);
                spawnActorAndFilmsFromActorId(actorToSpawn.id);
                
                this.unvisited_films[0].grow();
                
                console.log("actor [" + this.name + "] hit film [" + this.unvisited_films[0].title + "] and spawned actor [" + actorToSpawn.name + "]");
                console.log(actorsManager);
            }

            this.visited_films.push(this.unvisited_films[0]);
            this.unvisited_films.shift();
            this.timeToReach = this.calculateTimeToReach();
            this.velX = this.getXVelocity();
            this.velY = this.getYVelocity();
            
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
    
    calculateTimeToReach() {
      const distance = this.distFromTarget();
      
      return distance / this.speed;
      
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
        
        
        const velY = (yTarget - this.posY) / this.speed;
        
        return velY;
    }
    
    getXVelocity() {
        let yTarget;
        let xTarget;
        if (this.unvisited_films.length != 0) {
            yTarget = this.unvisited_films[0].posY;
            xTarget = this.unvisited_films[0].posX;
        } else {
            yTarget = random(height);
            xTarget = width;
        }
        
        
        const velX = (xTarget - this.posX) / this.speed;
        
        return velX;
    }
}

class Film extends Particle {
    constructor(title, r, g, b, release_year, actorsToSpawn, popularity) {
        super(600, popularity, r, g, b, createVector(yearToCoordinate(release_year), random(height)));
        super.drawParticle();
        this.title = title;
        this.release_year =  release_year;
        this.spawnedActors = [];
        this.actorsToSpawn = actorsToSpawn;
    }

    drawFilm() {
        //console.log(this.spawnedActors);
        if (this.spawnedActors.length <= 3) {
          image(this.image, this.posX, this.posY);
          textSize(20);
          fill (0,102,153);
          text(this.title, this.posX, this.posY);
        } else {
            filmsManager.splice(index, index + 1);
            filmsInSimulation.splice(index, index + 1);
            
        }
        
    }
    
    grow() {
      this.size += 0.5;
      this.drawParticle();
    }
}

function spawnActorAndFilmsFromActorName(actorName) {
    const getActorUrl = 'https://api.themoviedb.org/3/search/person?include_adult=false&page=1&query=' + actorName + '&language=en-US&api_key=' + API_KEY;
    const callApi = async() => {
        const response = await fetch(getActorUrl);
        const people = await response.json();
        const chosenActor = chooseRandomActor(people, actorName);
        spawnFilmsOfActor(chosenActor);
    }

    callApi();    
}

function spawnActorAndFilmsFromActorId(actorId) {
    const getActorUrl = 'https://api.themoviedb.org/3/person/' + actorId + '?language=en-US&api_key=' + API_KEY;
    loadJSON(getActorUrl, spawnFilmsOfActor);   
}

// actorID: ID of actor
// actorName: name of the actor
// return List of length 3 of film JSON objects
function spawnFilmsOfActor(actor) {
    const filmsOfActorUrl = "https://api.themoviedb.org/3/person/" + actor.id + "/movie_credits?language=en-US&api_key=" + API_KEY;
    const callSynchronousApi = async() => {
        const response = await fetch(filmsOfActorUrl);
        const filmsOfActor = await response.json();
        const chosenFilms = chooseRandomFilms(filmsOfActor, 3);
        const newActor = new Actor(actor.name, chosenFilms);
        actorsManager.push(newActor);
        actorsInSimulation.push(actor.id);
    }

    callSynchronousApi();
}

function createFilmObj(film) {
    const filmCreditsUrl = "https://api.themoviedb.org/3/movie/" + film.id + "/credits?api_key=" + API_KEY;

    const chosenActors = [];
    const callSynchronousApi = async() => {
        const response = await fetch(filmCreditsUrl);
        const filmCredits = await response.json();
        chooseRandomCastOfFilm(filmCredits.cast, 3, chosenActors);
    }

    callSynchronousApi();

    const color = getColorFromGenreList(film.genre_ids);
    const release_year = Number(film.release_date.substring(0, 4));
    //console.log(film.popularity);
    const newFilm = new Film(film.title, red(color), green(color), blue(color), release_year, chosenActors, log(film.popularity+1) );
    filmsManager.push(newFilm);
    return newFilm;
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
            people.results.splice(actorIdx);
        }
    }

    return chosenActor;
}

function chooseRandomFilms(films, capacity) {
    const chosenFilms = [];
    const existingReleaseYears = [];
    if (films.cast.length <= capacity) {
        films.cast.forEach((film) => {
            const film_release_year = Number(film.release_date.substring(0, 4));
            if (!existingReleaseYears.includes(film_release_year) && !filmsInSimulation.includes(film.id)) {
                // For each actor, show at most one film per year (avoid vertical movement)
                const newFilm = createFilmObj(film);
                chosenFilms.push(newFilm);
                existingReleaseYears.push(film_release_year);
                filmsInSimulation.push(film.id);
            }
        })
    } else {
        while (chosenFilms.length < capacity && films.cast.length > 0) {
            const filmIdx = int(random(films.cast.length));
            const film = films.cast[filmIdx];
            const film_release_year = Number(film.release_date.substring(0, 4));
            if (!existingReleaseYears.includes(film_release_year) && !filmsInSimulation.includes(film.id)) {
                const newFilm = createFilmObj(film);
                chosenFilms.push(newFilm);
                existingReleaseYears.push(film_release_year);
                filmsInSimulation.push(film.id);
            }
            films.cast.splice(filmIdx);
        }
    }

    chosenFilms.sort((film_a, film_b) => {return film_a.release_year - film_b.release_year});
    return chosenFilms;
}

function chooseRandomCastOfFilm(cast, capacity, chosenActors) {
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
            if (!actorsInSimulation.includes(actor.id)) {
                chosenActors.push({'id': actor.id, 'name': actor.name});
                actorsInSimulation.push(actor.id);
            }
            cast.splice(actorIdx);
        }
    }
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
    let oldFilmBorder = width * 0.10;
    let coordinate;
    
    
    if (year < 1940 || year > 2019) {
       coordinate = oldFilmBorder * (year - 1890) / 60;      
    } else {
      coordinate = (width - oldFilmBorder) * (year - 1950)/79; // 79 = 2019 - 1940
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
    //console.log(genreSum);
    return color(genreSum % 120, genreSum / 255, genre_ids.length * 20);
}