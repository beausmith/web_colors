$(function() {
	initializeMobileMenu();

    initializeContactForm();	

    initializeColorPickers();

    convertColors();
    //console.table(colors); // For Testing purposes

    for(i = 0; i < colors.length; i++){
        $( '#' + colors[i].originalFormat + 'Colors').append('<div class="color" style="background:' + colors[i].original + ';"><span>' + colors[i].original + '</span></div>');
    }

    $('.backgroundChanger').on("input change", function(){
        $( $(this).attr('data-target') ).css({
            fill: 'rgb(' + $(this).val() + ',' + $(this).val() + ',' + $(this).val() + ')'
        });
    });

    $('.color.listing').each(function(){
        $(this).css( 'background', $(this).find('span').text() )
    });

    printChart('rectangle','hue');
    printChart('fan','hue'); 
});

function initializeColorPickers(){
    $('.colorPicker input, .colorPicker select').on("input change", function(){
        var colorPicker = $(this).parents('.colorPicker');

        var colorFormat = colorPicker.attr('data-format');
        colorFormat = colorFormat.split(',');

        var colorDelimiter = colorPicker.attr('data-delimiter');

        var color = colorFormat[0];

        colorPicker.find('input, select').each(function(){
            if ($(this).attr('data-scale') != ''){
                color += $(this).val() / $(this).attr('data-scale') ;
            } else{
                color += $(this).val();                
            }

            color += $(this).attr('data-unit');

            if( ! $(this).is(':last-of-type') ){
                color += colorDelimiter;
            }
        });

        color += colorFormat[1];

        colorPicker.find('.colorBlock').text(color).css('border-color',color);
    }).change();
}

function convertColors(){
    colors = [];

    $('#aggregate .color.listing').each(function(){
        // Get original text
        var color = {original: $(this).text()};

        // Determine original color format and convert to hexadecimal        
        if ( /#(?:[0-9a-fA-F]{6})/.test(color.original) ){
            color.originalFormat = 'hexadecimal';

            color.hex = color.original;            

            color.rgb = hexToRgb(color.original);       

            //colors.hsv = rgbToHsv(color);                 
        } else if ( /#(?:[0-9a-fA-F]{3})/.test(color.original) ){
            color.originalFormat = 'threeDigitHexadecimal';

            color.hex = threeDigitsToSix(color.original);

            color.rgb = hexToRgb(color.hex);             

            //colors.hsv = rgbToHsv(color);                       
        } else if ( /(rgba)\(\d{1,3}%?(,\s?\d{1,3}%?){2},\s?(1|0|0?\.\d+)\)/.test(color.original) ){
            color.originalFormat = 'rgba';

            color.rgb = rgbaToRgb(color.original);

            color.hex = rgbToHex(color.rgb);

            if ( /#(?:[0-9a-fA-F]{3})/.test(color.hex) ){
                color.hex = threeDigitsToSix(color.hex);
            }            

            //colors.hsv = rgbToHsv(color);            
        } else if ( /(rgb)\(\d{1,3}%?(,\s?\d{1,3}%?){2}\)/.test(color.original) ){
            color.originalFormat = 'rgb';

            color.rgb = color.original;            

            color.hex = rgbToHex(color.original);

            colors.hsv = rgbToHsv(color.rgb);
            if ( /#(?:[0-9a-fA-F]{3})/.test(color.hex) ){
                color.hex = threeDigitsToSix(color.hex);
            }            
        } else if ( /(hsla)\(\d{1,3}%?(,\s?\d{1,3}%?){2},\s?(1|0|0?\.\d+)\)/.test(color.original) ){
            color.originalFormat = 'hsla';
        } else if ( /(hsl)\(\d{1,3}%?(,\s?\d{1,3}%?){2}\)/.test(color.original) ){
            color.originalFormat = 'hsl';
        } else{
            color.originalFormat = 'named';
        }

        if (color.rgb){ // Remove later, once I've converted named colors
            separateRgbValues(color);

            rgbToHsv(color);
            colors.push( color );
        }
    });
}

function sortColors(sortCriteria) {
    if (sortCriteria == 'hue'){
        return colors.sort(
            firstBy(function (v1, v2) { return v1.hue - v2.hue; })
            .thenBy(function (v1, v2) { return v1.sat - v2.sat; })
            .thenBy(function (v1, v2) { return v2.val - v1.val; })
        );
    }
    if (sortCriteria == 'sat'){
        return colors.sort(
            firstBy(function (v1, v2) { return v1.sat - v2.sat; })
            .thenBy(function (v1, v2) { return v1.hue - v2.hue; })
            .thenBy(function (v1, v2) { return v1.val - v2.val; })

        );
    }
    if (sortCriteria == 'val'){
        return colors.sort(
            firstBy(function (v1, v2) { return v1.val - v2.val; })
            .thenBy(function (v1, v2) { return v2.sat - v1.sat; })
            .thenBy(function (v1, v2) { return v1.hue - v2.hue; })
        );
    }
}

function printChart(type,sortCriteria){
    colors = sortColors(sortCriteria);

    if (type === 'fan'){
        fan = Snap('.chart.' + type + '.' + sortCriteria);
        center = $('.chart.' + type + '.' + sortCriteria).width()/2;

        $('.chart.' + type + '.' + sortCriteria).height( center * 2 );

        var circle = fan.circle(center, center, 0);

        circle.attr({
            fill: '#fff',
            class: 'background',
            r: center * 95/100
        });

        usedColors = [];
    }

    for(i = 0; i < colors.length; i++){    
        if (type === 'fan'){
            // Calculate rotation of hue.
            var rot = colors[i].hue * 360 / 255;
            // Convert from degrees to radians.
            rot *= 3.141592653589793 / 180;

            // Use simple trig to plot colors.
            x = center + Math.sin(rot) * colors[i].val * center * 93/100;
            y = center + Math.cos(rot) * colors[i].val * center * 93/100;

            var used = 1;

            for(z = 0; z < usedColors.length; z++){
                if (colors[i].hex === usedColors[z]){
                    used ++;
                }
            }

            usedColors.push(colors[i].hex);

            var circle = fan.circle(x, y, center/100 * Math.sqrt(used));

            circle.attr({
                fill: colors[i].hex,
            });
        } else if(type === 'rectangle'){
            dataPoint = '<div class="color" style="background:' + colors[i].hex + ';"><span>#' + colors[i].hex + '</span></div>';

            $('.chart.' + type + '.' + sortCriteria).append(dataPoint);   
        }
    }
}

function threeDigitsToSix(color){ 
   return '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
}

function hexToRgb(color){
    var red   = base16ToBase10( color.substring( 1, 3 ) );
    var green = base16ToBase10( color.substring( 3, 5 ) );
    var blue  = base16ToBase10( color.substring( 5, 7 ) );
 
    return 'rgb(' + red + ',' + green + ',' + blue + ')';
}

function rgbToHex(color){
    var temp_color = color.replace("rgb(", "");
    temp_color = temp_color.replace(")", "");
    temp_color = temp_color.split(',');

    var red = base10ToBase16(temp_color[0]);
    var green = base10ToBase16(temp_color[1]);
    var blue = base10ToBase16(temp_color[2]);

    return '#' + red + green + blue;
}

function rgbaToRgb(color){
    var temp_color = color.replace("rgba(", "");
    temp_color = temp_color.replace(")", "");        
    temp_color = temp_color.split(',');

    return 'rgb(' + temp_color[0] + ',' + temp_color[1] + ',' + temp_color[2] + ')';
}

function base16ToBase10(base16){
    return parseInt(base16,16);
}

function base10ToBase16(base10){
    var base16 = parseFloat(base10).toString(16);

    // If the hexadecimal number is only 1 character long, add 0 to the front.
    if (base16.length == 1){
        base16 = '0' + base16;
    }

    return base16;
}

function separateRgbValues(color){
    var temp_color = color.rgb.replace("rgb(", "");
    temp_color = temp_color.replace(")", "");
    temp_color = temp_color.split(',');

    color.red = temp_color[0];
    color.green = temp_color[1];
    color.blue = temp_color[2];    
}

function rgbToHsv(color){
    var rgb = color;
    rgb.red /= 255; 
    rgb.green /= 255; 
    rgb.blue /= 255; 

    /* Getting the Max and Min values for Chroma. */
    var max = Math.max.apply(Math, [rgb.red,rgb.green,rgb.blue]);
    var min = Math.min.apply(Math, [rgb.red,rgb.green,rgb.blue]);

    /* Variables for HSV value of hex color. */
    var chr = max-min;
    var hue = 0;
    if (max){
        var val = max;
    } else{
        val = 0;
    }
    var sat = 0;

    if (val > 0) {
        /* Calculate Saturation only if Value isn't 0. */
        sat = chr/val;
        if (sat > 0) {
            if (rgb.red == max) {
                hue = 60*(((rgb.green-min)-(rgb.blue-min))/chr);
                if (hue < 0) {hue += 360;}
            } else if (rgb.green == max) {
                hue = 120+60*(((rgb.blue-min)-(rgb.red-min))/chr);
            } else if (rgb.blue == max) {
                hue = 240+60*(((rgb.red-min)-(rgb.green-min))/chr);
            }
        }
    }

    rgb.hue = hue;
    rgb.sat = sat;
    rgb.val = val;
}


/*****************************************************************************************************/
// Default template functions
/*****************************************************************************************************/

function initializeMobileMenu(){
	$('#menu-toggle').click(function(){
		if ( $('#menu-toggle svg').attr('class') === 'open' ){
			$('#menu-toggle svg').attr('class','');
			$('#mobile_modal').fadeOut();
		} else{
			$('#menu-toggle svg').attr('class','open');
			$('#mobile_modal').fadeIn();			
		}

		var first_y = $('.first-line').attr('y2');
		var last_y = $('.last-line').attr('y2');

		animate(
	        $('.first-line'), // target jQuery element
	        { y2: last_y}, // target attributes
	        300 // optional duration in ms, defaults to 400
	    );
		animate(
	        $('.last-line'), // target jQuery element
	        { y2: first_y}, // target attributes
	        300 // optional duration in ms, defaults to 400
	    );

		$('header nav').toggleClass('open');
	});
}

function initializeContactForm(){
	$( ".contact_form" ).on( "submit", function( event ) {
	    event.preventDefault();

	    if ( validate() ){
		    var form_data = $('.contact_form').serialize();

		    $.ajax({
			    type : 'POST',
			    url : 'assets/php/utilities/email.php',
			    data : form_data,
			    success: function(data){
			    	$('.contact_form *').animate({'opacity':0},300);
			    	$('.contact_form').append(data);
			    	$('#success').fadeIn(300);
			    }
			});
		}
	});
}

function validate(){
	$('.error').removeClass('error');
	$('#error_text').remove();

	$('.required').each(function(){
		if ( $(this).val() === '' || $(this).val() === null || $(this).val() === undefined ){
			$(this).addClass('error');
			$(this).change(function(){ $(this).removeClass('error') });
		}
	});

	if ( $('.error').length > 0 ){
		$('<div id="error_text">Please fill out all required fields above. Required fields have a red outline.</div>').insertBefore('input[type=submit]');
		$('#error_text').slideDown(350);

		return false;
	} else{
		return true;
	}
}

/*****************************************************************************************************/
// Borrowed functions
/*****************************************************************************************************/

// Function allows you to animate SVG attributes like you would CSS properties. http://stackoverflow.com/a/17361309
function animate($el, attrs, speed) {
    speed = speed || 400;
    var start = {},
        timeout = 20,
        steps = Math.floor(speed/timeout),
        cycles = steps;
    
    $.each(attrs, function(k,v) {
        start[k] = $el.attr(k);
    });
    
    (function loop() {
        $.each(attrs, function(k,v) {
            var pst = (v - start[k])/steps;
            $el.attr(k, function(i, old) {
                return + old + pst;
            });
        });
      if ( --cycles )
          setTimeout(loop, timeout);
      else
          $el.attr(attrs);
    })();
}

/***
   Copyright 2013 Teun Duynstee

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */
firstBy = (function() {
    /* mixin for the `thenBy` property */
    function extend(f) {
        f.thenBy = tb;
        return f;
    }
    /* adds a secondary compare function to the target function (`this` context)
       which is applied in case the first one returns 0 (equal)
       returns a new compare function, which has a `thenBy` method as well */
    function tb(y) {
        var x = this;
        return extend(function(a, b) {
            return x(a,b) || y(a,b);
        });
    }
    return extend;
})();
