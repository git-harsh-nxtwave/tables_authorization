import { useState } from 'react';
import '../Styles/Level.css';

const Levelcard = () => {
  const [formData, setFormData] = useState({
    project_id: 'kossip-helpers',
    dataset_id: '',
    object_name: '',
    object_type: '',
    query: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Add your submit logic here
  };

  return (
    <div className="form-container">
      <div className="form-card">
        <h1 className="form-title">Data Object Form</h1>
        <div className="space-y-4">

          <div className="form-group">
            <label htmlFor="project_id" className="form-label">Project ID</label>
            <input
              type="text"
              id="project_id"
              name="project_id"
              value={formData.project_id}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="dataset_id" className="form-label">Dataset ID</label>
            <input
              type="text"
              id="dataset_id"
              name="dataset_id"
              value={formData.dataset_id}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="object_name" className="form-label">Object Name</label>
            <input
              type="text"
              id="object_name"
              name="object_name"
              value={formData.object_name}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="object_type" className="form-label">Object Type</label>
            <input
              type="text"
              id="object_type"
              name="object_type"
              value={formData.object_type}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="query" className="form-label">Query</label>
            <textarea
              id="query"
              name="query"
              value={formData.query}
              onChange={handleChange}
              rows="4"
              className="form-textarea"
              required
            ></textarea>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            className="form-button"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default Levelcard;