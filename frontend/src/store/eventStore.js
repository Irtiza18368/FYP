import { defineStore } from "pinia";

export const useEventStore = defineStore('eventStore', {
    state: () => ({
        events: JSON.parse(localStorage.getItem('events')) || [],
    }),
    actions:{
        addEvent(event){
            this.events.push(event);
            this.saveToLocalStorage();
        },
        deleteEvent(eventId){
            this.events = this.events.filter((event) => event.id !== eventId);
            this.saveToLocalStorage();
        },
        updateEventDates(eventId, newStart, newEnd){
            const event = this.events.find((e) => e.id === eventId);
            if (event){
                event.start = newStart;
                event.end = newEnd;
                this.saveToLocalStorage();
            }
        },
        saveToLocalStorage(){
            localStorage.setItem('events', JSON.stringify(this.events));
        },
    },
});