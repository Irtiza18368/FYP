import { defineStore } from 'pinia';
import {ref, computed} from 'vue';

export const useTodoStore = defineStore('todo', () => {
    const tasks = ref([])
    const newTask = ref('')
    const filter = ref('all')
    const searchQuery = ref('')
    const editingIndex = ref(null)
    const editedTask = ref('')

    const reorderTasks = (newOrder) => {
        tasks.value = newOrder
        saveTasks()
    }

    //Loading the tasks
    const loadTasks = () => {
        const storedTasks = localStorage.getItem('todo-tasks')
        tasks.value = storedTasks ? JSON.parse(storedTasks) : []
    }

    const saveTasks = () => {
        localStorage.setItem('todo-tasks', JSON.stringify(tasks.value))
    }

    //Adding a new task
    const addTask = () => {
        if (newTask.value.trim()) {
            tasks.value.push({ 
                text: newTask.value, 
                completed: false,
                createdAt: new Date().toISOString()
            })
            newTask.value = ''
            saveTasks()
        }
    }

    const removeTask = (index) => {
        tasks.value.splice(index, 1)
        saveTasks()
    }

    const toggleTask = (index) => {
        tasks.value[index].completed = !tasks.value[index].completed
        saveTasks()
    }

    const startEditing = (index) => {
        editingIndex.value = index
        editedTask.value = tasks.value[index].text
    }

    const saveEdit = () => {
        if (editingIndex.value !== null && editedTask.value.trim()){
            tasks.value[editingIndex.value].text = editedTask.value.trim()
            editingIndex.value = null
            saveTasks()
        }
    }

    const cancelEdit = () => {
        editingIndex.value = null
    }

    const filteredTasks = computed(() => {
        let result = tasks.value
        if (filter.value === 'completed'){
            result = result.filter(task => task.completed)
        } else if (filter.value === 'active'){
            result = result.filter(task => !task.completed)
        }
        if (searchQuery.value){
            const query = searchQuery.value.toLowerCase()
            result = result.filter(task => task.text.toLowerCase().includes(query))
        }
        return result
    })

    const completedTasks = computed(() => tasks.value.filter(task => task.completed))

    const activeTasks = computed(() => tasks.value.filter(task => !task.completed))

    return {
        tasks,
        newTask,
        filter,
        searchQuery,
        editingIndex,
        editedTask,
        reorderTasks,
        loadTasks,
        addTask,
        removeTask,
        toggleTask,
        startEditing,
        saveEdit,
        cancelEdit,
        filteredTasks,
        completedTasks,
        activeTasks
    }
})