// frontend/src/components/ProfileAnalysis.jsx
// Component for uploading and analyzing Fi MCP data

const ProfileSummary = ({ humanDescription }) => {
  if (!humanDescription) return null;
  const {
    name,
    age,
    lifeStage,
    netWorth,
    totalLiability,
    creditScore,
    employment,
  } = humanDescription;
  return (
    <div className="profile-analysis" style={{ backgroundColor: "#0b0f10" }}>
      <div className="preview-section">
        <div className="preview-grid preview-item">
          <div className="preview-item">
            <span className="text-4xl preview-value">{name}</span>
            <div className="text-xs">{lifeStage}</div>
          </div>
          <div className="twoXB flex items-center justify-center preview-item ">
            <span className="preview-value text-5xl text-center items-center flex justify-center">
              {age}
            </span>
          </div>

          <div className="preview-item">
            <span className="preview-label">Net Worth: </span>
            <span className="preview-value">
              ₹{parseInt(netWorth).toLocaleString()}
            </span>
            <div>
                <span className="preview-label">Total Liability: </span>
                <span className="preview-value">
                  ₹{parseInt(totalLiability).toLocaleString()}
                </span>
            </div>
          </div>

          <div className="preview-item twoXL text-center">
            <span className="preview-label">Credit Score: </span>
            <span className="preview-value">{creditScore}</span>
          </div>
          <div className="preview-item text-center twoXL">
            <div>
              <span className="preview-label">Employer</span>
              <span className="preview-value">
                {employment?.currentEmployer}
              </span>
            </div>
            <div>
              <span className="preview-label">Work Experience: </span>
              <span className="preview-value">
                {employment?.workExperienceYears}yrs |
                <span className="preview-label"> Career Trajectory: </span>
                <span className="preview-value">
                  {employment?.careerTrajectory}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSummary;
