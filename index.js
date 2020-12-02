'use strict';

let map, service, infoWindow, defaultLocation, rangeValue, searchString;
let placesDiv, stars, photosDiv, bubble, firebaseConfig, previewImg, previewDiv;
let storage, classifier, search, indicators, bootSlides, radiusCircle
let markersArray = [];
let placesArray = [];
let slideIndex = 1;

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
   let rangeInput = document.getElementById("range-input");
   search = document.getElementById("search-field");
   bubble = document.getElementById("bubble");
   placesDiv = document.getElementById("places")
   placesDiv.style.display = "none"
   previewImg = document.getElementById("toUpload");
   previewDiv = document.getElementById("uploadPreview");
   indicators = document.getElementById("inds");
   bootSlides = document.getElementById("bootSlides");

  rangeInput.addEventListener("change", function(){
    rangeValue = rangeInput.value;
    updateMarkers()
  }, false);

   rangeInput.addEventListener("input", () => {
     setBubble(rangeInput, bubble)
     radiusCircle.setRadius(Number(rangeInput.value))
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

   radiusCircle = new google.maps.Circle({
    strokeColor: "#FF0000",
    strokeOpacity: 0.9,
    strokeWeight: 2,
    fillColor: "#FF0000",
    fillOpacity: 0.35,
    map,
    center: defaultLocation,
    radius: 1000,
  });

  /*
    let request = {
      location: defaultLocation, // Center of search circle
      radius: "10000",  //Radius of search circle in meters (max 50 000)
      type: ["restaurant"], // Type of establishment. NOT A KEYWORD!
    }



    service.nearbySearch(request, placesResultCallback);

   */
  service = new google.maps.places.PlacesService(map);
  firebase.initializeApp(firebaseConfig);
  classifier = ml5.imageClassifier('./tensorflow/model.json', modelLoaded);


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
      let section = document.createElement('div');
      section.classList.add("col-2", "flex-column", "justify-content-center", "placesection", "mx-auto", "d-flex", "border-right", "border-right");
      // ID of the element is the unique ID of the restaurant to make future lookups easier
      section.id = place.place_id;
      let pics = []
      pics = place.photos
      let html =
          `
            <img src="`+ pics[0].getUrl({maxWidth: 100, maxHeight: 100}) +
          `" onclick="fetchAllImgs(` + section.id + `);" class="rounded-circle mx-auto d-block placethumb" width="100" height="100">
            
            
            <h4 class="d-block text-truncate"> ` + place.name + ` </h4>
            <p class="stars">` + stars + `</p>
            <div style="height:0px;overflow:hidden">
                 <input type="file" id="`+ section.id.toString() + 'input' + `" accept="image/*"/>
            </div>
            <button type="button" class="imgButton" data-toggle="modal" data-target="#pickerModal" onclick="chooseImage(`+ section.id.toString() +`);">Add photo</button>
          `
      section.innerHTML = html
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
    document.getElementById("myCarousel").style.display = "block"
    bootSlides.innerHTML = ""
    indicators.innerHTML = ""
    let i = 0
    place.photos.forEach(p => {
      let url = p.getUrl({maxWidth: 1200, maxHeight: 442})
      let li = document.createElement("li")
          li.setAttribute("data-target", "#myCarousel");
          li.setAttribute("data-slide-to", i.toString());
          if(i === 0){
            li.classList.add("active")
          }
      indicators.appendChild(li)

      let slide = document.createElement("div")
          slide.classList.add("carousel-item")
      if(i === 0){
          slide.classList.add("active", "h-90")
      }
      let img = document.createElement("img")
          img.src = url
          img.classList.add("d-block", "mx-auto")
      slide.appendChild(img)
      bootSlides.appendChild(slide)

      i++
    })
    //openModal()
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
  searchString = search.value;
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
      radiusCircle.center = defaultLocation
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
  document.getElementById("myCarousel").style.display = "none";
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
// Param is ID of restaurant that photo will be linked to
function chooseImage(id){
  let rdyimg
  let idd = id.id + "input"
  let element = document.getElementById(idd)
  let btn = document.getElementById("uploadToFirebase")
  let snackbar = document.getElementById("uploadSnackbar")
  element.click()
  element.addEventListener("change", function() {
      previewImg.src = window.URL.createObjectURL(this.files[0])
    previewImg.width = "800"
      previewImg.onload = function() {
        let result;
        isFood(previewImg).then(res => {
          result = res

        if(result){                   // if users photo contains food
          btn.disabled = false        // enable upload button
          snackbar.setAttribute("class", "")
          snackbar.classList.add("alert", "alert-success")
          snackbar.innerText = "Great pic!"
        } else {
          snackbar.setAttribute("class","")
          snackbar.classList.add("alert", "alert-danger")
          snackbar.innerText= "Your picture must have food in it!"
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
