<template>
  <div class="container my-5">

    <!--Card-->
    <div class="card glass-card shadow-lg">
      <div class="card-header bg-primary text-white text-center">
        <h2 class="mb-0">Add Task</h2>
      </div>
      <div class="card-body">

        <!--Form Field-->
        <form @submit.prevent="handleAddTask">

          <!--Task Title-->
          <div class="mb-3">
            <label for="title" class="form-label">Task Title:</label>
            <input v-model="formData.title" id="title" type="text" class="form-control glass-input" :class="{'is-invalid': titleInvalid}" required placeholder="Enter task title" />
            <div v-if="titleInvalid" class="invalid-feedback">Please enter a task title</div>
          </div>

          <!--Starting Date-->
          <div class="mb-3">
            <label for="start_date" class="form-label">Start Date:</label>
            <input v-model="formData.start_date" id="start_date" type="date" class="form-control glass-input" :class="{'is-invalid': startDateInvalid}" />
            <div v-if="startDateInvalid" class="invalid-feedback">
              Please select a valid start date.
            </div>
          </div>

          <!--Ending Date-->
          <div class="mb-3">
            <label for="end_date" class="form-label">End Date:</label>
            <input v-model="formData.end_date" id="end_date" type="date" class="form-control glass-input" :class="{'is-invalid': endDateInvalid}" />
            <div v-if="endDateInvalid" class="invalid-feedback">
              Please select a valid end date.
            </div>
          </div>

          <!--Completion Checkbox-->
          <div class="form-check mb-3">
            <input v-model="formData.is_completed" id="is_completed" type="checkbox" class="form-check-input" />
            <label for="is_completed" class="form-check-label glass-checkbox">Completed</label>
          </div>

          <!--Submit Button-->
          <button type="submit" class="btn btn-gradient w-100" :disabled="isFormInvalid">Add Task</button>
        </form>
        
        <!--Live Preview Section-->
        <div v-if="formData.title" class="preview-box mt-4 p-3 glass-card">
          <h2 class="text-center mb-3">Task Preview</h2>
          <h2>{{ formData.title }}</h2>
          <p><strong>Start Date: </strong>{{ formData.start_date || 'Not set' }}</p>
          <p><strong>End Date: </strong>{{ formData.end_date || 'Not set' }}</p>
          <p><strong>Status: </strong>{{ formData.is_completed ? 'Completed': 'Pending' }}</p>
        </div>
      </div>
    </div>

    <!--Success Toast Notification-->
    <div v-if="showSuccess" class="toast align-items-center text-bg-success position-fixed top-0 end-0 m-3 glass-toast" role="alert">
      <div class="d-flex">
        <div class="toast-body">
          Task Added Successfully!
        </div>
        <button type="button" class="btn-close btn-close-white" @click="showSuccess = false" aria-label="Close"></button>
      </div>
    </div> 
  </div>
</template>

<script lang="js">

import { useTaskStore } from '../store/taskStore';
import { mapActions } from 'pinia';

export default {
  data() {
    return {
      formData: {
        title: '',
        start_date: '',
        end_date: '',
        is_completed: false,
        user_id: 1,
      },
      showSuccess: false,
      titleInvalid: false,
      startDateInvalid: false,
      endDateInvalid: false,
    };
  },

  computed:{
    isFormInvalid(){
      return !this.formData.title.trim() || this.titleInvalid || this.startDateInvalid || this.endDateInvalid;
    },
  },
  methods: {
    ...mapActions(useTaskStore, ['addTask', 'fetchTasks']),
    
    async handleAddTask() {
      //Resetting validation states
      this.titleInvalid = false;
      this.startDateInvalid = false;
      this.endDateInvalid = false;

      if (!this.formData.title.trim()){
        this.titleInvalid = true;
        return;
      }

      //Validate dates if provided
      if (this.formData.start_date || this.formData.end_date){
        const startDate = this.formData.start_date ? new Date(this.formData.start_date) : null;
        const endDate = this.formData.end_date ? new Date(this.formData.end_date): null;

        if (startDate && endDate && startDate > endDate){
          this.startDateInvalid = true;
          this.endDateInvalid = true;
          alert('End date must be after start date');
          return;
        }
      }

      try{
        const taskToSend = {
          ...this.formData,
          user_id: this.formData.user_id || 1
        };

        const newTask = await this.addTask(taskToSend);
        console.log('Task created:', newTask);
        
        this.showSuccess = true;
        this.formData = {
          title: '',
          start_date: '',
          end_date: '',
          is_completed: false,
          user_id: 1
        };

        await this.fetchTasks();

        setTimeout(() => {
          this.showSuccess = false;
        }, 3000);
      } catch (error){
        console.error('Error adding task:', error);
        alert('Failed to add task');
      }
    },
  },
  mounted(){
    const today = new Date().toISOString().split('T')[0];
    this.formData.start_date = today;
  },
};
</script>

<style>

.preview-box{
  border: 1px dashed rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.05);
}

.container {
  max-width: 600px;
}

/* Card Styling */
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  padding: 30px;
}

/* Card Header */
.card-header {
  background: linear-gradient(135deg, #8e2de2, #4a00e0);
  border-radius: 18px 18px 0 0;
  text-align: center;
}

.card-header h2 {
  font-size: 1.75rem;
  margin: 0;
}

/* Form Inputs */
.glass-input {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: #fff;
  padding: 12px 14px;
  font-size: 1rem;
  transition: all 0.3s ease-in-out;
}

.glass-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.glass-input:focus {
  background: rgba(255, 255, 255, 0.2);
  border-color: #8e2de2;
  box-shadow: 0 0 10px rgba(142, 45, 226, 0.6);
  outline: none;
}

/* Invalid input feedback */
.is-invalid {
  color: #ff6b6b;
  font-size: 0.875rem;
  margin-top: 6px;
}

.glass-checkbox {
  margin-left: 8px;
  color: #fff;
}

.glass-checkbox:checked {
  background-color: #6a11cb;
  border-color: #6a11cb;
}

/* Buttons */
.btn-gradient {
  background: linear-gradient(135deg, #8e2de2, #4a00e0);
  border: none;
  color: #fff;
  padding: 12px 20px;
  font-size: 1.05rem;
  font-weight: 500;
  border-radius: 14px;
  transition: all 0.3s ease-in-out;
  width: 100%;
  position: relative;
  overflow: hidden;
  z-index: 1;
}

.btn-gradient:before{
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #4a00e0, #8e2de2);
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
  z-index: -1;
}

.btn-gradient:hover {
  background: linear-gradient(135deg, #4a00e0, #8e2de2);
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.btn-gradient:hover:before{
  opacity: 1;
}

.btn-gradient:not(:disabled):hover{
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.btn-gradient:not(:disabled):active{
  transform: translateY(0);
}

.btn-gradient:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: linear-gradient(135deg, #cccccc, #999999);
}


/* Toast notification styles */
.glass-toast {
  background: rgba(40,167,69, 0.85);
  backdrop-filter: blur(8px);
  border-radius: 14px;
  padding: 10px 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  color: #fff;
}

/* Ripple Effect on button */
.btn-gradient:after{
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  background: rgba(255, 255, 255, 0.5);
  opacity: 0;
  border-radius: 50%;
  transform: scale(1) translate(-50%, -50%);
  transform-origin: 50% 50%;
}

@keyframes ripple{
  0%{
    transform: scale(0);
    opacity: 1;
  }
  100%{
    transform: scale(150);
    opacity: 0;
  }
}

.btn-gradient:active:after{
  animation: ripple 0.4s ease-out;
}

.glass-toast .btn-close {
  filter: invert(1);
  opacity: 0.8;
}
</style>