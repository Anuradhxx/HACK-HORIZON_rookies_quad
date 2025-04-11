import datetime
from app import db, login_manager
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    plants = db.relationship('Plant', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.username}>'

class Plant(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    species = db.Column(db.String(128))
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    image_path = db.Column(db.String(256))
    identified_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    def __repr__(self):
        return f'<Plant {self.species} at ({self.latitude}, {self.longitude})>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'species': self.species,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'identified_at': self.identified_at.isoformat(),
            'user_id': self.user_id
        }

class Suggestion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    recommended_plants = db.relationship('RecommendedPlant', backref='suggestion', lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f'<Suggestion at ({self.latitude}, {self.longitude})>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'description': self.description,
            'recommended_plants': [plant.species for plant in self.recommended_plants]
        }

class RecommendedPlant(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    species = db.Column(db.String(128), nullable=False)
    suggestion_id = db.Column(db.Integer, db.ForeignKey('suggestion.id'), nullable=False)

    def __repr__(self):
        return f'<RecommendedPlant {self.species}>'
