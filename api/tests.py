from django.test import TestCase
from django.urls import reverse
from django.contrib.auth.models import User

class UserAuthTest(TestCase):
    def setUp(self):
        self.username = "testuser"
        self.password = "testpassword"
        self.user = User.objects.create_user(username=self.username, password=self.password)

    def test_signup(self):
        signup_url = reverse('http://localhost:8000/api/signup/')
        response = self.client.post(signup_url, {
            'username': 'newuser',
            'password1': 'newpassword',
            'password2': 'newpassword'
        })
        self.assertEqual(response.status_code, 200)
        self.assertTrue(User.objects.filter(username='newuser').exists())

    def test_login(self):
        login_url = reverse('http://localhost:8000/api/login/')
        response = self.client.post(login_url, {
            'username': self.username,
            'password': self.password
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn('_auth_user_id', self.client.session)

    def test_invalid_login(self):
        login_url = reverse('http://localhost:8000/api/login/')
        response = self.client.post(login_url, {
            'username': 'wronguser',
            'password': 'wrongpassword'
        })
        self.assertEqual(response.status_code, 200)
        self.assertNotIn('_auth_user_id', self.client.session)