<template>
  <div class="d-flex flex-column vh-100 bg-light">
    <!--Dynamic Background-->
    <div class="dynamic-background"></div>

    <!--Navbar with Glassmorphism Effect-->
    <nav class="navbar navbar-expand-lg shadow-sm glass-navbar">
      <div class="container-fluid">
        <Navbar />
      </div>
    </nav>

    <!--Main content with smooth fade-in using bootstrap-->
    <main class="flex-grow-1 p-3 overflow-auto bg-white border-top fade-in custom-scrollbar">
      <router-view />
    </main>
    
  </div>
</template>

<script lang="js">
import Navbar from './components/Navbar.vue';

export default {
  components: {
    Navbar,
  },
};
</script>

<style>

.dynamic-background{
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #6a11cb, #2575fc);
  z-index: -1;
  animation: gradientAnimation 10s ease finite;
}

@keyframes gradientAnimation{
  0%{
    background-position: 0% 50%;
  }
  50%{
    background-position: 100% 50%;
  }
  100%{
    background-position: 0% 50%;
  }
}

.glass-navbar{
  background: rgba(255,255,255,0.2);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255,255,255,0.2);
  transition: all 0.3s ease-in-out;
}

.glass-navbar:hover{
  background: rgba(255,255,255,0.3);
  backdrop-filter: blur(15px);
}

.fade-in{
  opacity: 0;
  animation: fadeIn 0.6s ease-in-out forwards;
}

@keyframes fadeIn{
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to{
    opacity: 1;
    transform: translateY(0);
  }
}

.custom-scrollbar::-webkit-scrollbar{
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track{
  background: rgba(0,0,0,0.1);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb{
  background: rgba(0,123,255,0.6);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover{
  background: rgba(0,123,255,0.8);
}

.navbar{
  width: 100%;
  transition: background 0.3s ease-in-out, backdrop-filter 0.3s ease-in-out;
}

body{
  font-family: 'Poppins', sans-serif;
}
</style>