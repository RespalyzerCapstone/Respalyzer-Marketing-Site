"""
Flask Documentation:     https://flask.palletsprojects.com/
Jinja2 Documentation:    https://jinja.palletsprojects.com/
Werkzeug Documentation:  https://werkzeug.palletsprojects.com/
This file contains the routes for your application.
"""

import os
#os.environ["FFMPEG_PATH"] = "../venv/Lib/site-packages/ffmpeg"

from flask import Flask
from flask import request, make_response, flash, jsonify
from flask_cors import CORS




app = Flask(__name__)
CORS(app)

import pickle
import librosa
import soundfile
import tempfile
import numpy as np
from scipy import signal

from werkzeug.utils import secure_filename
import keras

# these libraries deal with mp3 to wav conversion
from os import path
from pydub import AudioSegment


src = "file.mp3"
dst = "testFile.wav"

# this part deals with the conversion
# use the following 2 commented lines to deal with audio conversion to mp3 (use this in the function where relevant)
# src should be the mp3 file coming in, and destination will be whatever you want the file to be named as done above
#audio = AudioSegment.from_mp3(src)
#audio.export(dst, format="wav")

gSampleRate = 7000


###
# Routing for your application.
###

@app.route('/', methods=["GET"])
def server():
    return "Connected to server"

"""@app.route('/record', methods=["GET", "POST"])
def record():
    try:
        content = request.json
        recording = content['recording']

        # Load the trained AI model
        model = pickle.load(open('../model.pkl','rb'))


        # Preprocess the recording
        resampled_audio = resample_audio(recording)

        upperCutoffFreq = 3000
        cutoffFrequencies = [80, upperCutoffFreq]
        highPassCoeffs = signal.firwin(401, cutoffFrequencies, fs=gSampleRate, pass_zero="bandpass")

        normalized_audio = normalizeVolume(applyHighpass(resampled_audio, highPassCoeffs))
        cleaned_audio = applyLogCompressor(normalized_audio, 30)
        
        # Save the preprocessed audio to a temporary file
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp:
            temp_filename = temp.name
            soundfile.write(temp_filename, cleaned_audio, gSampleRate)

            # Extract features from the audio
            features = np.array(audio_features(temp_filename))
            features_reshaped = np.reshape(features, (1, 193, 1))

            # Make predictions using the AI model
            predictions = model.predict(features_reshaped)
            outcome, percentage, largest_index = process_predictions(predictions)
            likelihood = round((percentage * 100), 2)

        # Remove the temporary audio file
        os.remove(temp_filename)

        # Return the response as JSON
        response = {
            "outcome": outcome,
            "likelihood": likelihood
        }
        return make_response(response, 200)
    except Exception as e:
        return make_response({'error': str(e)}, 400)

def resample_audio(filename):
    audioBuffer, nativeSampleRate = librosa.load(filename, dtype=np.float32, mono=True, sr=None)

    if nativeSampleRate == gSampleRate:
        print("Resample Ran")
        return audioBuffer
    else:
        duration = len(audioBuffer) / nativeSampleRate
        nTargetSamples = int(duration * gSampleRate)
        timeXSource = np.linspace(0, duration, len(audioBuffer), dtype=np.float32)
        timeX = np.linspace(0, duration, nTargetSamples, dtype=np.float32)
        resampledBuffer = np.interp(timeX, timeXSource, audioBuffer)
        print("Resample Ran")
        return resampledBuffer

def normalizeVolume(npArr):
    minAmp, maxAmp = (np.amin(npArr), np.amax(npArr))
    maxEnv = max(abs(minAmp), abs(maxAmp))
    scale = 1.0 / maxEnv
    npArr *= scale
    print("Normalize Ran")
    return npArr

def applyLogCompressor(signal, gamma):
    sign = np.sign(signal)
    absSignal = 1 + np.abs(signal) * gamma
    logged = np.log(absSignal)
    scaled = logged * (1 / np.log(1.0 + gamma))
    print("Log Compressor Ran")
    return sign * scaled

def applyHighpass(npArr, highPassCoeffs):
    print("1 Ran")
    return signal.lfilter(highPassCoeffs, [1.0], npArr)

def audio_features(filename):
    sound, sample_rate = librosa.load(filename)
    stft = np.abs(librosa.stft(sound)) 

    mfccs = np.mean(librosa.feature.mfcc(y=sound, sr=sample_rate, n_mfcc=40), axis=1)
    chroma = np.mean(librosa.feature.chroma_stft(S=stft, sr=sample_rate), axis=1)
    mel = np.mean(librosa.feature.melspectrogram(y=sound, sr=sample_rate), axis=1)
    contrast = np.mean(librosa.feature.spectral_contrast(S=stft, sr=sample_rate), axis=1)
    tonnetz = np.mean(librosa.feature.tonnetz(y=librosa.effects.harmonic(sound), sr=sample_rate), axis=1)

    concat = np.concatenate((mfccs, chroma, mel, contrast, tonnetz))
    print("2 ran")
    return concat

def process_predictions(predictions):
    readings = ["COPD", "Healthy", "URTI", "Bronchiectasis", "Pneumonia", "Bronchiolitis"]
    print(predictions)
    largest_index = np.argmax(predictions)
    print(largest_index)
    percentage = predictions[0][largest_index]
    print(percentage)
    outcome = readings[largest_index]
    print(outcome)
    print("3 ran")
    return outcome, percentage, largest_index"""
    

@app.route('/record', methods=["POST"])
def record():
    try:
        if request.method == 'POST':
            # Get the uploaded file
            print(request.files)
            print(request.files['recording'])
            file = request.files['recording']
            content_type = file.mimetype
            print(content_type)
            
            # Save the file to a temporary location
            temp_filename = tempfile.mktemp(suffix='.wav', dir='audio')
            file.save(temp_filename)

            # Load the trained AI model
            model = pickle.load(open('../model.pkl', 'rb'))
            print("model loads")
            # Preprocess the recording
            resampled_audio = resample_audio(temp_filename)
            print("resampled")
            # Rest of the preprocessing steps...
            upperCutoffFreq = 3000
            cutoffFrequencies = [80, upperCutoffFreq]
            highPassCoeffs = signal.firwin(401, cutoffFrequencies, fs=gSampleRate, pass_zero="bandpass")

            normalized_audio = normalizeVolume(applyHighpass(resampled_audio, highPassCoeffs))
            cleaned_audio = applyLogCompressor(normalized_audio, 30)
            
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp:
                temp_filename = temp.name
                soundfile.write(temp_filename, cleaned_audio, gSampleRate)

                # Extract features from the audio
                features = np.array(audio_features(temp_filename))
                features_reshaped = np.reshape(features, (1, 193, 1))

                # Make predictions using the AI model
                predictions = model.predict(features_reshaped)
                outcome, percentage, largest_index = process_predictions(predictions)
                likelihood = round((percentage * 100), 2)
                print(outcome, likelihood)

            # Remove the temporary audio file
            os.remove(temp_filename)

            # Return the response as JSON
            response = {
                "outcome": outcome,
                "likelihood": likelihood
            }
            return jsonify(response), 200

    except Exception as e:
        print("ERROR", e)
        return jsonify({'error': str(e)}), 400

def resample_audio(filename):
    print("librosa 1")
    audioBuffer, nativeSampleRate = librosa.load(filename, dtype=np.float32, mono=True, sr=None)
    print("Resample Ran")

    if nativeSampleRate == gSampleRate:
        print("Resample Ran")
        return audioBuffer
    else:
        duration = len(audioBuffer) / nativeSampleRate
        nTargetSamples = int(duration * gSampleRate)
        timeXSource = np.linspace(0, duration, len(audioBuffer), dtype=np.float32)
        timeX = np.linspace(0, duration, nTargetSamples, dtype=np.float32)
        resampledBuffer = np.interp(timeX, timeXSource, audioBuffer)
        print("Resample Ran")
        return resampledBuffer

def normalizeVolume(npArr):
    minAmp, maxAmp = (np.amin(npArr), np.amax(npArr))
    maxEnv = max(abs(minAmp), abs(maxAmp))
    scale = 1.0 / maxEnv
    npArr *= scale
    print("Normalize Ran")
    return npArr

def applyLogCompressor(signal, gamma):
    sign = np.sign(signal)
    absSignal = 1 + np.abs(signal) * gamma
    logged = np.log(absSignal)
    scaled = logged * (1 / np.log(1.0 + gamma))
    print("Log Compressor Ran")
    return sign * scaled

def applyHighpass(npArr, highPassCoeffs):
    print("1 Ran")
    return signal.lfilter(highPassCoeffs, [1.0], npArr)

def audio_features(filename):
    sound, sample_rate = librosa.load(filename)
    stft = np.abs(librosa.stft(sound)) 

    mfccs = np.mean(librosa.feature.mfcc(y=sound, sr=sample_rate, n_mfcc=40), axis=1)
    chroma = np.mean(librosa.feature.chroma_stft(S=stft, sr=sample_rate), axis=1)
    mel = np.mean(librosa.feature.melspectrogram(y=sound, sr=sample_rate), axis=1)
    contrast = np.mean(librosa.feature.spectral_contrast(S=stft, sr=sample_rate), axis=1)
    tonnetz = np.mean(librosa.feature.tonnetz(y=librosa.effects.harmonic(sound), sr=sample_rate), axis=1)

    concat = np.concatenate((mfccs, chroma, mel, contrast, tonnetz))
    print("2 ran")
    return concat

def process_predictions(predictions):
    readings = ["COPD", "Healthy", "URTI", "Bronchiectasis", "Pneumonia", "Bronchiolitis"]
    print(predictions)
    largest_index = np.argmax(predictions)
    print(largest_index)
    percentage = predictions[0][largest_index]
    print(percentage)
    outcome = readings[largest_index]
    print(outcome)
    print("3 ran")
    return outcome, percentage, largest_index


###
# The functions below should be applicable to all Flask apps.
###

# Display Flask WTF errors as Flash messages
def flash_errors(form):
    for field, errors in form.errors.items():
        for error in errors:
            flash(u"Error in the %s field - %s" % (
                getattr(form, field).label.text,
                error
            ), 'danger')

@app.route('/<file_name>.txt')
def send_text_file(file_name):
    """Send your static text file."""
    file_dot_text = file_name + '.txt'
    return app.send_static_file(file_dot_text)

if __name__ == '__main__':
    app.run(debug=True)
