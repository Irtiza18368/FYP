import {createRouter, createWebHistory} from 'vue-router';

import Home from '../views/Home.vue';
import AddTask from '../views/AddTask.vue';
import Settings from '../views/Settings.vue';
import Calendar from '../views/Calendar.vue';
import ManageTask from '../views/ManageTask.vue';
import Tasks from '../views/Tasks.vue';
import TodoList from '../components/TodoList.vue';


const routes = [
    {path: '/', name: 'Home', component: Home},
    {path: '/manage-task', name: 'Completed Task', component: ManageTask},
    {path: '/add-task', name: 'AddTask', component: AddTask},
    {path: '/calendar', name: 'Calendar', component: Calendar},
    {path: '/settings', name: 'Settings', component: Settings},
    {path: '/tasks', name: 'Tasks', component: Tasks},
    {path: '/todo', name: 'To-do List', component: TodoList},
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
