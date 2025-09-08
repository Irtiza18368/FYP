<template>
  <div class="container mt-5">
    <div class="card-body">

      <!--Inactivity Timer-->
      <div class="mt-4 text-center">
        <h2 class="text-muted">Inactivity Time: <span class="text-danger">{{ dashboardStore.inactivityTime }}s</span></h2>
      </div>

      <!--Hero Section-->
      <transition name="fade">
        <div class="hero-section p-5 text-white rounded glass-background">
          <div class="animated-background"></div>
          <h2 class="display-4 greeting-text">{{ dashboardStore.greeting }}, {{ dashboardStore.username }}!</h2>
          <p class="mt-3 fs-5">
            You have {{ dashboardStore.upcomingDeadlines.length }} upcoming deadlines
          </p>
        </div>
      </transition>

      <!--Motivational Quote-->
      <transition name="fade-quote" mode="out-in">
        <div class="card glass-background mt-4 text-center p-4" :key="dashboardStore.motivationalQuote">
          <h2 class="gradient-text">"{{ dashboardStore.motivationalQuote }}"</h2>
        </div>
      </transition>

      <!--Upcoming deadlines section-->
      <div class="row mt-5">
        <div class="col-md-12">
          <div class="card glass-background shadow-sm">
            <div class="card-body">
              <h2 class="card-title">Upcoming Deadlines</h2>
              <ul class="list-group">
                <li v-for="task in dashboardStore.upcomingDeadlines" :key="task.id" class="list-group-item">
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{{ task.title }}</strong> - Due Date: {{ dashboardStore.formatDate(task.end_date) }}
                      <span v-if="task.dueTime">at {{ dashboardStore.formatTime(task.dueTime) }}</span>

                      <!-- Progress Bar -->
                      <div class="progress mt-2" style="height: 6px;">
                        <div class="progress-bar gradient-progress" role="progressbar" :style="{width: `${100 - (task.daysLeft / task.totalDays) * 100}%`}"></div>
                      </div>
                    </div>
                    
                    <!--Badge with urgency-->
                    <span :class="['badge', {
                      'bg-danger': task.daysLeft <= 0,
                      'bg-warning text-dark': task.daysLeft > 0 && task.daysLeft <= 3,
                      'bg-success': task.daysLeft > 3,
                    }]"
                    >
                    {{ task.daysLeft <= 0 ? 'Due!' : `${task.daysLeft} days left` }}
                    </span>
                  </div>

                  <!--Quick Actions-->
                  <div class="mt-2 d-flex gap-2">
                    <button class="btn btn-sm btn-success" @click="markAsDone(task)">✔</button>
                    <button class="btn btn-sm btn-outline-warning" @click="snoozeTask(task)">⏰</button>
                    <button class="btn btn-sm btn-outline-info" @click="editTask(task)">✏️</button>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!--Feature Showcase-->
      <div class="row mt-5">
        <div class="col-md-4 mb-4" v-for="feature in features" :key="feature.title">
          <div class="card h-100">
            <div class="card-body text-center">
              <i :class="feature.icon + ' fs-1 gradient-text'"></i>
              <h2 class="card-title mt-3">{{ feature.title }}</h2>
              <p class="card-text">{{ feature.text }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <!--Navigational Buttons-->
      <div class="mt-5 text-center">
        <router-link to="/tasks" class="btn btn-outline-primary me-2 glass-button">Go to Tasks</router-link>
        <router-link to="/manage-task" class="btn btn-outline-primary me-2 glass-button">Go to Manage Task</router-link>
        <router-link to="/add-task" class="btn btn-outline-danger me-2 glass-button">Go to Add task</router-link>
        <router-link to="/settings" class="btn btn-outline-success me-2 glass-button">Go to Settings</router-link>
        <router-link to="/calendar" class="btn btn-outline-info me-2 glass-button">Go to Calendar</router-link>        
      </div>
    </div>
  
    <!--Footer-->
    <footer class="mt-5 py-4 glass-background text-center">
      <p class="mb-0">&copy; 2025 AI Deadline Reminder. All rights reserved</p>
    </footer>

    <!--Inactivity Overlay-->
    <div v-if="showInactivityModal" class="inactivity-overlay d-flex flex-column justify-content-center align-items-center">
      <div class="inactivity-modal glass-background p-5 text-center">
        <h2 class="mb-4">You've been inactive</h2>
        <p class="mb-4">Do you want to continue your session?</p>
        <button @click="continueSession" class="btn btn-success me-3">Continue</button>
        <button @click="logout" class="btn btn-danger">Logout</button>
      </div>
    </div>

    <!--Toasts-->
    <transition-group name="toast" tag="div">
      <div v-for="(toast, index) in toasts" :key="index">
        <Toast :message="toast.message" />
      </div>
    </transition-group>
  </div>
  <Chatbot />
</template>

<script lang="js">

import Toast from '../components/Toast.vue';
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useDashboardStore } from '../store/Dashboard';
import Chatbot from '../components/Chatbot.vue';
import { useRouter } from 'vue-router';

export default{
  name: 'Home',
  components: {Toast, Chatbot},
  setup(){
    const dashboardStore = useDashboardStore();
    const router = useRouter();
    const showInactivityModal = ref(false);
    const toasts = ref([]);
    const themeInterval = ref(null);

    let autoLogoutTimer = null;
    
    dashboardStore.setGreeting();
    dashboardStore.fetchUpcomingDeadlines();    
    
    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll'];

    const setupEventListeners = () => {
      activityEvents.forEach(event => 
        window.addEventListener(event, dashboardStore.resetInactivityTimer)
      );
    };

    const removeEventListener = () => {
      activityEvents.forEach(event => 
        window.removeEventListener(event, dashboardStore.resetInactivityTimer)
      );
    };

    const continueSession = () => {
      showInactivityModal.value = false;
      dashboardStore.resetInactivityTimer();
      clearTimeout(autoLogoutTimer);
      showToast('Welcome back');
    };

    const checkDeadlines = () => {
      dashboardStore.upcomingDeadlines.forEach(task => {
        if (task.daysLeft <= 1){
          showToast(`Deadline soon: "${task.title}"`);
        }
      });
    };

    const logout = () => {
      clearTimeout(autoLogoutTimer);
      showToast('Logged out');
    };

    const showToast = (message) => {
      toasts.value.push({message});
      setTimeout(() => {
        toasts.value.shift();
      }, 3000);
    };

    const markAsDone = (task) => {
      dashboardStore.removeTask(task.id);
      showToast(`Task "${task.title}" marked as done ✔`);
    }

    const snoozeTask = (task) => {
      task.daysLeft += 1;
      showToast(`Task "${task.title}" snoozed ⏰ (1 day extra)`);
    }

    const editTask = (task) => {
      showToast(`Edit task "${task.title}" ✏️`);
    }


    onMounted(()=>{
      dashboardStore.startInactivityTimer();
      dashboardStore.startQuoteRotation();
      setupEventListeners();
      checkDeadlines();

      themeInterval.value = setInterval(() => {
        dashboardStore.setGreeting();
      }, 3600000);
    });

    onUnmounted(()=> {
      dashboardStore.stopInactivityTimer();
      dashboardStore.stopQuoteRotation();
      removeEventListener();
      clearInterval(themeInterval.value);
    });

    watch(
      () => dashboardStore.inactivityTime,
      (newTime) => {
        if (newTime >= 300){
          showInactivityModal.value = true;

          autoLogoutTimer = setTimeout(() => {
            logout();
          }, 30000);
        }
      }
    );

    const features = [
      { icon: "bi bi-calendar-check", title: "Smart Reminders", text: "Get timely reminders for your tasks and deadlines." },
      { icon: "bi bi-list-task", title: "Task Management", text: "Easily create, edit and organize your tasks." },
      { icon: "bi bi-clock-history", title: "Progress Tracking", text: "Track your progress with visual indicators." }
    ]
    
    return{
      dashboardStore,
      showInactivityModal,
      continueSession,
      logout,
      toasts,
      showToast,
      themeInterval,
      markAsDone,
      snoozeTask,
      editTask,
      features
    };
  },
};
</script>

<style>
.toast-enter-active, .toast-leave-active{
  transition: all 0.4s ease;
}

.toast-enter-from{
  opacity: 0;
  transform: translateY(20px);
}

.toast-leave-to{
  opacity: 0;
  transform: translateY(-20px);
}

.progress-bar{
  border-radius: 10px;
  transition: width 0.6s ease;
}

.list-group-item .btn-sm{
  padding: 2px 8px;
  font-size: 0.8rem;
}

@keyframes float{
  0%{ transform: translateY(0px);}
  50%{transform: translateY(-10px);}
  100%{transform: translateY(0px);}
}

@keyframes pulse{
  0%{ transform: scale(1);}
  50%{transform: scale(1.05);}
  100%{transform: scale(1);}
}

.fade-quote-enter-active, .fade-quote-leave-active{
  transition: opacity 0.5s ease;
}

.fade-quote-enter-from, .fade-quote-leave-to{
  opacity: 0;
}

.inactivity-overlay{
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backdrop-filter: blur(10px) brightness(0.5);
  background: rgba(0, 0, 0, 0.5);
  z-index: 1050;
}

.inactivity-modal{
  max-width: 400px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
}

.hero-section{
  position: relative;
  background: v-bind('dashboardStore.themeGradient');
  transition: background 0.5s ease;
}

.list-group-item{
  padding: 1rem 1.5rem;
  margin-bottom: 0.5rem;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.list-group-item:hover{
  transform: translateX(5px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.list-group-item div{
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.list-group-item span.text-muted{
  color: #6c757d;
  font-size: 0.9rem;
}

.text-danger{
  font-weight: 700;
  font-size: 1.5rem;
}

/* Glassmorphism Effect */
.glass-background{
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

/* Neuromorphic Button */
.glass-button{
  background: rgba(255,255,255,0.2);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 10px;
  color: #333;
  font-weight: 600;
  padding: 10px 22px;
  transition: all 0.3s ease;
}

.glass-button:hover{
  background: rgba(255, 255, 255, 0.35);
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
}

/* Hero Greeting Text */
.greeting-text{
  font-size: 3rem;
  font-weight: bold;
  color: #fff;
  text-shadow: 1px 2px 10px rgba(0, 0, 0, 0.4);
}

/* Gradient Text */
.gradient-text{
  background: linear-gradient(135deg, #fc466b, #3f5efb);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: bold;
}

.gradient-progress{
  background: linear-gradient(135deg, #6a11cb, #2575fc);
}

/* Smooth Fade */
.fade-enter-active, .fade-leave-active{
  transition: opacity 0.5s ease;
}

.fade-enter, .fade-leave-to{
  opacity: 0;
}

/* Task Card Hover */
.card{
  border-radius: 18px;
  background: #ffffff;
  border: none;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover{
  transform: translateY(-8px);
  box-shadow: 0 18px 30px rgba(0, 0, 0, 0.1);
}

.card:hover::before{
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: inherit;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0) 70%);
  opacity: 0.3;
  transition: opacity 0.3s ease;
}

/* Footer section */
footer{
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(10px);
  border-radius: 10px;
  color: #333;
  font-size: 0.9rem;
}

/* Task Badge */
.badge{
  background: linear-gradient(135deg, #fc466b, #3f5efb);
  color: #fff;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 30px;
  font-size: 0.9rem;
}

/* Animated Background for Hero Section */
.animated-background{
  position: absolute;
  inset: 0;
  opacity: 0.7;
  z-index: -1;
  background: linear-gradient(135deg, #667eea, #764ba2);
  animation: moveBackground 12s ease-in-out infinite alternate;
  border-radius: 20px;
  transition: background 0.5s ease;
}

@keyframes moveBackground{
  0% {
    transform: scale(1);
  }
  100%{
    transform: scale(1.08);
  }
}
</style>