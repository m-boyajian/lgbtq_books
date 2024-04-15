import unittest
from flask import Flask
from app import app  # Import your Flask app
from models import db, User  # Import your models and db


class UserAuthenticationTestCase(unittest.TestCase):
    def setUp(self):
        # Create a test client for sending HTTP requests
        self.client = app.test_client()
    
    def tearDown(self):
        # No need for the 'app.app_context()' here
        # Drop the database tables
        db.session.remove()
        db.drop_all()

    def test_valid_authentication(self):
        # Create a test user in the database
        with app.app_context():
            test_user = User.signup(
                first_name="Test",
                last_name="User",
                username="testuser",
                email="test@example.com",
                password="testpassword",
            )
            db.session.commit()

        # Authenticate the test user
        response = self.client.post("/users/login", data={"username": "testuser", "password": "testpassword"})

        # Check if the response indicates successful login
        self.assertIn(b"Hello, testuser!", response.data)

    def test_invalid_authentication(self):
        # Attempt to authenticate with invalid credentials
        response = self.client.post("/users/login", data={"username": "invalidusername", "password": "invalidpassword"})

        # Check if the response indicates failed login
        self.assertIn(b"Invalid credentials.", response.data)

if __name__ == '__main__':
    unittest.main()
