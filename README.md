Hanky Code-LGBTQ Book Site

Hanky Code is an LGBTQ book search site which allows users to perform a search and receive filtered search results, and/or to browse various book genres, such as romance, sci-fi, history, self-help, mystery, and fiction, of LGBTQ themes and authors. The site also allows registered, logged-in users to favorite and save books to their private profile page.

For the homepage of the site, I implemented a random color change effect to the title 'HANKY CODE' as a more contemporary appearing nod to the LGBT flag. The homepage contains a navigation bar with links to 'Login' and 'Register', a search bar input field with a 'Search' button, and 6 genre tiles for the genres romance, sci-fi, history, self-help, mystery, and fiction. The site is intended to be simple and clean, utilizing Bootstrap and Font Awesome.

The frontend of the project is made with JavaScript, the backend with Python and Flask. Various dependencies were utilized such as bcrypt/Flask Bcrypt, WTForms/Flask-WTF, psycopg2-binary, Flask Login, and Jinja for templating. The database was made with SQLAlchemy/PostgreSQL.

Google Books API base link: 'https://www.googleapis.com/books/v1/volumes?q=LGBTQ'. API fetching done using axios.

