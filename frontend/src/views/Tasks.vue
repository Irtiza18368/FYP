<template>
  <!--Main container for the task list with padding-->
  <div class="container py-5">
    <!--Glass-styling card wrapper-->
    <div class="card custom-shadow glass-card">
      <!--Card header with title-->
      <div class="card-header bg-primary text-white text-center">
        <h2 class="mb-0">Task List</h2>
      </div>
      <!--Main body of the card-->
      <div class="card-body">

        <!--Search Input-->
        <input v-model="searchQuery" type="text" class="form-control mb-3 glass-input" placeholder="Search tasks" />
        
        <!--Category Filter Dropdown-->
        <select v-model="filterCategory" class="form-select mb-3 glass-input">
          <option value="">All Categories</option>
          <option v-for="category in categories" :key="category.id" :value="category">
            {{ category }}
          </option>
        </select>


        <!--Task List with animation-->
        <transition-group name="fade" tag="ul" class="list-group custom-scrollbar">
          <li v-for="task in filteredTasks" :key="task.id" class="list-group-item glass-item d-flex justify-content-between align-items-center" :class="task.priorityClass">
            
            <!--Edit Mode-->
            <div v-if="editTaskId === task.id" class="w-100">
              <input v-model="editedTask.title" type="text" class="form-control mb-2 glass-input" placeholder="Task Title" />
              <input v-model="editedTask.category" type="text" class="form-control mb-2 glass-input" placeholder="Category" />
              
              <!--Add Start Date Input-->
              <input v-model="editedTask.startDate" type="date" class="form-control mb-2 glass-input" />

              <!--Add Due Date Input-->
              <input v-model="editedTask.dueDate" type="date" class="form-control mb-2 glass-input" />
              
              <input v-model="editedTask.dueTime" type="time" class="form-control mb-2 glass-input" placeholder="Due Time (24-hour format):" />

              <!--Save/Cancel Buttons-->
              <div class="d-flex justify-content-end">
                <button class="btn btn-success btn-sm me-2 glass-button" @click="saveTaskHandler(task.id)">
                  <i class="bi bi-save me-1"></i> Save Task
                </button>
                <button class="btn btn-secondary btn-sm glass-button" @click="cancelEdit">
                  <i class="bi bi-x-circle me-1"></i> Cancel Editing
                </button>
              </div>
            </div>
              
            <!--View Mode-->
            <div v-else class="d-flex justify-content-between align-items-center w-100">
              <div class="d-flex align-items-center gap-3">
                <span class="fw-bold">{{ task.title }}</span>
                <span class="badge badge-custom">{{ task.category }}</span>
              </div>
              <div class="d-flex justify-content-between align-items-center">
                <small class="text-muted">
                  Time Remaining:
                  <span v-if="task.remainingTime">{{ task.remainingTime }}</span>
                  <span v-else class="text-danger">Expired</span>
                </small>
                <div>
                  <small><strong>Start Date:</strong>{{ formatDisplayDate(task.startDate) }}</small>
                  <small><strong>Due Date:</strong>{{ formatDisplayDate(task.dueDate) }}</small>
                  <small><strong>Due Time:</strong>{{ formatDueTime(task.dueTime) }}</small>
                </div>
                <!--Action buttons-->
                <button class="btn btn-warning btn-sm me-2 glass-button" @click="enableEditMode(task)">Edit Task</button>
                <button class="btn btn-danger btn-sm me-2 glass-button" @click="deleteTask(task.id)">Delete Task</button>
                <button class="btn btn-success btn-sm me-2 glass-button" @click="markTaskAsCompleteAndRedirect(task)">Mark as Complete</button>
              </div>
            </div>
          </li>
        </transition-group>

        <!--Suggestion Modal-->
        <div v-if="showSuggestion" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5)">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content glass-card">
              <div class="modal-header bg-primary text-white">
                <h2 class="modal-title">Suggested Next Task</h2>
                <button type="button" class="btn-close" @click="showSuggestion = false"></button>
              </div>
              <div class="modal-body">
                <p>You just completed <strong>"{{ completedTask.title }}"</strong>. Would you like to work on this next?</p>
                <div class="card mb-3 glass-item">
                  <h2>{{ suggestedTask.title }}</h2>
                  <span class="badge badge-custom">{{ suggestedTask.category }}</span>
                  <p class="mt-2 mb-0">
                    <small>Due: {{ formatDisplayDate(suggestedTask.dueDate) }} at {{ formatDueTime(suggestedTask.dueTime) }}</small>
                  </p>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary glass-button" @click="showSuggestion = false">Maybe Later</button>
                <button type="button" class="btn btn-primary glass-button" @click="startSuggestedTask">Start This Task</button>
              </div> 
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="js">

import { useTaskStore } from '../store/taskStore';
import { mapState, mapActions } from 'pinia';

export default 
{
  data() 
  {
    return {
      showSuggestion: false, //Controlling modal visibility
      suggestedTask: null, //Holding the suggested next task
      completedTask: null, //Storing last completed task
      editTaskId: null, //ID of the task in edit mode
      editedTask: {}, //Temporarily edited task data
      searchQuery: '', //Search input string
      filterCategory: '', //Selected catagory for filtering
    };
  },
  //Computed properties for derived data
  computed:{
    ...mapState(useTaskStore, ['tasks']),

    //Getting all the task categories
    categories(){
      return this.tasks ? [...new Set(this.tasks.map(task => task.category))] : [];
    },

    //Filtering the tasks based on search and category and excluding completed ones
    filteredTasks(){
      return this.tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(this.searchQuery.toLowerCase());
        const matchesCategory = this.filterCategory ? task.category === this.filterCategory : true;
        return matchesSearch && matchesCategory && !task.is_completed;
      }).map(task => {
        return {
          ...task,
          priorityClass: this.getPriorityClass(task.dueDate)
        };
      });
    },
  },
  mounted() 
  {
    //Loading the tasks and starting live countdown timer
    this.fetchTasks();
    this.startRealTimeTimer();
  },
  beforeDestroy(){
    //Stopping the timer when component is destroyed.
    clearInterval(this.timer);
  },
  methods:
  {
    ...mapActions(useTaskStore, [
      'fetchTasks', 
      'deleteTask', 
      'markTaskAsComplete', 
      'saveTask', 
      'addEvent', 
      'startRealTimeTimer', 
      'stopRealTimeTimer',
    ]),


    //Starting to work on the suggested task by opening the edit mode
    async startSuggestedTask(){
      this.showSuggestion = false;
      this.enableEditMode(this.suggestedTask);
    },

    //Assigning a priority class to a task based on due date proximity
    getPriorityClass(dueDate){
      if(!dueDate) return '';

      const now = new Date();
      const due = new Date(dueDate);
      const diffInDays = Math.floor((due - now) / (1000 * 60 * 60 * 24));

      if (diffInDays < 0) return 'priority-high';
      if (diffInDays <= 1) return 'priority-high';
      if (diffInDays <= 3) return 'priority-medium';
      return 'priority-low';
    },

    //Opening modal and preparing suggested task
    async markTaskAsCompleteAndRedirect(task){
      try{
        await this.markTaskAsComplete(task);
        this.completedTask = task;

        const suggestion = this.getNextTaskSuggestion(task);
        if (suggestion){
          this.suggestedTask = suggestion;
          this.showSuggestion = true;
        } else {
          this.$router.push('/manage-task');
        }
      } catch (error){
        console.error('Error marking task as complete:', error);
      }
    },
    
    //Suggest the next best task to do
    getNextTaskSuggestion(completedTask){
      if (!this.tasks || this.tasks.length === 0) return null;

      const pendingTasks = this.tasks.filter(t => !t.is_completed && t.id !== completedTask.id);

      if (pendingTasks.length === 0) return null;

      return pendingTasks.sort((a, b) => {
        const dateA = a.dueDate ? new Date(a.dueDate) : new Date(9999, 0);
        const dateB = b.dueDate ? new Date(b.dueDate) : new Date(9999, 0);

        const categoryMatchA = a.category === completedTask.category ? 0 : 1;
        const categoryMatchB = b.category === completedTask.category ? 0 : 1;

        const startDateA = a.startDate ? new Date(a.startDate) : new Date(0);
        const startDateB = b.startDate ? new Date(b.startDate) : new Date(0);

        return (dateA - dateB) || (categoryMatchA - categoryMatchB) || (startDateA - startDateB);
      })[0];
    },
    
    //Switching to edit mode
    enableEditMode(task){
      this.editTaskId = task.id;
      this.editedTask = {
        ...task,
        startDate: task.startDate ? this.formatDateForInput(task.startDate): '',
        dueDate: task.dueDate? this.formatDateForInput(task.dueDate): '',
      };
    },

    //Formatting a date string for display
    formatDisplayDate(dateString){
      if(!dateString) return 'N/A';
      try{
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? 'N/A': date.toLocaleDateString();
      } catch{
        return 'N/A'; 
      }
    },  

    //Format a date string to be used in input fields(YYYY-MM-DD)
    formatDateForInput(dateString){
      if(!dateString) return '';
      const date = new Date(dateString);

      if (isNaN(date.getTime())) return '';

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },

    cancelEdit(){
      this.editTaskId =  null;
      this.editedTask = {};
    },

    //Formatting due time from 12 to 24 hour format
    formatDueTime(dueTime){
      if (!dueTime) return "N/A";

      const match = dueTime.match(/(\d{1,2}):(\d{2}) (AM|PM)/);
      if (match){
        let [_, hours, minutes, period] = match;
        hours = period === "PM" && hours !== "12" ? String(+hours + 12) : hours;
        hours = period === "AM" && hours === "12" ? "00" : hours;
        return `${hours}:${minutes}`;
      }

      return dueTime;
    },

    async saveTaskHandler(taskId){
      try{

        const formattedDueTime = this.formatDueTime(this.editedTask.dueTime);
        const startDate = this.editedTask.startDate ? new Date(this.editedTask.startDate).toISOString(): null;
        const dueDate = this.editedTask.dueDate ? new Date(this.editedTask.dueDate).toISOString(): null;

        const updatedTask = {
          ...this.editedTask,
          dueTime: formattedDueTime,
          startDate: startDate,
          dueDate: dueDate,
        };

        await this.saveTask({taskId, updatedTask});
        this.cancelEdit();
      } catch (error){
        console.error('Error saving task:', error);
      }
    },
  },
};
</script>

<style>

/* Priority Highlighting */
.priority-high {
  border: 2px solid rgba(255, 0, 0, 0.7);
  animation: glow-red 1.5s infinite alternate;
}

.priority-medium {
  border: 2px solid rgba(255, 165, 0, 0.7);
  animation: glow-orange 1.5s infinite alternate;
}

.priority-low {
  border: 2px solid rgba(0, 255, 0, 0.7);
}

@keyframes glow-red {
  from { box-shadow: 0 0 10px rgba(255, 0, 0, 0.6); }
  to { box-shadow: 0 0 20px rgba(255, 0, 0, 1); }
}

@keyframes glow-orange {
  from { box-shadow: 0 0 10px rgba(255, 165, 0, 0.6); }
  to { box-shadow: 0 0 20px rgba(255, 165, 0, 1); }
}

/* Container styling */
.container{
  max-width: 900px;
  margin: auto;
  padding: 20px;
}

.modal-content.glass-card{
  border: none;
  border-radius: 20px;
  overflow: hidden;
}

.modal-body .card{
  border: 1px solid rgba(255,255,255,0.3);
  transition: transform 0.3s ease;
}

.modal-body .card:hover{
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}

/* Glassmorphic Card */
.glass-card{
  background: linear-gradient(270deg, rgba(255, 255, 255, 0.2), rgba(0, 123, 255, 0.2), rgba(255, 255, 255, 0.2));
  border-radius: 20px;
  background-size: 600% 600%;
  animation: moveGradient 20s ease infinite;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.25);
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.2);
  padding: 30px;
}

@keyframes moveGradient{
  0% {background-position: 0% 50%;}
  50% {background-position: 100% 50%;}
  100% {background-position: 0% 50%;}
}

/* Header Styling */
.card-header{
  background: rgba(0,123, 255, 0.7);
  border-radius: 16px;
  color: #fff;
  font-weight: bold;
  padding: 25px;
  text-shadow: 1px 1px 3px rgba(0,0,0,0.3);
  backdrop-filter: blur(8px);
}

/* Input & Select - Neumorphism feel */
.glass-input{
  background: rgba(255,255,255,0.2);
  border: none;
  border-radius: 12px;
  padding: 12px 16px;
  color: #fff;
  backdrop-filter: blur(10px);
  box-shadow: inset 0 2px 6px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

.glass-input::placeholder{
  color: rgba(255,255,255,0.6);
}

.glass-input:focus{
  outline: none;
  box-shadow: 0 0 0 2px rgba(0,123, 255, 0.3);
}

/* Task Item */
.glass-item{
  background: rgba(255,255,255,0.1);
  border-radius: 16px;
  margin-bottom: 15px;
  padding: 20px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  transition: transform 0.3s ease;
}

.glass-item:hover{
  transform: translateY(-4px);
}

/* Buttons */
.glass-button {
  background: rgba(255,255,255,0.2);
  border: none;
  color: #fff;
  padding: 8px 16px;
  border-radius: 10px;
  font-weight: 500;
  box-shadow: 0 3px 10px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

.glass-button:hover {
  background: rgba(255,255,255,0.3);
  transform: translateY(-2px);
}

.badge-custom{
  background: linear-gradient(135deg, #00c6ff, #0072ff);
  color: white;
  border-radius: 12px;
  padding: 6px 14px;
  font-size: 0.85rem;
  font-weight: bold;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}

.fade-enter-active, .fade-leave-active{
  transition: opacity 0.5s, transform 0.4s;
}

@keyframes scale-in{
  0% {
    transform: scale(0.95);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.fade-enter, .fade-leave-to{
  opacity: 0;
  transform: translateY(10px);
}

@media(max-width: 576px){
  .form-control{
    margin-bottom: 12px;
  }
  .list-group-item{
    flex-direction: column;
    align-items: flex-start;
    padding: 15px;
  }
  .glass-button{
    width: 100%;
    margin-bottom: 10px;
  }
  .list-group-item > div {
    width: 100%;
  }
  .list-group-item > div > div {
    flex-direction: column;
    gap: 12px;
  }
}
</style>