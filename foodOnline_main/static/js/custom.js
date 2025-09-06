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


$(document).ready(function(){
    // Add to cart
    $('.add_to_cart').on('click',function(e){
        e.preventDefault();

        food_id = $(this).attr('data-id');
        url = $(this).attr('data-url');
        $.ajax({
            type: 'GET',
            url:url,
            success: function(response){
                // console.log(response.cart_counter['cart_count']);
                if(response.status == 'login_required'){
                    swal(response.message,'','info').then(function(){
                        window.location = '/login';
                    })
                }else if(response.status == 'Failed'){
                    swal(response.message,'','error')
                }else{
                    if (response.cart_counter && typeof response.cart_counter.cart_count !== "undefined") {
                      $("#cart_counter").html(response.cart_counter.cart_count);
                    } else {
                      console.warn("cart_counter or cart_count missing in response:",response);
                    }

                    if (typeof response.qty !== "undefined") {
                      $("#qty-" + food_id).html(response.qty);
                    }

                    applyCartAmounts(
                        response.cart_amount['subtotal'],
                        response.cart_amount['tax'],
                        response.cart_amount['total']
                    )
                }
            }
        });
    });
    // Place the cart item quantity on load
    $('.item_qty').each(function(){
        var the_id = $(this).attr('id')
        var qty = $(this).attr('data-qty')
        $('#'+the_id).html(qty)
    });
    $('.decrease_cart').on('click', function(e) {
    e.preventDefault();

    const food_id = $(this).data('id');     // fooditem.id
    const cart_id = $(this).data('cartid'); // cart id
    const url = $(this).data('url');

    $.ajax({
        type: 'GET',
        url: url,
        success: function(response) {
            if (response.status === 'login_required') {
                swal(response.message, '', 'info').then(() => {
                    window.location = '/login';
                });
            } 
            else if (response.status === 'Failed') {
                swal(response.message, '', 'error');
            } 
            else {
                // ✅ Update cart counter
                if (response.cart_counter?.cart_count !== undefined) {
                    $('#cart_counter').text(response.cart_counter.cart_count);
                }
                applyCartAmounts(
                    response.cart_amount['subtotal'],
                    response.cart_amount['tax'],
                    response.cart_amount['total']
                )
                // ✅ Update quantity
                if (response.qty !== undefined) {
                    const qtyElement = $(`#qty-${food_id}`);
                    qtyElement.text(response.qty);
                    qtyElement.attr("data-qty", response.qty); // keep in sync
                    RemoveCartItem(response.qty, cart_id);
                }

                checkEmptyCart();
            }
        },
        error: function(xhr, status, error) {
            console.error("Error decreasing cart:", error);
        }
    });
});



    // Delete cart item
    $('.delete_cart').on('click',function(e){
        e.preventDefault();

        cart_id = $(this).attr('data-id');
        url = $(this).attr('data-url');

       
        $.ajax({
            type: 'GET',
            url:url,
            success: function(response){
                // console.log(response);
                if(response.status == 'Failed'){
                    swal(response.message,'','error')
                }
                else{
              
                    $("#cart_counter").html(response.cart_counter.cart_count);
                    swal(response.status,response.message,"success")

                    applyCartAmounts(
                        response.cart_amount['subtotal'],
                        response.cart_amount['tax'],
                        response.cart_amount['total']
                    )
                    
                    RemoveCartItem(0,cart_id);
                    checkEmptyCart();
                }
                
                
            }
        });
    });

    // delete the cart item if quantity is 0

    function RemoveCartItem(cartItemQuantity,cart_id){
        if(window.location.pathname == '/cart/'){
            if(cartItemQuantity<=0){
                document.getElementById("cart-item-"+cart_id).remove()
            }
        }
        
    }

    function checkEmptyCart(){
        var cart_counter = document.getElementById('cart_counter').innerHTML
        if(cart_counter == 0){
            document.getElementById("empty-cart").style.display = "block";
        }
    }

    // apply cart amounts
    function applyCartAmounts(subtotal, tax, total){
        if(window.location.pathname == '/cart/'){
            $('#subtotal').html(subtotal)
            $('#tax').html(tax)
            $('#total').html(total)
        }
        
    }

    // Add Opening Hours

    $('.add_hour').on('click',function(e){
        e.preventDefault();
        var day = document.getElementById('id_day').value
        var from_hour = document.getElementById('id_from_hour').value
        var to_hour = document.getElementById('id_to_hour').value
        var is_closed = document.getElementById('id_is_closed').checked
        var csrf_token = $('input[name=csrfmiddlewaretoken]').val()
        var url = document.getElementById('add_hour_url').value

        console.log(day, from_hour, to_hour, is_closed, csrf_token)

        if(is_closed){
            is_closed = 'True'
            condition = "day != ''"
        }else{
            is_closed = 'False'
            condition = "day != '' && from_hour != '' && to_hour != ''"
        }

        if(eval(condition)){
            $.ajax({
                type: 'POST',
                url: url,
                data: {
                    'day': day,
                    'from_hour': from_hour,
                    'to_hour': to_hour,
                    'is_closed': is_closed,
                    'csrfmiddlewaretoken': csrf_token,
                },
                success: function(response){
                    if(response.status == 'success'){
                        if(response.is_closed == 'closed'){
                            html = '<tr id="hour-'+response.id+'"><td><b>'+ response.day+'</b></td><td><b>Closed</b></td><td><a href="#" class="remove_hour" data-url="/vendor/opening-hours/remove/'+response.id+'/"><b>Remove</b></a></td></tr>'
                        }else{
                            html = '<tr id="hour-'+response.id+'"><td><b>'+ response.day+'</b></td><td><b>'+response.from_hour+'</b>-<b>'+response.to_hour+'</b></td><td><a href="#" class="remove_hour" data-url="/vendor/opening-hours/remove/'+response.id+'/"><b>Remove</b></a></td></tr>'
                        }
                        
                        $(".opening_hours").append(html)
                        document.getElementById("opening_hours").reset();
                    }else{
                        swal(response.message,'',"error")
                    }
                }
            })
        }else{
            swal('Please fill all the fields','','info')
        }
    });

   
    $(document).on('click','.remove_hour',function(e){
        e.preventDefault();
        url = $(this).attr('data-url');
        
        $.ajax({
            type: 'GET',
            url: url,
            success: function(response){
                if(response.status == 'success'){
                    document.getElementById('hour-'+response.id).remove()
                }
            }
        })
    })

    // document ready close 
});