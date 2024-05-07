from flask import Flask, render_template, redirect, flash, request, jsonify, url_for
from flask_session import Session
from models import connect_db, db, User, Saved_Books
from forms import LoginForm, RegisterForm
from flask_migrate import Migrate
from flask_login import LoginManager, login_required, current_user, login_user, logout_user
from datetime import timedelta
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
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_PERMANENT'] = False
app.config['SESSION_USE_SIGNER'] = True
app.config['SESSION_FILE_DIR'] = '/Users/MelBoyajian/Desktop/desktop_items/Springboard/Capstone1'
Session(app)

API_KEY = "AIzaSyABwXgHtTnZQ0Y4eZcNuknYiLAL7Epynyw"
migrate = Migrate(app, db)

connect_db(app)

cached_books_data = {} #Stores fetched results as a dictionary

@app.route("/")
def home_page():
    query = request.args.get('query')
    page = request.args.get('page', 1, type=int)
    max_results = 40
    books_per_page = 12
    bookUrl = f"https://www.googleapis.com/books/v1/volumes?q={query}&max_results={max_results}&startIndex={(page-1)*books_per_page}"
    response = requests.get(bookUrl)
    books_data = response.json()

    total_items = books_data.get('totalItems', 0)
    max_pages = 4 
    total_pages = min((total_items + books_per_page - 1) // books_per_page, max_pages)
    # Retrieve books list
    books_list = books_data.get('items', [])

    # Check if the books are favorites of the current user (if authenticated)
    isFavorite = []
    if current_user.is_authenticated:
        favorite_books = current_user.saved_books
        for book in books_list:
            isFavorite.append(book in favorite_books)
    else:
        isFavorite = [False] * len(books_list)

    return render_template("index.html", books=books_list, page=page, isFavorite=isFavorite, total_pages=total_pages, max_pages=max_pages)

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

        if user and user.check_password(form.password.data):
            if login_user(user):
                flash(f"Hello, {user.username}!", "success")
                return redirect(url_for('profile', user_id=current_user.id)) 

            else:
                flash("Failed to log in the user.", "danger")
        else:
            flash("Invalid username or password.", "danger")

    return render_template('users/login.html', form=form)

@app.route("/users/logout", methods=["GET"])
def logout():
    """Logout the current user."""
    logout_user()  # Use Flask-Login's logout_user function
    return redirect(url_for('home_page'))

############Registration and Login forms##############
# Route for displaying the registration form
@app.route("/users/register", methods=["GET"])
def registration_form():
    """Displays the registration form."""
    form = RegisterForm()
    return render_template('users/register.html', form=form)

# Route for handling user registration
@app.route("/users/register", methods=["POST"])
def register():
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

############ Genre and searchbar routes ##############
@app.route('/genre/<genre>')
def show_genre(genre):
    page = request.args.get('page', 1, type=int)
    per_page = 12

    if genre not in cached_books_data:
        fetch_by_genre(genre)

    books_data = cached_books_data[genre]
    total_items = books_data.get('totalItems', 0)
    total_pages = (total_items + per_page - 1) // per_page

    start_index = (page - 1) * per_page
    end_index = min(start_index + per_page, total_items)

    books_list = books_data.get('items', [])[start_index:end_index]

    # Check if the books are favorites of the current user
    isFavorite = [book in current_user.saved_books for book in books_list] if current_user.is_authenticated else [False] * len(books_list)

    return render_template('genre.html', genre=genre, books=books_list, isFavorite=isFavorite, page=page, total_pages=total_pages)

@app.route("/users/<int:user_id>/profile", methods=["GET"])
@login_required
def profile(user_id):
    if current_user.is_anonymous or current_user.id != user_id:
        flash("You are not authorized to view this profile.", 'danger')
        return redirect(url_for('home_page'))

    page = request.args.get('page', 1, type=int)
    per_page = 12

    # Retrieve the current user's favorite books
    favorite_books = current_user.saved_books
    total_items = len(favorite_books)
    total_pages = (total_items + per_page - 1) // per_page

    start_index = (page - 1) * per_page
    end_index = min(start_index + per_page, total_items)

    books_list = favorite_books[start_index:end_index]

    # Fetch detailed information for each book
    detailed_books_list = []
    for book in books_list:
        book_info = fetch_by_title(book.book_title)
        if book_info:
            detailed_books_list.append({
                'title': book_info['title'],
                'cover_url': book_info['cover_url'],
                'author': book_info['author'],
                'publisher': book_info['publisher'],
                'preview_link': book_info.get('previewLink', '#'), 
                'is_favorite': book.is_favorite
            })

    return render_template('users/profile.html', current_user=current_user, favorite_books=detailed_books_list, page=page, total_pages=total_pages)

############ Routes related to getting favorites, adding and deleting favorites & comments ##############
@app.route('/users/<int:user_id>/favorites/add', methods=['POST'])
@login_required
def add_favorite(user_id):
    if current_user.id != user_id:
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 403

    data = request.get_json()
    title = data.get('title')

    try:
        # Check if the entry already exists
        favorite_entry = Saved_Books.query.filter_by(user_id=user_id, book_title=title).first()
        
        if favorite_entry:
            # If it exists, update its favorite status
            favorite_entry.is_favorite = True
        else:
            # If it does not exist, create new
            favorite_entry = Saved_Books(user_id=user_id, book_title=title, is_favorite=True)
            db.session.add(favorite_entry)

        db.session.commit()
        return jsonify({'status': 'success', 'message': 'Book marked as favorite'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': 'Internal server error'}), 500
    
@app.route('/users/<int:user_id>/favorites/remove', methods=['DELETE'])
@login_required
def remove_favorite(user_id):
    if current_user.id != user_id:
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 403

    data = request.get_json()
    title = data.get('title')

    try:
        # Find the entry in the database
        favorite_entry = Saved_Books.query.filter_by(user_id=user_id, book_title=title).first()
        
        if favorite_entry:
            # Delete the entry from the database
            db.session.delete(favorite_entry)
            db.session.commit()  # Commit the transaction
            return jsonify({'status': 'success', 'message': 'Book removed from favorites'}), 200
        else:
            return jsonify({'status': 'error', 'message': 'Book not found'}), 404

    except Exception as e:
        db.session.rollback()  # Rollback the transaction in case of error
        return jsonify({'status': 'error', 'message': 'Internal server error'}), 500
    
@app.route('/users/<int:user_id>/favorites', methods=['GET'])
def get_favorites(user_id):
    try:
        # Check if the user is authenticated
        if current_user.is_authenticated:
            # Fetch the user's favorites
            favorite_books = Saved_Books.query.filter_by(user_id=current_user.id).all()

            book_data = []
            for fav_book in favorite_books:
                book_info = fetch_by_title(fav_book.book_title)
                if book_info:
                    book_data.append({
                        'title': book_info.get('title', ''),
                        'cover_url': book_info.get('cover_url', ''),
                        'author': book_info.get('author', 'Unknown'),
                        'publisher': book_info.get('publisher', 'Unknown'),
                        'is_favorite': fav_book.is_favorite
                    })

            return jsonify(favorite_books=book_data)
        else:
            # User is not authenticated, return an empty list
            return jsonify(favorite_books=[])

    except Exception as e:
        return jsonify(error=str(e)), 500

########### API fetch routes ##############
def fetch_books(query, max_results=40, start_index=0):
    url = f"https://www.googleapis.com/books/v1/volumes?q={query}&maxResults={max_results}&startIndex={start_index}&key={API_KEY}"

    response = requests.get(url)

    if response.status_code == 200:
        books_data = response.json()  
        cached_books_data[query] = books_data

        # Return the fetched books data
        return jsonify(books_data)
    else:
        return jsonify(error=f"Failed to fetch books. Status code: {response.status_code}")

@app.route('/fetch_genre/<genre>')
def fetch_by_genre(genre, max_results=40, start_index=0):
    query = f"lgbt+{genre}"
    url = f"https://www.googleapis.com/books/v1/volumes?q={query}&maxResults={max_results}&startIndex={start_index}&key={API_KEY}"
    response = requests.get(url)
    
    if response.status_code == 200:
        books_data = response.json()  
        cached_books_data[genre] = books_data
        return jsonify(books_data)  
    else:
        return jsonify(error=f"Failed to fetch books. Status code: {response.status_code}")
    
def fetch_by_title(title):
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
        return None
    
#########################
if __name__=='__main__':
    app.run(port=3000)


