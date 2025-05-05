# Importing necessary modules from Django
from django import forms
from django.contrib.auth.models import User # Built-in User Model
from django.contrib.auth.forms import AuthenticationForm #Built-in login form

#Defining a custom signupform using ModelForm
class SignupForm(forms.ModelForm):
    #Adding a password input field
    password = forms.CharField(widget=forms.PasswordInput, label="Password")
    #Adding a confirm password input field
    confirm_password = forms.CharField(widget=forms.PasswordInput, label="Confirm Password")

    class Meta:
        #Linking the form to the built-in User model
        model = User

        #Only including the username field from the user model
        fields = ["username"]

    #Custom validation for checking if passwords match or not
    def clean(self):
        cleaned_data = super().clean() #Getting cleaned form data
        password = cleaned_data.get("password")
        confirm_password = cleaned_data.get("confirm_password")

        #If passwords doesnt match, raise a validation error stating the passwords are incorrect.
        if password != confirm_password:
            raise forms.ValidationError("Passwords do not match")
        
        #Returning the cleaned data if valid
        return cleaned_data

#Defining a custom LoginForm extending Django's AuthenticationForm
class LoginForm(AuthenticationForm):
    
    #Overriding the default fields with custom labels and widgets
    username = forms.CharField(label="Username", max_length=150)
    password = forms.CharField(widget=forms.PasswordInput, label="Password")