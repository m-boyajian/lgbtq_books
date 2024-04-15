from flask import Flask, render_template, redirect, flash, request, jsonify, url_for, current_app, session
from models import connect_db, db, User, Saved_Books
from forms import LoginForm, RegisterForm
from flask_migrate import Migrate
from flask_login import LoginManager, login_required, current_user, login_user, logout_user
from datetime import timedelta
from sqlalchemy.exc import SQLAlchemyError
import requests
app = Flask(__name__, template_folder="templates", static_folder="static")

login_manager = LoginManager()
login_manager.init_app(app)

app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql:///lgbtq_books"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ECHO"] = True
app.config["SECRET_KEY"] = "zyxwvutsrqponmlkjihgfedcba"
app.config['TESTING'] = True
app.config['WTF_CSRF_TIME_LIMIT'] = 86400  # CSRF token of one day
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)  # Permanent session lifetime of one week
app.config['WTF_CSRF_HEADERS'] = ['X-CSRFToken']

API_KEY = "AIzaSyABwXgHtTnZQ0Y4eZcNuknYiLAL7Epynyw"
migrate = Migrate(app, db)

connect_db(app)

@app.route("/")
def home_page():
    """"""
    # Preload genre.html template
    render_template("genre.html", genre="", books=[], isFavorite=[])
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
    form = LoginForm()

    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()

        print("Form data:", form.data)
        print("User from database:", user)

        if user and user.check_password(form.password.data):
            if login_user(user):
                flash(f"Hello, {user.username}!", "success")
                print("User successfully logged in:", current_user)
                return redirect(url_for('profile'))
            else:
                flash("Failed to log in the user.", "danger")
        else:
            flash("Invalid username or password.", "danger")

    print("Form validation failed or other issue. Form data:", form.data)
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
    print("Current User:", current_user)
    if current_user.is_anonymous:
        flash("You need to log in to see your profile.", 'warning')
        return redirect(url_for('login'))
    print("Profile route accessed")

    # Retrieve the current user's favorite books
    favorite_books = current_user.saved_books
    
    return render_template('users/profile.html', favorite_books=favorite_books)

@app.route('/check_favorite')
def check_favorite():
    title = request.args.get('title')
    is_favorite = None

    if current_user.is_authenticated:
        is_favorite = check_if_book_is_favorite(current_user.id, title)
        print(is_favorite) 
        return jsonify(is_favorite=True)
    else:
        print(is_favorite)  
        return jsonify(is_favorite=False)

@login_required
def check_if_book_is_favorite(user_id, title):
    user = User.query.get(user_id)
    favorite_books = user.saved_books
    is_favorite = any(book.book_title == title for book in favorite_books)
    return is_favorite

@app.route('/fetch_favorite_books', methods=['GET'])
@login_required
def fetch_favorite_books():
    try:
        user = current_user

        if user.is_authenticated:
            favorite_books = Saved_Books.query.filter_by(user_id=user.id).all()

            book_data = []
            for fav_book in favorite_books:
                # Fetch detailed book information from the Google Books API
                book_info = fetch_book_details(fav_book.book_title)
                if book_info:
                    book_data.append({
                        'title': book_info.get('title', ''),
                        'cover_url': book_info.get('cover_url', ''),
                        'author': book_info.get('author', 'Unknown'),
                        'publisher': book_info.get('publisher', 'Unknown'),
                        'is_favorite': fav_book.is_favorite
                    })

            print(f"User {user.username} favorites: {book_data}")
            return jsonify(favorite_books=book_data)
        else:
            return jsonify(favorite_books=[])

    except Exception as e:
        print(f"Error fetching favorite books: {e}")
        return jsonify(error=str(e)), 500

def fetch_book_details(title):
    url = f"https://www.googleapis.com/books/v1/volumes?q={title}&key={API_KEY}"
    response = requests.get(url)

    if response.status_code == 200:
        book_info = response.json().get('items', [])[0].get('volumeInfo', {})
        return {
            'title': book_info.get('title', ''),
            'cover_url': book_info.get('imageLinks', {}).get('thumbnail', ''),
            'author': ', '.join(book_info.get('authors', ['Unknown'])),
            'publisher': book_info.get('publisher', 'Unknown'),
        }
    else:
        print(f"Failed to fetch book details. Status code: {response.status_code}")
        return None

@app.route('/add_to_favorites', methods=['POST'])
@login_required
def add_to_favorites():
    data = request.get_json()
    title = data.get('title')
    user_id = data.get('user_id') or current_user.id

    if not user_id:
        return jsonify({'status': 'error', 'message': 'User not authenticated'}), 401

    existing_entry = Saved_Books.query.filter_by(user_id=user_id, book_title=title).first()
    if existing_entry:
        return jsonify({'status': 'error', 'message': 'Book already saved'}), 400

    print(f"Adding book '{title}' to favorites for user {user_id}")

    saved_book = Saved_Books(
        user_id=user_id,
        book_title=title,
    )
    db.session.add(saved_book)
    db.session.commit()
    print(f"Book '{title}' added to favorites successfully")
    return jsonify({'status': 'success'})

@app.route('/remove_from_favorites', methods=['POST'])
@login_required
def remove_from_favorites():
    try:
        data = request.get_json()
        title = data.get('title')

        print(f"Removing book '{title}' from favorites for user {current_user.id}")

        remove_book_from_favorites(current_user.id, title)

        print(f"Book '{title}' removed from favorites by user {current_user.username}")
        return jsonify({'message': 'Book removed from favorites'})
    except Exception as e:
        print(f"Error removing book from favorites: {e}")
        return jsonify({'status': 'error', 'message': 'Internal server error'}), 500

@login_required
def remove_book_from_favorites(user_id, title):
    try:
        user = User.query.get(user_id)
        book = Saved_Books.query.filter_by(title=title).first()

        if user and book:
            if book in user.saved_books:
                user.saved_books.remove(book)
                db.session.commit()
                print(f"Book '{title}' removed from favorites for user {user.username}")

    except SQLAlchemyError as e:
        db.session.rollback()
        print(f"Error removing book from favorites: {str(e)}")

###########Search & fetch books##############
def fetch_books(query, max_results=40, start_index=0):
    url = f"https://www.googleapis.com/books/v1/volumes?q={query}&maxResults={max_results}&startIndex={start_index}&key={API_KEY}"
    response = requests.get(url)
    return response.json()

@app.route('/fetch_books_by_genre/<genre>')
def fetch_books_by_genre(genre, max_results=40, start_index=0):
    requested_max_results = request.args.get('max_results', default=40, type=int)
    page = request.args.get('page', default=1, type=int)
    start_index = (page - 1) * requested_max_results
    query = f"lgbt+{genre}"
    url = f"https://www.googleapis.com/books/v1/volumes?q={query}&maxResults={max_results}&startIndex={start_index}&key={API_KEY}"

    response = requests.get(url)
    response.raise_for_status() 

    if response.status_code == 200:
        return response.json()
    else:
        current_app.logger.error("Failed to fetch books. Status code: %s", response.status_code)
        return jsonify(error=f"Failed to fetch books. Status code: {response.status_code}")

@app.route('/genre/<genre>')
def show_genre(genre):
    books_data = fetch_books_by_genre(genre=genre)
    current_app.logger.info("Books Data: %s", books_data)
    books_list = books_data.get('items', [])
    if current_user.is_authenticated:
        # If the user is logged in, check for favorites
        isFavorite = [check_if_book_is_favorite(current_user.id, book['volumeInfo']['title']) for book in books_list]
    else:
        # If the user is not logged in, set all books as not favorite
        isFavorite = [False] * len(books_list)

    return render_template('genre.html', genre=genre, books=books_list, isFavorite=isFavorite)

@app.route('/search_results', methods=["GET"])
def search_books():
    query = request.args.get('query') 
    books_data = fetch_books(query)
    current_app.logger.info("Books Data: %s", books_data)
    books_list = books_data.get('items', [])
    return jsonify(books_data=books_list)

if __name__=='__main__':
    app.run(debug=True)

@app.route('/debug-session')
def debug_session():
    print(session)
    return 'Check the console for session information.'