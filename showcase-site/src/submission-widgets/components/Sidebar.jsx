import { useEffect, useState } from 'react';
import axios from 'axios';

const Sidebar = ({ isAuthenticated, onTodoComplete }) => {

  const [todos, setTodos] = useState([]);
  const [events, setEvents] = useState([]);
  const [checkedTodos, setCheckedTodos] = useState({});

  const authenticateUser = () => {
    window.location.href = 'http://localhost:5000/api/calendar/auth';
  };

  const parseEvents = (responseText) => {
    const lines = responseText
      .split('\n')
      .filter(line => line.trim() && !line.toLowerCase().includes('looks wike you haz'));

    const todoList = [];
    const eventList = [];

    lines.forEach((line) => {
      const [timePart, ...rest] = line.split(' — ');
      const title = rest[0]?.trim();
      const description = rest.slice(1).join(' ').toLowerCase();

      const entry = {
        time: timePart.trim(),
        title,
      };

      if (description.includes('priority') || description.includes('compulsory')) {
        todoList.push(entry);
      } else {
        eventList.push(entry);
      }
    });

    setTodos(todoList);
    setEvents(eventList);
    // Reset checkboxes
    const initialCheckboxState = {};
    todoList.forEach((todo, i) => {
      initialCheckboxState[i] = false;
    });
    setCheckedTodos(initialCheckboxState);
  };

  const toggleCheckbox = (index) => {
    setCheckedTodos(prev => {
      const updatedChecked = { ...prev, [index]: true };

      const todoToDelete = todos[index];

      // Send cute delete message to chat API
      const sendDeletePrompt = async () => {
        try {
          const message1 = `Heya cutie~! Can you pwease dewete the event cawwed \"${todoToDelete.title}\" fwom 30 March 2025, nya~? ✨💖`;
          const message2 = `${todoToDelete.title}`;

          await axios.post('http://localhost:5000/api/calendar/chat', { prompt: message1 });
          await new Promise(resolve => setTimeout(resolve, 3000));
          await axios.post('http://localhost:5000/api/calendar/chat', { prompt: message2 });
        } catch (err) {
          console.error('Failed to send delete message:', err);
        }
      };

      sendDeletePrompt();
  
      // Wait 0.5s, then remove todo and untick
      setTimeout(() => {
        setTodos(prevTodos => {
          const updated = [...prevTodos];
          updated.splice(index, 1);
          return updated;
        });
  
        setCheckedTodos(prevChecked => {
          const resetChecked = { ...prevChecked };
          delete resetChecked[index]; // Or set to false if you prefer
          return resetChecked;
        });
  
        onTodoComplete?.();
      }, 1000);
  
      return updatedChecked;
    });
  };
  

  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/calendar/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: 'What do I have on 30 March?' }),
        });

        const data = await res.json();
        parseEvents(data.response);
      } catch (err) {
        console.error('Fetch error:', err);
      }
    };

    fetchCalendar();
  }, []);

  return (
    <div
      className="h-full w-[216px] rounded-r-xl flex flex-col px-4 py-6 text-white font-mono"
      style={{ backgroundColor: '#A43FE7' }}
    >
      {!isAuthenticated && (
        <button onClick={authenticateUser} className="mb-4 p-2 bg-yellow-500 text-black rounded">
          Link Your Google Calendar
        </button>
      )}

      {isAuthenticated && (
        <>
<h2 className="text-yellow-300 text-lg font-bold">To-dos</h2>

          {todos.length === 0 && (
            <div className="text-sm italic text-yellow-200 opacity-80">
              No to-dos for today~ ✨
            </div>
          )}

        {todos.slice(0, 3).map((todo, idx) => (
          <div key={idx} className="grid grid-cols-[1fr_auto] items-center w-full text-sm mb-1">
            <div className="pr-2 overflow-hidden">
              <span className="block truncate">{todo.title}</span>
            </div>
            <input
              type="checkbox"
              className="accent-yellow-400 cursor-pointer justify-self-end"
              checked={checkedTodos[idx] || false}
              onChange={() => toggleCheckbox(idx)}
            />
          </div>
        ))}

        {todos.length > 3 && (
          <div className="text-xs text-yellow-100 italic">
            + {todos.length - 3} more…
          </div>
        )}


          <h2 className="text-yellow-300 text-lg font-bold mt-3">Events later</h2>

          {events.length === 0 && (
            <div className="text-sm italic text-yellow-200 opacity-80">
              No events for today~ 🎉
            </div>
          )}

          {events.slice(0, 3).map((event, idx) => (
            <div key={idx} className="mb-2 border-b border-yellow-300 pb-1">
              <div className="font-bold text-sm truncate overflow-hidden whitespace-nowrap">{event.title}</div>
              <div className="text-xs truncate overflow-hidden whitespace-nowrap">{event.time}</div>
            </div>
          ))}

          {events.length > 3 && (
            <div className="text-xs text-yellow-100 italic">+ {events.length - 3} more…</div>
          )}
        </>
      )}


    </div>
  );
};

export default Sidebar;
