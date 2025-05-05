<template>
  <div class="chatbot-container" :class="{ 'chatbot-open': isOpen }">
    <div class="chatbot-header" @click="toggleChatbot">
      <div class="header-content">
        <svg class="robot-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12v8h2v-8c0-4.42 3.58-8 8-8s8 3.58 8 8v8h2v-8c0-5.52-4.48-10-10-10z" />
          <circle cx="9" cy="13" r="1.5" />
          <circle cx="15" cy="13" r="1.5" />
          <path d="M18 19H6c-1.1 0-2-.9-2-2v-3h16v3c0 1.1-.9 2-2 2z" />
        </svg>
        <h4 v-if="isOpen">AI Assistant</h4>
        <span v-if="isOpen && hasDeadlineReminders" class="reminder-badge">{{ deadlineReminders.length }}</span>
      </div>
      <span v-if="isOpen" class="toggle-icon">x</span>
    </div>
    
    <div v-if="isOpen" class="chatbot-body">
      <div class="message-container">
        <div v-for="(message, index) in messages" :key="index" :class="['message', message.sender]">
          <div class="message-bubble">
            <div class="message-content">{{ message.text }}</div>
            <div v-if="message.taskDetails" class="task-details mt-2">
              <div class="task-priority" :class="'priority-' + message.taskDetails.priority">
                Priority: {{ message.taskDetails.priorityText }}
              </div>
              <div class="task-deadline">
                Due: {{ formatDate(message.taskDetails.deadline) }} 
                <span v-if="message.taskDetails.dueTime">at {{ formatTime(message.taskDetails.dueTime) }}</span>  
              </div>
            </div>
            <div class="message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>
      </div>
      
      <div class="input-container glass-background">
        <input v-model="userInput" @keyup.enter="sendMessage" placeholder="Ask about deadlines or task priorities..." class="chat-input">
        <button @click="sendMessage" class="send-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useDashboardStore } from '../store/Dashboard';

export default {
  setup() {
    const dashboardStore = useDashboardStore();

    const isOpen = ref(false);
    const userInput = ref('');
    const messages = ref([]);
    const deadlineReminders = ref([]);
    const reminderInterval = ref(null);

    // Initialize with welcome message
    onMounted(() => {
      addBotMessage("Hello! I'm your AI assistant. I can help you prioritize tasks and remind you of deadlines. How can I help?");
      startReminderCheck();
      checkImmediateDeadlines();
    });

    onUnmounted(() => {
      clearInterval(reminderInterval.value);
    });

    const hasDeadlineReminders = computed(() => {
      return deadlineReminders.value.length > 0;
    });

    const startReminderCheck = () => {
      reminderInterval.value = setInterval(() => {
        checkImmediateDeadlines();
      }, 300000);
    };

    const checkImmediateDeadlines = () => {
      const now = new Date();
      const urgentTasks = dashboardStore.upcomingDeadlines.filter(task => {
        if (!task.end_date) return false;
        
        try{
          const dueDate = new Date(task.end_date);
          if (isNaN(dueDate.getTime())) return false;
        
          const timeLeft = dueDate - now;
          const hoursLeft = timeLeft / (1000 * 60 * 60);
          // Tasks due within 24 hours
          return hoursLeft <= 24 && hoursLeft > 0;
        } catch{
          return false;
        }
      });

      deadlineReminders.value = urgentTasks;

      if (urgentTasks.length > 0 && isOpen.value) {
        showDeadlineReminders(urgentTasks);
      }
    };

    const showDeadlineReminders = (tasks) => {
      tasks.forEach(task => {
        const hoursLeft = Math.floor((new Date(task.end_date) - new Date()) / (1000 * 60 * 60));
        addBotMessage(
          `Reminder: "${task.title}" is due in ${hoursLeft} hours!`,
          {
            taskDetails: {
              title: task.title,
              deadline: task.end_date,
              dueTime: task.dueTime || null,
              priority: getPriorityLevel(task.end_date),
              priorityText: getPriorityText(task.end_date)
            }
          }
        );
      });
    };

    const toggleChatbot = () => {
      isOpen.value = !isOpen.value;
      if (isOpen.value && deadlineReminders.value.length > 0) {
        showDeadlineReminders(deadlineReminders.value);
      }
    };

    const addBotMessage = (text, extraData = {}) => {
      messages.value.push({
        text,
        sender: 'bot',
        timestamp: new Date(),
        ...extraData
      });
    };

    const addUserMessage = (text) => {
      messages.value.push({
        text,
        sender: 'user',
        timestamp: new Date()
      });
    };

    const sendMessage = async () => {
      if (!userInput.value.trim()) return;

      addUserMessage(userInput.value);
      const userMessage = userInput.value;
      userInput.value = '';

      try {
        const response = await getBotResponse(userMessage);
        addBotMessage(response.text, response.extraData);
      } catch (error) {
        console.error('Error getting bot response:', error);
        addBotMessage("Sorry, I'm having trouble responding right now.");
      }
    };

    const getPriorityLevel = (deadline) => {
      const now = new Date();
      const dueDate = new Date(deadline);
      const timeLeft = dueDate - now;
      const daysLeft = timeLeft / (1000 * 60 * 60 * 24);

      if (daysLeft <= 2) return 1; // High priority
      if (daysLeft <= 5) return 2; // Medium priority
      return 3; // Low priority
    };

    const getPriorityText = (deadline) => {
      const priority = getPriorityLevel(deadline);
      return ['High', 'Medium', 'Low'][priority - 1];
    };

    const getBotResponse = async (message) => {
      const lowerMessage = message.toLowerCase();
      
      // Prioritization queries
      if (lowerMessage.includes('priorit') || lowerMessage.includes('which task first') || 
          lowerMessage.includes('what should i do first')) {
        return handlePrioritizationQuery();
      }
      
      // Deadline queries
      if (lowerMessage.includes('deadline') || lowerMessage.includes('due date') || 
          lowerMessage.includes('task due') || lowerMessage.includes('when is')) {
        return handleDeadlineQuery(lowerMessage);
      }
      
      // Reminder queries
      if (lowerMessage.includes('remind') || lowerMessage.includes('alert')) {
        return handleReminderQuery();
      }
      
      // Greetings
      const greetings = ['hi', 'hello', 'hey', 'greetings'];
      if (greetings.some(word => lowerMessage.includes(word))) {
        return { 
          text: "Hello there! I can help you prioritize tasks and remind you of deadlines. Try asking 'Which tasks should I prioritize?' or 'What deadlines are coming up?'"
        };
      }
      
      // Help requests
      const helpRequests = ['help', 'support', 'assistance'];
      if (helpRequests.some(word => lowerMessage.includes(word))) {
        return { 
          text: "I can help you with: prioritizing tasks, deadline reminders, and task management. Try asking: 'Which task is most urgent?' or 'What deadlines are approaching?'"
        };
      }
      
      // Default response
      return { 
        text: "I'm your task management assistant. I can help you prioritize tasks and remind you of deadlines. Try asking about your upcoming tasks or deadlines."
      };
    };

    const handlePrioritizationQuery = () => {
      if (dashboardStore.upcomingDeadlines.length === 0) {
        return { text: "You don't have any upcoming tasks to prioritize. Great job staying on top of things!" };
      }

      const validTasks = dashboardStore.upcomingDeadlines.filter(task => {
        if (!task.end_date) return false;
        const date = new Date(task.end_date);
        return !isNaN(date.getTime());
      });

      if (validTasks.length === 0){
        return { text: "No valid deadlines found to prioritize"};
      }

      // Sort tasks by priority (soonest deadline first)
      const sortedTasks = [...dashboardStore.upcomingDeadlines].sort((a, b) => {
        return new Date(a.end_date) - new Date(b.end_date);
      });

      const highestPriorityTask = sortedTasks[0];
      const priorityLevel = getPriorityLevel(highestPriorityTask.end_date);
      const priorityText = getPriorityText(highestPriorityTask.end_date);
      const daysLeft = highestPriorityTask.daysLeft;

      let responseText = `Your highest priority task is "${highestPriorityTask.title}" `;
      responseText += `with ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left. `;
      responseText += `This is a ${priorityText} priority task.`;

      return {
        text: responseText,
        extraData: {
          taskDetails: {
            title: highestPriorityTask.title,
            deadline: highestPriorityTask.end_date,
            dueTime: highestPriorityTask.dueTime || null,
            priority: priorityLevel,
            priorityText: priorityText
          }
        }
      };
    };

    const handleDeadlineQuery = (message) => {
      if (dashboardStore.upcomingDeadlines.length === 0) {
        return { text: "You don't have any upcoming deadlines. Great job staying on top of things!" };
      }

      // Check if asking about a specific task
      const specificTask = dashboardStore.upcomingDeadlines.find(task => 
        message.includes(task.title.toLowerCase())
      );

      if (specificTask) {
        const priorityLevel = getPriorityLevel(specificTask.end_date);
        const priorityText = getPriorityText(specificTask.end_date);
        const daysLeft = specificTask.daysLeft;
        
        return {
          text: `"${specificTask.title}" is due in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} (${formatDate(specificTask.end_date)}). Priority: ${priorityText}.`,
          extraData: {
            taskDetails: {
              title: specificTask.title,
              deadline: specificTask.end_date,
              dueTime: specificTask.dueTime,
              priority: priorityLevel,
              priorityText: priorityText
            }
          }
        };
      }

      // General deadline overview
      const highPriorityCount = dashboardStore.upcomingDeadlines.filter(task => 
        getPriorityLevel(task.end_date) === 1
      ).length;

      const mediumPriorityCount = dashboardStore.upcomingDeadlines.filter(task => 
        getPriorityLevel(task.end_date) === 2
      ).length;

      let responseText = `You have ${dashboardStore.upcomingDeadlines.length} upcoming deadlines:\n`;
      responseText += `- ${highPriorityCount} high priority\n`;
      responseText += `- ${mediumPriorityCount} medium priority\n`;
      responseText += `- ${dashboardStore.upcomingDeadlines.length - highPriorityCount - mediumPriorityCount} low priority\n\n`;
      responseText += `Ask about a specific task for more details.`;

      return { text: responseText };
    };

    const handleReminderQuery = () => {
      if (deadlineReminders.value.length === 0) {
        return { text: "You don't have any immediate deadline reminders right now." };
      }

      let responseText = "You have these upcoming deadlines:\n";
      deadlineReminders.value.forEach(task => {
        const hoursLeft = Math.floor((new Date(task.end_date) - new Date()) / (1000 * 60 * 60));
        responseText += `- "${task.title}" due in ${hoursLeft} hours\n`;
      });

      return { text: responseText };
    };

    const formatTime = (timeInput) => {
      if (!timeInput) return 'No time set';

      if (typeof timeInput === 'string' && timeInput.includes(':')){
        const timeParts = timeInput.split(':');
        if (timeParts.length >= 2){
          let hours = parseInt(timeParts[0]);
          const minutes = timeParts[1];
          const ampm = hours >= 12 ? 'PM': 'AM';
          hours = hours % 12;
          hours = hours ? hours : 12;
          return `${hours}: ${minutes} ${ampm}`;
        }
        return timeInput;
      }

      if (timeInput instanceof Date){
        return timeInput.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
      }

      return 'Invalid Time';
    };

    const formatDate = (dateInput) => {
      if (!dateInput) return 'No date set'; 
      
      try{
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) return "Invalid Date";
        return date.toLocaleDateString();
      } catch(e){
        return "Invalid Date";
      }
    };

    return {
      isOpen,
      userInput,
      messages,
      deadlineReminders,
      hasDeadlineReminders,
      toggleChatbot,
      sendMessage,
      formatTime,
      formatDate,
      dashboardStore,
    };
  }
};
</script>

<style>

.robot-icon{
  width: 40px;
  height: 40px;
  fill: white;
  transition: all 0.3s ease;
  transform-origin: center;
}

.chatbot-container:not(.chatbot-open) .robot-icon{
  width: 50px;
  height: 50px;
  animation: float 3s ease-in-out infinite, subtle-bounce 2s ease-in-out infinite;
}

.chatbot-open .robot-icon{
  transform: scale(0.9);
}

@keyframes float{
  0%, 100% { transform: translateY(0);}
  50% { transform: translateY(-5px);}
}

@keyframes subtle-bounce{
  0%, 100% {transform: translateY(0) scale(1);}
  50% { transform: translateY(-3px) scale(1.05);}
}

.chatbot-header:hover .robot-icon{
  animation: none;
  transform: scale(1.1);
}

.chatbot-container:not(.chatbot-open) .header-content::after{
  content: "";
  position: absolute;
  top: -8px;
  left: 50%;
  width: 12px;
  height: 12px;
  background: white;
  transform: translateX(-50%) rotate(45deg);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.chatbot-container:not(.chatbot-open):hover .header-content::after{
  opacity: 1;
}

.chatbot-container {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: auto;
  max-width: 380px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(15px);
  border-radius: 50px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.2);
  z-index: 1000;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  overflow: hidden;
  max-height: 60px;
}

.chatbot-open {
  max-height: 65vh;
  height: 600px;
  width: 380px;
  border-radius: 20px;
}

.chatbot-open .toggle-icon {
transform: rotate(90deg);
}

.chatbot-header {
  padding: 12px 20px;
  background: linear-gradient(135deg, #6a11cb, #2575fc);
  color: white;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
  min-height: 60px;
}

.chatbot-header::before{
content: '';
position: absolute;
top: -50%;
left: -50%;
width: 200%;
height: 200%;
background: linear-gradient(to bottom right, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 60%);
transform: rotate(30deg);
}

.header-content {
display: flex;
align-items: center;
gap: 12px;
}

.toggle-icon {
  font-size: 1.5rem;
  font-weight: 300;
  transition: transform 0.3s ease;
}

.chatbot-body {
  display: flex;
  flex-direction: column;
  height: calc(100% - 50px);
  background: rgba(255, 255, 255, 0.7);
}

.message-container {
  flex-grow: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.message {
  max-width: 85%;
  display: flex;
  transition: all 0.3s ease;
}

.message.user {
  align-self: flex-end;
}

.message.bot {
  align-self: flex-start;
}

.message-bubble {
  padding: 12px 18px;
  border-radius: 18px;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  line-height: 1.4;
}

.message.user .message-bubble {
  background: linear-gradient(135deg, #6a11cb, #2575fc);
  color: white;
  border-bottom-right-radius: 5px;
}

.message.bot .message-bubble {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-bottom-left-radius: 5px;
}

.message-content {
  word-wrap: break-word;
  font-size: 0.95rem;
}

.message-time {
  font-size: 0.7rem;
  opacity: 0.8;
  text-align: right;
  margin-top: 5px;
}

.message.user .message-time {
  color: rgba(255, 255, 255, 0.7);
}

.message.bot .message-time {
  color: rgba(0, 0, 0, 0.5);
}

.input-container {
  display: flex;
  padding: 15px;
  align-items: center;
  background: rgba(255, 255, 255, 0.5);
  border-top: 1px solid rgba(255, 255, 255, 0.4);
}

.chat-input {
  flex-grow: 1;
  padding: 12px 18px;
  border: none;
  border-radius: 50px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(5px);
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.05), 0 2px 10px rgba(0, 0, 0, 0.05);
  outline: none;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.chat-input:focus {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: inset 0 0 0 1px rgba(106, 17, 203, 0.3), 0 2px 15px rgba(106, 17, 203, 0.1);
}

.send-button {
  background: linear-gradient(135deg, #6a11cb, #2575fc);
  color: white;
  border: none;
  border-radius: 50%;
  width: 45px;
  height: 45px;
  margin-left: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(106, 17, 203, 0.3);
}

.send-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(106, 17, 203, 0.4);
}

.send-button svg {
  width: 20px;
  height: 20px;
  stroke: white;
  transition: all 0.3s ease;
}

.send-button:hover svg{
  transform: translateX(2px);
}

/* Custom scrollbar to match your app's style */
.message-container::-webkit-scrollbar {
  width: 8px;
}

.message-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 10px;
}

.message-container::-webkit-scrollbar-thumb {
  background: rgba(106, 17, 203, 0.4);
  border-radius: 10px;
}

.message-container::-webkit-scrollbar-thumb:hover {
  background: rgba(106, 17, 203, 0.6);
}

/* Animation for new messages */
.message {
  animation: messageAppear 0.3s ease-out forwards;
}

@keyframes messageAppear {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.reminder-badge {
  background-color: #ff4757;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  margin-left: 8px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.task-details {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  padding: 8px;
  font-size: 0.85rem;
}

.task-priority {
  font-weight: 600;
  margin-bottom: 4px;
}

.task-priority.priority-1 {
  color: #ff4757;
}

.task-priority.priority-2 {
  color: #ffa502;
}

.task-priority.priority-3 {
  color: #2ed573;
}

.task-deadline {
  color: #666;
}

/* Make sure messages with task details have more space */
.message-bubble.with-details {
  padding-bottom: 12px;
}
</style>