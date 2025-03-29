import { useState, useEffect } from 'react';
import axios from 'axios';

import StudyWatcher from './components/StudyWatcher';
import Sidebar from './components/Sidebar';

const MyWidget = () => {
    const [message, setMessage] = useState('');
    const [response, setResponse] = useState('');
    const [isWatching, setIsWatching] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [mode, setMode] = useState('CHAT'); // 'CHAT' or 'STUDY'

    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/calendar/auth-status');
                setIsAuthenticated(res.data.isAuthenticated);
            } catch (error) {
                console.error('Error checking authentication status:', error.message);
            }
        };
        checkAuthStatus();
    }, []);

    const startWatch = async () => {
        try {
            await axios.post('http://localhost:5000/api/study-watcher/start-watch');
            setIsWatching(true);
            setMode('STUDY');
        } catch (error) {
            console.error('Error starting study mode:', error.message);
        }
    };

    const stopWatch = async () => {
        try {
            await axios.post('http://localhost:5000/api/study-watcher/stop-watch');
            setIsWatching(false);
            setMode('CHAT');
        } catch (error) {
            console.error('Error stopping study mode:', error.message);
        }
    };

    const handleChat = async () => {
        try {
            const res = await axios.post('http://localhost:5000/api/calendar/chat', { prompt: message });
            setResponse(res.data.response);
        } catch (error) {
            console.error('Error communicating with backend:', error.message);
        }
    };

    const getFormattedDate = () => {
        const date = new Date();
        const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
        const day = date.getDate();
        const month = date.toLocaleDateString('en-US', { month: 'short' });

        return `${weekday} ${day} ${month.toUpperCase()}`;
    };

    return (
        <div 
            className="relative w-[600px] h-[360px] mx-auto bg-white rounded-xl shadow-lg flex" 
            style={{ fontFamily: "'Press Start 2P', cursive" }}
        >
            {/* Main Content */}
            <div className="flex-grow p-6 space-y-4" style={{ width: '75%' }}>

                {/* Header with Date and Toggle */}
                <div className="flex justify-between items-center mb-4">
                    {/* Date */}
                    <h2 
                        className="font-bold" 
                        style={{ color: '#A43FE7', textShadow: '2px 2px 4px #FFD726', fontSize: '12px' }}
                    >
                        {getFormattedDate()}
                    </h2>
                    {/* Toggle Button */}
                    <div className="flex items-center border border-purple-500 overflow-hidden" style={{fontSize: '10px' }}>
                        <button 
                            onClick={() => { setMode('CHAT'); stopWatch(); }}
                            className={`p-1 px-4 transition-colors duration-300 ${mode === 'CHAT' ? 'bg-purple-500 text-white' : 'bg-white text-purple-500'}`}
                            style={{ borderRight: '1px solid #A43FE7' }}
                        >
                            CHAT
                        </button>
                        <button 
                            onClick={() => { setMode('STUDY'); startWatch(); }}
                            className={`p-1 px-4 transition-colors duration-300 ${mode === 'STUDY' ? 'bg-purple-500 text-white' : 'bg-white text-purple-500'}`}
                        >
                            STUDY
                        </button>
                    </div>
                </div>
    
                {/* Conditional Rendering Based on Mode */}
                {mode === 'CHAT' && (
                    <div className="mt-4">
                        {/* Chat Interface */}
                        <textarea 
                            value={message} 
                            onChange={e => setMessage(e.target.value)} 
                            placeholder="Ask your pet about tasks..." 
                            className="w-full p-2 mb-2 border rounded"
                        />
                        <button 
                            onClick={handleChat} 
                            className="p-2 bg-blue-500 text-white rounded"
                        >
                            Ask Pet
                        </button>
                        <div>Response: {response}</div>
                    </div>
                )}
    
                {mode === 'STUDY' && (
                    <div className="mt-4">
                        <StudyWatcher onStop={stopWatch} />
                    </div>
                )}
            </div>
    
            {/* Sidebar - Making sure it's not pushed */}
            <div style={{ width: '25%' }}>
                <Sidebar isAuthenticated={isAuthenticated} />
            </div>
        </div>
    );
    
};

export default MyWidget;
