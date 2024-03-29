var markers = [];
var locations = [];
var noFilterLocations = []
var search = "";
var radius = null;
var isNameChecked = false;
// Default location (Toronto)
var pos = {
    lat: 43.6425662,
    lng: -79.3892508
};

// Handle google map load error
function googleError() {
    alert("Could not load google map!");
}

// viewModel
function viewModel() {
    search = ko.observable();
    locations = ko.observableArray();
    radius = ko.observable(2750);
    toggleClass = ko.observable();
    toggleMenu = function() {
        if (toggleClass() === "toggled") {
            toggleClass("");
        } else {
            toggleClass("toggled");
        }
    }

    isNameChecked = ko.observable();
    isNameChecked.subscribe(function(newValue) {
        filter();
    });
}

// Initiate viewModel
var vm = new viewModel();
ko.applyBindings(vm);

function showInfo() {
    alert("The website is using two different APIs to gather data.\n \
          Zomato. (for the side-bar list)\n \
          Foursquare. (for map info windows)")
}

// filter the data if it hase no data to show
function filter() {
    var tempLocations = [];
    if (isNameChecked()) {
        noFilterLocations.length = 0;
        for (var i = 0; i < locations().length; i++) {
            if (locations()[i].foursquare.name != "No data!") {
                tempLocations.push(locations()[i]);
            } else {
                markers[i].setVisible(false);
            }
            noFilterLocations.push(locations()[i]);
        }
        locations(tempLocations);
    } else {
        for (var i = 0; i < noFilterLocations.length; i++) {
            if (noFilterLocations[i].foursquare.name === "No data!") {
                markers[i].setVisible(true);
            }
        }
        locations(noFilterLocations.slice(0));
    }
}

// Find places using the search term
function find() {
    isNameChecked(false);
    findGeolocation();
}

// Model for data from foursquare
function getLocationsFoursquare(lat, lng, search, index) {
    $.ajax({
        url: "https://api.foursquare.com/v2/venues/search",
        data: {
            categoryId: '4d4b7105d754a06374d81259',
            radius: '100',
            ll: lat + "," + lng,
            query: search,
            client_id: 'H2KDEDO03T5D5UZHSG24XXMVP3WST2GWIHPBO2RQIEREJ2OW',
            client_secret: '2DHASPBYJDCPPZJHU2AWGKSNHI141CBASPZ5F4LJN5QUNI4H',
            v: '20170114'
        },
        type: "GET",
        success: function(data) {
            var no_data = {
                name: 'No data!',
                location: {
                    address: 'No address!'
                },
                url: 'https://www.google.ca/#q=' + locations()[index].name,
                is_data: false
            };
            if (data.response.venues.length > 0) {
                var obj = data.response.venues[0];
                if ('name' in obj) {
                    locations()[index].foursquare = obj;
                    if (!('url' in obj)) {
                        obj['url'] = 'https://www.google.ca/#q=' + obj.name;
                    }
                    if (!('location' in obj)) {
                        obj['location'] = {
                            address: 'No address!'
                        };
                    } else if (!('address' in obj.location)) {
                        obj['location']['address'] = 'No address!';
                    }
                } else {
                    locations()[index].foursquare = no_data;
                }
            } else {
                locations()[index].foursquare = no_data;
            }
        },
        error: function(x, t, m) {
            if (t === "timeout") {
                alert("The Foursquare API did not load!");
            } else {
                alert("Something went wrong!");
            }
        }
    });
}

// Model for data from zomato
function getLocations(lat, lng, search) {
    locations([]);
    $.ajax({
        url: "https://developers.zomato.com/api/v2.1/search",
        data: {
            lat: lat,
            lon: lng,
            radius: radius(),
            q: search
        },
        type: "GET",
        timeout: 5000,
        beforeSend: function(xhr) {
            xhr.setRequestHeader('user-key', '892a31736bd16f15eedd942201d67ca2');
        },
        success: function(data) {
            var places = data.restaurants;
            var j = 0;
            for (i in places) {
                name = places[i].restaurant.name;
                lat = places[i].restaurant.location.latitude;
                lng = places[i].restaurant.location.longitude;
                // if lat and ln sre not zero
                if (lat * lng != 0) {
                    getLocationsFoursquare(lat, lng, name, i - j);
                    locations.push({
                        index: i - j,
                        name: name,
                        position: {
                            lat: lat,
                            lng: lng
                        }
                    });
                } else {
                    j++;
                }
            }
            drop();
        },
        error: function(x, t, m) {
            if (t === "timeout") {
                alert("The Zomato API did not load!");
            } else {
                alert("Something went wrong!");
            }
        }
    });
}

// To handle click event on list items
function listClick(data) {
    new google.maps.event.trigger(markers[data.index], 'click');
}

// Add markers to markers array
function addMarkers(name, lat, lng) {
    var image_home = 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
    var image_places = 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';

    var position = new google.maps.LatLng(lat, lng);
    bounds.extend(position);
    if (name === 'Your location!' || name === 'Toronto') {
        marker = new google.maps.Marker({
            position: position,
            map: map,
            icon: image_home,
            animation: google.maps.Animation.DROP
        });
    } else {
        marker = new google.maps.Marker({
            position: position,
            map: map,
            icon: image_places,
            animation: google.maps.Animation.DROP
        });
        markers.push(marker);
    }
}

// Function to add info window to markers
function addInfoWindow(marker, content) {
    var infowindow = new google.maps.InfoWindow();

    google.maps.event.addListener(marker, 'click', (function(marker, content, infowindow) {
        return function() {
            marker.setIcon('http://maps.google.com/mapfiles/ms/icons/blue-dot.png');
            infowindow.setContent(
                '<a href="' + content.url + '" target="_blank">' + content.name + '</a>' +
                '<p>' + content.location.address + '</p>'
            );
            infowindow.open(map, marker);
        };
    })(marker, content, infowindow));

    google.maps.event.addListener(infowindow, 'closeclick', function() {
        marker.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png');
    });
}

// Animate map markers to drop
function drop() {
    clearMarkers();
    for (var i = 0; i < locations().length; i++) {
        addMarkerWithTimeout(locations()[i], (i + 1) * 300, i);
    }
}

// Add marker with delay to get a marker drop effect
function addMarkerWithTimeout(location, timeout, index) {
    window.setTimeout(function() {
        addMarkers(location.name, location.position.lat, location.position.lng);
        addInfoWindow(markers[index], locations()[index].foursquare);
    }, timeout);
}

// Clear markers for new search
function clearMarkers() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
}

// Try HTML5 geolocation.
function findGeolocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            defaultLocations("Your location!", pos.lat, pos.lng)
            map.setCenter(pos);
        }, function() {
            defaultLocations("Toronto", pos.lat, pos.lng);
            handleLocationError(true, alert, map.getCenter());
        });
    } else {
        // Browser doesn't support Geolocation
        defaultLocations("Toronto", pos.lat, pos.lng);
        handleLocationError(false, alert, map.getCenter());
    }
}

// Make default locations or get geo location and search
function defaultLocations(name, lat, lng) {
    addMarkers(name, lat, lng);
    if (name === 'Toronto') {
        radius(2750);
        locations([]);
        search("sushi");
        getLocations(pos.lat, pos.lng, search());
    } else {
        getLocations(pos.lat, pos.lng, search());
    }
}

// Check if the user shared their geolocation or their browser support it
function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
        'Error: The Geolocation service failed.' :
        'Error: Your browser doesn\'t support geolocation.');
}

function initialize() {
    // Map customization
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 14,
        center: pos,
        disableDefaultUI: true,
        styles: [{
            elementType: 'geometry',
            stylers: [{
                color: '#242f3e'
            }]
        }, {
            elementType: 'labels.text.stroke',
            stylers: [{
                color: '#242f3e'
            }]
        }, {
            elementType: 'labels.text.fill',
            stylers: [{
                color: '#746855'
            }]
        }, {
            featureType: 'administrative.locality',
            elementType: 'labels.text.fill',
            stylers: [{
                color: '#d59563'
            }]
        }, {
            featureType: 'poi',
            elementType: 'labels.text.fill',
            stylers: [{
                color: '#d59563'
            }]
        }, {
            featureType: 'poi.park',
            elementType: 'geometry',
            stylers: [{
                color: '#263c3f'
            }]
        }, {
            featureType: 'poi.park',
            elementType: 'labels.text.fill',
            stylers: [{
                color: '#6b9a76'
            }]
        }, {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{
                color: '#38414e'
            }]
        }, {
            featureType: 'road',
            elementType: 'geometry.stroke',
            stylers: [{
                color: '#212a37'
            }]
        }, {
            featureType: 'road',
            elementType: 'labels.text.fill',
            stylers: [{
                color: '#9ca5b3'
            }]
        }, {
            featureType: 'road.highway',
            elementType: 'geometry',
            stylers: [{
                color: '#746855'
            }]
        }, {
            featureType: 'road.highway',
            elementType: 'geometry.stroke',
            stylers: [{
                color: '#1f2835'
            }]
        }, {
            featureType: 'road.highway',
            elementType: 'labels.text.fill',
            stylers: [{
                color: '#f3d19c'
            }]
        }, {
            featureType: 'transit',
            elementType: 'geometry',
            stylers: [{
                color: '#2f3948'
            }]
        }, {
            featureType: 'transit.station',
            elementType: 'labels.text.fill',
            stylers: [{
                color: '#d59563'
            }]
        }, {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{
                color: '#17263c'
            }]
        }, {
            "featureType": "poi",
            "stylers": [{
                "visibility": "off"
            }]
        }, {
            "featureType": "transit",
            "stylers": [{
                "visibility": "off"
            }]
        }, {
            featureType: 'water',
            elementType: 'labels.text.fill',
            stylers: [{
                color: '#515c6d'
            }]
        }, {
            featureType: 'water',
            elementType: 'labels.text.stroke',
            stylers: [{
                color: '#17263c'
            }]
        }]
    });
    bounds = new google.maps.LatLngBounds();
    defaultLocations("Toronto", pos.lat, pos.lng);
}
