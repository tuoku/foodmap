'use strict';

let map, service, infoWindow, defaultLocation, rangeValue, searchString
let placesDiv, stars, photosDiv, bubble
let markersArray = [];
let placesArray = [];
let slideIndex = 1;

rangeValue = 1000;

function initMap(){

  defaultLocation = new google.maps.LatLng(60.223978, 24.758720); // Karamalmi :)
  getLocation()
   let rangeInput = document.getElementById("range-input");
   let search = document.getElementById("search-field");
   bubble = document.getElementById("bubble");
   placesDiv = document.getElementById("places")
   placesDiv.style.display = "none"
   photosDiv = document.getElementById("modal-content");
   photosDiv.style.display = "none"

  rangeInput.addEventListener("change", function(){
    rangeValue = rangeInput.value;
    updateMarkers()
  }, false);

   rangeInput.addEventListener("input", () => {
     setBubble(rangeInput, bubble)
   });
   setBubble(rangeInput, bubble)

  search.addEventListener("keyup", function(event){
    if (event.keyCode === 13){
      searchString = search.value;
      updateMarkers()
    }

  }, false);

  map = new google.maps.Map(document.getElementById("map"),{
    center: defaultLocation,
    zoom: 13,
    disableDefaultUI: true,
  });


  infoWindow = new google.maps.InfoWindow();
/*
  let request = {
    location: defaultLocation, // Center of search circle
    radius: "10000",  //Radius of search circle in meters (max 50 000)
    type: ["restaurant"], // Type of establishment. NOT A KEYWORD!
  }



  service.nearbySearch(request, placesResultCallback);

 */
  service = new google.maps.places.PlacesService(map);
}

function placesResultCallback(results, status){
  clearMarkers()
  placesArray = []
  placesDiv.innerHTML=``
  placesDiv.style.display = "flex"
  if (status == google.maps.places.PlacesServiceStatus.OK){
    for (let i = 0; i < results.length; i++){
      let place = results[i];
      setStars(place.rating);
      placesArray.push(place);
      let section = document.createElement('section');
      section.className = 'placesection';
      // ID of the element is the unique ID of the restaurant to make future lookups easier
      section.id = place.place_id;
      let pics = []
      pics = place.photos
      let html =
          `
            <h4> ` + place.name + ` </h4>
            <p class="stars">` + stars + `</p>
            <img src="`+ pics[0].getUrl({maxWidth: 100, maxHeight: 100}) +
          `" onclick="openModal();currentSlide(1)" class="placethumb">
          `
      section.innerHTML = html
      placesDiv.appendChild(section)
      section.addEventListener('click', event => {
        let req = {
          placeId: section.id,
          fields: ['photos']
        };
        service.getDetails(req, photosCallback);
        console.log("clicked")

      })
      markersArray.push(
      new google.maps.Marker({
        map,
        title: place.name,
        position: place.geometry.location,
      }));
    }
  }
}

function photosCallback(place, status){
  if (status == google.maps.places.PlacesServiceStatus.OK) {
    photosDiv.style.display = "block"
    photosDiv.innerHTML = ""
    let i = 1
    place.photos.forEach(p => {
      let url = p.getUrl({maxWidth: 1200, maxHeight: 800})
      let a = document.createElement("div")
          a.className="mySlides"
              let b =
          ` 
                 <div class="numbertext">`+ i + " / " + place.photos.size + `</div> 
                 <img src="`+ url +`" class="slideImg"> 
          `
      a.innerHTML = b
      photosDiv.appendChild(a)
      i++
    })
    openModal()
  }


}

function createMarkers(places, map){
  const bounds = new google.maps.LatLngBounds();
  const placesList = document.getElementById("places");

  for (let i = 0, place; (place = places[i]); i++){
    const image = {
      url: place.icon,
      size: new google.maps.Size(71, 71),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(17, 34),
      scaledSize: new google.maps.Size(25, 25),
    };



    const li = document.createElement("li");
    li.textContent = place.name;
    placesList.appendChild(li);

    bounds.extend(place.geometry.location);
  }
  map.fitBounds(bounds)
}

function clearMarkers(){
  for (let i = 0; i < markersArray.length; i++ ) {
    markersArray[i].setMap(null);
  }
  markersArray.length = 0;
}

function updateMarkers(){
  let request = {
    location: defaultLocation, // Center of search circle
    radius: rangeValue,  //Radius of search circle in meters (max 50 000)
    type: ["restaurant"], // Type of establishment. NOT A KEYWORD!
    keyword: searchString,
  }
  service.nearbySearch(request, placesResultCallback);
}

function setStars(floatStars){
  switch(Math.round(floatStars)){
    case 0:
      stars = "☆☆☆☆☆"
      break;
    case 1:
      stars = "★☆☆☆☆"
      break;
    case 2:
      stars = "★★☆☆☆"
      break;
    case 3:
      stars = "★★★☆☆"
      break;
    case 4:
      stars = "★★★★☆"
      break;
    case 5:
      stars = "★★★★★"
      break;
  }
}
function setBubble(range, bubble) {
  const val = range.value;
  const min = range.min ? range.min : 0;
  const max = range.max ? range.max : 100;
  const newVal = Number(((val - min) * 100) / (max - min));
  bubble.innerHTML =  (Math.round((val / 1000)*10)/10) + " KM";
  bubble.style.left = `calc(${newVal}% + (${8 - newVal * 0.15}px))`;
}

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      defaultLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude)
      map.setCenter(defaultLocation)
    });
  } else {
    alert("Geolocation is not supported by this browser.");
  }
}
function openModal() {
  document.getElementById("placephotos").style.display = "block";

  showSlides(slideIndex);
}
function closeModal() {
  document.getElementById("placephotos").style.display = "none";
}



function plusSlides(n) {
  showSlides(slideIndex += n);
}

function showSlides(n) {
  let i;
  let slides = document.getElementsByClassName("mySlides");
  let dots = document.getElementsByClassName("demo");
  let captionText = document.getElementById("caption");
  if (n > slides.length) {slideIndex = 1}
  if (n < 1) {slideIndex = slides.length}
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  for (i = 0; i < dots.length; i++) {
    dots[i].className = dots[i].className.replace(" active", "");
  }
  slides[slideIndex-1].style.display = "flex";
  dots[slideIndex-1].className += " active";
  captionText.innerHTML = dots[slideIndex-1].alt;
}

