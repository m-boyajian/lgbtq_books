from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from flask_login import UserMixin
from flask_bcrypt import Bcrypt

bcrypt = Bcrypt()
db = SQLAlchemy()

class User(db.Model, UserMixin):

    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), nullable=False, unique=True)
    email = db.Column(db.String(50), nullable=False, unique=True)
    password = db.Column(db.String(100), nullable=False)
    saved_books = db.relationship('Saved_Books', backref='books', lazy=True)

    def __init__(self, username, email, password):
        self.username = username
        self.email = email
        self.password = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password, password)
    
    @classmethod
    def signup(cls, username, email, password):
        """Sign up a new user and return the user object."""
        user = cls(username=username, email=email, password=password)
        db.session.add(user)
        return user

    def is_active(self):
        """True, as all users are active."""
        return True

    def get_id(self):
        """Return the user's ID as a string to satisfy Flask-Login's requirements."""
        return str(self.id)

    @property
    def is_anonymous(self):
        """Return True if the user is anonymous, or False if authenticated."""
        return not self.is_authenticated()

class Saved_Books(db.Model):
    __tablename__ = "saved_books"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    book_title = db.Column(db.Text, nullable=False)
    is_favorite = db.Column(db.Boolean, default=False)
    user = db.relationship('User', backref=db.backref('saved_books_entries', cascade='all, delete-orphan'))
    __table_args__ = (
        db.UniqueConstraint('user_id', 'book_title', name='unique_user_book'),
    )

class Comments(db.Model):
    __tablename__ = "comments"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    book_title = db.Column(db.Text, nullable=False)
    comment_text = db.Column(db.Text, nullable=False)
    user = db.relationship('User', backref=db.backref('comments', cascade='all, delete-orphan'))
    
def connect_db(app):
    """Connect to database."""
    with app.app_context():
        db.app = app
        db.init_app(app)
        db.create_all()

