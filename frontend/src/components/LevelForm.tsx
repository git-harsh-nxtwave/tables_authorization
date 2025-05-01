import { useState, useEffect, ChangeEvent } from 'react';
import { LevelData } from '../types';
import '../Styles/LevelForm.css';

type LevelFormProps = {
  level: number;
  onSubmit: (level: number, data: LevelData) => void;
  onAddNextLevel: (level: number, data: LevelData) => void;
  disabled: boolean;
  initialData: LevelData;
  isLastLevel: boolean;
  previousLevelData?: LevelData;
};

const LevelForm = ({ level, onSubmit, onAddNextLevel, disabled, initialData, isLastLevel, previousLevelData }: LevelFormProps) => {
  const [formData, setFormData] = useState<LevelData>({
    dataset_id: initialData.dataset_id || '',
    object_name: initialData.object_name || '',
    object_type: level === 1 ? 'VIEW' : (initialData.object_type || 'TABLE'),
    query: initialData.query || ''
  });
  
  const [datasetOptions, setDatasetOptions] = useState<string[]>([]);
  const [loadingDatasets, setLoadingDatasets] = useState<boolean>(true);
  const [datasetError, setDatasetError] = useState<string | null>(null);
  const [isQueryFocused, setIsQueryFocused] = useState(false);

  useEffect(() => {
    const fetchDatasetIds = async () => {
      try {
        setLoadingDatasets(true);
        setDatasetError(null);
        
        const response = await fetch('http://localhost:5000/api/datasets');
        if (!response.ok) {
          throw new Error('Failed to fetch datasets');
        }
        
        const data = await response.json();
        if (data.status === 'success') {
          setDatasetOptions(data.datasets);
          if (initialData.dataset_id && data.datasets.includes(initialData.dataset_id)) {
            setFormData(prev => ({ ...prev, dataset_id: initialData.dataset_id }));
          } else if (data.datasets.length > 0) {
            setFormData(prev => ({ ...prev, dataset_id: data.datasets[0] }));
          }
        } else {
          throw new Error(data.error || 'Unknown error');
        }
      } catch (error) {
        console.error('Error fetching datasets:', error);
        setDatasetError('Failed to load datasets. Please try again later.');
      } finally {
        setLoadingDatasets(false);
      }
    };

    fetchDatasetIds();
  }, [initialData.dataset_id]);

  useEffect(() => {
    if (level >= 2 && previousLevelData) {
      const newObjectName = `${previousLevelData.object_name}`;
      const generatedQuery = `SELECT * FROM \`${previousLevelData.dataset_id}.${previousLevelData.object_name}\``;
      
      setFormData(prev => ({
        ...prev,
        object_name: initialData.object_name || newObjectName,
        query: initialData.query || generatedQuery
      }));
    }
  }, [level, previousLevelData, initialData.object_name, initialData.query]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value as 'VIEW' | 'TABLE' | string
    }));
  };

  const isFormComplete = (): boolean => {
    return (
      !!formData.dataset_id && 
      !!formData.object_name && 
      !!formData.object_type && 
      !!formData.query
    );
  };

  const handleDone = () => {
    if (isFormComplete()) {
      onSubmit(level, formData);
    }
  };

  const handleAddNextLevel = () => {
    if (isFormComplete()) {
      onAddNextLevel(level, formData);
    }
  };

  return (
    <div className="level-form-container">
      <div className="level-header-row">
        <h3 className="level-header">Level {level}</h3>
        <select
          name="object_type"
          value={formData.object_type}
          onChange={handleSelectChange}
          className="object-type-select"
          disabled={disabled || level === 1}
          required
        >
          <option value="TABLE">TABLE</option>
          <option value="VIEW">VIEW</option>
        </select>
      </div>

      <div className="compact-fields-row">
        <div className="form-group compact">
          <label htmlFor={`dataset_id_${level}`} className="form-label">
            Dataset ID
          </label>
          {loadingDatasets ? (
            <div className="loading-message">Loading...</div>
          ) : datasetError ? (
            <div className="error-message">{datasetError}</div>
          ) : (
            <select
              id={`dataset_id_${level}`}
              name="dataset_id"
              value={formData.dataset_id}
              onChange={handleSelectChange}
              className="form-input"
              disabled={disabled || datasetOptions.length === 0}
              required
            >
              {datasetOptions.map(dataset => (
                <option key={dataset} value={dataset}>
                  {dataset}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="form-group compact">
          <label htmlFor={`object_name_${level}`} className="form-label">
            Object Name
          </label>
          <input
            type="text"
            id={`object_name_${level}`}
            name="object_name"
            value={formData.object_name}
            onChange={handleInputChange}
            className="form-input"
            disabled={disabled}
            required
          />
        </div>
      </div>

      <div className={`query-editor-container ${isQueryFocused ? 'focused' : ''}`}>
        <label htmlFor={`query_${level}`} className="query-label">
          SQL Query
        </label>
        <div className="query-editor">
          <textarea
            id={`query_${level}`}
            name="query"
            value={formData.query}
            onChange={handleInputChange}
            className="sql-textarea"
            disabled={disabled}
            required
            onFocus={() => setIsQueryFocused(true)}
            onBlur={() => setIsQueryFocused(false)}
          />
        </div>
        {level >= 2 && previousLevelData && (
          <div className="query-hint">
            Query automatically generated from Level {level - 1}. Edit as needed.
          </div>
        )}
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="form-button secondary"
          onClick={handleAddNextLevel}
          disabled={!isFormComplete() || disabled || loadingDatasets || datasetError !== null || level >= 4}
        >
          Add Level {level + 1}
        </button>
        <button
          type="button"
          className="form-button primary"
          onClick={handleDone}
          disabled={!isFormComplete() || disabled || loadingDatasets || datasetError !== null}
        >
          Save Level {level}
        </button>
      </div>
    </div>
  );
};

export default LevelForm;