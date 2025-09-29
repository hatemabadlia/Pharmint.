// PomodoroTimer.jsx
import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";

const beepSound =
  "https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg";

const PomodoroTimer = () => {
  const getInitialSettings = () => {
    const saved = localStorage.getItem("pomodoroSettings");
    return saved
      ? JSON.parse(saved)
      : { pomodoro: 20, rest: 5, longRest: 15 };
  };

  const [settings, setSettings] = useState(getInitialSettings);
  const [timeLeft, setTimeLeft] = useState(settings.pomodoro * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState("Pomodoro");
  const intervalRef = useRef(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);

  // 🔔 Audio
  const audioRef = useRef(new Audio(beepSound));

  useEffect(() => {
    localStorage.setItem("pomodoroSettings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev > 0) return prev - 1;
          clearInterval(intervalRef.current);
          triggerEndEffects();
          handleNext();
          return 0;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const handleStartPause = () => {
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setTimeLeft(settings[mode.toLowerCase()] * 60);
  };

  const handleNext = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);

    if (mode === "Pomodoro") {
      setMode("Rest");
      setTimeLeft(settings.rest * 60);
    } else if (mode === "Rest") {
      setMode("Long Rest");
      setTimeLeft(settings.longRest * 60);
    } else {
      setMode("Pomodoro");
      setTimeLeft(settings.pomodoro * 60);
    }
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
    confetti({
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

  const total = settings[mode.toLowerCase()] * 60;
  const progress = ((total - timeLeft) / total) * 100;

  const colors = {
    Pomodoro: "text-blue-500 stroke-blue-500",
    Rest: "text-green-500 stroke-green-500",
    "Long Rest": "text-green-600 stroke-green-600",
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <h1 className="text-xl font-bold mb-4">
        Why don’t you take a challenge? 😉
      </h1>

      <div className="flex gap-6 text-sm mb-6">
        <span className="text-blue-500">Pomodoro {settings.pomodoro}m</span>
        <span className="text-green-500">Rest {settings.rest}m</span>
        <span className="text-green-600">Long Rest {settings.longRest}m</span>
      </div>

      <div className="relative w-64 h-64 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="10"
            className="text-gray-200"
            fill="none"
          />
          <circle
            cx="128"
            cy="128"
            r="120"
            strokeLinecap="round"
            strokeWidth="10"
            fill="none"
            className={`${colors[mode]} transition-all duration-500`}
            strokeDasharray={2 * Math.PI * 120}
            strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
          />
        </svg>
        <div className="absolute text-center">
          <h2 className="text-4xl font-bold">{formatTime(timeLeft)}</h2>
          <p className="text-gray-500">{mode}</p>
        </div>
      </div>

      <div className="flex gap-4 mt-6">
        <button
          onClick={handleStartPause}
          className="px-6 py-2 rounded-xl bg-blue-500 text-white shadow-md hover:bg-blue-600"
        >
          {isRunning ? "Pause" : "Start"}
        </button>
        <button
          onClick={handleReset}
          className="px-6 py-2 rounded-xl bg-gray-300 text-gray-700 hover:bg-gray-400"
        >
          Reset
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-2 rounded-xl bg-green-500 text-white shadow-md hover:bg-green-600"
        >
          Next
        </button>
      </div>

      <button
        onClick={() => setShowSettings(true)}
        className="mt-6 text-sm text-gray-600 underline"
      >
        ⚙️ Settings
      </button>

      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 shadow-lg w-80">
            <h3 className="font-bold text-lg mb-4">Customize Durations</h3>
            {["pomodoro", "rest", "longRest"].map((key) => (
              <div key={key} className="mb-3">
                <label className="block capitalize">
                  {key} (minutes)
                </label>
                <input
                  type="number"
                  value={settings[key]}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      [key]: Number(e.target.value),
                    })
                  }
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            ))}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 rounded-lg bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showCongrats && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl p-8 shadow-lg text-center animate-bounce">
            <h2 className="text-2xl font-bold text-green-600 mb-2">
              🎉 Congrats! 🎊
            </h2>
            <p className="text-gray-600">You finished your {mode}!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer;
