from django.urls import path
from . import views

urlpatterns = [
    path('', views.homepage, name='homepage'),
    path('signup/', views.user_signup, name='signup'),
    path('login/', views.user_login, name='login'),
    path('logout/', views.logout, name='logout'),
    path('tasks/', views.task_list, name='task_lists'),


    path('tasks/<int:task_id>/', views.task_update, name= 'task_update'),
]
