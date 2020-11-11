'use strict';

let map, service, infoWindow, defaultLocation, rangeValue, searchString;
let markersArray = []

rangeValue = 300;

function initMap(){
  defaultLocation = new google.maps.LatLng(60.223978, 24.758720); // Karamalmi :)
   let rangeInput = document.getElementById("range-input");
   let search = document.getElementById("search-field");

  rangeInput.addEventListener("change", function(){
    rangeValue = rangeInput.value;
    updateMarkers()
  }, false);

  search.addEventListener("keyup", function(event){
    if (event.keyCode === 13){
      searchString = search.value;
      updateMarkers()
    }

  }, false);

  map = new google.maps.Map(document.getElementById("map"),{
    center: defaultLocation,
    zoom: 13,
  });

  infoWindow = new google.maps.InfoWindow();

  let request = {
    location: defaultLocation, // Center of search circle
    radius: "10000",  //Radius of search circle in meters (max 50 000)
    type: ["restaurant"], // Type of establishment. NOT A KEYWORD!
  }

  service = new google.maps.places.PlacesService(map);

  service.nearbySearch(request, placesResultCallback);
}

function placesResultCallback(results, status){
  clearMarkers()
  if (status == google.maps.places.PlacesServiceStatus.OK){
    for (let i = 0; i < results.length; i++){
      let place = results[i];
      markersArray.push(
      new google.maps.Marker({
        map,
        title: place.name,
        position: place.geometry.location,
      }));
    }

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