import React from 'react';
import '../Styles/SubmissionOverlay.css';

type SubmissionOverlayProps = {
  isLoading: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  onMakeChanges: () => void;
  onShowDbt: () => void;
  onSubmitAgain: () => void;
};

const SubmissionOverlay = ({
  isLoading,
  isSuccess,
  isError,
  onMakeChanges,
  onShowDbt,
  onSubmitAgain
}: SubmissionOverlayProps) => {
  if (!isLoading && !isSuccess && !isError) return null;

  return (
    <div className="submission-overlay">
      {isLoading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Submitting your levels...</p>
        </div>
      )}
      
      {isSuccess && (
        <div className="result-modal success">
          <h3>Submission Successful!</h3>
          <div className="button-group">
            <button onClick={onMakeChanges} className="modal-button secondary">
              Make Changes
            </button>
            <button onClick={onShowDbt} className="modal-button primary">
              Show dbt Command
            </button>
          </div>
        </div>
      )}
      
      {isError && (
        <div className="result-modal error">
          <h3>Submission Failed</h3>
          <button onClick={onSubmitAgain} className="modal-button primary">
            Submit Again
          </button>
        </div>
      )}
    </div>
  );
};

export default SubmissionOverlay;