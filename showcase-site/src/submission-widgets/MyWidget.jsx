import { useState, useEffect } from 'react';
import axios from 'axios';
import PetBounce from './MyAssets/PetBounce.gif';
import PetStare from './MyAssets/PetStare.gif'


import StudyWatcher from './components/StudyWatcher';
import Sidebar from './components/Sidebar';

const MyWidget = () => {
    const [message, setMessage] = useState('');
    const [response, setResponse] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [mode, setMode] = useState('CHAT'); // 'CHAT' or 'STUDY'
    const [time, setTime] = useState(0); // Time in seconds
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [isEditingTime, setIsEditingTime] = useState(false);
    const [inputMinutes, setInputMinutes] = useState(0);
    const [inputSeconds, setInputSeconds] = useState(0);
    const [happiness, setHappiness] = useState(0); // Ranges from 0 to 100

    const increaseHappiness = () => {
        setHappiness(prev => Math.min(prev + 20, 100)); // cap at 100
    };
    


    useEffect(() => {
        let timerInterval;

        if (isTimerRunning && time > 0) {
            timerInterval = setInterval(() => {
                setTime(prevTime => {
                    if (prevTime <= 1) {
                        clearInterval(timerInterval);
                        setIsTimerRunning(false);
                        setInputMinutes(0);
                        setInputSeconds(0);
                        
                        alert('Time is up! Study mode has ended.');
                        return 0;
                    }
                    return prevTime - 1;
                });
            }, 1000);
        }

        return () => clearInterval(timerInterval);
    }, [isTimerRunning, time]);


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

    // Start watching
    const startWatch = async () => {
        try {
            await axios.post('http://localhost:5000/api/study-watcher/start-watch');
            setMode('STUDY');
        } catch (error) {
            console.error('Error starting study mode:', error.message);
        }
    };

    // Stop watching
    const stopWatch = async () => {
        try {
            await axios.post('http://localhost:5000/api/study-watcher/stop-watch');
            setMode('CHAT');
            setIsTimerRunning(false); 
            setTime(0);  
            setInputMinutes(0);
            setInputSeconds(0);
        } catch (error) {
            console.error('Error stopping study mode:', error.message);
        }
    };

    // Stop button
    const resetTimer = () => {
        setIsTimerRunning(false);  
        setTime(0);
        setInputMinutes(0);
        setInputSeconds(0);
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
            <div className="flex-grow p-7 space-y-4 flex flex-col" style={{ width: '75%' }}>
                
                {/* Header with Date and Toggle */}
                <div className="flex justify-between items-center mb-2">
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
    
                {/* CHAT MODE */}
                {mode === 'CHAT' && (
                <>
                    {/* Pet and Bubble Centered in the Middle of the Widget */}
                    <div className="flex items-center justify-center w-full flex-grow">
                        <div className="flex items-start space-x-2">
                            {/* Pet Image */}
                            <div className="flex-shrink-0">
                                <img 
                                    src={PetBounce} 
                                    alt="pet gif" 
                                    style={{ width: '150px', height: '150px' }}
                                />
                            </div>

                            {/* Chat Bubble */}
                            <div 
                                className="bg-purple-200 text-black rounded-lg p-3 shadow-md break-words max-w-xs overflow-y-auto"
                                style={{ wordWrap: 'break-word', whiteSpace: 'pre-wrap', fontSize:'10px', maxHeight: '150px' }}
                            >
                                {response || "Hi UwU, I am Fuzzie, I'll hewp you with youw cawendaw! (๑>◡<๑)💖"}
                            </div>

                        </div>
                    </div>

                    {/* Chat Input Bar - Positioned at the Bottom of the Widget */}
                    <div 
                        className="flex items-center justify-center w-full mt-auto"
                    >
                        <div 
                            className="flex border rounded shadow-md  w-full"
                            style={{ backgroundColor: '#E3D9E9', border: '2px solid #A43FE6', height: '35px' }}
                        >
                            <textarea 
                                value={message} 
                                onChange={e => setMessage(e.target.value)} 
                                placeholder="Ask your pet about tasks..." 
                                className="w-full px-2 border-none rounded-l resize-none focus:outline-none bg-transparent flex items-center"
                                style={{ height: '100%', fontSize:'10px', display: 'flex', alignItems: 'center', paddingTop: '8px' }}
                            />
                            <button 
                                onClick={handleChat} 
                                className="flex items-center justify-center bg-[#A43FE7] rounded-r"
                                style={{ width: '30px', height: '100%' }}
                            >
                                <span style={{ color: 'white', fontSize: '16px' }}>↑</span>
                            </button>
                        </div>
                    </div>
                </>
                )}

                {mode === 'STUDY' && (
                    <div className="flex items-center justify-center w-full flex-grow">
                        <div className="flex items-start space-x-4">
                            {/* PetStare Image */}
                            <div className="flex-shrink-0">
                                <img 
                                    src={PetStare} 
                                    alt="pet stare gif" 
                                    style={{ width: '150px', height: '150px' }}
                                />
                            </div>

                            {/* Timer & StudyWatcher Section */}
                            <div className="flex flex-col items-center space-y-2">
                                {/* Timer Display */} 
                                <div 
                                    className="flex items-center space-x-1 text-2xl font-bold cursor-pointer"
                                    onClick={() => {
                                        if (!isTimerRunning) setIsEditingTime(true);
                                    }}
                                >
                                    {isEditingTime ? (
                                        <div className="flex space-x-1 items-center">
                                            <input
                                                type="number"
                                                value={inputMinutes}
                                                onChange={(e) => setInputMinutes(e.target.value)}
                                                placeholder="MM"
                                                className="w-12 text-center border border-gray-300 rounded p-1 text-sm"
                                                autoFocus
                                            />
                                            <span>:</span>
                                            <input
                                                type="number"
                                                value={inputSeconds}
                                                onChange={(e) => setInputSeconds(e.target.value)}
                                                placeholder="SS"
                                                className="w-12 text-center border border-gray-300 rounded p-1 text-sm"
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <span>{String(Math.floor(time / 60)).padStart(2, '0')}</span>
                                            <span>:</span>
                                            <span>{String(time % 60).padStart(2, '0')}</span>
                                        </>
                                    )}
                                </div>

                                {/* Timer Control Buttons */}
                                <div className="flex space-x-2 mt-2">
                                    {!isTimerRunning && time > 0 ? (
                                        <>
                                            <button 
                                                onClick={() => setIsTimerRunning(true)}
                                                className="bg-green-500 text-white rounded"
                                                style={{ width: '50px', height: '50px', alignItems: 'center', justifyContent: 'center'  }}
                                            >
                                                ▶️
                                            </button>
                                            <button 
                                                onClick={resetTimer}  // Use the new function here
                                                className="bg-red-500 text-white rounded"
                                                style={{ width: '50px', height: '50px', alignItems: 'center', justifyContent: 'center'  }}
                                            >
                                                ⏹
                                            </button>
                                        </>
                                    ) : !isTimerRunning && time === 0 ? (
                                        <button 
                                            onClick={() => {
                                                const parsedMinutes = parseInt(inputMinutes, 10);
                                                const parsedSeconds = parseInt(inputSeconds, 10);
                                                if (!isNaN(parsedMinutes) && parsedMinutes >= 0 && 
                                                    !isNaN(parsedSeconds) && parsedSeconds >= 0) {
                                                    const total = (parsedMinutes * 60) + parsedSeconds;
                                                    setTime(total);
                                                    if (total > 0) {
                                                        setIsTimerRunning(true);
                                                    }
                                                }
                                                setIsEditingTime(false);
                                            }}
                                            className="bg-blue-500 text-white rounded"
                                            style={{ width: '50px', height: '50px', alignItems: 'center', justifyContent: 'center'  }}
                                        >
                                            ▶
                                        </button>
                                    ) : (
                                        <>
                                            <button 
                                                onClick={() => setIsTimerRunning(false)}
                                                className="bg-yellow-500 text-white rounded"
                                                style={{ width: '50px', height: '50px', alignItems: 'center', justifyContent: 'center'  }}
                                            >
                                                ⏸
                                            </button>
                                            <button 
                                                onClick={resetTimer}  // Use the new function here
                                                className="bg-red-500 text-white rounded"
                                                style={{ width: '50px', height: '50px', alignItems: 'center', justifyContent: 'center'  }}
                                            >
                                                ⏹
                                            </button>
                                        </>
                                    )}
                                </div>
                {/* StudyWatcher Component */}
                <StudyWatcher onStop={stopWatch}/>
            </div>
        </div>
    </div>
                )}
{/* Happiness Meter */}
<div className="w-full mt-2">
    <div className="text-[10px] font-bold mb-1 text-purple-700">Pet Happiness</div>
    <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
        <div 
            className="h-full bg-yellow-400 transition-all duration-300"
            style={{ width: `${happiness}%` }}
        ></div>
    </div>
</div>


            </div>
    
            {/* Sidebar  */}
            <div style={{ width: '25%' }}>
            <Sidebar isAuthenticated={isAuthenticated} onTodoComplete={increaseHappiness} />

            </div>
        </div>
    );
    
};

export default MyWidget;
