import { defineStore } from "pinia";

export const useTaskStore = defineStore('task', {
    state: () => ({
        tasks: [],
        timer: null,
    }),
    actions: {
        async fetchTasks(){
            try{
                const response = await fetch('http://localhost:8000/api/tasks');
                const data = await response.json();
                this.tasks = data.map(task => ({
                    ...task,
                    subtasks: task.subtasks || [],
                    remainingTime: this.calculateRemainingTime(task.end_date),
                    startDate: task.start_date,
                    dueDate: task.end_date,
                    priorityClass: this.calculatePriority(task.end_date)
                }));
            } catch (error){
                console.error('Error fetching tasks:', error);
            }
        },

        calculateRemainingTime(dueDate){
            const now = new Date();
            const due = new Date(dueDate);
            const diff = due - now;
            if (diff <= 0) return null;

            const days = Math.floor(diff / (1000 * 60 * 60 *24));
            const hours = Math.floor((diff % (1000 * 60 * 60 *24))/ (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60))/ (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60))/ (1000));
            
            return `${days}d ${hours}h ${minutes}m ${seconds}s`;
        },

        startRealTimeTimer(){
            this.timer = setInterval(() => {
                this.tasks = this.tasks.map(task => ({
                    ...task,
                    remainingTime: this.calculateRemainingTime(task.end_date),
                }));
            }, 1000);
        },

        stopRealTimeTimer(){
            if (this.timer){
                clearInterval(this.timer);
                this.timer = null;
            }
        },

        async deleteTask(taskId){
            try{
                const response = await fetch(`http://localhost:8000/api/tasks/${taskId}/`, {
                    method: 'DELETE',
                });
                if(!response.ok){
                    throw new Error('Failed to delete task');
                }
                this.tasks = this.tasks.filter(task => task.id !== taskId);
            } catch (error){
                console.error('Error deleting task:', error);
            }
        },

        calculatePriority(dueDate){
            if (!dueDate) return '';

            const now = new Date();
            const due = new Date(dueDate);
            const diffInDays = Math.floor((due - now) / (1000 * 60 * 60 * 24));

            if (diffInDays < 0) return 'priority-high';
            if (diffInDays <= 1) return 'priority-high';
            if (diffInDays <= 3) return 'priority-medium';
            return 'priority-low';
        },

        async markTaskAsComplete(task){
            try{
                task.is_completed = true;
                const response = await fetch(`http://localhost:8000/api/tasks/${task.id}/`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(task),
                });
                if (!response.ok){
                    throw new Error('Failed to mark task as complete');
                }
                await this.fetchTasks();
            } catch (error){
                console.error('Error marking task as complete:', error);
            }
        },

        async restoreTask(taskId){
            try{
                const task = this.tasks.find(task => task.id === taskId);
                if (task){
                    task.is_completed = false;
                    const response = await fetch(`http://localhost:8000/api/tasks/${taskId}/`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(task),
                    });
                    if (!response.ok){
                        throw new Error('Failed to restore task');
                    }
                    await this.fetchTasks();
                }
            } catch (error){
                console.error('Error restoring task:', error);
            }
        },

        async addTask(taskData){
            try{
                const response = await fetch('http://localhost:8000/api/tasks/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(taskData),
                });
                
                if (!response.ok){
                    throw new Error('Failed to add task');
                }
                const newTask = await response.json();
                this.tasks.push(newTask);
                return newTask;
            } catch (error){
                console.error('Error adding task:', error);
                throw error;
            }
        },

        async saveTask({taskId, updatedTask}){
            try{

                const payload = {
                    ...updatedTask,
                    start_date: updatedTask.startDate || null,
                    end_date: updatedTask.dueDate || null,
                };

                const response = await fetch(`http://localhost:8000/api/tasks/${taskId}/`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });
                if (!response.ok){
                    throw new Error('Failed to update task');
                }
                await this.fetchTasks();
            } catch(error){
                console.error('Error updating task:', error);
            }
        },

        addEvent(event){
            console.log('Event added to calendar:', event);
        },
    },
});