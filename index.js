let map;

function initMap(){
  map = new google.maps.Map(document.getElementById("map"),{
    center: {lat: 60.223978, lng: 24.758720},
    zoom: 13,
  });
}