import os
import uuid
import math
import requests
from utils import get_reforestation_trees
from datetime import datetime
from flask import render_template, redirect, url_for, flash, request, jsonify, send_from_directory
from flask_login import login_user, logout_user, current_user, login_required
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from app import app, db
from models import User, Plant
from forms import LoginForm, SignupForm, PlantLogForm, MapFilterForm


from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import numpy as np
from PIL import Image

model = load_model('vanilla_cnn_model.keras')
class_names = ['Apple', 'Bell Pepper', 'Cherry', 'Corn', 'Grape', 'Peach', 'Potato', 'Strawbarry', 'Tomato']

@app.context_processor
def inject_now():
    return {'now': datetime.now()}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'gif'}


def get_address_from_coordinates(latitude, longitude):
    try:
        response = requests.get(
            f"https://nominatim.openstreetmap.org/reverse?format=json&lat={latitude}&lon={longitude}&zoom=18&addressdetails=1",
            headers={'User-Agent': 'SmartPlantIdentifier/1.0'}
        )
        
        if response.status_code == 200:
            data = response.json()
            if data and data.get('display_name'):
                return data['display_name']
        
        return None
    except Exception as e:
        app.logger.error(f"Error fetching address: {str(e)}")
        return None

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('log_plant'))
    
    login_form = LoginForm()
    signup_form = SignupForm()
    active_form = 'login'
    

    if request.form.get('form_type') == 'login':
        if login_form.validate_on_submit():
            try:
                user = User.query.filter_by(username=login_form.username.data).first()
                if user and user.check_password(login_form.password.data):
                    login_user(user)
                    token = create_access_token(identity=user.id)
                    next_page = request.args.get('next', url_for('log_plant'))
                    return jsonify({'success': True, 'token': token, 'redirect': next_page})
                else:
                    return jsonify({'success': False, 'errors': {'username': ['Invalid username or password']}})
            except Exception as e:
                app.logger.error(f"Login error: {str(e)}")
                return jsonify({'success': False, 'error': 'An error occurred. Please try again.'})
    

    if request.form.get('form_type') == 'signup':
        active_form = 'signup'
        
        if signup_form.validate_on_submit():
            try:
                existing_user = User.query.filter_by(username=signup_form.username.data).first()
                if existing_user:
                    return jsonify({'success': False, 'errors': {'username': ['Username already exists']}})
                
                existing_email = User.query.filter_by(email=signup_form.email.data).first()
                if existing_email:
                    return jsonify({'success': False, 'errors': {'email': ['Email already in use']}})
                

                user = User(username=signup_form.username.data, email=signup_form.email.data)
                user.set_password(signup_form.password.data)
                db.session.add(user)
                db.session.commit()
                

                login_user(user)
                token = create_access_token(identity=user.id)
                return jsonify({'success': True, 'token': token, 'redirect': url_for('log_plant')})
            except Exception as e:
                db.session.rollback()
                app.logger.error(f"Error creating user: {str(e)}")
                return jsonify({'success': False, 'error': 'An error occurred. Please try again.'})
    
    if request.method == 'GET':
        active_form = request.args.get('active', 'login')
        return render_template('auth.html', login_form=login_form, signup_form=signup_form, active_form=active_form)
    

    if request.form.get('form_type') == 'login':
        errors = {field.name: field.errors for field in login_form if field.errors}
        return jsonify({'success': False, 'errors': errors})
    else:
        errors = {field.name: field.errors for field in signup_form if field.errors}
        return jsonify({'success': False, 'errors': errors})

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.')
    return redirect(url_for('home'))


@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json()
    user = User.query.filter_by(username=data.get('username')).first()
    if user and user.check_password(data.get('password')):
        token = create_access_token(identity=user.id)
        return jsonify(token=token)
    return jsonify(error="Invalid credentials"), 401

@app.route('/api/signup', methods=['POST'])
def api_signup():
    data = request.get_json()
    if User.query.filter_by(username=data.get('username')).first():
        return jsonify(error="Username already exists"), 400
    if User.query.filter_by(email=data.get('email')).first():
        return jsonify(error="Email already in use"), 400
    
    user = User(username=data.get('username'), email=data.get('email'))
    user.set_password(data.get('password'))
    db.session.add(user)
    db.session.commit()
    
    token = create_access_token(identity=user.id)
    return jsonify(token=token)


@app.route('/log', methods=['GET', 'POST'])
@login_required
def log_plant():
    form = PlantLogForm()
    
    if form.validate_on_submit():

        file = form.image.data
        if file and allowed_file(file.filename):
            filename = secure_filename(f"{uuid.uuid4()}_{file.filename}")
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            
            species = None

            try:
                img = Image.open(file_path).resize((128, 128))
                img_array = np.expand_dims(np.array(img) / 255.0, axis=0)
                prediction = model.predict(img_array)
                predicted_class_idx = int(np.argmax(prediction[0]))
                species = class_names[predicted_class_idx]
            except Exception as e:
                app.logger.error(f"Model prediction failed: {str(e)}")
            
            latitude = 0.0
            longitude = 0.0
            address = None
            
            try:
                latitude = float(form.latitude.data) if form.latitude.data else 0.0
                longitude = float(form.longitude.data) if form.longitude.data else 0.0
                address = get_address_from_coordinates(latitude, longitude)
            except (ValueError, TypeError) as e:
                app.logger.error(f"Error converting coordinates: {str(e)}")
            
            plant = Plant(
                species=species,
                latitude=latitude,
                longitude=longitude,
                image_path=filename,
                user_id=current_user.id
            )
            db.session.add(plant)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'species': species,
                'plant_id': plant.id,
                'address': address
            })
        
        return jsonify({'success': False, 'error': 'Invalid file format'})
    
    return render_template('log_plant.html', form=form)

@app.route('/api/log', methods=['POST'])
@jwt_required()
def api_log_plant():
    user_id = get_jwt_identity()
    
    if 'image' not in request.files:
        return jsonify(error="No image file"), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify(error="No selected file"), 400
    
    latitude = request.form.get('latitude')
    longitude = request.form.get('longitude')
    
    if not latitude or not longitude:
        return jsonify(error="Latitude and longitude are required"), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(f"{uuid.uuid4()}_{file.filename}")
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        species = "Unknown"


        try:
            img = Image.open(file_path).resize((128, 128))
            img_array = np.expand_dims(np.array(img) / 255.0, axis=0)
            prediction = model.predict(img_array)
            predicted_class_idx = int(np.argmax(prediction[0]))
            species = class_names[predicted_class_idx]
        except Exception as e:
            app.logger.error(f"Model prediction failed: {str(e)}")
            

        lat_float = 0.0
        lng_float = 0.0
        address = None

        try:
            lat_float = float(latitude) if latitude else 0.0
            lng_float = float(longitude) if longitude else 0.0
            address = get_address_from_coordinates(lat_float, lng_float)
        except (ValueError, TypeError) as e:
            app.logger.error(f"Error converting coordinates in API: {str(e)}")
            

        plant = Plant(
            species=species,
            latitude=lat_float,
            longitude=lng_float,
            image_path=filename,
            user_id=user_id
        )
        db.session.add(plant)
        db.session.commit()
        
        return jsonify(species=species, plant_id=plant.id, address=address)
    
    return jsonify(error="Invalid file format"), 400


@app.route('/map', methods=['GET'])
def map_view():
    form = MapFilterForm()
    return render_template('map.html', form=form)

@app.route('/api/map', methods=['GET'])
def api_map():
    try:
        lat = float(request.args.get('lat', 0))
        lng = float(request.args.get('long', 0))
        

        db_plants = Plant.query.all()
        plant_list = [plant.to_dict() for plant in db_plants]
        
        
        suggestions = get_reforestation_trees(str(lat), str(lng)).split("\n")
        return jsonify({
            'plants': plant_list,
            'suggestions': suggestions
        })
    except Exception as e:
        app.logger.error(f"Error in map API: {str(e)}")
        return jsonify(error=str(e)), 400


# @app.route('/nearby-plants', methods=['GET'])
# def nearby_plants():
#     form = NearbyPlantsForm()
#     return render_template('nearby_plants.html', form=form)
# 
# @app.route('/api/nearby-plants', methods=['GET'])
# def api_nearby_plants():
#     try:
#         lat = float(request.args.get('lat', 0))
#         lng = float(request.args.get('long', 0))
#         dist = float(request.args.get('dist', 500))
#         
#         # In a production app, this would use a proper geospatial query
#         # For simplicity, we'll calculate distance manually for all plants
#         plants = Plant.query.all()
#         nearby = []
#         
#         for plant in plants:
#             # Simple distance calculation (this is not accurate for long distances)
#             distance = math.sqrt((plant.latitude - lat)**2 + (plant.longitude - lng)**2) * 111000  # rough meters
#             if distance <= dist:
#                 plant_data = plant.to_dict()
#                 plant_data['distance'] = round(distance)
#                 nearby.append(plant_data)
#         
#         return jsonify({
#             'plants': nearby
#         })
#     except Exception as e:
#         return jsonify(error=str(e)), 400

# @app.route('/suggest', methods=['GET'])
# def suggestions():
#     form = SuggestionForm()
#     return render_template('suggestions.html', form=form)
# 


@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
