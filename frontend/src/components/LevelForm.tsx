import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { LevelData } from '../types';
import '../Styles/LevelForm.css';

type LevelFormProps = {
  level: number;
  onSubmit: (level: number, data: LevelData) => void;
  disabled: boolean;
  initialData: LevelData;
  isLastLevel: boolean;
  previousLevelData?: LevelData;
};

const LevelForm = ({ level, onSubmit, disabled, initialData, isLastLevel, previousLevelData }: LevelFormProps) => {
  const [formData, setFormData] = useState<LevelData>({
    dataset_id: initialData.dataset_id || '',
    object_name: initialData.object_name || '',
    object_type: level === 1 ? 'VIEW' : (initialData.object_type || 'TABLE'),
    query: initialData.query || ''
  });

  // Automatically generate and update query for levels > 1 when previous level data changes
  useEffect(() => {
    if (level >= 2 && previousLevelData) {
      const generatedQuery = `SELECT * FROM \`${previousLevelData.dataset_id}.${previousLevelData.object_name}\``;
      setFormData(prev => ({
        ...prev,
        query: generatedQuery
      }));
    }
  }, [level, previousLevelData, previousLevelData?.dataset_id, previousLevelData?.object_name]);

  // Reset form when initialData or level changes
  useEffect(() => {
    setFormData({
      dataset_id: initialData.dataset_id || '',
      object_name: initialData.object_name || '',
      object_type: level === 1 ? 'VIEW' : (initialData.object_type || 'TABLE'),
      query: initialData.query || (level >= 2 && previousLevelData ? 
        `SELECT * FROM \`${previousLevelData.dataset_id}.${previousLevelData.object_name}\`` : '')
    });
  }, [initialData, level, previousLevelData]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value as 'VIEW' | 'TABLE'
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(level, formData);
  };

  const isFormComplete = (): boolean => {
    return (
      !!formData.dataset_id && 
      !!formData.object_name && 
      !!formData.object_type && 
      !!formData.query
    );
  };

  return (
    <div className="level-form-container">
      <h3 className="level-header">Level {level}</h3>
      <form onSubmit={handleSubmit} className="level-form">
        <div className="form-group">
          <label htmlFor={`dataset_id_${level}`} className="form-label">
            Dataset ID (Level {level})
          </label>
          <input
            type="text"
            id={`dataset_id_${level}`}
            name="dataset_id"
            value={formData.dataset_id}
            onChange={handleInputChange}
            className="form-input"
            disabled={disabled}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor={`object_name_${level}`} className="form-label">
            Object Name (Level {level})
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

        <div className="form-group">
          <label htmlFor={`object_type_${level}`} className="form-label">
            Object Type (Level {level})
          </label>
          <select
            id={`object_type_${level}`}
            name="object_type"
            value={formData.object_type}
            onChange={handleSelectChange}
            className="form-input"
            disabled={disabled || level === 1}
            required
          >
            <option value="VIEW">VIEW</option>
            <option value="TABLE">TABLE</option>
          </select>
          {level === 1 && (
            <p className="text-sm text-gray-500 mt-1">
              Level 1 is always set to VIEW
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor={`query_${level}`} className="form-label">
            Query (Level {level})
          </label>
          <textarea
            id={`query_${level}`}
            name="query"
            value={formData.query}
            onChange={handleInputChange}
            rows={4}
            className="form-textarea"
            disabled={disabled}
            required
          />
          {level >= 2 && previousLevelData && (
            <p className="auto-generated-query">
              Query automatically generated from Level {level - 1}. You can edit it if needed.
            </p>
          )}
        </div>

        <button
          type="submit"
          className="form-button"
          disabled={!isFormComplete() || disabled}
        >
          {isLastLevel ? 'Done' : 'Next Level'}
        </button>
      </form>
    </div>
  );
};

export default LevelForm;