import unittest
from app import app, db, login_manager
from models import User

login_manager.init_app(app)

class TestAppRoutes(unittest.TestCase):
    def setUp(self):
        # Initialize Flask test client
        self.client = app.test_client()
        self.ctx = app.app_context()
        self.ctx.push()
        self.create_test_user()

    def tearDown(self):
        # Remove the test user after each test
        if self.test_user:
            db.session.delete(self.test_user)
            db.session.commit()
        self.ctx.pop()

    def create_test_user(self):
        # Create a fake test user and add it to the database
        self.test_user_data = {
            'username': 'test_user',
            'email': 'test_user@gmail.com',
            'password': 'test_user1'
        }
        self.test_user = User(**self.test_user_data)
        db.session.add(self.test_user)
        db.session.commit()

    def login(self):
        response = self.client.post('/users/login', data=dict(
            username=self.test_user_data['username'],
            password=self.test_user_data['password']
        ), follow_redirects=True)

        return response

    def test_home_page(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)  

    def test_login_form(self):
        response = self.client.get('/users/login')
        self.assertEqual(response.status_code, 200) 

    def test_registration_form(self):
        response = self.client.get('/users/register')
        self.assertEqual(response.status_code, 200) 

    def test_genre_page(self):
        response = self.client.get('/genre/<genre>')
        self.assertEqual(response.status_code, 200)  

if __name__ == '__main__':
    unittest.main()


