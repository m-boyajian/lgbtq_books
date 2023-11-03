from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField
from wtforms.validators import DataRequired, Email, Length, ValidationError
from email_validator import validate_email, EmailNotValidError

class LoginForm(FlaskForm):
    """Form for user login."""
    username = StringField("Username", validators=[DataRequired()])
    password = PasswordField("Password", validators=[Length(min=8)])

class RegisterForm(FlaskForm):
    """Form for new user registration."""
    username = StringField("Username", validators=[DataRequired()])
    password = PasswordField("Choose New Password", validators=[Length(min=8)])
    email = StringField("Email", validators=[DataRequired(), Email()])

    def validate_email(self, field):
        try:
            validate_email(field.data)
        except EmailNotValidError as e:
            raise ValidationError(str(e))
