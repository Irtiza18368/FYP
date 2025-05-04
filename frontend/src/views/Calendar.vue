<template>
  <div class="container mt-4">
    <h2>Calendar</h2>

    <!--Event Form-->
    <div class="mb-3">
      <input v-model="newEvent.title" placeholder="Event Title" class="form-control mb-2" />
      <input v-model="newEvent.startDate" type="date" class="form-control mb-2" placeholder="Start Date" />
      <input v-model="newEvent.endDate" type="date" class="form-control mb-2" placeholder="End Date" />
      <button @click="addEvent" class="btn btn-primary">Add Event</button>
    </div>

    <!--Calendar-->
    <FullCalendar :options="calendarOptions" />

    <!--Glassmorphic Modal-->
    <div v-if="selectedEvent" class="glass-modal">
      <div class="glass-content">
        <h2>{{ selectedEvent.title }}</h2>
        <p><strong>Start Date:</strong>{{ selectedEvent.start }}</p>
        <p><strong>End Date:</strong>{{ selectedEvent.end }}</p>
        <div class="mt-3">
          <button class="btn btn-warning me-2" @click="editEvent(selectedEvent)">Edit</button>
          <button class="btn btn-danger" @click="deleteEvent(selectedEvent.id)">Delete</button>
          <button class="btn btn-secondary ms-2" @click="selectedEvent = null">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="js">


import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useEventStore } from '../store/eventStore';

export default{
  components: {
    FullCalendar
  },
  data(){
    return{
      newEvent: {
        title: '',
        startDate: '',
        endDate: '',
      },
      selectedEvent: null,
    };
  },
  setup(){
    const eventStore = useEventStore();

    return{
      eventStore,
    };
  },
  computed:{
    calendarOptions(){
      return{
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
        initialView: 'dayGridMonth',
        events: this.eventStore.events,
        editable: true,
        selectable: true,
        select: this.handleDateSelect,
        eventClick: this.handleEventClick,
        eventDrop: this.updateEventDates,
      };
    },
  },
  methods: {
    getRandomColor(){
      const letters = '0123456789ABCDEF';
      let color= '#';
      for (let i=0; i< 6; i++){
        color += letters[Math.floor(Math.random()* 16)];
      }
      return color;
    },
    addEvent(){
      if (this.newEvent.title && this.newEvent.startDate && this.newEvent.endDate){
        const event = {
          title: this.newEvent.title,
          start: this.newEvent.startDate,
          end: this.newEvent.endDate,
          backgroundColor: this.getRandomColor(),
          id: Date.now().toString(),
        };
        
        
        this.eventStore.addEvent(event);

        //Reset Form
        this.newEvent.title = '';
        this.newEvent.startDate = '';
        this.newEvent.endDate = '';
        this.newEvent.category = '';
      }
    },

    handleDateSelect(selection){
      this.newEvent.startDate = selection.startStr;
      this.newEvent.endDate = selection.endStr;
    },


    handleEventClick(info){
      this.selectedEvent = {
        id: info.event.id,
        title: info.event.title,
        start: info.event.startStr,
        end: info.event.endStr,
      };
    },
    deleteEvent(id){
      this.eventStore.deleteEvent(id);
      this.selectedEvent = null;
    },
    editEvent(event){
      this.newEvent.title = event.title;
      this.newEvent.startDate = event.start;
      this.newEvent.endDate = event.end;
      this.eventStore.deleteEvent(event.id);
      this.selectedEvent = null;
    },
    updateEventDates(eventDropInfo){
      this.eventStore.updateEventDates(
        eventDropInfo.event.id,
        eventDropInfo.event.startStr,
        eventDropInfo.event.endStr,
      );
    },
  },
};

</script>

<style>

.container{
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

/* Calendar Typography and Font */
.fc{
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 1rem;
  color: #f5f5f5;
}

/* Header with glass and gradient */
.fc-header-toolbar{
  background-color: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  color: black;
  padding: 16px;
  border-radius: 16px;
  margin-bottom: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

/* Grid for Days */
.fc-daygrid-day{
  transition: background-color 0.3s ease;
  background-color: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.fc-daygrid-day:hover{
  background-color: rgba(255, 255, 255, 0.15);
}

/* Events styling */
.fc-event{
  transition: transform 0.2s ease-in-out;
  border: none;
  color: white;
  padding: 6px;
  border-radius: 12px;
  font-weight: 600;
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  transition: transform 0.2s ease-in-out;
  animation: popIn 0.3s ease-in;
}

@keyframes popIn{
  from{ transform: scale(0.8); opacity: 0;}
  to{ transform: scale(1); opacity: 1;}
}

.fc-event:hover{
  transform: perspective(600px) rotateY(5deg);
}

/* Buttons */
.fc-button, .btn-primary{
  background: linear-gradient(135deg, #4a90e2, #6a82fb);
  border: none;
  color: white;
  padding: 8px 14px;
  border-radius: 12px;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  transition: background 0.3s ease, transform 0.2s ease;
}

.fc-button:hover, .btn-primary:hover{
  background: linear-gradient(135deg, #6a82fb, #4a90e2);
  transform: translateY(-2px);
}

.fc-day-today{
  border: 2px solid #00ffe0;
  box-shadow: 0 0 10px #00ffe0;
  animation: pulse 1.5s infinite;
}

@keyframes pulse{
  0% {box-shadow: 0 0 10px #00ffe0;}
  50% {box-shadow: 0 0 20px #00ffe0;}
  100% {box-shadow: 0 0 10px #00ffe0;}
}

.btn-primary{
  padding: 10px 16px;
  border-radius: 14px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.25);
}

.btn-primary:hover{
  transform: scale(1.03);
}

/* Responsive Enhancements */
@media (max-width: 768px) {
  .fc-header-toolbar {
    flex-direction: column;
    gap: 10px;
  }

  input.form-control {
    font-size: 0.95rem;
  }

  .btn-primary {
    width: 100%;
    font-size: 1rem;
  }
}

.glass-modal{
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backdrop-filter: blur(10px);
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.glass-content{
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  padding: 2rem;
  border-radius: 20px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  color: white;
  text-align: center;
  animation: fadeInScale 0.3s ease;
}

@keyframes fadeInScale{
  from{
    transform: scale(0.8);
    opacity: 0;
  }
  to{
    transform: scale(1);
    opacity: 1;
  }
}
</style>