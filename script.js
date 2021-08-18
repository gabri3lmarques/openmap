'use strict';


const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {

  constructor(coords, distance, duration){
    this.date = new Date();
    this.id = (Date.now() + '').slice(-10);
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription(){
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type} on ${months[this.date.getMonth()]}, ${this.date.getDate()}`
  }
}

class Running extends Workout {
  type = "running";

  constructor(coords, distance, duration, cadence){
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace(){
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = "cycling";

  constructor(coords, distance, duration, elavationGain){
    super(coords, distance, duration);
    this.elavationGain = elavationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed(){
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class App {
  #map;
  #mapEvent;
  #workouts = [];

  constructor(){
    this._getPosition();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElvationFiel);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _warning(){
    alert("Clique no mapa para adicionar uma atividade física.")
  }

  _moveToPopup(e){
    const workoutElement = e.target.closest('.workout');
    if(!workoutElement) return;
    const workout = this.#workouts.find(work => work.id === workoutElement.dataset.id);
    this.#map.setView(workout.coords, 13, {
      animate: true,
      pan: {
        duration: 1
      }
    });
  }

  _getPosition(){
    if(navigator.geolocation){
      navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function(){
        alert('não foi possível pegar sua posição');
      });  
    };
  }

  async _loadMap(position){
    const {latitude} = position.coords;
    const {longitude} = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));
    this.#map.on('load', setTimeout(this._warning, 1000));
  }

  _showForm(mapE){
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm(){
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => form.style.display = 'grid', 1000)
  }

  _toggleElvationFiel(){
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  //adiciona novo exercício no mapa
  _newWorkout(e){
    function isValidInput(element) {
      return Number.isFinite(element);
    }

    function isPositive(element) {
      return element > 0;
    }
    
    e.preventDefault();

    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const {lat, lng} = this.#mapEvent.latlng;
    let workout;

    if(type === 'running'){
      const cadence = +inputCadence.value;
      if(![distance, duration, cadence].every(isValidInput) || ![distance, duration, cadence].every(isPositive)){
        return(
          alert("os campos devem ser números positivos")
        )
      };

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    if(type === 'cycling'){
      const elevation = +inputElevation.value;
      if(![distance, duration, elevation].every(isValidInput) || ![distance, duration].every(isPositive)){
        return(
          alert("os campos, exceto ELEVAÇÃO devem ser números positivos")
        )
      };

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    this.#workouts.push(workout);
    this._renderWorkoutMarker(workout);
    this._renderWorkout(workout);
    //limpa o valor dos inputs 
    this._hideForm();
  }

  _renderWorkoutMarker(workout){
    //exibe o PIN no map
    L.marker(workout.coords).addTo(this.#map)
    .bindPopup(L.popup({maxWidth: 250, minWidth: 100, autoClose: false, closeOnClick: false, className: `${workout.type}-popup`}))
    .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)
    .openPopup();
  }

  _renderWorkout(workout){
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>`;

    if(workout.type === 'running') {
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>`;
    }

    if(workout.type === 'cycling') {
      html += `
          <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elavationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>`;
    }

    form.insertAdjacentHTML('afterend', html);
    console.log(workout)
  }
}

const app = new App();



