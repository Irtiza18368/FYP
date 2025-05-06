<template>
  <!--Main container filling the viewport height-->
  <div class="d-flex flex-column vh-100 bg-light">
    
    <!--Dynamic Background-->
    <div class="dynamic-background"></div>

    <!--Navbar with Glassmorphism Effect-->
    <nav class="navbar navbar-expand-lg shadow-sm glass-navbar">
      <div class="container-fluid">
        <!--Importing and including custom navbar component-->
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

//Importing the Navbar component
import Navbar from './components/Navbar.vue';

export default {
  components: {
    Navbar, //Registering Navbar for use.
  },
};
</script>

<style>

/* Fixed background covering the whole page with gradient animation */
.dynamic-background{
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #6a11cb, #2575fc);
  z-index: -1; /* Putting it behind all other elements */
  animation: gradientAnimation 10s ease finite;
}

/* Keyframes for Gradient Animation */
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

/* Navbar styling with glassmorphism (frosted glass look) */
.glass-navbar{
  background: rgba(255,255,255,0.2);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255,255,255,0.2);
  transition: all 0.3s ease-in-out;
}

/* Enhanced glass effect on hover */
.glass-navbar:hover{
  background: rgba(255,255,255,0.3);
  backdrop-filter: blur(15px);
}

/* Fade-in animation for the main content */
.fade-in{
  opacity: 0;
  animation: fadeIn 0.6s ease-in-out forwards;
}

/* Keyframes for the fade-in effect */
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

/* Custom scrollbar styles for a better UI experience */
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

/* Default navbar styling and smooth transitions */
.navbar{
  width: 100%;
  transition: background 0.3s ease-in-out, backdrop-filter 0.3s ease-in-out;
}

/* Global font family using Google Fonts Poppins */
body{
  font-family: 'Poppins', sans-serif;
}
</style>