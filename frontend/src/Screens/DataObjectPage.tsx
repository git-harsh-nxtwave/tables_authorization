import { useState, useEffect } from 'react';
import LevelForm from '../components/LevelForm';
import ConfirmationDialog from '../components/ConfirmationDialog';
import SubmissionOverlay from '../components/SubmissionOverlay';
import DbtComparisonView from './DbtComparisonView';
import '../Styles/DataObjectPage.css';
import { LevelData, FormData } from '../types';

const DataObjectPage = () => {
  // State for project and level management
  const [projectId, setProjectId] = useState<string>('');
  const [projectIds, setProjectIds] = useState<string[]>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [formData, setFormData] = useState<FormData>({});
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const [visibleLevels, setVisibleLevels] = useState<number[]>([1]);
  const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(true);
  const [projectError, setProjectError] = useState<string>('');

  // State for confirmation dialogs
  const [showAddConfirmation, setShowAddConfirmation] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [levelToDelete, setLevelToDelete] = useState<number | null>(null);
  const [pendingLevelData, setPendingLevelData] = useState<{level: number, data: LevelData} | null>(null);

  // State for submission and dbt view
  const [submissionState, setSubmissionState] = useState<{
    loading: boolean;
    success: boolean;
    error: boolean;
    dbtModels: Record<string, string>;
    dbtFilePaths: Record<string, string>;
  }>({
    loading: false,
    success: false,
    error: false,
    dbtModels: {},
    dbtFilePaths: {}
  });
  const [showDbtView, setShowDbtView] = useState(false);

  const maxLevels = 4;

  // Fetch project IDs from API
  useEffect(() => {
    const fetchProjectIds = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/api/project_ids');
        if (!response.ok) {
          throw new Error('Failed to fetch project IDs');
        }
        const data = await response.json();
        if (data.status === 'success' && Array.isArray(data.project_ids)) {
          setProjectIds(data.project_ids);
          if (data.project_ids.length > 0) {
            setProjectId(data.project_ids[0]);
          }
        } else {
          throw new Error('Invalid data format from API');
        }
      } catch (error) {
        console.error('Error fetching project IDs:', error);
        setProjectError(error instanceof Error ? error.message : 'Failed to load project IDs');
      } finally {
        setIsLoadingProjects(false);
      }
    };

    fetchProjectIds();
  }, []);

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
    if (projectIds.length === 0) return;

    const savedData = localStorage.getItem('levelFormData');
    if (savedData) {
      try {
        const { projectId: savedProjectId, levels, completed, visible } = JSON.parse(savedData) as {
          projectId?: string;
          levels?: FormData;
          completed?: number[];
          visible?: number[];
        };
        
        if (savedProjectId && projectIds.includes(savedProjectId)) {
          setProjectId(savedProjectId);
        }
        
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
  }, [projectIds]);

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

    if (level === visibleLevels[visibleLevels.length - 1]) {
      console.log('All levels completed! Ready to submit.');
    }
  };

  const handleAddNextLevel = (level: number, data: LevelData) => {
    setPendingLevelData({ level, data });
    setShowAddConfirmation(true);
  };

  const confirmAddLevel = () => {
    if (!pendingLevelData) return;
    
    const { level, data } = pendingLevelData;
    handleLevelSubmit(level, data);
    if (level < maxLevels) {
      const nextLevel = level + 1;
      setVisibleLevels(prev => [...prev, nextLevel]);
      setCurrentLevel(nextLevel);
    }
    
    setPendingLevelData(null);
    setShowAddConfirmation(false);
  };

  const handleDeleteLevelClick = (level: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (level <= 1) return;
    setLevelToDelete(level);
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteLevel = () => {
    if (!levelToDelete) return;
    
    setVisibleLevels(prev => prev.filter(l => l !== levelToDelete));
    setCompletedLevels(prev => prev.filter(l => l !== levelToDelete));
    const { [`level${levelToDelete}`]: _, ...remainingData } = formData;
    setFormData(remainingData);
    
    if (currentLevel === levelToDelete) {
      setCurrentLevel(Math.max(1, levelToDelete - 1));
    }
    
    setLevelToDelete(null);
    setShowDeleteConfirmation(false);
  };

  const handleLevelChange = (level: number) => {
    setCurrentLevel(level);
  };

  const handleFinalSubmit = async () => {
    if (!projectId) {
      console.log('Please select a project ID');
      return;
    }

    setSubmissionState({
      loading: true,
      success: false,
      error: false,
      dbtModels: {},
      dbtFilePaths: {}
    });

    const submissionData = {
      timestamp: new Date().toISOString(),
      data: {
        project_id: projectId,
        timestamp: new Date().toISOString(),
        ...formData
      }
    };

    try {
      // Step 1: Submit data to /api/submit
      const submitResponse = await fetch('http://localhost:5000/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData.data),
      });

      const submitResult = await submitResponse.json();
      if (!submitResponse.ok) throw new Error(submitResult.message || 'Failed to submit data');

      // Step 2: Convert to DBT using /api/convert-to-dbt
      const dbtResponse = await fetch('http://localhost:5000/api/convert-to-dbt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      const dbtResult = await dbtResponse.json();
      if (!dbtResponse.ok) throw new Error(dbtResult.message || 'Failed to convert to DBT');

      // Extract DBT models and file paths from the response
      const dbtModels = Object.fromEntries(
        Object.entries(dbtResult.comparisons || {}).map(([level, data]: [string, any]) => [
          level.replace('level', ''),
          data.dbt_format
        ])
      );
      const dbtFilePaths = Object.fromEntries(
        Object.entries(dbtResult.comparisons || {}).map(([level, data]: [string, any]) => [
          level.replace('level', ''),
          data.dbt_file_path
        ])
      );

      setSubmissionState({
        loading: false,
        success: true,
        error: false,
        dbtModels,
        dbtFilePaths
      });
      
    } catch (error) {
      console.error('Error during submission or DBT conversion:', error);
      setSubmissionState({
        loading: false,
        success: false,
        error: true,
        dbtModels: {},
        dbtFilePaths: {}
      });
    }
  };

  const handleMakeChanges = () => {
    setSubmissionState({
      loading: false,
      success: false,
      error: false,
      dbtModels: {},
      dbtFilePaths: {}
    });
  };

  const handleShowDbt = () => {
    setShowDbtView(true);
  };

  const handleSubmitAgain = () => {
    handleFinalSubmit();
  };

  const handleCloseDbtView = () => {
    setShowDbtView(false);
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

  if (isLoadingProjects) {
    return (
      <div className="page-container">
        <div className="loading-spinner">Loading projects...</div>
      </div>
    );
  }

  if (projectError) {
    return (
      <div className="page-container">
        <div className="error-message">
          <p>{projectError}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

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
              disabled={projectIds.length === 0}
            >
              {projectIds.map(id => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
            {projectIds.length === 0 && (
              <p className="no-projects-message">No projects available</p>
            )}
          </div>

          <div className="level-nav">
            {visibleLevels.map(level => {
              const levelData = formData[`level${level}`];
              const datasetId = levelData?.dataset_id || 'Not selected';
              
              return (
                <div key={level} className="level-nav-item">
                  <button
                    className={`level-nav-button ${currentLevel === level ? 'active' : ''} ${
                      completedLevels.includes(level) ? 'completed' : ''
                    }`}
                    onClick={() => handleLevelChange(level)}
                  >
                    <div className="level-nav-content">
                      <div className="level-number">Level {level}</div>
                      <div className="level-dataset" title={datasetId}>
                        {datasetId.length > 15 ? `${datasetId.substring(0, 12)}...` : datasetId}
                      </div>
                    </div>
                    {completedLevels.includes(level) && (
                      <span className="checkmark">✓</span>
                    )}
                  </button>
                  {level > 1 && (
                    <button
                      className="delete-level-button"
                      onClick={(e) => handleDeleteLevelClick(level, e)}
                      title="Delete this level"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {allLevelsComplete && visibleLevels.length > 0 && (
            <div className="left-pane-submit">
              <button 
                onClick={handleFinalSubmit}
                className="form-button submit-all-button"
                disabled={submissionState.loading || !projectId}
              >
                {submissionState.loading ? 'Submitting...' : 'Submit All Levels'}
              </button>
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
              onAddNextLevel={handleAddNextLevel}
              disabled={!projectId}
              initialData={getInitialLevelData(currentLevel)}
              isLastLevel={currentLevel === visibleLevels[visibleLevels.length - 1]}
              previousLevelData={getPreviousLevelData(currentLevel)}
            />
          )}
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={showAddConfirmation}
        title="Add New Level"
        message="Are you sure you want to add another level? This action cannot be undone."
        onConfirm={confirmAddLevel}
        onCancel={() => setShowAddConfirmation(false)}
        confirmText="Add Level"
        cancelText="Cancel"
      />

      <ConfirmationDialog
        isOpen={showDeleteConfirmation}
        title="Delete Level"
        message={`Are you sure you want to delete Level ${levelToDelete}? All data for this level will be lost.`}
        onConfirm={confirmDeleteLevel}
        onCancel={() => setShowDeleteConfirmation(false)}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Submission Overlay */}
      <SubmissionOverlay
        isLoading={submissionState.loading}
        isSuccess={submissionState.success}
        isError={submissionState.error}
        onMakeChanges={handleMakeChanges}
        onShowDbt={handleShowDbt}
        onSubmitAgain={handleSubmitAgain}
      />

      {/* DBT Comparison View */}
      {showDbtView && (
        <DbtComparisonView
          originalSql={Object.fromEntries(
            Object.entries(formData).map(([key, value]) => [
              key.replace('level', ''),
              value.query || ''
            ])
          )}
          dbtModels={submissionState.dbtModels}
          dbtFilePaths={submissionState.dbtFilePaths}
          onClose={handleCloseDbtView}
        />
      )}
    </div>
  );
};

export default DataObjectPage;