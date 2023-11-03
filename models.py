from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from flask_login import UserMixin
from flask_bcrypt import Bcrypt

bcrypt = Bcrypt()
db = SQLAlchemy()

saved_books_association = db.Table(
    'saved_books_association',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id')),
    db.Column('book_id', db.Integer, db.ForeignKey('books.id'))
)

class User(db.Model, UserMixin):

    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), nullable=False, unique=True)
    email = db.Column(db.String(50), nullable=False, unique=True)
    password = db.Column(db.String(100), nullable=False)
    saved_books = db.relationship('Books', secondary=saved_books_association, backref=db.backref('users', lazy='dynamic'))

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

    def is_anonymous(self):
        """Return True if the user is anonymous, or False if authenticated."""
        return not self.is_authenticated()
    
class Books(db.Model):
    __tablename__ = "books"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(20), nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey('authors.id'))
    genre_id = db.Column(db.Integer, db.ForeignKey('genres.id'))
    description = db.Column(db.Text)
    cover_url = db.Column(db.Text, default="/static/images/unicorn_float.jpg")
    comments = db.relationship('Comments', backref='books')
    
class Genres(db.Model):
    __tablename__ = "genres"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(40))
    description = db.Column(db.Text)

class Authors(db.Model):
    __tablename__ = "authors"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(40))
    biography = db.Column(db.Text, nullable=True)

class Saved_Books(db.Model):
    __tablename__ = "saved_books"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    book_id = db.Column(db.Integer, db.ForeignKey('books.id'))
    date_saved = db.Column(db.DateTime, default=datetime.utcnow)
    cover_url = db.Column(db.Text, default="/static/images/unicorn_float.jpg")

class Comments(db.Model):
    __tablename__ = "comments"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    book_id = book_id = db.Column(db.Integer, db.ForeignKey('books.id'))
    comment_text = db.Column(db.Text, nullable=True)
    time = db.Column(db.DateTime, default=datetime.utcnow)
    
def connect_db(app):
    """Connect to database."""

    db.app = app
    db.init_app(app)