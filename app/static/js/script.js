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
  color_array = ['#e8eddf','#adca7a' ,'#73ad46', '#437b18', '#e8eddf', '#FFFFFF' ,'#73ad46', '#437b18', '#e8eddf','#2e83e4' ,'#73ad46'];


  $('section').each(function(){
    int++
    $(this).addClass('grid-item-' + int).css('background-color', color_array[int]);
  });
  var msg_box = document.getElementById('msg_box'),
    button = document.getElementById('button'),
    canvas = document.getElementById('canvas'),
    lang = {
      'mic_error': 'Error accessing the microphone',
      'recording': 'Recording',
      'play': 'Play',
      'stop': 'Stop',
      'download': 'Download',
      'use_https': 'This application is not working over an insecure connection. Try to use HTTPS'
    },
  time;
    
  button.type = 'button';
// Pass the blob to the processAudio function
    //processAudio(blob);
    //let blob = null;?
  function sendAudioToAPI(blob) {
    // Create a new FormData object
    console.log("[API]", blob)
    var formData = new FormData();

    // Append the recorded audio blob to the FormData object
    // formData.append('recording', blob);
    formData.append('recording', blob);

    // Make an HTTP POST request to the Flask API
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://127.0.0.1:5000/record', true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          var data = JSON.parse(xhr.responseText);
          handleApiResponse(data);
        } else {
          console.error('API request failed:', xhr.statusText);
        }
      }
    };
    xhr.onerror = function() {
      console.error('API request failed:', xhr.statusText);
    };
    xhr.send(formData);
  }
    //   fetch('http://127.0.0.1:5000/record', {
    //     method: 'POST',
    //     body: formData
    //   })
    //     .then(function (response) {
    //       // Handle the response from the API
    //       if (response.ok) {
    //         console.log(response.json())
    //         return response.json();
    //       } else {
    //         return response.text().then(function (error) {
    //   console.error('API request failed:', error);
    //   throw new Error('API request failed: ' + error);
    // });
    //     }
    // })
    // .then(function(data) {
    //     // Process the API response
    //     handleApiResponse(data);
    // })
    // .catch(function(error) {
    //     // Handle any errors that occur during the API request
    //     console.error(error);
    // });
    // }

    function handleApiResponse(data) {
    // Handle the response data and update the webpage accordingly
    // You can access the outcome and likelihood values from the 'data' object
    var outcome = data.outcome;
    var likelihood = data.likelihood;

    // Update the webpage with the outcome and likelihood information
    // For example, you can update a <div> element with the results
    var resultsDiv = document.getElementById('results');
    // if (resultsDiv) {
      resultsDiv.innerHTML = 'Outcome: ' + outcome + '<br>Likelihood: ' + likelihood + '%';
    // }
}

// Recording



if (navigator.mediaDevices === undefined) {
  navigator.mediaDevices = {};
}

if (navigator.mediaDevices.getUserMedia === undefined) {
  navigator.mediaDevices.getUserMedia = function(constrains) {
    var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    if (!getUserMedia) {
      return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
    }

    return new Promise(function(resolve, reject) {
      getUserMedia.call(navigator, constrains, resolve, reject);
    });
  };
}

if (navigator.mediaDevices.getUserMedia) {
  var btn_status = 'inactive',
    mediaRecorder,
    chunks = [],
    audio = new Audio(),
    mediaStream,
    audioSrc,
    type = {
      'type': 'audio/wav'
    },
    ctx,
    analys;
      //blob;

  button.addEventListener('click', function (event) {
    event.preventDefault();
    if (btn_status == 'inactive') {
      start();
    } else if (btn_status == 'recording') {
      stop();
    }
    return false;
  });

  function parseTime(sec) {
    var h = parseInt(sec / 3600);
    var m = parseInt(sec / 60);
    sec = sec - (h * 3600 + m * 60);

    h = h == 0 ? '' : h + ':';
    sec = sec < 10 ? '0' + sec : sec;

    return h + m + ':' + sec;
  }

   function start() {
    navigator.mediaDevices.getUserMedia({
      'audio': true
    }).then(function (stream) {
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.start();

      button.classList.add('recording');
      btn_status = 'recording';

      msg_box.innerHTML = lang.recording;

      if (navigator.vibrate) navigator.vibrate(150);

      time = Math.ceil(new Date().getTime() / 1000);

      mediaRecorder.ondataavailable = function (event) {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = function () {
        stream.getTracks().forEach(function (track) {
          track.stop();
        });

        blob = new Blob(chunks, type);
        console.log(blob);
        audioSrc = window.URL.createObjectURL(blob);

        audio.src = audioSrc;

        chunks = [];

        button.classList.remove('recording');
        btn_status = 'inactive';

        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

        var now = Math.ceil(new Date().getTime() / 1000);

        var t = parseTime(now - time);

        msg_box.innerHTML = '<a href="#" onclick="play(); return false;" class="txt_btn">' + lang.play  + ' (' + t + 's)</a><br>' +
          '<a href="#" onclick="save(); return false;" class="txt_btn">' + lang.download + '</a>'
        
        // var resultsDiv = document.getElementById('results');
        // if (resultsDiv) {
        //   resultsDiv.innerHTML = 'Outcome: COPD <br>Likelihood: 100%';
        // }
        sendAudioToAPI(blob)
      };
    }).catch(function (error) {
      if (location.protocol != 'https:') {
        msg_box.innerHTML = lang.mic_error + '<br>' + lang.use_https;
      } else {
        msg_box.innerHTML = lang.mic_error;
      }
      button.disabled = true;
    });
  }

  function stop() {
    mediaRecorder.stop();
    
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

});

