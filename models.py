from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from datetime import datetime

db = SQLAlchemy()
bcrypt = Bcrypt()

saved_books_association = db.Table(
    'saved_books_association',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id')),
    db.Column('book_id', db.Integer, db.ForeignKey('books.id'))
)


class User(db.Model):

    __tablename__ = "users"

    id = db.Column(
        db.Integer, 
        primary_key=True)
    
    username = db.Column(
        db.String(20), 
        nullable=False, 
        unique=True)
    
    first_name = db.Column(
        db.String(20),
        nullable=False,
    )

    last_name = db.Column(
        db.String(20),
        nullable=False,
    )
    
    email = db.Column(
        db.String(50), 
        nullable=False)
    
    password = db.Column(
        db.String(100), 
        nullable=False)
    
    saved_books = db.relationship(
        'Books', 
        secondary=saved_books_association,
        backref='users')
    
    @classmethod
    def signup(cls, username, email, first_name, last_name, password):
        """Sign up user.

        Hashes password and adds user to system.
        """

        hashed_pwd = bcrypt.generate_password_hash(password).decode('UTF-8')

        user = User(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            password=hashed_pwd,
        )

        db.session.add(user)
        return user

    @classmethod
    def authenticate(cls, username, password):
        """Find user with `username` and `password`.

        This is a class method (call it on the class, not an individual user.)
        It searches for a user whose password hash matches this password
        and, if it finds such a user, returns that user object.

        If can't find matching user (or if password is wrong), returns False.
        """

        user = cls.query.filter_by(username=username).first()

        if user:
            is_auth = bcrypt.check_password_hash(user.password, password)
            if is_auth:
                return user

        return False
    
class Books(db.Model):
    __tablename__ = "books"

    id = db.Column(
        db.Integer, 
        primary_key=True)
    
    title = db.Column(
        db.String(20), 
        nullable=False)
    
    author_id = db.Column(
        db.Integer, 
        db.ForeignKey('authors.id'))
    
    genre_id = db.Column(
        db.Integer, 
        db.ForeignKey('genres.id'))
    
    description = db.Column(
        db.Text)
    
    cover_url = db.Column(
        db.Text, 
        default="/static/images/unicorn_float.jpg")
    
    comments = db.relationship('Comments', backref='books')
    
class Genres(db.Model):
    __tablename__ = "genres"

    id = db.Column(
        db.Integer, 
        primary_key=True)
    
    name = db.Column(
        db.String(40))
    
    description = db.Column(
        db.Text)

class Authors(db.Model):
    __tablename__ = "authors"

    id = db.Column(
        db.Integer, 
        primary_key=True)
    
    name = db.Column(
        db.String(40))
    
    biography = db.Column(
        db.Text, 
        nullable=True)

class Saved_Books(db.Model):
    id = db.Column(
        db.Integer, 
        primary_key=True)
    
    user_id = db.Column(
        db.Integer, 
        db.ForeignKey('users.id'))
    
    book_id = db.Column(
        db.Integer, 
        db.ForeignKey('books.id'))
    
    date_saved = db.Column(
        db.DateTime, 
        default=datetime.utcnow)
    
    cover_url = db.Column(
        db.Text, 
        default="/static/images/unicorn_float.jpg")

class Comments(db.Model):
    id = db.Column(
        db.Integer, 
        primary_key=True)
    
    user_id = db.Column(
        db.Integer, 
        db.ForeignKey('users.id'))
    
    book_id = book_id = db.Column(
        db.Integer, 
        db.ForeignKey('books.id'))
    
    comment_text = db.Column(
        db.Text, nullable=True)
    
    time = db.Column(
        db.DateTime, 
        default=datetime.utcnow)
    
def connect_db(app):
    """Connect to database."""

    db.app = app
    db.init_app(app)