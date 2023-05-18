"""
Flask Documentation:     https://flask.palletsprojects.com/
Jinja2 Documentation:    https://jinja.palletsprojects.com/
Werkzeug Documentation:  https://werkzeug.palletsprojects.com/
This file contains the routes for your application.
"""

from flask import Flask
from flask import request, make_response, flash, jsonify


app = Flask(__name__)

import pickle
import librosa
import soundfile
import tempfile
import numpy as np
from scipy import signal

from werkzeug.utils import secure_filename
import os
import psycopg2
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


"""@app.route('/record', methods=["POST"])
def record():
    try:
        cnx = psycopg2.connect(user='respalyzer', password='pa$$w0rd', host='localhost', database='respalyzer')
        cursor = cnx.cursor()
        file = request.files['recording']
       
        #f"INSERT INTO public.recordings (recording, reading, date_recorded, user_id) VALUES ('{recording}','{reading}', NOW(), (SELECT MAX(user_id) FROM \"user\"))"        
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp:
            temp_filename = temp.name
            file.save(temp_filename)

            # Your model loading code here
            model = pickle.load(open('../model.pkl', 'rb'))

            # Your resampling function
            resampled_audio = resample_audio(temp_filename)

            upperCutoffFreq = 3000
            cutoffFrequencies = [80, upperCutoffFreq]
            highPassCoeffs = signal.firwin(401, cutoffFrequencies, fs=gSampleRate, pass_zero="bandpass")

            normalized_audio = normalizeVolume(applyHighpass(resampled_audio, highPassCoeffs))
            cleaned_audio = applyLogCompressor(normalized_audio, 30)

            soundfile.write(temp_filename, cleaned_audio, gSampleRate)

            features = np.array(audio_features(temp_filename))
            features_reshaped = np.reshape(features, (1, 193, 1))
            predictions = model.predict(features_reshaped)
            outcome, percentage, largest_index = process_predictions(predictions)
        os.remove(temp_filename)
        
        cursor.execute(f"INSERT INTO public.recordings (recording, reading, date_recorded, user_id, disease_id) VALUES ('{file.filename}','{outcome}', NOW(), (SELECT MAX(user_id) FROM \"user\"), {largest_index})")
        cnx.commit()
        cursor.close()
        cnx.close()
        return make_response({"success" : "Recording added"}, 201)
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
        cnx = psycopg2.connect(user='respalyzer', password='pa$$w0rd', host='localhost', database='respalyzer')
        cursor = cnx.cursor()
        content = request.json
        recording = content['recording']
        #date_recorded = content['date_recorded']
       
        #f"INSERT INTO public.recordings (recording, reading, date_recorded, user_id) VALUES ('{recording}','{reading}', NOW(), (SELECT MAX(user_id) FROM \"user\"))"        
        model = pickle.load(open('../model.pkl','rb'))
        
        
        resampled_audio = resample_audio(recording)

        upperCutoffFreq = 3000
        cutoffFrequencies = [80, upperCutoffFreq]
        highPassCoeffs = signal.firwin(401, cutoffFrequencies, fs=gSampleRate, pass_zero="bandpass")

        normalized_audio = normalizeVolume(applyHighpass(resampled_audio, highPassCoeffs))
        cleaned_audio = applyLogCompressor(normalized_audio, 30)
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp:
            temp_filename = temp.name
            soundfile.write(temp_filename, cleaned_audio, gSampleRate)

            features = np.array(audio_features(temp_filename))
            features_reshaped = np.reshape(features, (1, 193, 1))
            predictions = model.predict(features_reshaped)
            outcome, percentage, largest_index = process_predictions(predictions)
            likelihood = round((percentage * 100), 2)
        os.remove(temp_filename)
        
        cursor.execute(f"INSERT INTO public.recordings (recording, reading, date_recorded, user_id, disease_id, likelihood) VALUES ('{recording}','{outcome}', NOW(), (SELECT MAX(user_id) FROM \"user\"), {largest_index}, {likelihood})")
        cnx.commit()
        cursor.close()
        cnx.close()
        return make_response({"success" : "Recording added"}, 201)
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
