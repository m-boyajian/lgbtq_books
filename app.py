from flask import Flask, render_template, redirect, flash, session, g, request, jsonify
from models import connect_db, db, User
from forms import LoginForm, RegisterForm
from sqlalchemy.exc import IntegrityError
from flask_migrate import Migrate
from flask_login import LoginManager

app = Flask(__name__, template_folder="templates", static_folder="static")

app.app_context().push()

from flask_login import current_user
from flask_login import login_required

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
CURR_USER_KEY = "curr_user"

connect_db(app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route("/")
def home_page():
    """"""
    print(current_user)
    return render_template("index.html", user=current_user)

@app.route('/session_data')
def session_data():
    if CURR_USER_KEY in session:
        user_id = session[CURR_USER_KEY]
        return f"User ID in session: {user_id}"
    else:
        return "No user in session"


###########User signup/login/logout##############

@app.before_request
def add_user_to_global():
    """If user logged in, add curr user to Flask global."""

    if CURR_USER_KEY in session:
        g.user = User.query.get(session[CURR_USER_KEY])

    else:
        g.user = None

def login(user):
    """Log in user."""

    session[CURR_USER_KEY] = user.id

def logout():
    """Logout user."""

    if CURR_USER_KEY in session:
        del session[CURR_USER_KEY]

@app.route('/users/register', methods=["GET", "POST"])
def handle_registration():
    """Handle user signup. Create new user and add to DB. Redirect to home page.

    If form not valid, present form.

    If the there already is a user with that username: flash message
    and re-present form.
    """
    if CURR_USER_KEY in session:
        del session[CURR_USER_KEY]
    form = RegisterForm()

    if form.validate_on_submit():
        try:
            user = User.signup(
                first_name=form.first_name.data,
                last_name=form.last_name.data,
                username=form.username.data,
                password=form.password.data,
                email=form.email.data,
            )
            db.session.commit()

        except IntegrityError:
            flash("Username already taken", 'danger')
            return render_template('register.html', form=form)

        login(user)

        return redirect("/")

    else:
        return render_template('users/register.html', form=form)

@app.route('/users/login', methods=["GET", "POST"])
def handle_login():
    """Handle user login."""

    form = LoginForm()

    if form.validate_on_submit():
        user = User.authenticate(form.username.data,
                                 form.password.data)

        if user:
            login(user)
            flash(f"Hello, {user.username}!", "success")
            return redirect("/")

        flash("Invalid credentials.", 'danger')

    return render_template('users/login.html', form=form)

@app.route('/profile')
@login_required
def profile():
    # This route is protected and only accessible to logged-in users
    return render_template('profile.html')

@app.route('/logout')
def handle_logout():
    """Handle logout of user."""

    logout()

    flash("Logout successful", 'success')
    return redirect('/login')

###########Search & fetch books##############
def fetch_books(query):
    url = f"https://www.googleapis.com/books/v1/volumes?q={query}&key={API_KEY}"
    response = requests.get(url)
    return response.json()

def fetch_books_by_genre(genre):
    query = f"lgbt+subject:{genre}"
    url = f"https://www.googleapis.com/books/v1/volumes?q={query}&key={API_KEY}"
    print("Query:", query)
    print("URL:", url)
    response = requests.get(url)
    return response.json()

@app.route('/genre/<genre>')
def show_genre(genre):
    books_data = fetch_books_by_genre(genre)
    books_list = books_data.get('items', [])
    return render_template('genre.html', genre=genre, books=books_list)

@app.route('/search_results', methods=["GET"])
def search_books():
    query = request.args.get('query')  # Get the query from the URL parameters
    books_data = fetch_books(query)
    books_list = books_data.get('items', [])
    # Process the data and render a template with the results
    return jsonify(books_data=books_list)

@app.route('/genre/scifi')
def scifi_fantasy():
    print("Reached the /genre/{genre} route")
    return render_template('genre.html', genre='scifi')

@app.route('/genre/romance')
def romance_pulp():
    print("Reached the /genre/{genre} route")
    return render_template('genre.html', genre='romance')

@app.route('/genre/history')
def history_activism():
    print("Reached the /genre/{genre} route")
    return render_template('genre.html', genre='history')

@app.route('/genre/mystery')
def mystery():
    print("Reached the /genre/{genre} route")
    return render_template('genre.html', genre='mystery')

@app.route('/genre/selfcare')
def selfcare_mentalhealth():
    print("Reached the /genre/{genre} route")
    return render_template('genre.html', genre='selfcare')

@app.route('/genre/fiction')
def fiction():
    print("Reached the /genre/{genre} route")
    return render_template('genre.html', genre='fiction')