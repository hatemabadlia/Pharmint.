import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { useTheme } from "../context/ThemeContext"; // 🔑 Import useTheme

// Mocking confetti for standalone compilation
const mockConfetti = (options) => console.log("Mock Confetti Fired:", options);
const confettiLib = typeof confetti !== 'undefined' ? confetti : mockConfetti;

// ❌ Mocking unresolved audio import
// const beepSound = "https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg";

const PomodoroTimer = () => {
  // 🔑 Get theme state
  const { theme } = useTheme(); 

  const getInitialSettings = () => {
    // Adding try-catch for localStorage safety
    try {
      const saved = localStorage.getItem("pomodoroSettings");
      return saved
        ? JSON.parse(saved)
        : { pomodoro: 20, rest: 5, longRest: 15 };
    } catch (e) {
      console.error("Failed to read pomodoro settings from localStorage", e);
      return { pomodoro: 20, rest: 5, longRest: 15 };
    }
  };

  const [settings, setSettings] = useState(getInitialSettings);
  const [timeLeft, setTimeLeft] = useState(settings.pomodoro * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState("Pomodoro");
  const intervalRef = useRef(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);

  // 🔔 Mock Audio Ref (since URL is external)
  const audioRef = useRef({ play: () => console.log("Mock Beep!") }); 
  // const audioRef = useRef(new Audio(beepSound)); // Uncomment if beepSound URL is allowed

  useEffect(() => {
    // Adding try-catch for localStorage safety
    try {
      localStorage.setItem("pomodoroSettings", JSON.stringify(settings));
    } catch (e) {
      console.error("Failed to save pomodoro settings to localStorage", e);
    }
  }, [settings]);

  // Update timeLeft when settings change if timer is not running
  useEffect(() => {
      if (!isRunning) {
          const modeKey = mode === "Pomodoro" ? 'pomodoro' : mode === "Rest" ? 'rest' : 'longRest';
          setTimeLeft(settings[modeKey] * 60);
      }
  }, [settings, mode, isRunning]);


  useEffect(() => {
    if (isRunning && timeLeft > 0) { // Check timeLeft > 0 here
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev > 1) return prev - 1; // Decrement normally

          // When timeLeft reaches 1, next interval it will be 0
          clearInterval(intervalRef.current);
          triggerEndEffects();
          // Schedule the next mode switch after a brief pause
          setTimeout(() => {
            handleNext();
          }, 500); // 500ms delay before switching
          return 0; // Set timeLeft to 0
        });
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
        // This case handles if the timer somehow ends up at 0 while running
        // It shouldn't normally happen with the logic above, but as a fallback:
        clearInterval(intervalRef.current);
        setIsRunning(false);
    }
    
    // Cleanup function
    return () => clearInterval(intervalRef.current);
  }, [isRunning, timeLeft]); // Add timeLeft to dependency array

  const handleStartPause = () => {
      // If timer is at 0, reset before starting
      if (timeLeft === 0 && !isRunning) {
          const modeKey = mode === "Pomodoro" ? 'pomodoro' : mode === "Rest" ? 'rest' : 'longRest';
          setTimeLeft(settings[modeKey] * 60);
      }
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    const modeKey = mode === "Pomodoro" ? 'pomodoro' : mode === "Rest" ? 'rest' : 'longRest';
    setTimeLeft(settings[modeKey] * 60);
  };

  const handleNext = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false); // Ensure timer stops

    let nextMode = "";
    let nextTime = 0;

    if (mode === "Pomodoro") {
      nextMode = "Rest";
      nextTime = settings.rest * 60;
    } else if (mode === "Rest") {
       nextMode = "Long Rest";
       nextTime = settings.longRest * 60;
    } else { // Was Long Rest
       nextMode = "Pomodoro";
       nextTime = settings.pomodoro * 60;
    }
    
    setMode(nextMode);
    setTimeLeft(nextTime);
    // Do not auto-start the next timer
  };

  // 🎉 Trigger effects when timer ends
  const triggerEndEffects = () => {
    audioRef.current.play(); // play sound
    setShowCongrats(true); // show message
    fireConfetti(); // launch confetti
    setTimeout(() => setShowCongrats(false), 4000);
  };

  // 🎆 Confetti function
  const fireConfetti = () => {
    confettiLib({ // Use the library or the mock
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Calculate total time for the current mode based on settings
  const totalDuration = (mode === "Pomodoro" ? settings.pomodoro : mode === "Rest" ? settings.rest : settings.longRest) * 60;
  // Prevent division by zero if totalDuration is somehow 0
  const progress = totalDuration > 0 ? ((totalDuration - timeLeft) / totalDuration) * 100 : 0;


  // 💡 Define colors based on theme and mode
  const getCircleColors = () => {
      const baseColors = {
          Pomodoro: { light: "text-blue-500 stroke-blue-500", dark: "text-blue-400 stroke-blue-400" },
          Rest: { light: "text-green-500 stroke-green-500", dark: "text-green-400 stroke-green-400" },
          "Long Rest": { light: "text-emerald-600 stroke-emerald-600", dark: "text-emerald-400 stroke-emerald-400" },
      };
      return theme === 'dark' ? baseColors[mode].dark : baseColors[mode].light;
  };
  
  const getTrackColor = () => {
      return theme === 'dark' ? 'text-gray-700' : 'text-gray-200';
  };

  return (
    // 🔑 Main background
    <div className={`flex flex-col items-center justify-center min-h-screen p-4 transition-colors duration-300 ${
        theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* 🔑 Title Text */}
      <h1 className="text-xl font-bold mb-4 text-center">
        Why don’t you take a challenge? 😉
      </h1>

      {/* 🔑 Settings Summary Text */}
      <div className={`flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
        <span className="text-blue-500 dark:text-blue-400">Pomodoro {settings.pomodoro}m</span>
        <span className="text-green-500 dark:text-green-400">Rest {settings.rest}m</span>
        <span className="text-emerald-600 dark:text-emerald-400">Long Rest {settings.longRest}m</span>
      </div>

      {/* Timer Circle */}
      <div className="relative w-64 h-64 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90">
          {/* Background Track */}
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="10"
            className={getTrackColor()} // 🔑 Conditional track color
            fill="none"
          />
          {/* Progress Arc */}
          <circle
            cx="128"
            cy="128"
            r="120"
            strokeLinecap="round"
            strokeWidth="10"
            fill="none"
            className={`${getCircleColors()} transition-all duration-500`} // 🔑 Conditional progress color
            strokeDasharray={2 * Math.PI * 120}
            strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
            style={{ transition: 'stroke-dashoffset 0.5s linear' }} // Smooth progress transition
          />
        </svg>
        <div className="absolute text-center">
           {/* 🔑 Timer Text */}
          <h2 className={`text-5xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{formatTime(timeLeft)}</h2>
          {/* 🔑 Mode Text */}
          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{mode}</p>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-4 mt-6">
        <button
          onClick={handleStartPause}
          className={`px-6 py-2 rounded-xl text-white shadow-md transition-colors ${
              isRunning ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isRunning ? "Pause" : "Start"}
        </button>
        <button
          onClick={handleReset}
          // 🔑 Reset Button Style
          className={`px-6 py-2 rounded-xl transition-colors ${
              theme === 'dark' 
              ? 'bg-gray-600 text-gray-100 hover:bg-gray-500' 
              : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
          }`}
        >
          Reset
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-2 rounded-xl bg-green-500 text-white shadow-md hover:bg-green-600 transition-colors"
        >
          Next
        </button>
      </div>

      {/* Settings Button */}
      <button
        onClick={() => setShowSettings(true)}
        // 🔑 Settings Link Style
        className={`mt-6 text-sm underline transition-colors ${
            theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        ⚙️ Settings
      </button>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          {/* 🔑 Modal Background & Text */}
          <div className={`rounded-2xl p-6 shadow-lg w-full max-w-xs transition-colors ${
              theme === 'dark' ? 'bg-gray-800 text-gray-100 ring-1 ring-gray-700' : 'bg-white'
          }`}>
            <h3 className="font-bold text-lg mb-4">Customize Durations</h3>
            {["pomodoro", "rest", "longRest"].map((key) => (
              <div key={key} className="mb-3">
                <label className={`block capitalize text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {key === 'longRest' ? 'Long Rest' : key} (minutes)
                </label>
                {/* 🔑 Input Styling */}
                <input
                  type="number"
                  min="1" // Ensure positive values
                  value={settings[key]}
                  onChange={(e) => {
                      const value = Math.max(1, Number(e.target.value)); // Ensure value is at least 1
                      const newSettings = { ...settings, [key]: value };
                      setSettings(newSettings);
                      // If the current mode matches the setting being changed, update the timer (if not running)
                      const modeKey = mode === "Pomodoro" ? 'pomodoro' : mode === "Rest" ? 'rest' : 'longRest';
                      if (!isRunning && key === modeKey) {
                          setTimeLeft(value * 60);
                      }
                  }}
                  className={`w-full p-2 border rounded-lg outline-none transition-colors ${
                      theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-emerald-500'
                      : 'border-gray-300 focus:ring-2 focus:ring-green-500'
                  }`}
                />
              </div>
            ))}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowSettings(false)}
                // 🔑 Close Button Style
                className={`px-4 py-2 rounded-lg transition-colors ${
                    theme === 'dark' 
                    ? 'bg-gray-600 text-gray-100 hover:bg-gray-500' 
                    : 'bg-gray-300 text-gray-800 hover:bg-gray-400'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Congrats Modal */}
      {showCongrats && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4">
          {/* 🔑 Modal Background & Text */}
          <div className={`rounded-2xl p-8 shadow-lg text-center transition-colors ${
              theme === 'dark' ? 'bg-gray-800 ring-1 ring-gray-700' : 'bg-white'
          } animate-bounce`}>
            {/* 🔑 Text Color */}
            <h2 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-emerald-400' : 'text-green-600'}`}>
              🎉 Congrats! 🎊
            </h2>
            {/* 🔑 Text Color */}
            <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>You finished your {mode}!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer;