<template>
    <div class="todo-container">
      <h2 class="text-2xl font-semibold mb-4">📝 To-Do List</h2>
      
      <!--Search and Filtering-->
      <div class="controls-section">
        <input v-model="todoStore.searchQuery" type="text" placeholder="Search tasks" class="search-input">
        <select v-model="todoStore.filter" class="filter-select">
          <option value="all">All Tasks</option>
          <option value="active">Active Tasks</option>
          <option value="completed">Completed Tasks</option>
        </select>
      </div>

      <!--Add Task section-->
      <div class="input-section">
        <input
          v-model="todoStore.newTask"
          @keyup.enter="todoStore.addTask"
          type="text"
          placeholder="Add a new task..."
          class="todo-input"
        />
        <button @click="todoStore.addTask" class="add-btn">Add</button>
      </div>
      
      <!--Adding task section-->
      <draggable :list="todoStore.filteredTasks" tag="ul" item-key="createdAt" class="task-list" @end="onDragEnd" handle=".drag-handle" :disabled="todoStore.filter !== 'all' || todoStore.searchQuery" ghost-class="sortable-ghost" chosen-class="sortable-chosen" animation="200">
        <template #item="{element: task, index}">
          <li class="task-item" :class="{ 'editing': todoStore.editingIndex === index}">
            <!--Drag Handle-->
            <span class="drag-handle">☰</span>

            <!--View Mode-->
            <template v-if="todoStore.editingIndex !== index">
              <div class="task-content">
                <input type="checkbox" :checked="task.completed" @change="todoStore.toggleTask(index)" class="task-checkbox">
                <span :class="{ done: task.completed }" @dblclick="todoStore.startEditing(index)">
                  {{ task.text }}
                  <span class="task-date">
                    {{ formatDate(task.createdAt) }}
                  </span>
                </span>
              </div>
              <div class="task-actions">
                <button @click="todoStore.startEditing(index)" class="edit-btn">✏️</button>   
                <button @click="todoStore.removeTask(index)" class="delete-btn">❌</button>
              </div>
            </template>

            <!--Edit Mode-->
            <div v-else class="edit-section">
              <input v-model="todoStore.editedTask" @keyup.enter="todoStore.saveEdit" @keyup.escape="todoStore.cancelEdit" type="text" class="edit-input">
              <div class="edit-actions">
                <button @click="todoStore.saveEdit" class="save-btn">💾</button>
                <button @click="todoStore.cancelEdit" class="cancel-btn">❎</button>
              </div>
            </div>
          </li>
        </template>
      </draggable>

      <!--Show statistics-->
      <div class="stats mt-4 text-sm text-gray-600">
        <span> Total Tasks: {{ todoStore.tasks.length }}</span>
        <span>Active Tasks: {{ todoStore.activeTasks.length }}</span>
        <span>Completed Tasks: {{ todoStore.completedTasks.length }}</span>
        <span v-if="todoStore.searchQuery">Found Tasks: {{ todoStore.filteredTasks.length }}</span>
      </div>
    </div>
  </template>
  
<script setup>
import { useTodoStore } from '../store/todoStore'
import { onMounted } from 'vue'
import draggable from 'vuedraggable'

const todoStore = useTodoStore()

// Load tasks from localStorage when component mounts
onMounted(() => {
  todoStore.loadTasks()
})

const onDragEnd = () => {
  const newOrder = todoStore.filteredTasks.map(task => 
    todoStore.tasks.find(t => t.createdAt === task.createdAt)
  ).filter(Boolean)

  todoStore.reorderTasks(newOrder)
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}
</script>
  
<style scoped>

.add-btn{
  background: #7ed6df;
  color: #fff;
  box-shadow: 2px 2px 6px #b2dbe3, -2px -2px 6px #ffffff;
}

.add-btn, .save-btn, .cancel-btn, .edit-btn, .delete-btn {
  padding: 10px 18px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.add-btn:hover {
  background: #70c1d3;
  transform: scale(1.05);
}

.save-btn{
  background-color: #2ecc71;
  color: white;
}

.cancel-btn{
  background-color: #e74c3c;
  color: white;
}

.cancel-btn:hover{
  transform: scale(1.05);
  color: #c0392b;
}

.edit-btn{
  background-color: #3498db;
  color: white;
}

.input-section, .controls-section{
  display: flex;
  gap: 12px;
  margin-bottom: 25px;
}

.delete-btn:hover {
  color: #c0392b;
  transform: scale(1.1);
}

.drag-handle{
  cursor: move;
  margin-right: 10px;
  opacity: 0.4;
  transition: all 0.2s;
  user-select: none;
  padding: 8px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.drag-handle:hover{
  opacity: 1;
  background: #dfe6ec;
}

.edit-btn:hover{
  background-color: #2980b9;
}

.delete-btn{
  background-color: transparent;
  color: #e74c3c;
  font-size: 1.2rem;
}

.edit-section{
  display: flex;
  width: 100%;
  gap: 10px;
}

.editing{
  background: #fdfdfd;
  box-shadow: 0 0 0 2px rgba(52,152,219,0.25);
}

.todo-input, .search-input, .filter-select, .edit-input{
  flex: 1;
  padding: 12px 18px;
  border-radius: 15px;
  border: none;
  background: #e9eff5;
  box-shadow: inset 4px 4px 8px #d0d5da, inset -4px -4px 8px #ffffff;
  transition: all 0.3s;
  font-size: 1rem;
  color: #2c3e50;
}

.todo-input:focus, .search-input:focus, .edit-input:focus{
  outline: none;
  background: #ffffff;
}

.sortable-chosen{
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.sortable-ghost{
  opacity: 0.7;
  background: #dfe6ec;
  transform: scale(0.97);
}

.stats{
  display: flex;
  gap: 12px;
  margin-top: 20px;
  font-size: 0.85rem;
  color: #7f8c8d;
  flex-wrap: wrap;
}

.stats span{
  background: #e9eff5;
  padding: 5px 10px;
  border-radius: 10px;
}

.task-actions{
  display: flex;
  gap: 10px;
}

.task-checkbox{
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.task-content{
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.task-content span{
  cursor: pointer;
  font-size: 1.1rem;
  transition: color 0.3s;
}

.task-content span.done{
  text-decoration: line-through;
  color: #2ecc71;
}

.task-date{
  font-size: 0.8rem;
  color: #7f8c8d;
  margin-left: 8px;
}

.task-item {
  background: #e9eff5;
  border-radius: 18px;
  padding: 18px 22px;
  margin-bottom: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  box-shadow: 4px 4px 10px #d6dbe1, -4px -4px 10px #ffffff;
  transition: all 0.3s ease;
}

.task-item * {
  cursor: default;
}

.task-item:hover {
  transform: translateY(-3px);
}

.task-item span {
  cursor: pointer;
  font-size: 1.1rem;
  transition: color 0.3s;
}

.task-item span.done {
  text-decoration: line-through;
  color: #27ae60;
}

.task-list {
  list-style: none;
  padding: 0;
}

.task-list-move{
  transition: transform 0.5s ease;
}

.todo-container {
  background: #f0f4f8;
  border-radius: 25px;
  padding: 35px;
  box-shadow: 10px 10px 25px #d6dbe1, -10px -10px 25px #ffffff;
  color: #2c3e50;
  max-width: 700px;
  margin: auto;
}

.todo-input::placeholder {
  color: #95a5a6;
}

.save-btn:hover{
  transform: scale(1.05);
  color: #27ae60;
}
</style>  