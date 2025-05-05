#Importing Django's model system
from django.db import models

#Importing the currently active user model
from django.contrib.auth import get_user_model

#Defining a Task Model representing a user's task
class Task(models.Model):
    #Title of the task with a maximum length of 255 chars.
    title = models.CharField(max_length=255)
    
    #Optional start date/time of the task
    start_date = models.DateTimeField(null=True, blank=True)
    
    #Optional end date/time of the task
    end_date = models.DateTimeField(null=True, blank=True)
    
    #Optional due time
    dueTime = models.TimeField(null=True, blank=True)
    
    #Boolean field for tracking if the task is completed or not
    is_completed = models.BooleanField(default=False)
    
    
    #ForeignKey which links each task to a specific user
    #If the user is deleted then all their tasks will be deleted as well.
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    
    #Optional category field for classifying the task.
    category = models.CharField(max_length=100, null=True, blank=True)

    #String representation of the Task object.
    def __str__(self):
        return self.title

# Create your models here.
