<template>
  <div :class="['container my-5', { dark: darkMode }]">

    <!--Card-->
    <div class="card glass-card shadow-lg">
      <div class="card-header bg-primary text-white text-center d-flex justify-content-between align-items-center">
        <h2 class="mb-0">Add Task</h2>
        <button @click="toggleDarkMode" class="btn btn-sm btn-light" aria-label="Toggle dark mode">
          {{ darkMode ? '🌙' : '☀️' }}
        </button>
      </div>
      <div class="card-body">

        <!--Form Field-->
        <form @submit.prevent="handleAddTask">

          <!--Task Title-->
          <div class="mb-3">
            <label for="title" class="form-label">Task Title:</label>
            <input v-model="formData.title" id="title" type="text" class="form-control glass-input" :class="{'is-invalid': titleInvalid}" required placeholder="Enter task title" aria-label="Task title" />
            <div v-if="titleInvalid" class="invalid-feedback">Please enter a task title</div>
          </div>

          <!--Description-->
          <div class="mb-3">
            <label for="description" class="form-label">Description:</label>
            <textarea v-model="formData.description" id="description" class="form-control glass-input" placeholder="Enter task details" aria-label="Task description"></textarea>
          </div>

          <!--Priority-->
          <div class="mb-3">
            <label for="priority" class="form-label">Priority:</label>
            <select v-model="formData.priority" id="priority" class="form-select glass-input" aria-label="Priority">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <!--Tags-->
          <div class="mb-3">
            <label for="tags" class="form-label">Tags:</label>
            <input v-model="formData.tags" id="tags" type="text" class="form-control glass-input" placeholder="e.g. Work, Personal" aria-label="Task tags" />
          </div>

          <!--Starting Date-->
          <div class="mb-3">
            <label for="start_date" class="form-label">Start Date:</label>
            <input v-model="formData.start_date" id="start_date" type="date" class="form-control glass-input" :class="{'is-invalid': startDateInvalid}" :min="today" aria-label="Start date" />
            <div v-if="startDateInvalid" class="invalid-feedback">Please select a valid start date.</div>
          </div>

          <!--Ending Date-->
          <div class="mb-3">
            <label for="end_date" class="form-label">End Date:</label>
            <input v-model="formData.end_date" id="end_date" type="date" class="form-control glass-input" :class="{'is-invalid': endDateInvalid}" :min="formData.start_date || today" aria-label="End date" />
            <div v-if="endDateInvalid" class="invalid-feedback">Please select a valid end date.</div>
          </div>

          <!--Recurring Task-->
          <div class="mb-3">
            <label for="recurring" class="form-label">Recurring:</label>
            <select v-model="formData.recurring" id="recurring" class="form-select glass-input" aria-label="Recurring">
              <option value="none">None</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>

          <!--File Attachment-->
          <div class="mb-3">
            <label for="file" class="form-label">Attach File:</label>
            <input id="file" type="file" class="form-control glass-input" @change="handleFileUpload" aria-label="Attach file" />
          </div>

          <!--Completion Checkbox-->
          <div class="form-check mb-3">
            <input v-model="formData.is_completed" id="is_completed" type="checkbox" class="form-check-input" aria-label="Mark as completed" />
            <label for="is_completed" class="form-check-label glass-checkbox">Completed</label>
          </div>

          <!--Buttons-->
          <div class="d-flex gap-2">
            <button type="submit" class="btn btn-gradient flex-fill" :disabled="isFormInvalid">Add Task</button>
            <button type="button" class="btn btn-secondary flex-fill" @click="resetForm">Reset</button>
          </div>
        </form>

        <!--Live Preview Section-->
        <div v-if="formData.title" class="preview-box mt-4 p-3 glass-card">
          <h2 class="text-center mb-3">Task Preview</h2>
          <h2>{{ formData.title }}</h2>
          <p><strong>Description:</strong> {{ formData.description || 'No description' }}</p>
          <p><strong>Priority:</strong> <span :class="['badge', priorityBadge]">{{ formData.priority }}</span></p>
          <p><strong>Tags:</strong> {{ formData.tags || 'None' }}</p>
          <p><strong>Start Date:</strong> {{ formData.start_date || 'Not set' }}</p>
          <p><strong>End Date:</strong> {{ formData.end_date || 'Not set' }}</p>
          <p><strong>Recurring:</strong> {{ formData.recurring }}</p>
          <p><strong>Status:</strong> {{ formData.is_completed ? 'Completed': 'Pending' }}</p>
          <div v-if="progress > 0" class="progress mt-2">
            <div class="progress-bar" role="progressbar" :style="{width: progress + '%'}"></div>
          </div>
        </div>
      </div>
    </div>

    <!--Toast Notifications-->
    <transition name="slide-fade">
      <div v-if="toast.show" class="toast align-items-center position-fixed top-0 end-0 m-3 glass-toast" :class="toast.type">
        <div class="d-flex">
          <div class="toast-body">{{ toast.message }}</div>
          <button type="button" class="btn-close btn-close-white" @click="toast.show = false" aria-label="Close"></button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { useTaskStore } from '../store/taskStore';
import { mapActions } from 'pinia';

export default {
  data() {
    return {
      formData: {
        title: '',
        description: '',
        priority: 'low',
        tags: '',
        start_date: '',
        end_date: '',
        recurring: 'none',
        file: null,
        is_completed: false,
        user_id: 1,
      },
      toast: { show: false, message: '', type: 'success' },
      titleInvalid: false,
      startDateInvalid: false,
      endDateInvalid: false,
      darkMode: false,
      today: new Date().toISOString().split('T')[0],
    };
  },
  computed: {
    isFormInvalid(){
      return !this.formData.title.trim() || this.titleInvalid || this.startDateInvalid || this.endDateInvalid;
    },
    progress(){
      if (!this.formData.start_date || !this.formData.end_date) return 0;
      const start = new Date(this.formData.start_date);
      const end = new Date(this.formData.end_date);
      const now = new Date();
      if (now < start) return 0;
      if (now > end) return 100;
      return Math.round(((now - start) / (end - start)) * 100);
    },
    priorityBadge(){
      return {
        low: 'bg-success',
        medium: 'bg-warning text-dark',
        high: 'bg-danger'
      }[this.formData.priority];
    }
  },
  methods: {
    ...mapActions(useTaskStore, ['addTask', 'fetchTasks']),

    async handleAddTask() {
      this.titleInvalid = !this.formData.title.trim();

      if (this.formData.start_date && this.formData.end_date){
        const startDate = new Date(this.formData.start_date);
        const endDate = new Date(this.formData.end_date);
        if (startDate > endDate){
          this.startDateInvalid = this.endDateInvalid = true;
          return this.showToast('End date must be after start date', 'error');
        }
      }

      try{
        const taskToSend = { ...this.formData, user_id: this.formData.user_id || 1 };
        const newTask = await this.addTask(taskToSend);
        console.log('Task created:', newTask);

        this.showToast('Task Added Successfully!', 'success');
        this.resetForm();
        await this.fetchTasks();
      } catch (error){
        console.error('Error adding task:', error);
        this.showToast('Failed to add task', 'error');
      }
    },

    handleFileUpload(e){
      this.formData.file = e.target.files[0];
    },

    resetForm(){
      this.formData = {
        title: '',
        description: '',
        priority: 'low',
        tags: '',
        start_date: this.today,
        end_date: '',
        recurring: 'none',
        file: null,
        is_completed: false,
        user_id: 1,
      };
    },

    showToast(message, type){
      this.toast = { show: true, message, type };
      setTimeout(() => this.toast.show = false, 3000);
    },

    toggleDarkMode(){
      this.darkMode = !this.darkMode;
      localStorage.setItem('darkMode', JSON.stringify(this.darkMode));
    }
  },
  mounted(){
    this.formData.start_date = this.today;
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme) this.darkMode = JSON.parse(savedTheme);
  }
};
</script>

<style>
.container.dark {
  background: #1e272e;
  color: #f5f6fa;
}

/* Rest of your existing styles remain unchanged */

.slide-fade-enter-active, .slide-fade-leave-active {
  transition: all 0.5s ease;
}
.slide-fade-enter-from, .slide-fade-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.toast.success { background: rgba(40,167,69, 0.9); }
.toast.error { background: rgba(220,53,69, 0.9); }
.toast.info { background: rgba(23,162,184, 0.9); }
</style>
