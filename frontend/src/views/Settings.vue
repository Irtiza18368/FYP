<template>
  <div class="container py-5">
    <div class="card shadow-lg glass-card">
      <div class="card-header bg-primary text-white text-center">
        <h2 class="card-title mb-0">Settings</h2>
      </div>
      <div class="card-body">
        <form @submit.prevent="saveSettings">

          <!--Notification Toggling-->
          <div class="mb-3 d-flex justify-content-between align-items-center">
            <label class="form-label fw-bold mb-0 d-flex align-items-center">Notifications</label>
            <label class="switch">
              <input v-model="settings.notifications.enabled" type="checkbox" id="notifications" @change="trackChange" />
              <span class="slider"></span>
             </label>
          </div>

          <!--Notification Type-->
          <transition name="fade-slide">
            <div v-if="settings.notifications.enabled" class="mb-3 fade-in">
              <label class="form-label fw-bold d-flex align-items-center">Notification Type</label>
              <select v-model="settings.notifications.type" class="form-select glass-input" @change="trackChange">
                <option value="email">Email</option>
                <option value="push">Push Notification</option>
                <option value="both">Both</option>
              </select>
            </div>
          </transition>

          <!--Reminder Frequency-->
          <div v-if="settings.notifications.enabled" class="mb-3 fade-in">
            <label class="form-label fw-bold d-flex align-items-center">Reminder Frequency</label>
            <select v-model="settings.notifications.frequency" class="form-select glass-input">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <!--Preferred Reminder Time-->
          <div v-if="settings.notifications.enabled && settings.notifications.frequency === 'custom'" class="mb-3 fade-in">
            <label class="form-label fw-bold d-flex align-items-center">Preferred Reminder Time</label>
            <input v-model="settings.notifications.time" type="time" class="form-control glass-input" />
          </div>

          <!--Save Button-->
          <button type="submit" :class="['btn btn-gradient w-100 mt-4',{'unsaved-button': unsavedChanges}]">Save Settings</button>
        </form>
      </div>
    </div>

    <!--Snackbar Notification-->
    <div v-if="snackbar.message" class="snackbar glass-toast" @click="dismissSnackbar">
      <span>{{ snackbar.message }}</span>
      <div class="snackbar-progress" :style="{animationDuration: snackbar.duration + 'ms'}"></div>
    </div>
  </div>
</template>

<script lang="js">

import { useSettingsStore } from '../store/SettingsStore';
import { ref } from 'vue';

export default {
  setup(){
    const settings = useSettingsStore();
    const snackbar = ref({
      message: '',
      duration: 3000,
    });

    const snackbarQueue = ref([]);
    let snackbarTimer = null;
    
    settings.loadSettings();

    const showSnackbar = (message, duration = 3000) => {
      if (snackbar.value.message){
        snackbarQueue.value.push({message, duration});
        return;
      }

      snackbar.value.message = message;
      snackbar.value.duration = duration;

      snackbarTimer = setTimeout(()=> {
        dismissSnackbar();
      }, duration);
    };

    const dismissSnackbar = () => {
      clearTimeout(snackbarTimer);
      snackbar.value.message = '';

      setTimeout(()=> {
        if (snackbarQueue.value.length > 0){
          const next = snackbarQueue.value.shift();
          showSnackbar(next.message, next.duration);
        }
      }, 300);
    };

    const unsavedChanges = ref(false);

    const trackChange = () => {
      unsavedChanges.value = true;

      if (settings.notifications.enabled && (settings.notifications.type === 'push' || settings.notifications.type === 'both')){
        if(Notification.permission !== 'granted'){
          Notification.requestPermission().then(permission => {
            if (permission !== 'granted'){
              settings.notifications.type = 'email';
              showSnackbar("Push notifications permission denied. Reverted to email notifications.");
            }
          });
        }
      }
    };

    const saveSettings = () => {
      settings.saveSettings();
      showSnackbar("Settings saved!", 3000);
      unsavedChanges.value = false;
    };

    return{
      settings,
      snackbar,
      showSnackbar,
      dismissSnackbar,
      saveSettings,
      unsavedChanges,
      trackChange
    };
  },
};

</script>

<style>

.unsaved-button{
  animation: floatWobble 2s ease-in-out infinite;
  box-shadow: 0 0 12px rgba(255, 255, 255, 0.3), 0 0 24px rgba(142, 45, 226, 0.4);
}

@keyframes floatWobble {
  0% { transform: translateY(0) rotate(0deg);}
  25% { transform: translateY(-4px) rotate(-1deg);}
  50% { transform: translateY(0px) rotate(0deg);}
  75% { transform: translateY(-4px) rotate(1deg);}
  100% { transform: translateY(0) rotate(0deg);}
}

body{
  background: linear-gradient(270deg, #8e2de2, #4a00e0);
  background-size: 400% 400%;
  animation: backgroundMove 20s ease infinite;
}

@keyframes backgroundMove{
  0% { background-position: 0% 50%;}
  50% {background-position: 100% 50%;}
  100% {background-position: 0% 50%;}
}

/* Glass-Neumorphic Card */
.glass-card {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  padding: 2rem;
  transition: all 0.3s ease;
}

.glass-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.25);
}


/* Inputs with glass and neumorphic touch */
.glass-input {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: #f5f5f5;
  padding: 12px;
  font-size: 1rem;
  box-shadow: inset 2px 2px 6px rgba(0, 0, 0, 0.2),
              inset -2px -2px 6px rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease-in-out;
}


.glass-input:focus {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 12px rgba(157, 80, 187, 0.4);
  outline: none;
}


/* Gradient Button */
.btn-gradient {
  background: linear-gradient(135deg, #8e2de2, #4a00e0);
  border: none;
  color: #fff;
  padding: 12px;
  border-radius: 14px;
  box-shadow: 0 6px 14px rgba(142, 45, 226, 0.35);
  transition: all 0.25s ease;
}

.btn-gradient:hover {
  background: linear-gradient(135deg, #4a00e0, #8e2de2);
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(142, 45, 226, 0.45);
}


/* Modern Toggle Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
}

.switch input{
  opacity: 0;
  width: 0;
  height: 0;
}


.slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0;
  right: 0; bottom: 0;
  background-color: #ccc;
  border-radius: 34px;
  transition: 0.4s;
}

.slider::before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: #fff;
  transition: 0.4s;
  border-radius: 50%;
}


input:checked + .slider {
  background-color: #8e2de2;
}

input:checked + .slider::before {
  transform: translateX(24px) scale(1.2);
  transition: transform 0.3s ease, background-color 0.3s ease;
}

/* Snackbar Toast */
.snackbar {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 14px 20px;
  border-radius: 12px;
  color: #fff;
  background: rgba(56,239, 125, 0.9);
  backdrop-filter: blur(6px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 999;
  animation: fadeInOut 3s ease-in-out;
}

/* Snackbar progress bar */
.snackbar-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 4px;
  background: rgba(255, 255, 255, 0.5);
  width: 100%;
  border-radius: 0 0 12px 12px;
  animation: progress 3s linear;
  animation-name: progress;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

/* Animations */
@keyframes fadeInOut{
  0% { opacity: 0; transform: translateY(10px);}
  20% {opacity: 1; transform: translateY(0);}
  80% {opacity: 1;}
  100% {opacity: 0; transform: translateY(10px);}
}

@keyframes progress{
  0%{width: 100%;}
  100%{width: 0%;}
}

/* Fade In Animation */
.fade-in {
  opacity: 0;
  animation: fadeIn 0.4s ease-in forwards;
}

@keyframes fadeIn{
  from{opacity: 0; transform: translateY(8px);}
  to {opacity: 1; transform: translateY(0);}
}

/* Responsive adjustments */
@media (max-width: 576px) {
  .glass-card {
    padding: 1.5rem;
  }

  .glass-input {
    padding: 10px;
    font-size: 0.95rem;
  }

  .btn-gradient {
    padding: 10px;
    font-size: 0.95rem;
  }

  .snackbar {
    width: 90%;
    text-align: center;
  }
}

select:focus{
  animation: pulse 0.3s ease;
}

@keyframes pulse{
  0% { transform: scale(1);}
  50% { transform: scale(1.02);}
  100% {transform: scale(1);}
}

.fade-slide-enter-active, .fade-slide-leave-active{
  transition: all 0.4s ease;
}

.fade-slide-enter-from, .fade-slide-leave-to{
  opacity: 0;
  transform: translateY(10px);
}

.fade-slide-enter-to, .fade-slide-leave-from{
  opacity: 1;
  transform: translateY(0px);
}
</style>