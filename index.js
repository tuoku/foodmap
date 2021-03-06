'use strict';

let map, service, infoWindow, defaultLocation, rangeValue, searchString;
let placesDiv, stars, photosDiv, bubble, firebaseConfig, previewImg, previewDiv;
let storage, classifier, rangeCircle, lastRange, directionsService, directionsRenderer;
let placesExpanded = false;
let markersArray = [];
let placesArray = [];
let slideIndex = 1;
let placeMap
const proxy =  'https://cors-anywhere.herokuapp.com/';

rangeValue = 1000;

function initMap(){

  //-------------------------------------------------------
  //DO NOT TOUCH!! >:(
  firebaseConfig = {
    apiKey: "AIzaSyCOgbsMFFs0zhIP9ht6cxzwccOs88gbqCM",
    authDomain: "foodmap-295213.firebaseapp.com",
    databaseURL: "https://foodmap-295213.firebaseio.com",
    projectId: "foodmap-295213",
    storageBucket: "foodmap-295213.appspot.com",
    messagingSenderId: "789924552582",
    appId: "1:789924552582:web:810068b3e4a771c2031607"
  };
  //-------------------------------------------------------
  // Firebase storage bucket structure:
  // directory named $restaurantID / $photoindex.jpg
  // where $restaurantID = the unique id from PlacesAPI
  // and $photoindex = index of photo; first photo uploaded to restaurant has index of 1
  // examples:
  // ChIJEdEzdqn0jUYRtnfd75LPWBM/1.jpg
  // ChIJcZ3xnWP1jUYR8TBEhDP7J3o/7.jpg

  defaultLocation = new google.maps.LatLng(60.223978, 24.758720); // Karamalmi :)
  getLocation()
    placeMap = new Map()

   let rangeInput = document.getElementById("range-input");
   let search = document.getElementById("search-field");
   bubble = document.getElementById("bubble");
   placesDiv = document.getElementById("places")
   //placesDiv.style.display = "none"
   photosDiv = document.getElementById("modal-content");
   photosDiv.style.display = "none"
   previewImg = document.getElementById("toUpload");
   previewDiv = document.getElementById("uploadPreview");
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer();


  rangeInput.addEventListener("change", function(){
    rangeValue = rangeInput.value;
    let bounds = rangeCircle.getBounds()
    map.fitBounds(bounds)
    updateMarkers()
  }, false);

   rangeInput.addEventListener("input", () => {
     setBubble(rangeInput, bubble)
     rangeCircle.setRadius(Number(rangeInput.value))

   });
   setBubble(rangeInput, bubble)

  search.addEventListener("keyup", function(event){
    if (event.keyCode === 13){

    }

  }, false);
   document.getElementById("searchButton").addEventListener("click", function(){
     searchString = search.value;
     updateMarkers()
   })

  map = new google.maps.Map(document.getElementById("map"),{
    center: defaultLocation,
    zoom: 13,
    disableDefaultUI: true,
  });


  infoWindow = new google.maps.InfoWindow();

  rangeCircle = new google.maps.Circle({
    strokeColor: "#D32F2F",
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: "#D32F2F",
    fillOpacity: 0.1,
    map,
    center: defaultLocation,
    radius: 1000,
  });

  directionsRenderer.setMap(map)
  directionsRenderer.setPanel(document.getElementById("directions"))

  service = new google.maps.places.PlacesService(map);
  firebase.initializeApp(firebaseConfig);
  classifier = ml5.imageClassifier('./tensorflow/model.json', modelLoaded);


}
// Handles the search results from PlaceAPI nearby search
function placesResultCallback(results, status){
  clearMarkers()
  placesArray = []
  placesDiv.innerHTML=``
  placesDiv.style.display = "flex"
  if (status == google.maps.places.PlacesServiceStatus.OK){
    for (let i = 0; i < results.length; i++) {
      let place = results[i];
      // Place IDs containing a hyphen break a lot of functionality, so we'll just ignore those restaurants...
      if (!place.place_id.includes("-")) {
        setStars(place.rating);
        placesArray.push(place);
        let section = document.createElement('article');
        section.className = 'placesection';
        // ID of the element is the unique ID of the restaurant to make future lookups easier
        section.id = place.place_id;
        let pics = []
        pics = place.photos
        let ltln = new google.maps.LatLng(place.geometry.location.lat(),
            place.geometry.location.lng());
        console.log(ltln)
        let name = place.name
        let navBtn = document.createElement("button")
        navBtn.type = "button"
        navBtn.classList.add("imgButton","btn")
        navBtn.innerText = "Get directions"

        let html =
            `
            <img src="` + pics[0].getUrl({maxWidth: 100, maxHeight: 100}) +
            `" onclick="fetchAllImgs(` + section.id + `);" class="placethumb btn">
            <h4> ` + place.name + ` </h4>
            <p class="stars">` + stars + `</p>
            <div style="height:0px;overflow:hidden">    
                <input type="file" id="` + section.id.toString() + 'input' + `" accept="image/*"/>    
            </div>
            <button type="button" class="imgButton btn" onclick="chooseImage(` +
            section.id.toString() + `);">Add photo</button>
            
            
            
          `
        section.innerHTML = html
        section.appendChild(navBtn)
        navBtn.addEventListener('click', function() {
          directionsRenderer.setMap(map)
          document.getElementById("map").style.height = "100vh"
          document.getElementById("places").style.height = "0px"
          document.getElementById("search").style.display = "none"
          document.getElementById("mapClose").style.display = "block"
          document.getElementById("directions").style.display = "block"
          document.getElementById("expandPlaces").style.display = "none"
          rangeCircle.opacity = 0
          getDirections(ltln)
        })
        placesDiv.appendChild(section)
        markersArray.push(
            new google.maps.Marker({
              map,
              title: place.name,
              position: place.geometry.location,
            }));
      }
    }
  }
}

// Fetches all user-submitted images from firebase storage for a given restaurant
// and adds them to the slideshow.
// Also makes a PlaceDetails request with photosCallback.
// photosCallback adds images from PlacesAPI to the slideshow, in addition to the
// user submitted photos.
function fetchAllImgs(id){
  storage = firebase.storage()
  let storeRef = storage.ref()
  let resRef = storeRef.child(id.id)
  resRef.listAll().then(function(res) {
    res.items.forEach(r => {
      let url
      r.getDownloadURL().then(function(r){
        url = r
        let a = document.createElement("div")
        a.className="mySlides"
        let b =
            ` 
                 
                 <img src="`+ url +`" class="slideImg"> 
          `
        a.innerHTML = b
        photosDiv.appendChild(a)
      })
    })
  })


  let req = {
    placeId: id.id,
    fields: ['photos']
  };
  service.getDetails(req, photosCallback);
  console.log("clicked")
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
      let img = document.createElement("img")
          img.src = url
          img.className = "slideImg"
        a.appendChild(img)
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
      rangeCircle.setCenter(defaultLocation)
    });
  } else {
    alert("Geolocation is not supported by this browser.");
  }
}
function openModal() {
  document.getElementById("placephotos").style.display = "flex";

  showSlides(slideIndex);
}
function closeModal() {
  document.getElementById("placephotos").style.display = "none";
}
 function closeUploadPreview(){
  previewDiv.style.display = "none"
 }



function plusSlides(n) {
  showSlides(slideIndex += n);
}

function showSlides(n) {
  let i;
  let slides = document.getElementsByClassName("mySlides");
  if (n > slides.length) {slideIndex = 1}
  if (n < 1) {slideIndex = slides.length}
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  slides[slideIndex-1].style.display = "flex";
}
// Param is ID of restaurant that photo will be linked to
function chooseImage(id){
  let rdyimg
  let idd = id.id + "input"
  let element = document.getElementById(idd)
  let btn = document.getElementById("uploadToFirebase")
  let snackbar = document.getElementById("uploadSnackbar")
  element.click()
  element.addEventListener("change", function() {
      previewDiv.style.display = "flex"
      previewImg.src = window.URL.createObjectURL(this.files[0])
    previewImg.width = "800"
      previewImg.onload = function() {
        let result;
        isFood(previewImg).then(res => {
          result = res

        if(result){                   // if users photo contains food
          btn.style.display = "block" // show the upload button
          snackbar.style.backgroundColor = "green"
          snackbar.innerText = "Great pic!"
          snackbar.style.display = "block"
        } else {
          btn.style.display = "none"
          snackbar.style.backgroundColor = "red"
          snackbar.innerText= "Your picture must have food in it!"
          snackbar.style.display = "block"
        }
      })
      }

      rdyimg = this.files[0]
  })

  btn.addEventListener("click", function() {
    uploadImage(id.id, rdyimg)
  })
}
function uploadImage(id, img){
  storage = firebase.storage()
  let i
  let storeRef = storage.ref();
  let resRef = storeRef.child(id)
  resRef.listAll().then(function(res){
    i = res.items.length + 1
    console.log(i)
    let filename = i + ".jpg"
    let fileRef = resRef.child(filename)
    fileRef.put(img).then(function(snapshot){
      console.log("uploaded img to " + fileRef)
      previewDiv.style.display = "none"
  })

  })
}

// Called when ml5.js initialized
function modelLoaded(){
  console.log("ml5 ready")
}
// (probably) returns true if given image contains food.
// Model only has 2 labels; food and notfood.
// Combined confidence of both labels is always 1.0,
// so "confidence > 0.9" means the model is atleast 90% sure it sees food.
// param img is an <img> element
function isFood(img){
  return new Promise((resolve,reject) => {
    classifier.classify(img).then(results => {
      console.log(results)
      if(results[0].label == "food" && results[0].confidence > 0.9){ // adjust this number to adjust sensitivity
        resolve(true)
      } else {
        resolve(false)
      }
  })
})
}

function getDirections(LatLng){
  let request = {
    origin: defaultLocation,
    destination: LatLng,
    travelMode: 'DRIVING'
  };
  directionsService.route(request, function(result, status) {
    if (status == 'OK') {
      directionsRenderer.setDirections(result);
    }
  });
}

function exitMap(){
  document.getElementById("map").style.height = "60vh"
  document.getElementById("places").style.height = "40vh"
  document.getElementById("search").style.display = "block"
  document.getElementById("mapClose").style.display = "none"
  document.getElementById("directions").style.display = "none"
  document.getElementById("expandPlaces").style.display = "block"
  rangeCircle.strokeOpacity = 0.8
  rangeCircle.fillOpacity = 0.1
  directionsRenderer.setMap(null)
}

function expandPlaces(){
  document.getElementById("places").style.height = "80vh"
  document.getElementById("places").style.top = "20vh"
  document.getElementById("places").style.flexWrap = "wrap"
  document.getElementById("map").style.height = "20vh"
  document.getElementById("expandPlaces").style.top = "15vh"
  document.getElementById("expandPlaces").style.transform = "rotate(180deg)"
  document.querySelectorAll(".placesection").forEach(s => {s.style.height = "11em"})
  placesExpanded = true

}
 function shrinkPlaces(){
   document.getElementById("places").style.height = "40vh"
   document.getElementById("places").style.top = "60vh"
   document.getElementById("places").style.flexWrap = "nowrap"
   document.getElementById("map").style.height = "60vh"
   document.getElementById("expandPlaces").style.top = "56vh"
   document.getElementById("expandPlaces").style.transform = "rotate(0deg)"
   document.querySelectorAll(".placesection").forEach(s => {s.style.height = "85%"})
   placesExpanded = false
 }

 function togglePlaces(){
  if(placesExpanded){
    shrinkPlaces()
  }else{
    expandPlaces()
  }
 }
