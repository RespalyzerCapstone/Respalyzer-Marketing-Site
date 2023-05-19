function convertBlobToWav(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContext.decodeAudioData(reader.result).then((audioBuffer) => {
        // Create an OfflineAudioContext with the same sample rate as the Opus audio
        const offlineContext = new OfflineAudioContext({
          numberOfChannels: audioBuffer.numberOfChannels,
          length: audioBuffer.length,
          sampleRate: audioBuffer.sampleRate,
        });

        // Create a source node from the Opus audio buffer
        const source = offlineContext.createBufferSource();
        source.buffer = audioBuffer;

        // Connect the source to an AudioWorkletNode for the conversion
        offlineContext.audioWorklet.addModule('path/to/your/worker-script.js').then(() => {
          const workletNode = new AudioWorkletNode(offlineContext, 'worker-processor');
          source.connect(workletNode);
          workletNode.connect(offlineContext.destination);

          // Process the audio buffer to convert it to WAV format
          workletNode.onprocessorerror = (event) => {
            reject(event);
          };

          workletNode.onprocessorready = () => {
            const channelData = [];
            for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
              channelData.push(audioBuffer.getChannelData(channel));
            }
            const interleaved = interleave(channelData);
            const buffer = createWavBuffer(interleaved, audioBuffer.sampleRate);
            resolve(new Blob([buffer], { type: 'audio/wav' }));
          };

          // Start the offline rendering
          source.start();
          offlineContext.startRendering();
        }).catch((error) => {
          reject(error);
        });
      });
    };
    reader.readAsArrayBuffer(blob);
  });
}

function interleave(channelData) {
  const channelCount = channelData.length;
  const sampleCount = channelData[0].length;
  const interleaved = new Float32Array(sampleCount * channelCount);
  for (let sample = 0; sample < sampleCount; sample++) {
    for (let channel = 0; channel < channelCount; channel++) {
      interleaved[sample * channelCount + channel] = channelData[channel][sample];
    }
  }
  return interleaved;
}

function createWavBuffer(interleaved, sampleRate) {
  const buffer = new ArrayBuffer(44 + interleaved.length * 2);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // RIFF chunk length
  view.setUint32(4, 36 + interleaved.length * 2, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (PCM)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, 1, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * 2, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, interleaved.length * 2, true);

  // write the PCM samples
  const offset = 44;
  for (let i = 0; i < interleaved.length; i++, offset += 2) {
    const sample = Math.max(-1, Math.min(1, interleaved[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
  }

  return buffer;
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Usage example:
async function processAudio(blob) {
  try {
    const wavBlob = await convertBlobToWav(blob); // Wait for the promise to resolve
    sendAudioToAPI(wavBlob);
  } catch (error) {
    console.error('Error converting audio to WAV:', error);
  }
}

// Pass the blob to the processAudio function
    //processAudio(blob);
    
    function sendAudioToAPI(blob) {
    // Create a new FormData object
    var formData = new FormData();

    // Append the recorded audio blob to the FormData object
    formData.append('recording', blob);

    // Make an HTTP POST request to the Flask API
      fetch('http://127.0.0.1:5000/record', {
        method: 'POST',
        body: formData
      })
        .then(function (response) {
          // Handle the response from the API
          if (response.ok) {
            return response.json();
          } else {
            return response.text().then(function (error) {
      console.error('API request failed:', error);
      throw new Error('API request failed: ' + error);
    });
        }
    })
    .then(function(data) {
        // Process the API response
        handleApiResponse(data);
    })
    .catch(function(error) {
        // Handle any errors that occur during the API request
        console.error(error);
    });
    }

    function handleApiResponse(data) {
    // Handle the response data and update the webpage accordingly
    // You can access the outcome and likelihood values from the 'data' object
    var outcome = data.outcome;
    var likelihood = data.likelihood;

    // Update the webpage with the outcome and likelihood information
    // For example, you can update a <div> element with the results
    var resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = 'Outcome: ' + outcome + '<br>Likelihood: ' + likelihood + '%';
}

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
  
});


// Recording

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
      analys,
      blob;

  button.onclick = function() {
    if (btn_status == 'inactive') {
      start();
    } else if (btn_status == 'recording') {
      stop();
    }
  };

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
        audioSrc = window.URL.createObjectURL(blob);

        audio.src = audioSrc;

        chunks = [];
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
    button.classList.remove('recording');
    btn_status = 'inactive';

    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

    var now = Math.ceil(new Date().getTime() / 1000);

    var t = parseTime(now - time);

    msg_box.innerHTML = '<a href="#" onclick="play(); return false;" class="txt_btn">' + lang.play  + ' (' + t + 's)</a><br>' +
        '<a href="#" onclick="save(); return false;" class="txt_btn">' + lang.download + '</a>'
      sendAudioToAPI(blob)
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
