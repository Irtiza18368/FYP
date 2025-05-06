#Importing necessary modules and classes
from django.http import JsonResponse, HttpRequest
from django.utils.timezone import now, timedelta #For working with current date/time
from django.core.exceptions import ValidationError
from django.contrib.auth import authenticate, login, logout
from django.shortcuts import redirect, render, get_object_or_404
from django.views.decorators.csrf import csrf_exempt #For disabling CSRF protection on views
from .models import Task #Imported Task model
from .forms import SignupForm, LoginForm #Imported custom forms
from django.contrib import messages #For displaying messages in templates
from django.contrib.auth.models import User
from typing import Optional #For handling JSON data
import json

#Function for assigning a category based on the task title keywords
def categorize_task(title: str) -> str:
    if "meeting" in title.lower():
        return "Work"
    elif "coursework" in title.lower() or "report" in title.lower() or "assignment" in title.lower() or "exam" in title.lower() or "quiz" in title.lower():
        return "Education"
    elif "shopping" in title.lower():
        return "Personal"
    else:
        return "General"

#Homepage view
@csrf_exempt
def homepage(request: HttpRequest):
    return render(request, "Api/homepage.html")    

#User signup view
@csrf_exempt
def user_signup(request: HttpRequest):
    if request.method == "POST":
        form = SignupForm(request.POST) #Binding the form data
        if form.is_valid(): #Checking if the form passes validation
            user = form.save(commit=False) #Create the user but doesnt save to the DataBase yet.
            user.set_password(form.cleaned_data["password"]) #Hashing the password
            user.save() #Saving the user to the DataBase
            messages.success(request, "Signup successful! You can now log in.")
            return redirect("login") #If signup successful then redirect to login page.
        else:
            messages.error(request, "Please correct the errors below.")
    else:
        form = SignupForm() #Rendering empty form
    return render(request, "Api/Signup.html", {"form": form})

#User login view
@csrf_exempt
def user_login(request: HttpRequest):
    if request.method == "POST":
        form = LoginForm(data=request.POST) #Binding the form with POST data
        if form.is_valid():
            username = form.cleaned_data["username"]
            password = form.cleaned_data["password"]
            user = authenticate(request, username=username, password=password) #Checking credentials
            if user is not None:
                login(request, user) #Logging the user in
                return redirect("homepage") #Redirecting to homepage
            else:
                messages.error(request, "Invalid username or password")
    else:
        form = LoginForm() #Rendering empty form
    return render(request, "Api/Login.html", {"form": form})

#User logout view
@csrf_exempt
def logout(request: HttpRequest):
    logout(request) #Logging the user out
    return redirect("login") #Redirecting to login page

#View for listing tasks or creating a new task
@csrf_exempt
def task_list(request:HttpRequest) -> JsonResponse:
    if request.method == "GET":
        days = request.GET.get("days") #Optional query parameter for filtering by days
        tasks = Task.objects.all()

        today = now().date()
        tasks = tasks.filter(end_date__gte=today).order_by("end_date") #Filtering tasks which are not yet expired.

        if days:
            try:
                days = int(days)
                deadline_limit = today + timedelta(days=days) #Calculating limit date
                tasks = tasks.filter(end_date__lte=deadline_limit) #Filtering within limit
            except ValueError:
                return JsonResponse({"error": "Invalid days parameter"}, status=400)
        
        return JsonResponse(list(tasks.values()), safe=False) #Returning tasks as JSON
    
    elif request.method == "POST":
        data = json.loads(request.body) #Parsing JSON from request body
        
        #Getting the user instance by the ID
        try:
            user = User.objects.get(id=data["user_id"])
        except User.DoesNotExist:
            return JsonResponse({"error": "User not found"}, status=404)
        
        #Categorize the task based on the title
        category = categorize_task(data["title"])
        
        #Creating and saving the new task
        task = Task.objects.create(
            title = data["title"],
            start_date = data.get("start_date"),
            end_date = data.get("end_date"),
            dueTime = data.get("dueTime"),
            is_completed = data.get("is_completed", False),
            category = category,
            user = user,
        )
        return JsonResponse({"id": task.id, "category": category, "message": "Task Created"}, status=201)
    
    return JsonResponse({"error": "Unsupported HTTP method"}, status=405) #Invalid HTTP method

#View for retrieving, updating or deleting a task by ID
@csrf_exempt
def task_update(request:HttpRequest, task_id: Optional[int] = None) -> JsonResponse:
    if task_id is None:
        return JsonResponse({"error": "Task Id is required"}, status=400)
    
    #Getting the task or returning error if the task is not found
    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        return JsonResponse({"error": "Task not found"}, status=404)
    
    #If the request is GET, return the task data
    if request.method == "GET":
        return JsonResponse({
            "id": task.id,
            "title": task.title,
            "start_date": task.start_date,
            "end_date": task.end_date,
            "dueTime": task.dueTime,
            "is_completed": task.is_completed,
        })
    
    #If the request is PUT, update the task details.
    elif request.method == "PUT":
        data = json.loads(request.body)

        #Converting the empty dueTime to None
        dueTime = data.get("dueTime")
        if dueTime == '':
           dueTime = None

        #Updating the fields.
        task.title = data.get("title", task.title)
        task.start_date = data.get("start_date", task.start_date)
        task.end_date = data.get("end_date", task.end_date)
        task.dueTime = dueTime
        task.is_completed = data.get("is_completed", task.is_completed)

        #Either using provided category or recategorizing based on title
        if "category" in data:
            task.category = data["category"]
        else:
            task.category = categorize_task(task.title)
        
        #Try saving and catching validation errors
        try:
            task.save()
        except ValidationError as e:
            return JsonResponse({"error": str(e)}, status=400)
        
        #Returning updated task information
        return JsonResponse({
            "id": task.id,
            "title": task.title,
            "category": task.category,
            "start_date": task.start_date,
            "end_date": task.end_date,
            "dueTime": task.dueTime,
            "is_completed": task.is_completed,
        })
    
    #If the request is DELETE, delete the task
    elif request.method == "DELETE":
        task.delete()
        return JsonResponse({"message": "Task deleted successfully"})
    
    return JsonResponse({"error": "Unsupported HTTP method"}, status=405)