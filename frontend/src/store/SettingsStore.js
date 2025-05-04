import { defineStore } from "pinia";

export const useSettingsStore = defineStore('settings', {
    state:() => ({
        notifications: {
            enabled: false,
            type: 'email',
            frequency: 'daily',
            time: '08:00',
        },
        notificationTimer: null,
    }),
    actions:{
        saveSettings(){
            localStorage.setItem('settings', JSON.stringify({
                notifications: this.notifications,
            }));

            this.setupNotifications();
        },

        loadSettings(){
            if (this.notificationTimer){
                clearTimeout(this.notificationTimer);
                this.notificationTimer = null;
            }
            const savedSettings = localStorage.getItem('settings');
            if (savedSettings){
                const {notifications} = JSON.parse(savedSettings);
                this.notifications = notifications || {
                    enabled: false,
                    type: 'email',
                    frequency: 'daily',
                    time: '08:00',
                };
            }
            this.setupNotifications();
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