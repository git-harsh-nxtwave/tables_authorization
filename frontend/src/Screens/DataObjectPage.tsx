import { useState, useEffect } from 'react';
import LevelForm from '../components/LevelForm';
import '../Styles/DataObjectPage.css';
import { LevelData, FormData } from '../types';

const DataObjectPage = () => {
  const [projectId, setProjectId] = useState<string>('kossip-helpers');
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [formData, setFormData] = useState<FormData>({});
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const [visibleLevels, setVisibleLevels] = useState<number[]>([1]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitMessage, setSubmitMessage] = useState<string>('');
  const maxLevels = 4;

  const getInitialLevelData = (level: number): LevelData => {
    return formData[`level${level}`] || {
      dataset_id: '',
      object_name: '',
      object_type: level === 1 ? 'VIEW' : 'TABLE',
      query: ''
    };
  };

  const getPreviousLevelData = (currentLevel: number): LevelData | undefined => {
    if (currentLevel <= 1) return undefined;
    return formData[`level${currentLevel - 1}`];
  };

  // Load saved data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('levelFormData');
    if (savedData) {
      try {
        const { projectId: savedProjectId, levels, completed, visible } = JSON.parse(savedData) as {
          projectId?: string;
          levels?: FormData;
          completed?: number[];
          visible?: number[];
        };
        setProjectId(savedProjectId || 'kossip-helpers');
        if (levels) {
          const validatedLevels = Object.entries(levels).reduce((acc, [key, value]) => {
            acc[key as `level${number}`] = {
              ...value,
              object_type: value.object_type === 'VIEW' ? 'VIEW' : 'TABLE'
            };
            return acc;
          }, {} as FormData);
          setFormData(validatedLevels);
        }
        setCompletedLevels(completed || []);
        setVisibleLevels(visible || [1]);
      } catch (e) {
        console.error('Failed to parse saved data', e);
      }
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    const dataToSave = {
      projectId,
      levels: formData,
      completed: completedLevels,
      visible: visibleLevels
    };
    localStorage.setItem('levelFormData', JSON.stringify(dataToSave));
  }, [projectId, formData, completedLevels, visibleLevels]);

  const handleLevelSubmit = (level: number, data: LevelData) => {
    const updatedFormData = {
      ...formData,
      [`level${level}`]: {
        ...data,
        object_type: data.object_type === 'VIEW' ? 'VIEW' : 'TABLE'
      }
    };

    setFormData(updatedFormData);

    if (!completedLevels.includes(level)) {
      setCompletedLevels(prev => [...prev, level]);
    }

    // Add message when user completes the last visible level
    if (level === visibleLevels[visibleLevels.length - 1]) {
      setSubmitMessage('All levels completed! Click "Submit All Levels" to finish.');
    }

    // Automatically add next level when:
    // 1. Current level is complete
    // 2. We haven't reached max levels
    // 3. This is the latest visible level
    if (level < maxLevels && level === visibleLevels[visibleLevels.length - 1]) {
      const nextLevel = level + 1;
      setVisibleLevels(prev => [...prev, nextLevel]);
      setCurrentLevel(nextLevel);
    }
  };

  const handleLevelChange = (level: number) => {
    setCurrentLevel(level);
  };

  const addNewLevel = () => {
    if (visibleLevels.length < maxLevels) {
      const newLevel = visibleLevels.length + 1;
      setVisibleLevels(prev => [...prev, newLevel]);
      setCurrentLevel(newLevel);
    }
  };

  const handleFinalSubmit = async () => {
    const submissionData = {
      project_id: projectId,
      timestamp: new Date().toISOString(),
      ...formData
    };

    setIsSubmitting(true);
    setSubmitMessage('Submitting data...');

    try {
      const response = await fetch('http://localhost:5000/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit data');
      }

      setSubmitMessage('Data saved successfully!');
      console.log('Submission result:', result);
      
    } catch (error) {
      console.error('Error submitting data:', error);
      setSubmitMessage(error.message || 'Error saving data. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLevelComplete = (level: number): boolean => {
    const levelData = formData[`level${level}`];
    return !!levelData && 
           !!levelData.dataset_id && 
           !!levelData.object_name && 
           !!levelData.object_type && 
           !!levelData.query;
  };

  const allLevelsComplete = visibleLevels.every(level => isLevelComplete(level));

  return (
    <div className="page-container">
      <div className="form-layout">
        {/* Left Pane - Project ID and Level Navigation */}
        <div className="left-pane">
          <div className="project-id-container">
            <label htmlFor="project_id" className="form-label">Project ID</label>
            <select
              id="project_id"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="form-input"
            >
              <option value="kossip-helpers">kossip-helpers</option>
              <option value="kossip-helpers-dev">kossip-helpers-dev</option>
            </select>
          </div>

          <div className="level-nav">
            {visibleLevels.map(level => (
              <button
                key={level}
                className={`level-nav-button ${currentLevel === level ? 'active' : ''} ${
                  completedLevels.includes(level) ? 'completed' : ''
                }`}
                onClick={() => handleLevelChange(level)}
              >
                Level {level}
                {completedLevels.includes(level) && (
                  <span className="checkmark">✓</span>
                )}
              </button>
            ))}

            {visibleLevels.length < maxLevels && (
              <button 
                className="add-level-button"
                onClick={addNewLevel}
                disabled={!isLevelComplete(visibleLevels[visibleLevels.length - 1])}
              >
                + Add Level
              </button>
            )}
          </div>

          {allLevelsComplete && visibleLevels.length > 0 && (
            <div className="left-pane-submit">
              <button 
                onClick={handleFinalSubmit}
                className="form-button submit-all-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit All Levels'}
              </button>
              {submitMessage && (
                <div className={`submit-message ${submitMessage.includes('Error') ? 'error' : 'success'}`}>
                  {submitMessage}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Pane - Form Content */}
        <div className="form-container">
          {currentLevel <= maxLevels && (
            <LevelForm
              key={currentLevel}
              level={currentLevel}
              onSubmit={handleLevelSubmit}
              disabled={!projectId}
              initialData={getInitialLevelData(currentLevel)}
              isLastLevel={currentLevel === visibleLevels[visibleLevels.length - 1]}
              previousLevelData={getPreviousLevelData(currentLevel)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DataObjectPage;