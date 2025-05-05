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
        form = SignupForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.set_password(form.cleaned_data["password"])
            user.save()
            messages.success(request, "Signup successful! You can now log in.")
            return redirect("login")
        else:
            messages.error(request, "Please correct the errors below.")
    else:
        form = SignupForm()
    return render(request, "Api/Signup.html", {"form": form})

#User login view
@csrf_exempt
def user_login(request: HttpRequest):
    if request.method == "POST":
        form = LoginForm(data=request.POST)
        if form.is_valid():
            username = form.cleaned_data["username"]
            password = form.cleaned_data["password"]
            user = authenticate(request, username=username, password=password)
            if user is not None:
                login(request, user)
                return redirect("homepage")
            else:
                messages.error(request, "Invalid username or password")
    else:
        form = LoginForm()
    return render(request, "Api/Login.html", {"form": form})

#User logout view
@csrf_exempt
def logout(request: HttpRequest):
    logout(request)
    return redirect("login")

#View for listing tasks or creating a new task
@csrf_exempt
def task_list(request:HttpRequest) -> JsonResponse:
    if request.method == "GET":
        days = request.GET.get("days")
        tasks = Task.objects.all()

        today = now().date()
        tasks = tasks.filter(end_date__gte=today).order_by("end_date")

        if days:
            try:
                days = int(days)
                deadline_limit = today + timedelta(days=days)
                tasks = tasks.filter(end_date__lte=deadline_limit)
            except ValueError:
                return JsonResponse({"error": "Invalid days parameter"}, status=400)
        
        return JsonResponse(list(tasks.values()), safe=False)
    
    elif request.method == "POST":
        data = json.loads(request.body)
        try:
            user = User.objects.get(id=data["user_id"])
        except User.DoesNotExist:
            return JsonResponse({"error": "User not found"}, status=404)
        
        category = categorize_task(data["title"])
        
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
    
    return JsonResponse({"error": "Unsupported HTTP method"}, status=405)

#View for retrieving, updating or deleting a task by ID
@csrf_exempt
def task_update(request:HttpRequest, task_id: Optional[int] = None) -> JsonResponse:
    if task_id is None:
        return JsonResponse({"error": "Task Id is required"}, status=400)
    
    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        return JsonResponse({"error": "Task not found"}, status=404)
    
    if request.method == "GET":
        return JsonResponse({
            "id": task.id,
            "title": task.title,
            "start_date": task.start_date,
            "end_date": task.end_date,
            "dueTime": task.dueTime,
            "is_completed": task.is_completed,
        })
    
    elif request.method == "PUT":
        data = json.loads(request.body)

        dueTime = data.get("dueTime")
        if dueTime == '':
           dueTime = None


        task.title = data.get("title", task.title)
        task.start_date = data.get("start_date", task.start_date)
        task.end_date = data.get("end_date", task.end_date)
        task.dueTime = dueTime
        task.is_completed = data.get("is_completed", task.is_completed)

        if "category" in data:
            task.category = data["category"]
        else:
            task.category = categorize_task(task.title)
        
        try:
            task.save()
        except ValidationError as e:
            return JsonResponse({"error": str(e)}, status=400)
        
        return JsonResponse({
            "id": task.id,
            "title": task.title,
            "category": task.category,
            "start_date": task.start_date,
            "end_date": task.end_date,
            "dueTime": task.dueTime,
            "is_completed": task.is_completed,
        })
    
    elif request.method == "DELETE":
        task.delete()
        return JsonResponse({"message": "Task deleted successfully"})
    
    return JsonResponse({"error": "Unsupported HTTP method"}, status=405)