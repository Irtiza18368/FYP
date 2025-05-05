import { defineStore } from "pinia";

export const useSettingsStore = defineStore('settings', {
    state:() => ({
        notifications: {
            enabled: false,
            type: 'email',
            frequency: 'daily',
            time: '08:00',
        },
        theme: {
            mode: 'dark',
            primaryColor: '#8e2de2',
            secondaryColor: '#4a00e0',
            customColors: null
        },
        notificationTimer: null,
    }),
    actions:{
        setTheme(themeConfig){
            this.theme = {...this.theme, ...themeConfig};
            this.applyTheme();
            this.saveSettings();
        },

        applyTheme(){
            if (this.theme.mode === 'system'){
                this.applySystemTheme();
            } else{
                document.documentElement.setAttribute('data-theme', this.theme.mode);
            }

            document.documentElement.style.setProperty('--primary-color', this.theme.primaryColor);
            document.documentElement.style.setProperty('--secondary-color', this.theme.secondaryColor);

        },

        applySystemTheme(){
            const prefersDark = window.matchMedia('(prefers-color-scheme:dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark': 'light');
        },

        saveSettings(){
            localStorage.setItem('settings', JSON.stringify({
                notifications: this.notifications,
                theme: this.theme
            }));

            this.setupNotifications();
            this.applyTheme();
        },

        loadSettings(){
            if (this.notificationTimer){
                clearTimeout(this.notificationTimer);
                this.notificationTimer = null;
            }

            const savedSettings = localStorage.getItem('settings');
            if (savedSettings){
                const {notifications, theme} = JSON.parse(savedSettings);
                this.notifications = notifications || {
                    enabled: false,
                    type: 'email',
                    frequency: 'daily',
                    time: '08:00',
                };
                this.theme = theme || {
                    mode: 'dark',
                    primaryColor: '#8e2de2',
                    secondaryColor: '#4a00e0'
                };
            }
            this.setupNotifications();
            this.applyTheme();
        },

        setupNotifications(){
            if (this.notifications.enabled){
                if (this.notificationTimer){
                    clearInterval(this.notificationTimer);
                }

                if (this.notifications.frequency === 'daily'){
                    this.scheduleDailyNotification();
                } else if (this.notifications.frequency === 'weekly') {
                    this.scheduleWeeklyNotification();
                } else if (this.notifications.frequency === 'custom'){
                    this.scheduleCustomNotification();
                }
            }
        },

        scheduleDailyNotification(){
            const now = new Date();
            const notificationTime = new Date(now.toDateString() + ' ' + this.notifications.time);

            if (notificationTime < now){
                notificationTime.setDate(notificationTime.getDate() + 1);
            }

            const timeUntilNotification = notificationTime - now;

            this.notificationTimer = setTimeout(() => {
                this.sendNotification();
                this.scheduleDailyNotification();
            }, timeUntilNotification);
        },

        scheduleWeeklyNotification(){
            const now = new Date();
            const notificationTime = new Date(now.toDateString() + ' ' + this.notifications.time);

            notificationTime.setDate(notificationTime.getDate() + 7);

            const timeUntilNotification = notificationTime - now;

            this.notificationTimer = setTimeout(() => {
                this.sendNotification();
                this.scheduleWeeklyNotification();
            }, timeUntilNotification);
        },

        scheduleCustomNotification(){
            const now = new Date();
            const notificationTime = new Date(now.toDateString() + ' ' + this.notifications.time);

            if (notificationTime < now){
                notificationTime.setDate(notificationTime.getDate() + 1);
            }

            const timeUntilNotification = notificationTime - now;

            this.notificationTimer = setTimeout(() => {
                this.sendNotification();
                this.scheduleCustomNotification();
            }, timeUntilNotification);
        },

        sendNotification(){
            if (this.notifications.type === 'email'){
                this.sendEmailNotification();
            } else if (this.notifications.type === 'push'){
                this.sendPushNotification();
            } else if (this.notifications.type === 'both'){
                this.sendEmailNotification();
                this.sendPushNotification();
            }
        },

        sendEmailNotification(){
            console.log('Sending email notification...');
        },

        sendPushNotification(){
            if (Notification.permission === 'granted'){
                new Notification('Reminder', {
                    body: 'This is your scheduled reminder.'
                });
            } else {
                console.warn('Push notification permission not granted.')
            }
        },
    },
});