import { useState } from 'react';
import axios from 'axios';

const MyWidget = () => {
    const [message, setMessage] = useState('');
    const [response, setResponse] = useState('');

    const authenticateUser = () => {
        window.location.href = 'http://localhost:5000/api/calendar/auth';
    };

    const handleChat = async () => {
        try {
            const res = await axios.post('http://localhost:5000/api/calendar/chat', { prompt: message });
            setResponse(res.data.response);
        } catch (error) {
            console.error('Error communicating with backend:', error.message);
        }
    };

    return (
        <div className="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-lg space-y-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Your Virtual Pet</h2>
            
            {/* Google Authentication */}
            <button onClick={authenticateUser}>
                Link Your Google Calendar
            </button>

            {/* Chat Interface */}
            <div className="mt-4">
                <textarea 
                    value={message} 
                    onChange={e => setMessage(e.target.value)} 
                    placeholder="Ask your pet about tasks..." 
                />
                <button onClick={handleChat}>Ask Pet</button>
                <div>Response: {response}</div>
            </div>
        </div>
    );
};

export default MyWidget;
