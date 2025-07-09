import  { useState, useEffect } from 'react';
import { useSimulationStore } from '../store/simulationStore';
import {
  getAllSetupsApi,
  saveSetupApi,
  loadSetupApi,
  deleteSetupApi,
} from '../services/apiService';

export default function SetupManager() {
  const {
    user,
    selectedGridId,
    savedSetups,
    setSavedSetups,
    addSavedSetup,
    removeSavedSetup,
  } = useSimulationStore();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch saved setups when the user logs in
  useEffect(() => {
    if (user) {
      const fetchSetups = async () => {
        try {
          setError(null);
          const setups = await getAllSetupsApi();
          setSavedSetups(setups);
        } catch (err: any) {
          setError(err.message);
        }
      };
      fetchSetups();
    }
  }, [user, setSavedSetups]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter a name for the setup.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const newSetup = await saveSetupApi(name);
      addSavedSetup(newSetup);
      setName(''); // Clear input on success
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoad = async (setupId: string) => {
    setLoading(true);
    setError(null);
    try {
      await loadSetupApi(setupId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (setupId: string) => {
    if (!window.confirm('Are you sure you want to delete this setup?')) return;
    setLoading(true);
    setError(null);
    try {
      await deleteSetupApi(setupId);
      removeSavedSetup(setupId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setup-manager-panel">
      <h2>Manage Setups</h2>
      {error && <p className="error-message">{error}</p>}

      <div className="save-setup-section">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New setup name..."
          disabled={loading || !selectedGridId}
        />
        <button onClick={handleSave} disabled={loading || !selectedGridId}>
          Save Current
        </button>
      </div>
      {!selectedGridId && <p style={{ fontSize: '0.8rem', color: '#999' }}>Select a grid to save a setup.</p>}

      <div className="saved-setups-list">
        <h3>Saved Setups</h3>
        {savedSetups.length === 0 ? (
          <p>You have no saved setups.</p>
        ) : (
          <ul>
            {savedSetups.map((setup) => (
              <li key={setup.id}>
                <span>{setup.name}</span>
                <div className="button-group">
                  <button onClick={() => handleLoad(setup.id)} disabled={loading}>Load</button>
                  <button onClick={() => handleDelete(setup.id)} disabled={loading} className="delete-button">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}