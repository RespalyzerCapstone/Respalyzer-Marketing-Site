"""
Flask Documentation:     https://flask.palletsprojects.com/
Jinja2 Documentation:    https://jinja.palletsprojects.com/
Werkzeug Documentation:  https://werkzeug.palletsprojects.com/
This file contains the routes for your application.
"""

from app import app, db
from flask import render_template, request, redirect, url_for, flash, redirect, send_from_directory
from .forms import PropertyForm
from .models import Property

from werkzeug.utils import secure_filename
import os


###
# Routing for your application.
###

@app.route('/')
def home():
    """Render website's home page."""
    return render_template('home.html')


@app.route('/about/')
def about():
    """Render the website's about page."""
    return render_template('about.html', name="Peter Thelwell")

@app.route('/properties/create/', methods = ["GET", "POST"])
def create():
    """Render the form to add a new property."""
    form = PropertyForm()
    if request.method == 'POST':
        if form.validate_on_submit():
            title = request.form['title']
            desc = request.form['desc']
            bedsno = request.form['bedsno']
            bathsno = request.form['bathsno']
            price = request.form['price']
            propertytype = request.form['propertytype']
            location = request.form['location']
            file = request.files['pic']
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

            newprop = Property(title, desc, bedsno, bathsno, price, propertytype, location, filename)
            db.session.add(newprop)
            db.session.commit()
            flash(f"Property was successfully added", "success")
            return redirect(url_for('properties'))
        else:
            flash(f"Error!")
            return render_template('create.html', form = form)
    elif request.method == 'GET':
        return render_template('create.html', form = form)

@app.route('/properties/')
def properties():
    """Renders a list of all properties in the database."""
    properties=Property.query.all()
    return render_template('properties.html', properties=properties)

@app.route('/properties/<propertyid>')
def viewproperty(propertyid):
    """Renders a page about a single property."""
    property = Property.query.filter_by(id=propertyid).first()
    return render_template('viewProperty.html', property=property)

@app.route('/uploads/<filename>')
def getpic(filename):
    pic = send_from_directory(os.path.join(os.getcwd(),
    app.config['UPLOAD_FOLDER']), filename)
    return pic

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


@app.after_request
def add_header(response):
    """
    Add headers to both force latest IE rendering engine or Chrome Frame,
    and also tell the browser not to cache the rendered page. If we wanted
    to we could change max-age to 600 seconds which would be 10 minutes.
    """
    response.headers['X-UA-Compatible'] = 'IE=Edge,chrome=1'
    response.headers['Cache-Control'] = 'public, max-age=0'
    return response


@app.errorhandler(404)
def page_not_found(error):
    """Custom 404 page."""
    return render_template('404.html'), 404
