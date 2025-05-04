import { defineStore } from 'pinia';

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    username: '',
    greeting: '',
    upcomingDeadlines: [],
    chatHistory: [],
    isChatbotOpen: false,
    lastActiveTime: new Date(),
    inactivityTime: 0,
    inactivityTimer: null,
    

    motivationalQuote: '',
    quoteIndex: 0,
    quoteInterval: null,
    quotes: [
      "Dream it. Wish it. Do it",
      "Stay focused and never give up.",
      "Believe in yourself and all that you are."
    ],
  }),

  actions: {
    setGreeting() {
      const hour = new Date().getHours();
      if (hour < 12){
        this.greeting = 'Good morning';
        this.themeGradient = 'linear-gradient(135deg, #FFDEE9, #B5FFFC)';
      } else if (hour < 18){
        this.greeting = 'Good afternoon';
        this.themeGradient = 'linear-gradient(135deg, #FFF1EB, #ACE0F9)';
      } else{
        this.greeting = 'Good evening';
        this.themeGradient = 'linear-gradient(135deg, #667eea, #764ba2)';
      } 
    },

    toggleChatbot(){
      this.isChatbotOpen = !this.isChatbotOpen;
    },

    addChatMessage(message){
      this.chatHistory.push(message);
    },

    async fetchUpcomingDeadlines(){
      try{
        const response = await fetch('http://localhost:8000/api/tasks');
        if (!response.ok) throw new Error('Failed to fetch deadlines');

        const tasks = await response.json();

        this.upcomingDeadlines = tasks.map(task => ({
          ...task,
          formattedDate: this.formatDate(task.end_date),
          formattedTime: this.formatTime(task.dueTime),
          daysLeft: this.calculateDaysLeft(task.end_date),
        }));
      } catch(error){
        console.error('Error fetching upcoming deadlines:', error);
      }
    },

    resetInactivityTimer(){
      this.lastActiveTime = new Date();
      this.inactivityTime = 0;
      clearInterval(this.inactivityTimer);
      this.startInactivityTimer();
    },

    startInactivityTimer(){
      this.inactivityTimer = setInterval(()=> {
        this.inactivityTime = Math.floor((new Date() - this.lastActiveTime) / 1000);
      }, 1000);
    },

    stopInactivityTimer(){
      clearInterval(this.inactivityTimer);
    },


    formatDate(dateString){
      const date = new Date(dateString);
      if (isNaN(date.getTime())){
        return "Invalid Date";
      }
      return date.toLocaleDateString();
    },

    formatTime(timeString){
      if (!timeString) return 'No time set';

      const timeParts = timeString.split(':');
      if (timeParts.length >= 2){
        let hours = parseInt(timeParts[0]);
        const minutes = timeParts[1];
        const ampm = hours >= 12 ? 'PM': 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours}: ${minutes} ${ampm}`;
      }

      return timeString;
    },

    calculateDaysLeft(endDate){
      const today = new Date();
      const dueDate = new Date(endDate);
      const timeDifference = dueDate - today;
      const daysLeft = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
      return daysLeft > 0 ? daysLeft : 0; 
    },

    startQuoteRotation(){
      this.motivationalQuote = this.quotes[this.quoteIndex];

      this.quoteInterval = setInterval(()=> {
        this.quoteIndex = (this.quoteIndex + 1) % this.quotes.length;
        this.motivationalQuote = this.quotes[this.quoteIndex];
      }, 5000);
    },

    stopQuoteRotation(){
      clearInterval(this.quoteInterval);
      this.quoteInterval = null;
    },
  },
});