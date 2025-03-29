import { useEffect, useState } from 'react';

const Sidebar = ({ isAuthenticated }) => {
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
    setCheckedTodos(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
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

        <h2 className="text-yellow-300 text-lg font-bold mb-2">To-dos</h2>
            {todos.slice(0, 3).map((todo, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm mb-1">
                <div className="flex flex-col">
                <span>{todo.title}</span>
                <span className="text-xs text-yellow-200">{todo.time}</span>
                </div>
                <input
                type="checkbox"
                className="accent-yellow-400 cursor-pointer"
                checked={checkedTodos[idx] || false}
                onChange={() => toggleCheckbox(idx)}
                />
            </div>
            ))}
            {Array(Math.max(0, 3 - todos.length)).fill(null).map((_, i) => (
            <div key={`empty-todo-${i}`} className="flex items-center justify-between text-sm mb-1 opacity-50">
                <div className="flex flex-col">
                <span>—</span>
                <span className="text-xs text-yellow-200">—</span>
                </div>
                <input type="checkbox" disabled className="accent-yellow-400" />
            </div>
        ))}

      <h2 className="text-yellow-300 text-lg font-bold mt-6 mb-2">Events later</h2>
      {events.slice(0, 3).map((event, idx) => (
        <div key={idx} className="mb-4 border-b border-yellow-300 pb-1">
          <div className="font-bold text-sm">{event.title}</div>
          <div className="text-sm">{event.time}</div>
        </div>
      ))}
      {Array(Math.max(0, 3 - events.length)).fill(null).map((_, i) => (
        <div key={`empty-event-${i}`} className="mb-4 border-b border-yellow-300 pb-1 opacity-50">
          <div className="font-bold text-sm">—</div>
          <div className="text-sm">—</div>
        </div>
      ))}
    </div>
  );
};

export default Sidebar;
