<template>
  <div
    class="chatbot-container"
    :class="{ 'chatbot-open': isOpen }"
    :aria-expanded="isOpen.toString()"
    aria-label="AI assistant chatbot"
  >
    <!-- Header / Toggle -->
    <div class="chatbot-header" @click="toggleChatbot" role="button" tabindex="0" @keyup.enter="toggleChatbot">
      <div class="header-content">
        <svg class="robot-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.48 2 12v8h2v-8c0-4.42 3.58-8 8-8s8 3.58 8 8v8h2v-8c0-5.52-4.48-10-10-10z" />
          <circle cx="9" cy="13" r="1.5" />
          <circle cx="15" cy="13" r="1.5" />
          <path d="M18 19H6c-1.1 0-2-.9-2-2v-3h16v3c0 1.1-.9 2-2 2z" />
        </svg>
        <h4 v-if="isOpen" class="sr-only md:not-sr-only">AI Assistant</h4>
        <span v-if="isOpen && hasDeadlineReminders" class="reminder-badge" aria-label="Deadline reminders count">{{ deadlineReminders.length }}</span>
      </div>
      <span v-if="isOpen" class="toggle-icon" aria-hidden="true">×</span>
    </div>

    <!-- Body -->
    <div v-if="isOpen" class="chatbot-body" :data-theme="theme">
      <!-- Quick action chips -->
      <div class="quick-actions">
        <button class="chip" @click="quickAsk('Prioritize my tasks')">Prioritize Tasks</button>
        <button class="chip" @click="quickAsk('Show upcoming deadlines')">Show Deadlines</button>
        <button class="chip" @click="quickAsk('Remind me of urgent tasks')">Remind Me</button>
        <button class="chip" @click="quickAsk('Show tasks tagged Work')">Tasks by Tag</button>
      </div>

      <!-- Messages -->
      <div
        class="message-container"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        ref="msgContainerRef"
      >
        <transition-group name="stagger" tag="div">
          <div v-for="(message, index) in messages" :key="message.id" :class="['message', message.sender]">
            <div class="message-bubble" :class="{ 'with-details': message.taskDetails }">
              <div class="message-content">{{ message.text }}</div>

              <!-- Collapsible task details -->
              <details v-if="message.taskDetails" class="task-details mt-2">
                <summary>Task details</summary>
                <div class="task-priority" :class="'priority-' + message.taskDetails.priority">
                  <span class="prio-icon" aria-hidden="true">{{ priorityIcon(message.taskDetails.priority) }}</span>
                  Priority: {{ message.taskDetails.priorityText }}
                </div>
                <div class="task-deadline">
                  Due: {{ formatDate(message.taskDetails.deadline) }}
                  <span v-if="message.taskDetails.dueTime"> at {{ formatTime(message.taskDetails.dueTime) }}</span>
                </div>
                <div v-if="message.taskDetails.tags && message.taskDetails.tags.length" class="task-tags">
                  <span v-for="t in message.taskDetails.tags" :key="t" class="tag">#{{ t }}</span>
                </div>
              </details>

              <!-- Reactions -->
              <div class="reactions">
                <button class="react" @click="react(message, 'up')" :aria-pressed="message.reaction==='up'">👍</button>
                <button class="react" @click="react(message, 'down')" :aria-pressed="message.reaction==='down'">👎</button>
              </div>

              <div class="message-time">{{ formatTime(message.timestamp) }}</div>
            </div>
          </div>
        </transition-group>

        <!-- Typing indicator -->
        <div v-if="isTyping" class="message bot typing">
          <div class="message-bubble">
            <span class="dots" aria-label="Assistant is typing"><span></span><span></span><span></span></span>
          </div>
        </div>
      </div>

      <!-- Smart suggestions under thread -->
      <div v-if="suggestions.length" class="suggestions">
        <button v-for="(s, i) in suggestions" :key="i" class="suggestion" @click="quickAsk(s)">{{ s }}</button>
      </div>

      <!-- Input & Controls -->
      <div class="input-container glass-background">
        <input
          v-model="userInput"
          @keyup.enter="sendMessage"
          @keydown.up.prevent="recallLast"
          placeholder="Ask about deadlines, priorities, or tags..."
          class="chat-input"
          aria-label="Type your message"
        />
        <button @click="toggleVoice" class="icon-button" :aria-pressed="isListening.toString()" :title="isListening ? 'Stop voice input' : 'Start voice input'">🎤</button>
        <button @click="sendMessage" class="send-button" aria-label="Send message">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
        <button @click="resetChat" class="icon-button" title="Reset chat">♻️</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useDashboardStore } from '../store/Dashboard';
import { useTaskStore } from '../store/taskStore';

export default {
  setup() {
    const dashboardStore = useDashboardStore();
    const taskStore = useTaskStore();

    // UI state
    const isOpen = ref(false);
    const userInput = ref('');
    const lastUserMessage = ref('');
    const messages = ref([]);
    const isTyping = ref(false);
    const suggestions = ref([]);

    // Reminders / deadlines
    const deadlineReminders = ref([]);
    const reminderInterval = ref(null);

    // Voice state
    const isListening = ref(false);
    const synth = window.speechSynthesis || null;
    let recognition = null;

    const theme = computed(() =>
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    );

    const msgContainerRef = ref(null);

    const hasDeadlineReminders = computed(() => deadlineReminders.value.length > 0);

    const scrollToBottom = async () => {
      await nextTick();
      const el = msgContainerRef.value;
      if (el) el.scrollTop = el.scrollHeight;
    };

    const addMessage = (payload) => {
      messages.value.push({ id: crypto.randomUUID(), reaction: null, ...payload });
      scrollToBottom();
    };

    const addBotMessage = (text, extraData = {}) => addMessage({ text, sender: 'bot', timestamp: new Date(), ...extraData });
    const addUserMessage = (text) => addMessage({ text, sender: 'user', timestamp: new Date() });

    const speak = (text) => {
      if (!synth) return;
      try {
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = 1; utter.pitch = 1; utter.lang = navigator.language || 'en-US';
        synth.cancel();
        synth.speak(utter);
      } catch { /* noop */ }
    };

    const initRecognition = () => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) return null;
      const rec = new SR();
      rec.lang = navigator.language || 'en-US';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (e) => {
        const text = e.results[0][0].transcript;
        userInput.value = text;
        sendMessage();
      };
      rec.onend = () => { isListening.value = false; };
      return rec;
    };

    const toggleVoice = () => {
      if (!recognition) recognition = initRecognition();
      if (!recognition) {
        addBotMessage('Voice input not supported in this browser.');
        return;
      }
      if (isListening.value) {
        recognition.stop();
        isListening.value = false;
      } else {
        isListening.value = true;
        recognition.start();
      }
    };

    // Startup
    onMounted(async () => {
      addBotMessage("Hello! I'm your AI assistant. I can help you prioritize tasks, filter by tags, and remind you of deadlines. Ask me anything!");
      await ensureData();
      startReminderCheck();
      checkImmediateDeadlines();
      window.addEventListener('keydown', globalShortcuts);
    });

    onUnmounted(() => {
      clearInterval(reminderInterval.value);
      window.removeEventListener('keydown', globalShortcuts);
    });

    const ensureData = async () => {
      try {
        if (taskStore.fetchTasks) await taskStore.fetchTasks();
        if (dashboardStore.fetchUpcoming) await dashboardStore.fetchUpcoming();
      } catch { /* ignore fetch errors to keep UI responsive */ }
    };

    const globalShortcuts = (e) => {
      if (e.key === 'Escape' && isOpen.value) {
        isOpen.value = false;
      }
    };

    const startReminderCheck = () => {
      reminderInterval.value = setInterval(() => { checkImmediateDeadlines(); }, 300000); // 5 minutes
    };

    const upcomingFromStores = computed(() => {
      const a = Array.isArray(dashboardStore.upcomingDeadlines) ? dashboardStore.upcomingDeadlines : [];
      const b = Array.isArray(taskStore.tasks) ? taskStore.tasks.filter(t => t.end_date) : [];
      // Normalize task fields
      const normalizedB = b.map(t => ({
        title: t.title || t.text || 'Untitled',
        end_date: t.end_date || t.dueDate,
        dueTime: t.dueTime || null,
        tags: Array.isArray(t.tags) ? t.tags : (typeof t.tags === 'string' ? t.tags.split(',').map(s => s.trim()).filter(Boolean) : []),
        priority: t.priority || 'low',
        daysLeft: daysLeft(t.end_date || t.dueDate)
      }));
      const merged = [...a, ...normalizedB];
      // Remove invalid dates
      return merged.filter(task => {
        const d = new Date(task.end_date);
        return task.end_date && !isNaN(d.getTime());
      });
    });

    const daysLeft = (dateStr) => {
      try {
        const d = new Date(dateStr);
        const now = new Date();
        return Math.max(0, Math.ceil((d - now) / (1000 * 60 * 60 * 24)));
      } catch { return 0; }
    };

    const checkImmediateDeadlines = () => {
      const now = new Date();
      const urgentTasks = upcomingFromStores.value.filter(task => {
        const dueDate = new Date(task.end_date);
        if (isNaN(dueDate.getTime())) return false;
        const hoursLeft = (dueDate - now) / (1000 * 60 * 60);
        return hoursLeft <= 24 && hoursLeft > 0;
      });

      deadlineReminders.value = urgentTasks;
      if (urgentTasks.length > 0 && isOpen.value) showDeadlineReminders(urgentTasks);
    };

    const priorityLevel = (deadline) => {
      const d = daysLeft(deadline);
      if (d <= 2) return 1; // high
      if (d <= 5) return 2; // medium
      return 3; // low
    };
    const priorityText = (deadline) => ['High', 'Medium', 'Low'][priorityLevel(deadline) - 1];
    const priorityIcon = (p) => (p === 1 ? '🔥' : p === 2 ? '⚡' : '✅');

    const showDeadlineReminders = (tasks) => {
      tasks.forEach(task => {
        const hrs = Math.floor((new Date(task.end_date) - new Date()) / (1000 * 60 * 60));
        addBotMessage(`Reminder: "${task.title}" is due in ${hrs} hour${hrs===1?'':'s'}!`, {
          taskDetails: {
            title: task.title,
            deadline: task.end_date,
            dueTime: task.dueTime || null,
            priority: priorityLevel(task.end_date),
            priorityText: priorityText(task.end_date),
            tags: task.tags || []
          }
        });
      });
      speak(`You have ${tasks.length} urgent ${tasks.length===1?'task':'tasks'} in the next 24 hours.`);
    };

    const toggleChatbot = () => {
      isOpen.value = !isOpen.value;
      if (isOpen.value && deadlineReminders.value.length > 0) showDeadlineReminders(deadlineReminders.value);
      nextTick(scrollToBottom);
    };

    const react = (message, kind) => {
      message.reaction = message.reaction === kind ? null : kind;
    };

    const quickAsk = (text) => {
      userInput.value = text;
      sendMessage();
    };

    const recallLast = () => {
      if (!userInput.value && lastUserMessage.value) userInput.value = lastUserMessage.value;
    };

    const sendMessage = async () => {
      const text = (userInput.value || '').trim();
      if (!text) return;
      addUserMessage(text);
      lastUserMessage.value = text;
      userInput.value = '';

      isTyping.value = true;
      const { text: reply, extraData } = await getBotResponse(text);
      isTyping.value = false;
      addBotMessage(reply, extraData);
      speak(reply);
      updateSuggestions(reply);
    };

    // Lightweight NLP / intent detection
    const getBotResponse = async (raw) => {
      const msg = raw.toLowerCase();

      // Normalize synonyms
      const isPrioritize = /prioriti?z|which (task|one).*first|what should i do first|top tasks|most urgent/.test(msg);
      const isDeadlines = /deadline|due|when is|upcoming|schedule|calendar/.test(msg);
      const isRemind = /remind|alert|notify/.test(msg);

      // Tag filter intent e.g. "show tasks tagged work" or "work tasks"
      const tagMatch = msg.match(/tag(?:ged)?\s+([a-z0-9- ]+)|\b(work|personal|school|home|urgent)\b tasks?/);

      if (isPrioritize) return handlePrioritizationQuery();
      if (isDeadlines) return handleDeadlineQuery(msg);
      if (isRemind) return handleReminderQuery();
      if (tagMatch) return handleTagQuery(tagMatch[1] || tagMatch[2]);

      // Fallback small talk
      if (/\b(hi|hello|hey|greetings)\b/.test(msg)) {
        return { text: "Hi! Ask me to prioritize tasks, show deadlines, or filter by a tag like 'Work'." };
      }
      if (/help|what can you do/.test(msg)) {
        return { text: "I can: prioritize tasks, list deadlines, set reminders, and filter tasks by tag or priority. Try 'Which tasks are most urgent?'" };
      }

      return { text: "I'm here to help with tasks and deadlines. Try: 'Show upcoming deadlines' or 'Prioritize my tasks'." };
    };

    const handlePrioritizationQuery = () => {
      const tasks = upcomingFromStores.value;
      if (!tasks.length) return { text: "No upcoming tasks to prioritize. Nice and clear!" };

      const valid = tasks.filter(t => t.end_date && !isNaN(new Date(t.end_date)));
      if (!valid.length) return { text: "No valid deadlines found to prioritize." };
      const sorted = [...valid].sort((a,b) => new Date(a.end_date) - new Date(b.end_date));
      const top = sorted.slice(0, Math.min(3, sorted.length));

      const lines = top.map((t,i) => `${i+1}. ${t.title} — ${daysLeft(t.end_date)} day${daysLeft(t.end_date)===1?'':'s'} left (${formatDate(t.end_date)}) [${priorityText(t.end_date)}]`);
      return {
        text: `Here's your priority order:\n` + lines.join('\n'),
        extraData: {
          taskDetails: {
            title: top[0].title,
            deadline: top[0].end_date,
            dueTime: top[0].dueTime || null,
            priority: priorityLevel(top[0].end_date),
            priorityText: priorityText(top[0].end_date),
            tags: top[0].tags || []
          }
        }
      };
    };

    const handleDeadlineQuery = (message) => {
      const tasks = upcomingFromStores.value;
      if (!tasks.length) return { text: "You don't have any upcoming deadlines." };

      // Specific task by name if included
      const specific = tasks.find(t => message.includes((t.title || '').toLowerCase()));
      if (specific) {
        return {
          text: `"${specific.title}" is due ${daysLeft(specific.end_date)} day${daysLeft(specific.end_date)===1?'':'s'} from now (${formatDate(specific.end_date)}). Priority: ${priorityText(specific.end_date)}.`,
          extraData: {
            taskDetails: {
              title: specific.title,
              deadline: specific.end_date,
              dueTime: specific.dueTime || null,
              priority: priorityLevel(specific.end_date),
              priorityText: priorityText(specific.end_date),
              tags: specific.tags || []
            }
          }
        };
      }

      const hi = tasks.filter(t => priorityLevel(t.end_date) === 1).length;
      const mid = tasks.filter(t => priorityLevel(t.end_date) === 2).length;
      const lo = tasks.length - hi - mid;
      const soon = [...tasks].sort((a,b) => new Date(a.end_date)-new Date(b.end_date)).slice(0,5).map(t => `• ${t.title} — ${formatDate(t.end_date)} (${priorityText(t.end_date)})`).join('\n');

      return { text: `You have ${tasks.length} upcoming deadlines:\n- ${hi} high 🧨\n- ${mid} medium ⚡\n- ${lo} low ✅\n\nNext up:\n${soon}` };
    };

    const handleReminderQuery = () => {
      if (!deadlineReminders.value.length) return { text: "You don't have any immediate deadline reminders right now." };
      const lines = deadlineReminders.value.map(t => `- "${t.title}" in ${Math.floor((new Date(t.end_date) - new Date())/(1000*60*60))} hours`);
      return { text: `You have these upcoming deadlines:\n${lines.join('\n')}` };
    };

    const handleTagQuery = (tagRaw) => {
      const tag = (tagRaw || '').trim().toLowerCase();
      if (!tag) return { text: 'Please specify a tag to filter by.' };
      const tasks = upcomingFromStores.value.filter(t => {
        const tags = Array.isArray(t.tags) ? t.tags : [];
        return tags.map(s => s.toLowerCase()).includes(tag);
      });
      if (!tasks.length) return { text: `No upcoming tasks found for tag "${tag}".` };
      const list = tasks.slice(0,5).map(t => `• ${t.title} — ${formatDate(t.end_date)} (${priorityText(t.end_date)})`).join('\n');
      return { text: `Here are tasks tagged "${tag}":\n${list}` };
    };

    const updateSuggestions = (replyText) => {
      // Simple suggestion engine based on reply
      const base = [
        'Show upcoming deadlines',
        'Which tasks are most urgent?',
        'Show tasks tagged Work',
        'Remind me of urgent tasks'
      ];
      if (/No upcoming|don't have any/.test(replyText)) {
        suggestions.value = ['Add a new task', 'Show all tasks'];
      } else {
        suggestions.value = base;
      }
    };

    const resetChat = () => {
      messages.value = [];
      suggestions.value = [];
      deadlineReminders.value = [];
      userInput.value = '';
      lastUserMessage.value = '';

      addBotMessage("Hello! I'm your AI assistant. I can help you prioritize tasks, filter by tags and remind you of deadlines. Ask me anything!");
    };

    const formatTime = (timeInput) => {
      if (!timeInput) return 'No time set';
      if (typeof timeInput === 'string' && timeInput.includes(':')){
        const [hh, mm] = timeInput.split(':');
        let h = parseInt(hh, 10);
        const am = h < 12; h = h % 12 || 12; return `${h}:${mm} ${am ? 'AM' : 'PM'}`;
      }
      if (timeInput instanceof Date) return timeInput.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
      return 'Invalid Time';
    };
    const formatDate = (d) => {
      try { const x = new Date(d); if (isNaN(x.getTime())) return 'Invalid Date'; return x.toLocaleDateString(); } catch { return 'Invalid Date'; }
    };

    return {
      // state
      isOpen, userInput, messages, isTyping, isListening, suggestions,
      deadlineReminders, hasDeadlineReminders, msgContainerRef, theme,
      // methods
      toggleChatbot, toggleVoice, sendMessage, quickAsk, recallLast, react,
      formatTime, formatDate, priorityIcon,resetChat,
    };
  }
};
</script>

<style>

/* --- Container & header --- */
.robot-icon {
  width: 40px;
  height: 40px;
  fill: white;
  transition: all 0.3s ease;
  transform-origin: center;
}
.chatbot-container:not(.chatbot-open) .robot-icon {
  width: 50px;
  height: 50px;
  animation: float 3s ease-in-out infinite, subtle-bounce 2s ease-in-out infinite;
}
.chatbot-open .robot-icon {
  transform: scale(0.9);
}
@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
@keyframes subtle-bounce { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-3px) scale(1.05)} }

.chatbot-container {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: auto;
  max-width: 420px;
  background: #ffffff;
  border-radius: 50px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
  z-index: 1000;
  transition: all 0.4s cubic-bezier(0.175,0.885,0.32,1.275);
  overflow: hidden;
  max-height: 60px;
}
.chatbot-open {
  max-height: 70vh;
  height: 640px;
  width: 420px;
  border-radius: 20px;
}

.chatbot-header {
  padding: 10px 10px;
  background: #0084ff; /* Messenger Blue */
  color: white;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
  min-height: 60px;
}
.header-content { display: flex; align-items: center; gap: 12px; position: relative; }
.toggle-icon { font-size: 1.5rem; font-weight: 300; transition: transform 0.3s ease; }

/* --- Body --- */
.chatbot-body {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: calc(100% - 50px);
  padding: 16px;
  background: #f1f0f0; /* WhatsApp background */
}
.chatbot-body[data-theme="dark"] {
  background: #2a2f32;
  color: #e5e7eb;
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 12px;
}
.chip {
  padding: 6px 12px;
  border-radius: 20px;
  border: none;
  background: #e4e6eb;
  cursor: pointer;
  font-size: 12px;
}
.chatbot-body[data-theme="dark"] .chip {
  background: #3a3b3c;
  color: #f1f1f1;
}

/* --- Messages --- */
.message-container {
  flex-grow: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.message {
  max-width: 85%;
  display: flex;
  transition: all 0.3s ease;
  animation: messageAppear 0.3s ease-out forwards;
}
@keyframes messageAppear { from{opacity:0; transform: translateY(10px)} to{opacity:1; transform: none} }

.message.user { align-self: flex-end; }
.message.bot { align-self: flex-start; }

.message-bubble {
  padding: 12px 18px;
  border-radius: 18px;
  position: relative;
  line-height: 1.4;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

/* User bubble gradient (Messenger style) */
.message.user .message-bubble {
  background: linear-gradient(135deg, #0084ff, #00c6ff);
  color: white;
  border-bottom-right-radius: 5px;
}

/* Bot bubble (WhatsApp style) */
.message.bot .message-bubble {
  background: #ffffff;
  color: #111;
  border-bottom-left-radius: 5px;
  border: 1px solid rgba(0,0,0,0.05);
}
.chatbot-body[data-theme="dark"] .message.bot .message-bubble {
  background: #2a2f32;
  color: #e5e7eb;
  border-color: rgba(255,255,255,0.06);
}

/* Task details */
.task-details {
  background: rgba(0,0,0,0.05);
  border-radius: 8px;
  padding: 8px;
  font-size: 0.85rem;
}
.chatbot-body[data-theme="dark"] .task-details {
  background: rgba(255,255,255,0.06);
}
.task-priority { font-weight: 600; margin-bottom: 4px; display: flex; align-items: center; gap: 6px; }
.task-priority.priority-1 { color: #ff4757; }
.task-priority.priority-2 { color: #ffa502; }
.task-priority.priority-3 { color: #2ed573; }
.task-deadline { color: #666; }
.chatbot-body[data-theme="dark"] .task-deadline { color: #c7c7c7; }
.task-tags .tag { display: inline-block; margin-right: 6px; padding: 2px 8px; border-radius: 999px; background: rgba(0,0,0,0.06); font-size: 12px; }
.chatbot-body[data-theme="dark"] .task-tags .tag { background: rgba(255,255,255,0.08); }

/* Reactions */
.reactions { display: flex; gap: 6px; margin-top: 6px; }
.react { background: transparent; border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; padding: 2px 6px; cursor: pointer; font-size: 12px; }
.chatbot-body[data-theme="dark"] .react { border-color: rgba(255,255,255,0.12); color: #e5e7eb; }

/* Timestamp */
.message-time {
  font-size: 0.7rem;
  opacity: 0.6;
  margin-top: 4px;
  text-align: right;
}

/* Typing indicator */
.typing .message-bubble { display: inline-flex; align-items: center; }
.dots { display: inline-flex; gap: 4px; }
.dots span { width: 6px; height: 6px; background: currentColor; border-radius: 50%; opacity: 0.6; animation: blink 1s infinite; }
.dots span:nth-child(2) { animation-delay: .15s; }
.dots span:nth-child(3) { animation-delay: .3s; }
@keyframes blink { 0%,80%,100%{opacity:.3} 40%{opacity:1} }

/* Input area */
.input-container {
  display: flex;
  padding: 12px;
  align-items: center;
  background: #ffffff;
  gap: 8px;
}
.chatbot-body[data-theme="dark"] .input-container {
  background: #2a2f32;
}

.chat-input {
  flex-grow: 1;
  padding: 12px 18px;
  border: none;
  border-radius: 50px;
  background: #f1f0f0;
  outline: none;
  font-size: 0.9rem;
}
.chat-input:focus {
  background: #e4e6eb;
}

.icon-button {
  background: transparent;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 50%;
  width: 42px;
  height: 42px;
  cursor: pointer;
}

.send-button {
  background: #0084ff;
  color: white;
  border: none;
  border-radius: 50%;
  width: 45px;
  height: 45px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(0,132,255,0.3);
}
.send-button:hover { background: #006fd6; }

/* Scrollbar */
.message-container::-webkit-scrollbar { width: 8px; }
.message-container::-webkit-scrollbar-track { background: rgba(0,0,0,0.05); border-radius: 10px; }
.message-container::-webkit-scrollbar-thumb { background: rgba(0,132,255,0.4); border-radius: 10px; }
.message-container::-webkit-scrollbar-thumb:hover { background: rgba(0,132,255,0.6); }

/* Reminder badge */
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
@keyframes pulse { 0%{transform:scale(1)} 50%{transform:scale(1.1)} 100%{transform:scale(1)} }

/* Stagger animation */
.stagger-enter-active { transition: all .25s ease; }
.stagger-enter-from { opacity: 0; transform: translateY(8px); }

</style>