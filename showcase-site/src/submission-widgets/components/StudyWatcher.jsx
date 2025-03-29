import { useState, useEffect } from 'react';
import axios from 'axios';
import alertSound from '../MyAssets/phone_detected.mp3';


const StudyWatcher = ({ onStop }) => {
    const [isPhoneDetected, setIsPhoneDetected] = useState(false);
    const audio = new Audio(alertSound);

    useEffect(() => {
        let intervalId = setInterval(async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/study-watcher/status');
                const phoneDetected = response.data.phoneDetected;

                if (phoneDetected && !isPhoneDetected) { // If phone is detected and was not previously detected
                    audio.play();  // Play the audio file
                }

                setIsPhoneDetected(phoneDetected);
            } catch (error) {
                console.error('Error fetching status:', error.message);
            }
        }, 1000);

        return () => clearInterval(intervalId);
    }, [isPhoneDetected]);  // Include isPhoneDetected to trigger reactivity

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
