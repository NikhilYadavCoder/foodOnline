let autocomplete;

function initAutoComplete(){
autocomplete = new google.maps.places.Autocomplete(
    document.getElementById('id_address'),
    {
        types: ['geocode', 'establishment'],
        //default in this app is "IN" - add your country code
        componentRestrictions: {'country': ['in']},
    })
// function to specify what should happen when the prediction is clicked
autocomplete.addListener('place_changed', onPlaceChanged);
}

function onPlaceChanged() {
    const place = autocomplete.getPlace();

    if (!place.geometry) {
        document.getElementById('id_address').placeholder = "Start typing...";
        return;
    }

    const latitude = place.geometry.location.lat();
    const longitude = place.geometry.location.lng();

    document.getElementById('id_latitude').value = latitude;
    document.getElementById('id_longitude').value = longitude;

    // Extract address components
    let country = '';
    let state = '';
    let city = '';
    let pincode = '';

    place.address_components.forEach(component => {
        const types = component.types;

        if (types.includes('country')) {
            country = component.long_name;
        }
        if (types.includes('administrative_area_level_1')) {
            state = component.long_name;
        }
        if (types.includes('locality')) {
            city = component.long_name;
        }
        if (types.includes('postal_code')) {
            pincode = component.long_name;
        }
    });

    // Populate the fields
    document.getElementById('id_country').value = country;
    document.getElementById('id_state').value = state;
    document.getElementById('id_city').value = city;
    document.getElementById('id_pincode').value = pincode;
}


