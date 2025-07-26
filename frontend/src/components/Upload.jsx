import React from "react";
import { Upload as UploadIcon } from "lucide-react";

const Upload = ({ fileInputRef, isLoading, handleFileInput }) => (
  <div className="sample-section">
    <button
      className="sample-button"
      onClick={() => fileInputRef.current?.click()}
      disabled={isLoading}
    >
      <UploadIcon size={20} />
      Upload Fi data
    </button>
    <input
      ref={fileInputRef}
      type="file"
      accept=".txt"
      onChange={handleFileInput}
      style={{ display: "none" }}
    />
    <p className="sample-description">
      Use our sample profile to see Future Me in action
    </p>
  </div>
);

export default Upload;
