import './VolunteerCalendar.scss';
import 'react-big-calendar'
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

import axios from 'axios';
import moment from "moment";
import React, { useState } from 'react';
import { Calendar, momentLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";

import { backendPath } from '../../config';

const DDCalendar = withDragAndDrop(Calendar);
const localizer = momentLocalizer(moment);

const user = 49;

/*
@desc - Check if JS Date object is a valid date
@param - date, a js date object
@return - boolean
 */
function dateValid(date) {
    if (date instanceof Date && !isNaN(date.valueOf())) {
        return true;
    }
    return false;
}

/* TODO: CSS Updates
/* TODO: BUGS....
*      ------ DATE/TIME ISSUES ------
*       BUG: Sometimes events double up over two days for no clear reason - I think related to issue below
*       BUG: Times when loaded out of the backend are different from the when they were saved in the backend - python JS date issues
*       ----- AWAIT / AYSNC ISSUES -----
*       BUG: On first delete of duplicate event it will double the number of events instead of deleting
*       BUG: Sometimes you have to click submit twice to add repeating events (and sometimes it appears twice when submitting)
*       ---- UNKNOWN CAUSE ----
*       BUG: sometimes you delete a repeating event but it duplicates instead
 */


/*
-------------- MAIN FUNCTION ----------------------
 */
const VolunteerCalendar = () => {

    /*
    @desc - Create a calendar event, and adds it to the backend DB
    @param - title/name of event, date as HTML date picker output, start time as an int, end time as an int
    @return - new event object, & side effect creates backend DB entry
     */
    const [eventID, setEventID] = useState('');
    function createEvent(eventTitle, eventDate, eventStartTime, eventEndTime, eventRepeatStatus, allDayStatus) {

        /* Split the date input yyyy-mm-dd into year, month, day so it can easily be used by the calendar */
        const splitDate = eventDate.split('-');
        const year = parseInt(splitDate[0]);
        const month = parseInt(splitDate[1]) - 1; /* JS Date constructor is indexed from zero (months 0-11) but HTML starts at 1 (months 1-12) so subtract 1 to account for this */
        const day = parseInt(splitDate[2]);

        /* creation of the new event object */
        let newEvent = {};
        if (allDayStatus){
            newEvent = {
            userId: user,
            title: eventTitle,
            start: new Date(year, month, day),
            end: new Date(year, month, day),
            periodicity: eventRepeatStatus
            }
        }
        else {
            newEvent = {
                userId: user,
                title: eventTitle,
                start: new Date(year, month, day, Number(eventStartTime)),
                end: new Date(year, month, day, Number(eventEndTime)),
                periodicity: eventRepeatStatus
            }
        }

        if(dateValid(newEvent.start) && (allDayStatus || newEvent.start < newEvent.end)){ /* checks if time block is valid before adding it to DB */
            //newEvent.date = moment.format(newEvent.date);
            axios.post(backendPath + 'unavailability/createUnavailableEvent', newEvent).then((response) => {
                setEventID(response.data['eventId']);
            });
            newEvent.eventId = eventID; /* Adds eventId to event object */
        }

        return newEvent;
    }

    /*
    * @desc - creates all the events that are repeating items
    * @param - An event
    * @return - An array of events
    */
    function repeatEvent(event) {
        let newEvents = [];
        switch (event.periodicity) {
            case 1:
                for (let i = 1; i < 90; i++) {
                    let tempStart = moment(event.start.getTime());
                    tempStart.add(i, 'days');
                    let tempEnd = moment(event.end.getTime());
                    tempEnd.add(i, 'days');

                    let tempEvent = {
                        userId: event.userId,
                        title: event.title,
                        start: tempStart.toDate(),
                        end: tempEnd.toDate(),
                        periodicity: event.periodicity,
                        eventId: event.eventId,
                    }
                    newEvents.push(tempEvent);
                }
                break;
            case 2:
                for (let i = 7; i < 90; i+=7) {
                    let tempStart = moment(event.start.getTime());
                    tempStart.add(i, 'days');
                    let tempEnd = moment(event.end.getTime());
                    tempEnd.add(i, 'days');
                    let tempEvent = {
                        userId: event.userId,
                        title: event.title,
                        start: tempStart.toDate(),
                        end: tempEnd.toDate(),
                        periodicity: event.periodicity,
                        eventId: event.eventId,
                    }
                    newEvents.push(tempEvent);
                }
                break;
            case 3:
                for (let i = 1; i < 4; i++) {
                    let tempStart = moment(event.start.getTime());
                    tempStart.add(i, 'months');
                    let tempEnd = moment(event.end.getTime());
                    tempEnd.add(i, 'months');

                    let tempEvent = {
                        userId: event.userId,
                        title: event.title,
                        start: event.toDate(),
                        end: tempEnd.toDate(),
                        periodicity: event.periodicity,
                        eventId: event.eventId,
                    }
                    newEvents.push(tempEvent);
                }
                break;
            default:
                break;
        }
        return newEvents;
    }

    /*
    * @desc - removes an event from the calendar (backend + frontend)
    * @param - An event
    * @return - Nothing
    */
    function deleteEventDB(event) {
        /* Delete from backend DB */
        axios.get(backendPath + 'unavailability/removeUnavailableEvent?eventId=' + event.eventId + '&userId=' + event.userId).then((response) => {
                console.log(response.data[0]);
        }).catch(function (error) {
            console.log(error);
        });

        /* Front end deletion */
        let blocksToChange = [...blocks];
        let idx = blocks.indexOf(event);
        blocksToChange.splice(idx, 1); /* remove event from array */
        setBlocks(blocksToChange);
    }

    // TODO: Function to bring repeating events up to date - may not need if backend implements this functionality
    // function updateRepeatEventInDB() {
    //     let currentMonth = new Date().getMonth();
    //     blocks.forEach(function(element) {
    //         if (element.periodicity > 0){
    //             if(element.start.getMonth() < (currentMonth - 2) || (element.start.getMonth() >= 11 && CurrentMonth < 3)){
    //                  element.setMonth(currentMonth - 1);
    //                  Delete element from DB
    //                  Add element to DB
    //                  Essentially do same thing DragDrop handler does
    //             }
    //         }
    //     });
    // }

    /*
    * @desc - Reloads the events in the frontend calendar from the backend and causes the repeating events to be duplicated on the frontend
    * @return - Nothing
    */
    // async function loadEvents() {
    //     const response = await axios.get(backendPath + 'unavailability/showUnavailableEvent?userId='+user)
    //     let temp = response.data
    //     temp.forEach(function(element) { /* Converting date format to JS Date objects which React-Big-Calendar requires */
    //         element.start = moment(element.start).toDate();
    //         element.end = moment(element.end).toDate();
    //     });
    // }


    /* --- INITIALISE --- */

    /* Load Events from database on page initial render */
    const [blocks, setBlocks] = useState('');

    /* Init the calendar */
    React.useEffect(() => {
        axios.get(backendPath + 'unavailability/showUnavailableEvent?userId='+user).then((response) => {
            let temp = response.data;
            let tempRepeats = [];
            temp.forEach(function(element) { /* Converting date format to JS Date objects which React-Big-Calendar requires */
                element.start = moment(element.start).toDate();
                element.end = moment(element.end).toDate();

                if(element.periodicity > 0){
                    tempRepeats = tempRepeats.concat(repeatEvent(element));
                }
            });
            console.log(tempRepeats);
            console.log(temp.concat(tempRepeats));
            setBlocks(temp.concat(tempRepeats));
        });
    }, []);

    /* --- HANDLERS --- */

    /* Drag and Drop functionality */
    const handleEventChange = ({event, start, end}) => {
        const updatedBlock = { ...event, start, end };

        /* Delete from backend DB */
        axios.get(backendPath + 'unavailability/removeUnavailableEvent?eventId=' + event.eventId + '&userId=' + event.userId).then((response) => {
                console.log(response.data[0]);
        }).catch(function (error) {
            console.log(error);
        });

        /* replace with new event in backend DB */
        axios.post(backendPath + 'unavailability/createUnavailableEvent', updatedBlock).then((response) => {
            setEventID(response.data['eventId']);
        });
        updatedBlock.eventId = eventID;

        /* Front end deletion */
        let blocksToChange = [...blocks];
        let idx = blocks.indexOf(event);
        blocksToChange.splice(idx, 1, updatedBlock); /* remove event from array */

        /* Update Frontend Calendar */
        if (event.periodicity != 0) {
            // loadEvents(); // Reload page to capture repeating events
            setBlocks(blocksToChange);
        }
        else {
            setBlocks(blocksToChange);
        }
    }

    /* Init the variables for the form (stateful) */
    const [state, setState] = useState({
        title: "",
        startTime: "",
        endTime: "",
        repeat: "0",
        allDay: false,
        date: "",
    });

    /* Function handles changes to the state of the form */
    const handleChange = e => {
        console.log(state);

        /* Sets the state based on changes */
        setState({
            ...state,
            [e.target.name]: e.target.type === "checkbox" ? e.target.checked : e.target.value, /* Check boxes require a different value than other values, this allows for that. Otherwise would just use "[e.target.name]: e.target.value" */
        });
    };

    /* for hiding the time inputs */
    const hidden = state.allDay ? 'hidden' : '';

    /* Form submission functionality */
    function submit(e) {
        e.preventDefault();

        /* create new event */
        let newBlock = createEvent(state.title, state.date, state.startTime, state.endTime, state.repeat, state.allDay);

        if (dateValid(newBlock.start)) { /* If date value is valid and start time is before end time*/
            if (state.allDay || (newBlock.start < newBlock.end)) {
                if (newBlock.periodicity > 0) {
                    setBlocks([...blocks, newBlock]);
                }
                else {
                    setBlocks([...blocks, newBlock]); /* add new event to calendar (frontend)*/
                }
            }
        }
    }

    /* This is the event handler for clicking on a time block */
    const handleSelectedEvent = (event) => {
        if (confirm("Delete " + event.title)) { /* JS Confirmation window prompt, returns true if yes is clicked */

            //let repeat = event.periodicity;
            /* Delete from backend DB */
            deleteEventDB(event);

            // if (repeat > 0){
            //     loadEvents();
            // }

        }
    }
    /* NOTE: Alternative to the JS confirmation window we could also do a React popup/modal, this is significantly more complicated but would allow for the implementation of editing name/recurring. For now we shall leave like this, but it is a possible future improvement for sure... */

    /* HTML OF PAGE */
    return (
        <div className='grid-container'>

            {/* Header */}
            <div className='calHeader'>
                <h1>Calendar</h1>
                {/* FUTURE: I  want to change this to "User X's Calendar" */}
            </div>

            {/* Calendar */}
            <div className='calendar-body'>
                <DDCalendar
                    localizer={localizer}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '80vh' }}
                    events={blocks}
                    selectable={true}
                    onEventDrop={handleEventChange}
                    onEventResize={handleEventChange}
                    onSelectEvent={handleSelectedEvent} /* Event for when timeblock is clicked on */
                />
            </div>

            {/* SideBar / Form */}
            <div className='calForm'>

                {/* Border and styling of the form */}
                <form
                    className={'mt6 w-75 ml-auto mr-auto ba br2 b--black-10 pa2'}
                    onSubmit={submit}>
                    {/* Calls submit function when submit button at bottom of form is pressed */}

                    {/* Heading of form */}
                    <h2>Enter your unavailability</h2>

                    {/* Textbox for timeslot/block name/title */}
                    <div className="form-group">
                        <label htmlFor={'Name'}>Title: </label>
                        <input
                            className={'form-control'}
                            type="text"
                            name="title"
                            value={state.title}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Checkbox for all day events */}
                    <div className="form-group">
                        <label htmlFor={'allday'}>Toggle All Day:</label>
                        <input
                            type="checkbox"
                            name="allDay"
                            checked={state.allDay}
                            onChange={(handleChange)}
                        />
                   </div>

                    {/* Repeating Options */}
                    <div className="form-group">
                      <label htmlFor="repeat">Repeats:</label>
                      <select id="repeats" name="repeat"
                        value={state.repeat}
                        onChange={handleChange}>
                        <option value="0">None</option>
                        <option value="1">Daily</option>
                        <option value="2">Weekly</option>
                        <option value="3">Monthly</option>v
                      </select>
                    </div>

                    <div className={hidden}> {/* For hiding this when all day is pressed */}
                        {/* Start Time*/}
                        <div className="form-group">
                          <label htmlFor="startTime">Choose a Start Time:</label>
                          <select id="startTime" name="startTime"
                            value={state.startTime}
                            onChange={handleChange}>
                            <option value="0">12:00 AM</option>
                            <option value="1">1:00 AM</option>
                            <option value="2">2:00 AM</option>
                            <option value="3">3:00 AM</option>
                            <option value="4">4:00 AM</option>
                            <option value="5">5:00 AM</option>
                            <option value="6">6:00 AM</option>
                            <option value="7">7:00 AM</option>
                            <option value="8">8:00 AM</option>
                            <option value="9">9:00 AM</option>
                            <option value="10">10:00 AM</option>
                            <option value="11">11:00 AM</option>
                            <option value="12">12:00 AM</option>
                            <option value="13">1:00 PM</option>
                            <option value="14">2:00 PM</option>
                            <option value="15">3:00 PM</option>
                            <option value="16">4:00 PM</option>
                            <option value="17">5:00 PM</option>
                            <option value="18">6:00 PM</option>
                            <option value="19">7:00 PM</option>
                            <option value="20">8:00 PM</option>
                            <option value="21">9:00 PM</option>
                            <option value="22">10:00 PM</option>
                            <option value="23">11:00 PM</option>
                          </select>
                        </div>

                        {/* ISSUE: Could not get half hour options to work. */}

                        {/* End Time*/}
                        <div className="form-group">
                          <label htmlFor="endTime">Choose a End Time:</label>
                          <select id="endTime" name="endTime"
                            value={state.endTime}
                            onChange={handleChange}>
                            <option value="1">1:00 AM</option>
                            <option value="2">2:00 AM</option>
                            <option value="3">3:00 AM</option>
                            <option value="4">4:00 AM</option>
                            <option value="5">5:00 AM</option>
                            <option value="6">6:00 AM</option>
                            <option value="7">7:00 AM</option>
                            <option value="8">8:00 AM</option>
                            <option value="9">9:00 AM</option>
                            <option value="10">10:00 AM</option>
                            <option value="11">11:00 AM</option>
                            <option value="12">12:00 AM</option>
                            <option value="13">1:00 PM</option>
                            <option value="14">2:00 PM</option>
                            <option value="15">3:00 PM</option>
                            <option value="16">4:00 PM</option>
                            <option value="17">5:00 PM</option>
                            <option value="18">6:00 PM</option>
                            <option value="19">7:00 PM</option>
                            <option value="20">8:00 PM</option>
                            <option value="21">9:00 PM</option>
                            <option value="22">10:00 PM</option>
                            <option value="23">11:00 PM</option>
                            <option value="24">12:00 PM</option>
                          </select>
                        </div>
                    </div>

                    {/* Date */}
                    <div className="form-group">
                      <label htmlFor="startTime">Choose a Date:</label>
                      <input type="date" id="date" name="date"
                        value={state.date}
                        onChange={handleChange}
                    />
                    </div>

                    {/* Submit Button */}
                    <input
                      type="submit"
                      value="Submit"
                      className={'btn bg-light-red pv2 ph3 br2 b near-white dim'}
                    />
                </form>
            </div>
        </div>
    );
};

export default VolunteerCalendar;