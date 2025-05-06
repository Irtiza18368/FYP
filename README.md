# AI-powered Deadline Reminder application with Study Planner

A Django web application that helps students organizing their deadlines, prioritizing tasks, customizing themes, setting reminders for the tasks and sending notification via email or push notification.

## Quick Start
## Backend Setup (Django)

### 1. Check if Anaconda/Miniconda is installed or not
Open your terminal in your IDE (e.g. VSCode, PyCharm etc.) and run:
```bash
conda --version
```
If conda is not installed,you can download from this links:
1. https://www.anaconda.com/download
2. https://www.anaconda.com/docs/getting-started/miniconda/main


### 2. Creating a new virtual environment with Django
```bash
conda create --name venv Django==5.1
```
By doing this, it will create a virtual environment named venv with Djago 5.1 installed.
Naming can be different.

### 3. Activating the virtual environment
```bash
conda activate venv
```
which should now start with (venv)

### 4. Upgrading python installation package (PIP)
```bash
pip install --upgrade pip
```

### 5. Verifying Django installation
```bash
python -m django --version
```
which should give the version 5.1

### 6. Running the Django backend server
Make sure you're in the Django project directory (where manage.py is located):

```bash
python manage.py runserver
```

## Frontend Setup(Vite+Vue)

### 1. Checking if Node.js and npm(Node package manager) are installed or not
```bash
node -v
npm -v
```
if not installed then you can download Node.js from this website:
https://nodejs.org/en

### 2. (Optional) Checking if Vite is installed globally
```bash
npm list -g vite
```

To install vite globally(optional):
```bash
npm install -g vite
```

### 3. Install project dependencies
Navigate to the frontend directory and run:
```bash
npm install
```
If the packages are not installed then do this.

### 4. Running the frontend development server
```bash
npm run dev
```
which will start the local development server.
