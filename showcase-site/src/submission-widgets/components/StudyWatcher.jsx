import { useState, useEffect } from 'react';
import axios from 'axios';

const StudyWatcher = ({ onStop }) => {
    const [isPhoneDetected, setIsPhoneDetected] = useState(false);
    const [minutes, setMinutes] = useState(0);
    const [seconds, setSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        let intervalId;

        if (isRunning) {
            intervalId = setInterval(async () => {
                try {
                    const response = await axios.get('http://localhost:5000/api/study-watcher/status');
                    setIsPhoneDetected(response.data.phoneDetected);
                } catch (error) {
                    console.error('Error fetching status:', error.message);
                }

                if (seconds > 0) {
                    setSeconds(seconds - 1);
                } else if (minutes > 0) {
                    setMinutes(minutes - 1);
                    setSeconds(59);
                } else {
                    clearInterval(intervalId);
                    setIsRunning(false);
                    onStop();
                    alert('Time is up!');
                }
            }, 1000);
        }

        return () => clearInterval(intervalId);
    }, [isRunning, minutes, seconds]);

    const handleStart = () => {
        if (minutes > 0 || seconds > 0) {
            setIsRunning(true);
        }
    };

    const handleReset = () => {
        setIsRunning(false);
        setMinutes(0);
        setSeconds(0);
    };

    return (
        <div>
            <div className="text-gray-500 mb-2">Monitoring your study session...</div>
            {isPhoneDetected ? (
                <div className="text-red-500">The pet noticed you are playing with your phone! 📱</div>
            ) : (
                <div className="text-green-500">You are focused! 🐱</div>
            )}
            <div className="mt-4">
                <label className="mr-2">Minutes:</label>
                <input
                    type="number"
                    value={minutes}
                    onChange={(e) => setMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                    className="p-1 border rounded"
                    disabled={isRunning}
                />
                <label className="ml-4 mr-2">Seconds:</label>
                <input
                    type="number"
                    value={seconds}
                    onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    className="p-1 border rounded"
                    disabled={isRunning}
                />
                <div className="mt-2">
                    <button
                        onClick={handleStart}
                        className="p-2 bg-blue-500 text-white rounded mr-2"
                        disabled={isRunning}
                    >
                        Start Timer
                    </button>
                    <button
                        onClick={handleReset}
                        className="p-2 bg-gray-500 text-white rounded"
                    >
                        Reset
                    </button>
                    <button
                        onClick={onStop}
                        className="p-2 bg-red-500 text-white rounded ml-2"
                    >
                        Stop Study Mode
                    </button>
                </div>
            </div>
            <div className="mt-4">
                <span className="text-2xl font-bold">
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </span>
            </div>
        </div>
    );
};

export default StudyWatcher;
