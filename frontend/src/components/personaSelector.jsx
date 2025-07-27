/* eslint-disable no-unused-vars */
// frontend/src/components/PersonaSelector.jsx
// Component for selecting different Future Me personas

import React, { useState, useEffect } from "react";
import { User, TrendingUp, Clock, Crown } from "lucide-react";
import { apiService } from "../services/api";

const PersonaSelector = ({
  currentAge,
  selectedAge,
  onAgeSelect,
  userProfile,
}) => {
  const [personaCharacteristics, setPersonaCharacteristics] = useState({});
  const [loadingAge, setLoadingAge] = useState(null);

  const predefinedAges = [
    {
      age: 30,
      icon: TrendingUp,
      title: "Early Career",
      description: "Building foundations",
    },
    {
      age: 40,
      icon: User,
      title: "Prime Years",
      description: "Wealth accumulation",
    },
    {
      age: 50,
      icon: Clock,
      title: "Mid-Life",
      description: "Financial maturity",
    },
    {
      age: 60,
      icon: Crown,
      title: "Pre-Retirement",
      description: "Wisdom & security",
    },
  ];

  // Generate persona characteristics for an age
  const generatePersonaCharacteristics = async (age) => {
    if (personaCharacteristics[age]) return; // Already loaded

    setLoadingAge(age);
    try {
      const response = await apiService.generatePersona(age, userProfile);
      setPersonaCharacteristics((prev) => ({
        ...prev,
        [age]: response.persona,
      }));
    } catch (error) {
      console.error(`Failed to generate persona for age ${age}:`, error);
    } finally {
      setLoadingAge(null);
    }
  };

  // Load characteristics for selected age
  useEffect(() => {
    if (selectedAge && !personaCharacteristics[selectedAge]) {
      generatePersonaCharacteristics(selectedAge);
    }
  }, [selectedAge]);

  // Load characteristics for predefined ages
  useEffect(() => {
    predefinedAges.forEach(({ age }) => {
      if (!personaCharacteristics[age]) {
        generatePersonaCharacteristics(age);
      }
    });
  }, []);

  const handleAgeSelect = (age) => {
    onAgeSelect(age);
    if (!personaCharacteristics[age]) {
      generatePersonaCharacteristics(age);
    }
  };

  const getAgeColor = (age) => {
    if (age <= 30) return "#10B981"; // Green
    if (age <= 40) return "#3B82F6"; // Blue
    if (age <= 50) return "#8B5CF6"; // Purple
    return "#F59E0B"; // Amber
  };

  const renderPersonaCard = ({ age, icon: Icon, title, description }) => {
    const isSelected = selectedAge === age;
    const isLoading = loadingAge === age;
    const characteristics = personaCharacteristics[age];
    const isAvailable = age > currentAge;

    return (
      <div
        key={age}
        className={`persona-card ${isSelected ? "selected" : ""} ${
          !isAvailable ? "disabled" : ""
        }`}
        onClick={() => isAvailable && handleAgeSelect(age)}
        style={{ borderColor: isSelected ? getAgeColor(age) : undefined }}
      >
        <div className="persona-header">
          <div className="persona-icon" style={{ color: getAgeColor(age) }}>
            <Icon size={24} />
          </div>
          <div className="persona-age">
            <span className="age-number">{age}</span>
            <span className="age-label">years old</span>
          </div>
        </div>

        <div className="persona-info">
          <h4 className="persona-title">{characteristics?.title || title}</h4>
          <p className="persona-description">
            {characteristics?.lifePhase || description}
          </p>
        </div>

        {isLoading && (
          <div className="persona-loading">
            <div className="loading-spinner small"></div>
            <span>Generating persona...</span>
          </div>
        )}

        {characteristics && !isLoading && (
          <div className="persona-details">
            <div className="persona-stat">
              <span className="stat-label">Net Worth</span>
              <span className="stat-value">
                {characteristics.netWorthRange}
              </span>
            </div>
            <div className="persona-focus">
              <strong>Focus:</strong> {characteristics.financialFocus}
            </div>
          </div>
        )}

        {!isAvailable && (
          <div className="persona-unavailable">
            <span>Current Age</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="persona-selector">
      <div className="selector-header">
        <h3>Choose Your Future Self</h3>
        <p>
          Select an age to start a conversation with that version of yourself
        </p>
      </div>

      {/* Predefined Age Cards */}
      <div className="personas-grid">
        {predefinedAges.map(renderPersonaCard)}
      </div>

      {/* Custom Age Selector */}
      <div className="custom-age-selector">
        <h4>Or choose a custom age:</h4>
        <div className="age-input-container">
          <input
            type="range"
            min={currentAge + 1}
            max={80}
            value={selectedAge}
            onChange={(e) => handleAgeSelect(parseInt(e.target.value))}
            className="age-slider"
            style={{
              background: `linear-gradient(to right, ${getAgeColor(
                selectedAge
              )} 0%, ${getAgeColor(selectedAge)} ${
                ((selectedAge - currentAge - 1) / (79 - currentAge)) * 100
              }%, #e5e7eb ${
                ((selectedAge - currentAge - 1) / (79 - currentAge)) * 100
              }%, #e5e7eb 100%)`,
            }}
          />
          <div className="age-display">
            <span className="custom-age">{selectedAge}</span>
            <span className="age-label">years old</span>
          </div>
        </div>
      </div>

      {/* Selected Persona Details */}
      {selectedAge && personaCharacteristics[selectedAge] && (
        <div className="selected-persona-details">
          <h4>Future Me at {selectedAge}</h4>
          <div className="persona-achievements">
            <h5>Major Achievements:</h5>
            <ul>
              {personaCharacteristics[selectedAge].majorAchievements?.map(
                (achievement, index) => (
                  <li key={index}>{achievement}</li>
                )
              )}
            </ul>
          </div>
          <div className="persona-lessons">
            <h5>Key Lessons Learned:</h5>
            <ul>
              {personaCharacteristics[selectedAge].keyLessons?.map(
                (lesson, index) => (
                  <li key={index}>{lesson}</li>
                )
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Age Timeline Visualization */}
      <div className="age-timeline">
        <div className="timeline-track">
          <div
            className="timeline-progress"
            style={{
              width: `${
                ((selectedAge - currentAge) / (80 - currentAge)) * 100
              }%`,
              backgroundColor: getAgeColor(selectedAge),
            }}
          ></div>

          <div className="timeline-marker current" style={{ left: "0%" }}>
            <div className="marker-dot"></div>
            <span className="marker-label">Now ({currentAge})</span>
          </div>

          <div
            className="timeline-marker selected"
            style={{
              left: `${
                ((selectedAge - currentAge) / (80 - currentAge)) * 100
              }%`,
              color: getAgeColor(selectedAge),
            }}
          >
            <div
              className="marker-dot"
              style={{ backgroundColor: getAgeColor(selectedAge) }}
            ></div>
            <span className="marker-label">Future Me ({selectedAge})</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonaSelector;
