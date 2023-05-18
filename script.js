$(document).ready(function() {
    
    //activate wow.js
     new WOW().init();
  
    //activate fullpage.js
    $('#fullpage').fullpage({
      scrollBar: true,
      navigation: true,
      navigationTooltips: ['This is:', 'Your Companion', 'We aim to:', 'We do this by:', 'Possible results', 'Please note', 'Lets Try it', 'Recording', 'Your Results', 'Coming to', 'Meet the Team'],
      loopBottom: true,
      sectionSelector: 'section'
    });
  
  //apply color to each section from array
  int = -1;
  color_array = ['#e8eddf','#adca7a' ,'#73ad46', '#437b18', '#e8eddf','#adca7a' ,'#73ad46', '#437b18', '#e8eddf','#2e83e4' ,'#73ad46'];


  $('section').each(function(){
    int++
    $(this).addClass('grid-item-' + int).css('background-color', color_array[int]);
  });
  
});


// Recording



var msg_box = document.getElementById( 'msg_box' ),
    button = document.getElementById( 'button' ),
    canvas = document.getElementById( 'canvas' ),
lang = {
    'mic_error': 'Error accessing the microphone', 
    // 'press_to_start': 'Press to start recording', 
    'recording': 'Recording', 
    'play': 'Play', 
    'stop': 'Stop', 
    'download': 'Download', 
    'use_https': 'This application in not working over insecure connection. Try to use HTTPS'
},
time;


// msg_box.innerHTML = lang.press_to_start;

if ( navigator.mediaDevices === undefined ) {
    navigator.mediaDevices = {};
}


if ( navigator.mediaDevices.getUserMedia === undefined ) {
    navigator.mediaDevices.getUserMedia = function ( constrains ) {
        var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia
        if ( !getUserMedia )  {
            return Promise.reject( new Error( 'getUserMedia is not implemented in this browser' ) );
        }

        return new Promise( function( resolve, reject ) {
            getUserMedia.call( navigator, constrains, resolve, reject );
        } );
    }
}


if ( navigator.mediaDevices.getUserMedia ) {
    var btn_status = 'inactive',
        mediaRecorder,
        chunks = [],
        audio = new Audio(),
        mediaStream,
        audioSrc,
        type = {
            'type': 'audio/ogg,codecs=opus'
        },
        ctx,
        analys,
        blob;

    button.onclick = function () {
        if ( btn_status == 'inactive' ) {
            start();
        } else if ( btn_status == 'recording' ) {
            stop();
        }
    }

    function parseTime( sec ) {
        var h = parseInt( sec / 3600 );
        var m = parseInt( sec / 60 );
        var sec = sec - ( h * 3600 + m * 60 );

        h = h == 0 ? '' : h + ':';
        sec = sec < 10 ? '0' + sec : sec;

        return h + m + ':' + sec;
    }


    function start() {
        navigator.mediaDevices.getUserMedia( { 'audio': true } ).then( function ( stream ) {
            mediaRecorder = new MediaRecorder( stream );
            mediaRecorder.start();

            button.classList.add( 'recording' );
            btn_status = 'recording';

            msg_box.innerHTML = lang.recording;
          
            if ( navigator.vibrate ) navigator.vibrate( 150 );

            time = Math.ceil( new Date().getTime() / 1000 );


            mediaRecorder.ondataavailable = function ( event ) {
                chunks.push( event.data );
            }

            mediaRecorder.onstop = function () {
                stream.getTracks().forEach( function( track ) { track.stop() } );

                blob = new Blob( chunks, type );
                audioSrc = window.URL.createObjectURL( blob );

                audio.src = audioSrc;

                chunks = [];
            }   

            
            
        } ).catch( function ( error ) {
            if ( location.protocol != 'https:' ) {
              msg_box.innerHTML = lang.mic_error + '<br>'  + lang.use_https;
            } else {
              msg_box.innerHTML = lang.mic_error; 
            }
            button.disabled = true;
        });
    }

    function stop() {
        mediaRecorder.stop();
        button.classList.remove( 'recording' );
        btn_status = 'inactive';
      
        if ( navigator.vibrate ) navigator.vibrate( [ 200, 100, 200 ] );

        var now = Math.ceil( new Date().getTime() / 1000 );

        var t = parseTime( now - time );

        msg_box.innerHTML = '<a href="#" onclick="play(); return false;" class="txt_btn">' + lang.play + ' (' + t + 's)</a><br>' +
                            '<a href="#" onclick="save(); return false;" class="txt_btn">' + lang.download + '</a>'
    }

    

    function play() {
        audio.play();
        msg_box.innerHTML = '<a href="#" onclick="pause(); return false;" class="txt_btn">' + lang.stop + '</a><br>' +
                            '<a href="#" onclick="save(); return false;" class="txt_btn">' + lang.download + '</a>';
    }

    function pause() {
        audio.pause();
        audio.currentTime = 0;
        msg_box.innerHTML = '<a href="#" onclick="play(); return false;" class="txt_btn">' + lang.play + '</a><br>' +
                            '<a href="#" onclick="save(); return false;" class="txt_btn">' + lang.download + '</a>'
    }

    function roundedRect(ctx, x, y, width, height, radius, fill) {
        ctx.beginPath();
        ctx.moveTo(x, y + radius);
        ctx.lineTo(x, y + height - radius);
        ctx.quadraticCurveTo(x, y + height, x + radius, y + height);
        ctx.lineTo(x + width - radius, y + height);
        ctx.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
        ctx.lineTo(x + width, y + radius);
        ctx.quadraticCurveTo(x + width, y, x + width - radius, y);
        ctx.lineTo(x + radius, y);
        ctx.quadraticCurveTo(x, y, x, y + radius);
        
        ctx.fillStyle = fill;
        ctx.fill();
    }

    function save() {
        var a = document.createElement( 'a' );
        a.download = 'record.wav';
        a.href = audioSrc;
        document.body.appendChild( a );
        a.click();

        document.body.removeChild( a );
    }

} else {
    if ( location.protocol != 'https:' ) {
      msg_box.innerHTML = lang.mic_error + '<br>'  + lang.use_https;
    } else {
      msg_box.innerHTML = lang.mic_error; 
    }
    button.disabled = true;
}