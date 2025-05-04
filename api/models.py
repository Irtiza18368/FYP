from django.db import models
from django.contrib.auth import get_user_model

class Task(models.Model):
    title = models.CharField(max_length=255)
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    dueTime = models.TimeField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    category = models.CharField(max_length=100, null=True, blank=True)

    def __str__(self):
        return self.title

# Create your models here.
