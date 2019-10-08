let APIkey = "77bcb8668e691d702f0e6870eb117283";
let started = false;
let input, greeting;
let actorsManager = [];
let filmsManager = [];

function setup() {
    createCanvas(windowWidth, windowHeight);
    background(0);

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

let next = 0;
function draw() {
    if (started && millis() > next) {
        //console.log(actorsManager);
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
    }
}

class Actor extends Particle {
    constructor(name, films) {
        super(100, 1.5, 100, 255, 0, 100, 0, 100, createVector(100, 100));
        this.name = name;
        this.unvisited_films = films;
        this.visited_films = [];
    }

    drawActor() {
        super.drawParticle();
        image(this.image, this.posX, this.posY);
    }

    updateActor() {
        this.posX += this.velocity.x;
        this.posY += this.velocity.y;
    }
}

class Film extends Particle {
    constructor(title, r, g, b, position) {
        super(400, 3, 100, 255, 100, 255, 100, 255, createVector((position - 1860) * float(windowWidth / 160), 300));
        this.title = title;
    }

    drawFilm() {
        super.drawParticle();
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
    
    
        const syncCallUrl = async () => {
          let possibleFilm = newFilms.cast[int(random(listLength))];
          
          if (!newFilmsList.includes(possibleFilm)) {
              console.log(possibleFilm);
              const url = "https://api.themoviedb.org/3/movie/" + possibleFilm.id + 
              "?api_key=" + APIkey;
              
              const response = await fetch(url);
              const filmDetails = await response.json();
              console.log(filmDetails);
              
              let r, g, b, genreSum = 0;
              
              let releaseDate = int(filmDetails.release_date.substring(0, 4));
              console.log(releaseDate);
              for (i = 0; i < Object.keys(filmDetails.genres); i++) {
                genreSum += filmDetails.genres.id;
              }
              
              const newFilm = new Film(possibleFilm.title, genreSum % 255, genreSum / 255, 10, releaseDate);
              newFilmsList.push(newFilm);
              filmsManager.push(newFilm);
          }
        }
        
        syncCallUrl();
    
    return newFilmsList;
}

//helper function for asynchronous API calls
function callAPI(url, callback) {
  return loadJSON(url, callback);
}
