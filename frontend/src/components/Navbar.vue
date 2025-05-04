<template>
    <!--Main Navbar-->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark sticky-top glass-navbar" data-bs-theme="dark" @mouseenter="showParticles" @mouseleave="destroyParticles">
        <div class="container-fluid">

            <!--Logo and Brand Name-->
            <router-link class="navbar-brand d-flex align-items-center" to="/">
                <i class="bi bi-alarm fs-3 me-2"></i>
                <span class="neon-text">AI powered Deadline Reminder</span>
            </router-link>

            <!--Hamburger Menu button-->
            <button 
                class="navbar-toggler border border-info" 
                type="button" 
                data-bs-toggle="collapse" 
                data-bs-target="#navbarNav" 
            >
                <span class="navbar-toggler-icon"></span>
            </button>

            <!--Collapsible Navbar Content-->
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto gap-lg-3">
                    <!--Looping through links-->
                    <li class="nav-item" v-for="link in links" :key="link.name">
                        <router-link :to="link.path" class="nav-link d-flex align-items-center">
                            <!--Inline SVG Icon-->
                            <svg :class="link.iconClass" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                                <path :d="link.iconPath" />
                            </svg>
                            <span class="ms-1">{{ link.name }}</span> 
                        </router-link>
                    </li>
                </ul>
            </div>            
        </div>
    </nav>
</template>

<script lang="js">

export default{
    name: 'Navbar',
    data(){
        return{
            links: [
                {name: 'Home', path: '/', iconClass: 'me-1', iconPath: 'M8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4.5a.5.5 0 0 0 .5-.5v-4h2v4a.5.5 0 0 0 .5.5H14a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354l-6-6zM2.5 14V7.707l5.5-5.5 5.5 5.5V14H10v-4a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5v4H2.5z'},
                {name: 'Tasks', path: '/tasks', iconClass: 'me-1', iconPath: 'M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H4zm2 3a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 6 4zm3 0a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 9 4zm3 0a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5z'},
                {name: 'To-do', path: '/todo', iconClass: 'me-1', iconPath: 'M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z'},
                {name: 'Add task', path: '/add-task', iconClass: 'me-1', iconPath: 'M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z'},
                {name: 'Manage Task', path: '/manage-task', iconClass: 'me-1', iconPath: 'M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z'},
                {name: 'Calendar', path: '/calendar', iconClass: 'me-1', iconPath: 'M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM2 2a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H2z'},
                {name: 'Settings', path: '/settings', iconClass: 'me-1', iconPath: 'M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z'},
            ],
        };
    },
};
</script>

<style scoped>

.glass-navbar{
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(12px);
    animation: blurPulse 8s ease-in-out infinite;
}

@keyframes blurPulse{
    0%, 100% { backdrop-filter: blur(10px);}
    50% { backdrop-filter: blur(20px);}
}

.neon-text{
    color: #fff;
    text-shadow: 0 0 5px #00fffc, 0 0 10px #00fffc, 0 0 20px #00fffc;
}

.nav-link::before{
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    border: 2px solid transparent;
    border-radius: 8px;
    background: linear-gradient(45deg, #00fffc, #ff00ff, #00fffc);
    background-size: 400% 400%;
    animation: pulseBorder 8s linear infinite;
    z-index: -1;
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
}

@keyframes pulseBorder{
    0% {background-position: 0% 50%;}
    50% {background-position: 100% 50%;}
    100%{background-position: 0% 50%;}
}

.nav-link:hover{
    color: #00fffc !important;
    transform: translateY(-2px);
}

.dropdown-menu{
    box-shadow: 0 0 10px rgba(0, 255, 252, 0.2);
}

.dropdown-item:hover{
    background-color: rgba(0, 255, 252, 0.2) !important;
    color: #00fffc !important;
}

.nav-link:hover .rounded-circle{
    border-color: #00fffc !important;
    box-shadow: 0 0 10px rgba(0, 255, 252, 0.7);
    transform: scale(1.1);
}

.nav-link:hover svg{
    transform: translateX(5px) scale(1.1);
    fill: #00fffc;
}

.nav-link, .nav-link svg, .nav-link .rounded-circle{
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease-in-out;
}

.router-link-exact-active{
    border-bottom: 2px solid #00fffc;
    animation: underlineGlow 1.5s ease infinite;
}

@keyframes underlineGlow{
    0%, 100% {border-color: #00fffc;}
    50% {border-color: #ff00ff;}
}
</style>