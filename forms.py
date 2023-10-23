from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField
from wtforms.validators import DataRequired, Email, Length
from email_validator import validate_email, EmailNotValidError

class LoginForm(FlaskForm):
    """Form for user login."""
    username = StringField("Username", validators=[DataRequired()])
    password = PasswordField("Password", validators=[Length(min=6)])

class RegisterForm(FlaskForm):
    """Form for new user registration."""
    first_name = StringField("First Name", validators=[DataRequired()])
    last_name = StringField("Last Name", validators=[DataRequired()])
    username = StringField("Username", validators=[DataRequired()])
    password = PasswordField("Password", validators=[Length(min=6)])
    email = StringField("Email", validators=[DataRequired(), Email()])

    def validate_email(self, field):
        try:
            validate_email(field.data)
        except EmailNotValidError as e:
            raise ValidationError(str(e))
