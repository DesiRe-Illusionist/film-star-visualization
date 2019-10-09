let APIkey = "77bcb8668e691d702f0e6870eb117283";
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
    let name = input.value();
    
    if (name != '') {

      let url = 'https://api.themoviedb.org/3/search/person?include_adult=false&page=1&query=' + 
      name + '&language=en-US&api_key=' + APIkey;
      loadJSON(url, spawnNewActor);
    }

    started = true;

  }

function draw() {
    clear();
    background(0);
    if (started) {
        console.log(actorsManager);
        actorsManager.forEach((actor) => {
            //console.log(actor);
            actor.drawActor();
        })

        filmsManager.forEach((film) => {
            console.log(film);
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
    }

    drawActor() {
        image(this.image, this.posX, this.posY);
    }

    updateActor() {
        (this.unvisited_films[0].posY - this.posY)

        this.posX += 1;
        this.posY += this.velocity.y;
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


// get details of a film such as genre, popularity, etc.
// filmID: id of film
// return film details JSON: https://developers.themoviedb.org/3/movies/get-movie-details
function getFilmDetails(filmID) {
  let url = "https://api.themoviedb.org/3/movie/" + filmID + 
  "?api_key=" + APIkey;
  
  const syncCallUrl = async () => {
        const response = await fetch(url);
        const filmDetails = await response.json();
        console.log(filmDetails);
         
        return filmDetails;
    }
  
  syncCallUrl();
}

// callback function for film details
function newFilmDetails(filmDetails) {
  
  
  //TO DO: use film details to populate stuff
}


// get new actors from a film
// filmID: id of film
// return List of length 3 of actor JSON objects
function getFilmCredits(filmID) {
  let url = "https://api.themoviedb.org/3/movie/" + filmId + 
  "/credits?api_key=" + APIkey;
  
  let newActors = callAPI(url, spawnNewActors);
  
}

// callback function for getFilmCredits
function spawnNewActors(newActors) {
  let newActorsList = [];
  let listLength = Object.keys(newActors.cast).length;
  
  while (newActorsList.length < 3) {
    let possibleActor = newActors.cast[int(random(listLength))];
    
    if (!newActorsList.includes(possibleActor)) {
      newActorsList.push(possibleActor);
    }
  }
  
  //TO DO: spawn new actors here
}


function spawnNewActor(people) {
  console.log(people);
  let listLength = Object.keys(people.results).length;
  let possibleActor = people.results[int(random(listLength))];
  let foundActor = false;
  
  while(!foundActor) {
    console.log(possibleActor);
    if (possibleActor.known_for_department === "Acting") {
        foundActor = true;
    } else {
        // TO DO: What if there is no actor in result? This will be infinite loop.
        possibleActor = people.results[int(random(listLength))];
    }
  }
  
  getFilmsOfActor(possibleActor.id, possibleActor.name);
}

// actorID: ID of actor
// actorName: name of the actor
// return List of length 3 of film JSON objects
function getFilmsOfActor(actorID, actorName) {
    const filmsOfActorUrl = "https://api.themoviedb.org/3/person/" + actorID + 
    "/movie_credits?language=en-US&api_key=" + APIkey;

    const syncCallUrl = async () => {
        const response = await fetch(filmsOfActorUrl);
        const newFilms = await response.json();
        console.log(newFilms);

        const newFilmsList = spawnNewFilms(newFilms);

        // sort film list by their release year;
        newFilmsList.sort((film_a, film_b) => {return film_a.release_year - film_b.release_year});
        const newActor = new Actor(actorName, newFilmsList);
        actorsManager.push(newActor);  
    }

    syncCallUrl();
}

// callback function for spawning new films
function spawnNewFilms(newFilms) {
    console.log(newFilms);
    let newFilmsList = [];
    let listLength = Object.keys(newFilms.cast).length;
    
    while (newFilmsList.length < 3) {
        let possibleFilm = newFilms.cast[int(random(listLength))];
        
        if (!newFilmsList.includes(possibleFilm)) {

            const color = getColorFromGenreList(possibleFilm.genre_ids);
            const release_year = Number(possibleFilm.release_date.substring(0, 4));
            const newFilm = new Film(possibleFilm.title, red(color), green(color), blue(color), release_year);
            newFilmsList.push(newFilm);
            filmsManager.push(newFilm);
        }
    }    
    return newFilmsList;
}

//helper function for asynchronous API calls
function callAPI(url, callback) {
  return loadJSON(url, callback);
}

function yearToCoordinate(year) {
    if (year < 1895 || year > 2019) {
        return 0;
    }

    const coordinate = (width - 400) * (year - 1895)/124; // 124 = 2019 - 1895
    console.log("coordinate is " + coordinate);
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
