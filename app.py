from flask import Flask, render_template, redirect, flash, request, jsonify, url_for, session 
from models import connect_db, db, User, Books, Saved_Books
from forms import LoginForm, RegisterForm
from flask_migrate import Migrate
from flask_login import LoginManager, login_required, current_user, login_user, logout_user
import requests
app = Flask(__name__, template_folder="templates", static_folder="static")


login_manager = LoginManager()
login_manager.init_app(app)

app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql:///lgbtq_books"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ECHO"] = True
app.config["SECRET_KEY"] = "zyxwvutsrqponmlkjihgfedcba"
app.config['TESTING'] = True

import requests

API_KEY = "AIzaSyABwXgHtTnZQ0Y4eZcNuknYiLAL7Epynyw"
migrate = Migrate(app, db)

connect_db(app)

@app.route("/")
def home_page():
    """"""
    return render_template("index.html")

############User signup/login/logout##############
@login_manager.user_loader
def user_loader(user_id):
    if user_id.isdigit():
        user = User.query.get(int(user_id))
        return user
    return None

@app.route("/users/login", methods=["GET"])
def login_form():
    """Displays the login form."""
    form = LoginForm()
    return render_template('users/login.html', form=form)

@app.route("/users/login", methods=["POST"])
def login():
    """Displays login form. Logs in the current user by processing the form"""
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        print("Username from form:", form.username.data)
        print("User from the database:", user)
        
        if user:
            if login_user(user):
                print("Login successful")
                flash(f"Hello, {user.username}!", "success")
                db.session.commit()  # Commit the transaction to the database
                return redirect(url_for('profile'))
            else:
                print("Login failed")
                flash("Failed to log in the user.", "danger")
        else:
            print("User not found")
            flash("User not found.", 'danger')
    else:
        flash("Invalid credentials.", 'danger')

    return render_template('users/login.html', form=form)

@app.route("/users/logout", methods=["GET"])
def logout():
    """Logout the current user."""
    logout_user()  # Use Flask-Login's logout_user function
    return redirect(url_for('home_page'))

@app.route('/users/register', methods=["GET", "POST"])
def handle_registration():
    """Creates a new user and adds user to the DB. Makes sure username & email are unique."""
    form = RegisterForm()

    if form.validate_on_submit():
        # Check if a user with the same username or email already exists
        existing_user = User.query.filter((User.username == form.username.data) | (User.email == form.email.data)).first()

        if existing_user:
            flash("Username or email already taken", 'danger')
            return render_template('users/register.html', form=form)

        user = User.signup(
            username=form.username.data,
            password=form.password.data,
            email=form.email.data,
        )
        db.session.commit()

        flash("Registration successful! Please log in.", 'success')
        return redirect(url_for('login_form'))

    return render_template('users/register.html', form=form)

@app.route('/users/profile', methods=["GET"])
@login_required
def profile():
    if current_user.is_anonymous:
        flash("You need to log in to see your profile.", 'warning')
        return redirect(url_for('login'))
    print("Profile route accessed")

    # Retrieve the current user's favorite books
    favorite_books = current_user.saved_books
    
    return render_template('users/profile.html', favorite_books=favorite_books)

@app.route('/check_favorite', methods=['GET'])
def check_favorite():
    title = request.args.get('title')
    # Implement the logic to check if the book is a favorite for the current user
    is_favorite = check_if_book_is_favorite(current_user.id, title)
    return jsonify(is_favorite)

@app.route('/fetch_favorite_books', methods=['GET'])
def fetch_favorite_books():
    user_id = request.args.get('user_id')
    user = User.query.get(user_id)

    if user:
        favorite_books = Saved_Books.query.filter_by(user_id=user.id).all()
        book_titles = [book.book.title for book in favorite_books]
        return jsonify(favorite_books=[book_titles])
    else:
        return jsonify(favorite_books=[])

@app.route('/add_to_favorites', methods=['POST'])
@login_required
def add_to_favorites():
    title = request.form.get('title')
    add_book_to_favorites(current_user.id, title)
    return jsonify({'message': 'Book added to favorites'})

@app.route('/remove_from_favorites', methods=['POST'])
@login_required
def remove_from_favorites():
    title = request.form.get('title')
    remove_book_from_favorites(current_user.id, title)
    return jsonify({'message': 'Book removed from favorites'})

def check_if_book_is_favorite(user_id, title):
    user = User.query.get(user_id)
    favorite_books = user.saved_books
    is_favorite = any(book.title == title for book in favorite_books)
    return is_favorite

def add_book_to_favorites(user_id, title):
    user = User.query.get(user_id)
    book = Books.query.filter_by(title=title).first()

    if user and book:
        if book not in user.saved_books:
            user.saved_books.append(book)
            db.session.commit()

def remove_book_from_favorites(user_id, title):
    user = User.query.get(user_id)
    book = Books.query.filter_by(title=title).first()

    if user and book:
        if book in user.saved_books:
            user.saved_books.remove(book)
            db.session.commit()

###########Search & fetch books##############
def fetch_books(query, max_results=40, start_index=0):
    url = f"https://www.googleapis.com/books/v1/volumes?q={query}&maxResults={max_results}&startIndex={start_index}&key={API_KEY}"
    response = requests.get(url)
    return response.json()

def fetch_books_by_genre(genre, max_results=40, start_index=0):
    if genre == "scifi":
        query = "lgbt+science fiction|lgbt+sci-fi"
    elif genre == "selfhelp":
        query = "lgbt+self-help|lgbt+selfcare|lgbt+self-care"
    else:
        query = f"lgbt+{genre}" if genre else "lgbt"
    url = f"https://www.googleapis.com/books/v1/volumes?q={query}&maxResults={max_results}&startIndex={start_index}&key={API_KEY}"

    print("Query:", query)
    print("URL:", url)

    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    else:
        return jsonify(error=f"Failed to fetch books. Status code: {response.status_code}")

@app.route('/genre/<genre>')
@login_required
def show_genre(genre):
    books_data = fetch_books_by_genre(genre=genre)
    books_list = books_data.get('items', [])
    isFavorite = [check_if_book_is_favorite(current_user.id, book['volumeInfo']['title']) for book in books_list]

    return render_template('genre.html', genre=genre, books=books_list, isFavorite=isFavorite)

@app.route('/search_results', methods=["GET"])
def search_books():
    query = request.args.get('query')  # Gets query from the URL parameters
    books_data = fetch_books(query)
    books_list = books_data.get('items', [])
    return jsonify(books_data=books_list)

if __name__=='__main__':
    app.run(debug=True)
