// App.js
import React, { useState, useEffect } from 'react';
import EEGUpload from './components/EEGUpload';
import SeizurePrediction from './components/SeizurePrediction';
import SeizureLog from './components/SeizureLog';

function App() {
  const [predictionResult, setPredictionResult] = useState(null);
  const [seizureLog, setSeizureLog] = useState([]);

  useEffect(() => {
    fetchSeizureLog();
  }, []);

  const fetchSeizureLog = async () => {
    try {
      const response = await fetch('http://localhost:5000/seizure_log');
      const data = await response.json();
      setSeizureLog(data);
    } catch (error) {
      console.error('Error fetching seizure log:', error);
    }
  };

  return (
    <div className="App">
      <h1>Epileptic Seizure Prediction Tool</h1>
      <EEGUpload setPredictionResult={setPredictionResult} />
      {predictionResult && <SeizurePrediction result={predictionResult} />}
      <SeizureLog log={seizureLog} />
    </div>
  );
}

export default App;

// components/EEGUpload.js
import React from 'react';

function EEGUpload({ setPredictionResult }) {
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
      const data = new Float32Array(e.target.result);
      try {
        const response = await fetch('http://localhost:5000/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ eegData: Array.from(data) }),
        });
        const result = await response.json();
        setPredictionResult(result);
      } catch (error) {
        console.error('Error uploading EEG data:', error);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div>
      <h2>Upload EEG Data</h2>
      <input type="file" onChange={handleFileUpload} accept=".edf,.bdf" />
    </div>
  );
}

export default EEGUpload;

// components/SeizurePrediction.js
import React, { useEffect } from 'react';

function SeizurePrediction({ result }) {
  useEffect(() => {
    if (result.isSeizure) {
      alert('WARNING: High probability of seizure detected!');
    }
  }, [result]);

  return (
    <div>
      <h2>Seizure Prediction Result</h2>
      <p>Seizure Probability: {(result.seizureProbability * 100).toFixed(2)}%</p>
      <p>Seizure Detected: {result.isSeizure ? 'Yes' : 'No'}</p>
    </div>
  );
}

export default SeizurePrediction;

// components/SeizureLog.js
import React from 'react';

function SeizureLog({ log }) {
  return (
    <div>
      <h2>Seizure Log</h2>
      <ul>
        {log.map((entry, index) => (
          <li key={index}>
            {new Date(entry.timestamp).toLocaleString()}: {entry.details}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SeizureLog;
