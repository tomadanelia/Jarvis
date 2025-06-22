import React, { useState } from 'react';
import { useSimulationStore } from '../store/simulationStore';
import {
  startSimulationControlApi,
  pauseSimulationControlApi,
  resumeSimulationControlApi,
  resetSimulationControlApi,
  setSpeedFactorControlApi,
} from '../services/apiService';

const SPEED_FACTORS = [0.25, 0.5, 1.0, 2.0, 4.0];

export default function ControlPanel() {
  const simulationStatus = useSimulationStore(state => state.simulationStatus);
  const selectedGridId = useSimulationStore(state => state.selectedGridId);
  const [currentSpeed, setCurrentSpeed] = useState(1.0);
  const [isLoading, setIsLoading] = useState(false);

  // Generic handler to wrap API calls with loading state
  const handleApiCall = async (apiCall: () => Promise<void>) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await apiCall();
    } catch (error) {
      console.error('API call failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = () => handleApiCall(startSimulationControlApi);
  const handlePause = () => handleApiCall(pauseSimulationControlApi);
  const handleResume = () => handleApiCall(resumeSimulationControlApi);
  const handleReset = () => handleApiCall(resetSimulationControlApi);

  const handleSpeedChange = async (newSpeed: number) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await setSpeedFactorControlApi(newSpeed);
      setCurrentSpeed(newSpeed);
    } catch (error) {
      console.error('Failed to set speed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const canInteract = !!selectedGridId;

  return (
    <div className="control-panel">
      <div className="button-group">
        {simulationStatus === 'idle' && (
          <button onClick={handleStart} disabled={!canInteract || isLoading}>
            Start
          </button>
        )}
        {simulationStatus === 'paused' && (
          <button onClick={handleResume} disabled={!canInteract || isLoading}>
            Resume
          </button>
        )}
        {simulationStatus === 'running' && (
          <button onClick={handlePause} disabled={!canInteract || isLoading}>
            Pause
          </button>
        )}
        <button onClick={handleReset} disabled={!canInteract || isLoading}>
          Reset
        </button>
      </div>

      <div className="speed-controls">
        <span style={{ color:'#ccc'}}>Speed:</span>
        <div className="button-group">
          {SPEED_FACTORS.map(factor => (
            <button
              key={factor}
              onClick={() => handleSpeedChange(factor)}
              disabled={isLoading || !canInteract}
              className={currentSpeed === factor ? 'active' : ''}
            >
              {factor}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}