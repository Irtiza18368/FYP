<template>
    <div class="container py-5">
        <div class="card glass-card shadow-lg">
            <div class="card-header bg-success text-white text-center">
                <h2 class="mb-0">Completed Tasks</h2>
            </div>
            <div class="card-body">

                <!--Progression Bar-->
                <div class="mb-4">
                    <div class="d-flex justify-content-between">
                        <span>Completion Progress</span>
                        <span>{{ completionPercentage }}</span>
                    </div>
                    <div class="progress glass-progress">
                        <div class="progress-bar gradient-progress" role="progressbar" :style="{ width: completionPercentage + '%'}" :aria-valuenow="completionPercentage" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                </div>


                <!--Completed Task Listings-->
                <ul class="list-group">
                    <li v-for="task in completedTasks" :key="task.id" class="list-group-item glass-item d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center gap-3">
                            <span class="fw-bold">{{ task.title }}</span>
                            <span class="badge badge-custom">{{ task.category }}</span>
                        </div>
                        <div>
                            <button class="btn btn-warning btn-sm me-2 glass-button" @click="restoreTaskAndRedirect(task.id)">Restore Task</button>
                            <button class="btn btn-danger btn-sm me-2 glass-button" @click="deleteTask(task.id)">Delete Task</button>
                        </div>
                    </li>
                </ul>

                <div class="timeline mt-5">
                    <div v-for="(task, index) in sortedCompletedTasks" :key="task.id" class="timeline-item">
                        <div class="timeline-icon">
                            <i class="bi bi-check-circle-fill"></i>
                        </div>
                        <div class="timeline-content glass-timeline-card">
                            <h2 class="mb-1">{{ task.title }}</h2>
                            <small class="text-muted">Completed on: {{ formatDate(task.updated_at || task.completed_at || task.end_date) }}</small>
                        </div>
                    </div>
                </div>

                <div v-if="suggestedRestoreTask" class="modal-overlay">
                    <div class="modal glass-card p-4">
                        <h2 class="mb-3">Smart Suggestions</h2>
                        <p>Want to also restore <strong>"{{ suggestedRestoreTask.title }}"</strong> from the same category?</p>
                        <div class="d-flex justify-content-end gap-3">
                            <button class="btn btn-secondary" @click="dismissSuggestion">No</button>
                            <button class="btn btn-success" @click="acceptSuggestion">Yes, Restore</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!--Snackbar Notifications-->
        <div v-if="showSnackbar" class="snackbar glass-toast">{{ snackbarMessage }}</div>
    </div>
</template>

<script lang="js">

import { useTaskStore } from '../store/taskStore';
import { mapState, mapActions } from 'pinia';

export default {
    data(){
        return{
            showSnackbar: false,
            snackbarMessage: '',
            suggestedRestoreTask: null,
        };
    },
    computed:{
        ...mapState(useTaskStore, ['tasks']),
        
        completedTasks(){
            return this.tasks.filter((task) => task.is_completed);
        },

        sortedCompletedTasks(){
            return [...this.completedTasks].sort((a,b)=> new Date(b.end_date) - new Date(a.end_date));
        },
        
        completionPercentage(){
            if (this.tasks.length === 0) return 0;
            return Math.round((this.completedTasks.length / this.tasks.length) * 100);
        },
    },
    
    mounted(){
        this.fetchTasks();
    },
    
    methods:{
        ...mapActions(useTaskStore, ['fetchTasks', 'deleteTask', 'restoreTask']),

        formatDate(dateStr){
            const options = {year: 'numeric', month: 'short', day: 'numeric'};
            return new Date(dateStr).toLocaleDateString(undefined, options);
        },

        async acceptSuggestion(){
            if (this.suggestedRestoreTask){
                await this.restoreTask(this.suggestedRestoreTask.id);
                this.snackbarMessage = `"${this.suggestedRestoreTask.title}" also restored!`;
                this.showSnackbar = true;
                this.suggestedRestoreTask = null;

                setTimeout(()=> {
                    this.showSnackbar = false;
                    this.$router.push('/tasks');
                }, 3000);
            }
        },

        dismissSuggestion(){
            this.suggestedRestoreTask = null;
            this.$router.push('/tasks');
        },
        
        async restoreTaskAndRedirect(taskId){
            try{
                const restoredTask = this.tasks.find(task => task.id === taskId);
                await this.restoreTask(taskId);

                const relatedPending  = this.tasks.find(task => 
                    !task.is_completed && task.category === restoredTask.category && task.id !== taskId
                );

                this.snackbarMessage = 'Task restored successfully!';
                this.showSnackbar = true;
                setTimeout(() => {
                    this.showSnackbar = false;
                }, 3000);

                if(relatedPending){
                    this.suggestedRestoreTask = relatedPending;
                } else{
                    this.$router.push('/tasks');
                }
            } catch (error){
                console.error('Error restoring task:', error);
            }
        },
    },
};
</script>


<style>

.modal-overlay{
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.45);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
}

.modal {
    max-width: 400px;
    border-radius: 16px;
    backdrop-filter: blur(30px);
}

.glass-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(25px) saturate(180%);
    -webkit-backdrop-filter: blur(25px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 20px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    padding: 2rem;
    transition: transform 0.4s ease, box-shadow 0.4s ease;
}

.glass-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
}

.card-header {
    border-radius: 18px 18px 0 0;
    background: linear-gradient(135deg, #43a047, #66bb6a);
    color: white;
}

.glass-item {
    background: rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 14px;
    padding: 1rem;
    margin-bottom: 1rem;
    transition: all 0.3s ease-in-out;
}

.glass-item:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.01);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
}

.glass-progress {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 20px;
    height: 12px;
    overflow: hidden;
}

.gradient-progress {
    background: linear-gradient(90deg, #66bb6a, #43a047);
    border-radius: 20px;
    height: 100%;
    transition: width 0.6s ease;
}

.glass-button {
    background: rgba(76, 175, 80, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.25);
    color: #fff;
    font-weight: 500;
    padding: 8px 16px;
    border-radius: 12px;
    font-size: 0.9rem;
    transition: all 0.25s ease-in-out;
}

.glass-button:hover {
    background: rgba(76, 175, 80, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
}

.badge-custom {
    background: linear-gradient(135deg, #66BB6A, #388e3c);
    color: white;
    border-radius: 12px;
    padding: 6px 14px;
    font-size: 0.8rem;
    font-weight: 600;
}

.snackbar {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 14px 26px;
    border-radius: 16px;
    color: white;
    background: rgba(76, 175, 80, 0.95);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
    z-index: 1050;
    animation: slide-up 0.4s ease-out;
}

@keyframes slide-up{
    from{
        transform: translate(-50%, 100%);
    }
    to{
        transform: translate(-50%, 0);
    }
}

@media (max-width: 576px) {
    .card {
        padding: 1.5rem;
    }

    .list-group-item {
        flex-direction: column;
        align-items: flex-start;
    }

    .list-group-item > div {
        width: 100%;
    }

    .list-group-item > div > div {
        flex-direction: column;
        gap: 10px;
    }

    .glass-button {
        width: 100%;
        margin-bottom: 10px;
    }
}

.timeline{
    position: relative;
    margin-left: 2rem;
    padding-left: 2rem;
    border-left: 2px solid rgba(255, 255, 255, 0.2);
}

.timeline-item{
    position: relative;
    margin-bottom: 2rem;
}

.timeline-icon {
    position: absolute;
    left: -1.15rem;
    top: 0.1rem;
    width: 2rem;
    height: 2rem;
    background: linear-gradient(135deg, #66BB6A, #388e3c);
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    font-size: 1.2rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 1;
}

.glass-timeline-card {
    background: rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 1rem;
    border-radius: 16px;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
}

.glass-timeline-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
}
</style>