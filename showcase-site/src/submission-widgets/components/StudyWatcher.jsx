import { useState, useEffect } from 'react';
import axios from 'axios';

const StudyWatcher = ({ onStop }) => {
    const [isPhoneDetected, setIsPhoneDetected] = useState(false);

    useEffect(() => {
        let intervalId = setInterval(async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/study-watcher/status');
                setIsPhoneDetected(response.data.phoneDetected);
            } catch (error) {
                console.error('Error fetching status:', error.message);
            }
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    return (
        <div>
            {isPhoneDetected ? (
                <div className="text-red-500">The pet noticed you are playing with your phone! 📱</div>
            ) : (
                <div className="text-green-500">You are focused! 🐱</div>
            )}
        </div>
    );
};

export default StudyWatcher;
