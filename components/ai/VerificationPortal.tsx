import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAI } from "../../contexts/ai/ai-context";
import {
  VerificationChallenge,
  VerificationQuestion,
} from "../../agents/verification-agent";

interface VerificationPortalProps {
  difficulty?: number;
  userId: string;
  onComplete: (result: any) => void;
}

export const VerificationPortal: React.FC<VerificationPortalProps> = ({
  difficulty = 1,
  userId,
  onComplete,
}) => {
  // State
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [challenge, setChallenge] = useState<VerificationChallenge | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [interacted, setInteracted] = useState(false);

  // Get AI methods
  const {
    generateChallenge,
    evaluateResponses,
    isLoading: aiIsLoading,
  } = useAI();

  // Generate a challenge when the component mounts
  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // For initial testing, use the API endpoint directly
        const response = await fetch("/api/ai/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "generate",
            userId,
            difficulty,
          }),
        });

        const data = await response.json();

        if (data.success && data.challenge) {
          setChallenge(data.challenge);
        } else {
          setError(data.message || "Failed to generate challenge");
        }
      } catch (err) {
        setError("Error generating verification challenge. Please try again.");
        console.error("Error fetching challenge:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChallenge();
  }, [userId, difficulty]);

  // Handle response changes
  const handleResponseChange = (questionId: string, value: string) => {
    setInteracted(true);
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // Handle next step
  const handleNext = () => {
    if (!challenge) return;

    // Check if response is provided
    const currentQuestion = challenge.questions[step];
    if (!responses[currentQuestion.id]) {
      setError("Please provide an answer before continuing");
      return;
    }

    setError(null);

    // Go to next question or submit if last
    if (step < challenge.questions.length - 1) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (step > 0) {
      setStep(step - 1);
      setError(null);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!challenge) return;

    try {
      setIsLoading(true);
      setError(null);

      // For initial testing, use the API endpoint directly
      const response = await fetch("/api/ai/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "evaluate",
          userId,
          challengeId: challenge.id,
          responses,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.result);
        onComplete(data.result);
      } else {
        setError(data.message || "Failed to evaluate responses");
      }
    } catch (err) {
      setError("Error submitting verification responses. Please try again.");
      console.error("Error submitting responses:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Render question based on type
  const renderQuestion = (question: VerificationQuestion) => {
    switch (question.answerType) {
      case "multiple-choice":
        return (
          <div className="verification-options">
            {question.options?.map((option, index) => (
              <motion.label
                key={index}
                className={`verification-option ${
                  responses[question.id] === option ? "selected" : ""
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={responses[question.id] === option}
                  onChange={() => handleResponseChange(question.id, option)}
                />
                <span>{option}</span>
              </motion.label>
            ))}
          </div>
        );

      case "true-false":
        return (
          <div className="verification-options true-false">
            <motion.label
              className={`verification-option ${
                responses[question.id] === "true" ? "selected" : ""
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <input
                type="radio"
                name={question.id}
                value="true"
                checked={responses[question.id] === "true"}
                onChange={() => handleResponseChange(question.id, "true")}
              />
              <span>True</span>
            </motion.label>
            <motion.label
              className={`verification-option ${
                responses[question.id] === "false" ? "selected" : ""
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <input
                type="radio"
                name={question.id}
                value="false"
                checked={responses[question.id] === "false"}
                onChange={() => handleResponseChange(question.id, "false")}
              />
              <span>False</span>
            </motion.label>
          </div>
        );

      case "text":
      default:
        return (
          <textarea
            className="verification-input"
            value={responses[question.id] || ""}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="Type your answer here..."
            rows={4}
          />
        );
    }
  };

  // Interactive welcome screen
  if (!isLoading && !result && challenge && !interacted) {
    return (
      <motion.div
        className="verification-welcome"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="welcome-icon">🎭</div>
        <h2>Fan Verification Challenge</h2>
        <p>Prove you're a true fan by answering these questions about PAPA.</p>
        <ul className="welcome-features">
          <li>
            <span>🏆</span> Earn fan access levels based on your knowledge
          </li>
          <li>
            <span>🔓</span> Unlock exclusive features and content
          </li>
          <li>
            <span>🎵</span> Show your connection to PAPA's music and history
          </li>
        </ul>
        <motion.button
          className="welcome-button"
          onClick={() => setInteracted(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Start Challenge
        </motion.button>
      </motion.div>
    );
  }

  // Show loading state
  if (isLoading || aiIsLoading) {
    return (
      <div className="verification-loading">
        <div className="loading-spinner"></div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          Preparing your fan verification challenge...
        </motion.p>
        <motion.div
          className="loading-facts"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <p>
            The verification system analyzes your knowledge of PAPA to determine
            your fan level.
          </p>
        </motion.div>
      </div>
    );
  }

  // Show error state
  if (error && !challenge) {
    return (
      <motion.div
        className="verification-error"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="error-icon">❌</div>
        <h3>Something went wrong</h3>
        <p>{error}</p>
        <motion.button
          onClick={() => window.location.reload()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Try Again
        </motion.button>
      </motion.div>
    );
  }

  // Show results
  if (result) {
    return (
      <motion.div
        className="verification-results"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="result-icon">{result.success ? "🎉" : "🔄"}</div>
        <h2>
          {result.success
            ? "Verification Successful!"
            : "Verification Incomplete"}
        </h2>
        <div className="score-display">
          <div
            className="score-circle"
            style={{
              background: `conic-gradient(#00a4ff ${result.score}%, #2a2a2a ${result.score}% 100%)`,
            }}
          >
            <span>{Math.round(result.score)}%</span>
          </div>
        </div>
        <p className="result-feedback">{result.feedback}</p>

        {result.accessGranted && (
          <motion.div
            className="access-granted"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <div className="access-badge">Level {result.newAccessLevel}</div>
            <p>You've been granted access to exclusive fan content!</p>
          </motion.div>
        )}

        <div className="result-actions">
          {result.success ? (
            <motion.button
              className="success-button"
              onClick={() => (window.location.href = "/archive")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              View Exclusive Content
            </motion.button>
          ) : (
            <motion.button
              className="retry-button"
              onClick={() => window.location.reload()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Try Again
            </motion.button>
          )}
        </div>
      </motion.div>
    );
  }

  // Show challenge questions
  return (
    <div className="verification-portal">
      <h2>Fan Verification</h2>
      <p className="verification-description">
        Answer these questions to access exclusive PAPA content
      </p>

      {challenge && (
        <AnimatePresence mode="wait">
          <motion.div
            className="verification-question-container"
            key={`question-${step}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="verification-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${
                      ((step + 1) / challenge.questions.length) * 100
                    }%`,
                  }}
                ></div>
              </div>
              <span>
                Question {step + 1} of {challenge.questions.length}
              </span>
            </div>

            <div className="verification-question">
              <h3>{challenge.questions[step].question}</h3>
              {renderQuestion(challenge.questions[step])}
            </div>

            {error && (
              <motion.p
                className="verification-error-message"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {error}
              </motion.p>
            )}

            <div className="verification-buttons">
              {step > 0 && (
                <motion.button
                  onClick={handlePrevious}
                  className="verification-prev-btn"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Previous
                </motion.button>
              )}
              <motion.button
                onClick={handleNext}
                className="verification-next-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {step < challenge.questions.length - 1
                  ? "Next"
                  : "Complete Verification"}
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      <style jsx global>{`
        .verification-portal {
          max-width: 800px;
          margin: 0 auto;
          padding: 1rem;
          color: white;
        }

        .verification-welcome {
          text-align: center;
          padding: 2rem;
          background: rgba(0, 30, 60, 0.3);
          border-radius: 12px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(0, 164, 255, 0.2);
        }

        .welcome-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .welcome-features {
          text-align: left;
          max-width: 400px;
          margin: 1.5rem auto;
          list-style-type: none;
          padding: 0;
        }

        .welcome-features li {
          margin-bottom: 0.8rem;
          display: flex;
          align-items: center;
          gap: 0.8rem;
        }

        .welcome-features li span {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: rgba(0, 164, 255, 0.2);
        }

        .welcome-button {
          background: linear-gradient(45deg, #0088ff, #00a4ff);
          color: white;
          border: none;
          padding: 0.8rem 2rem;
          border-radius: 30px;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          margin-top: 1.5rem;
          box-shadow: 0 4px 15px rgba(0, 164, 255, 0.3);
        }

        .verification-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          text-align: center;
        }

        .loading-facts {
          margin-top: 2rem;
          max-width: 400px;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .loading-spinner {
          border: 4px solid rgba(0, 164, 255, 0.3);
          border-radius: 50%;
          border-top: 4px solid #00a4ff;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
          margin-bottom: 2rem;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .verification-error {
          text-align: center;
          padding: 2rem;
          background: rgba(255, 50, 50, 0.1);
          border-radius: 12px;
          border: 1px solid rgba(255, 50, 50, 0.3);
        }

        .error-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .verification-error button {
          background: #ff5050;
          color: white;
          border: none;
          padding: 0.8rem 2rem;
          border-radius: 30px;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          margin-top: 1.5rem;
        }

        .verification-question-container {
          background: rgba(0, 30, 60, 0.3);
          border-radius: 12px;
          padding: 2rem;
          margin-top: 1.5rem;
          border: 1px solid rgba(0, 164, 255, 0.2);
          backdrop-filter: blur(5px);
        }

        .verification-progress {
          margin-bottom: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .progress-bar {
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(to right, #0088ff, #00a4ff);
          border-radius: 10px;
          transition: width 0.3s ease;
        }

        .verification-progress span {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.7);
          text-align: right;
        }

        .verification-question h3 {
          margin-top: 0;
          margin-bottom: 1.5rem;
          font-size: 1.3rem;
          color: white;
        }

        .verification-options {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
          margin-bottom: 2rem;
        }

        .verification-options.true-false {
          flex-direction: row;
          justify-content: center;
          gap: 1.5rem;
        }

        .verification-option {
          display: flex;
          align-items: center;
          padding: 0.8rem 1.2rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          cursor: pointer;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.2s ease;
        }

        .verification-option.selected {
          background: rgba(0, 164, 255, 0.15);
          border-color: rgba(0, 164, 255, 0.5);
        }

        .verification-option:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .verification-option input {
          margin-right: 0.8rem;
        }

        .verification-input {
          width: 100%;
          padding: 1rem;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          font-size: 1rem;
          resize: vertical;
          margin-bottom: 2rem;
        }

        .verification-input:focus {
          outline: none;
          border-color: rgba(0, 164, 255, 0.5);
          background: rgba(0, 164, 255, 0.05);
        }

        .verification-error-message {
          color: #ff5050;
          margin-bottom: 1rem;
          padding: 0.8rem;
          background: rgba(255, 0, 0, 0.1);
          border-radius: 6px;
          text-align: center;
        }

        .verification-buttons {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
        }

        .verification-prev-btn,
        .verification-next-btn {
          padding: 0.8rem 1.5rem;
          border-radius: 30px;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          border: none;
        }

        .verification-prev-btn {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .verification-next-btn {
          background: linear-gradient(45deg, #0088ff, #00a4ff);
          color: white;
          flex-grow: 1;
          box-shadow: 0 4px 15px rgba(0, 164, 255, 0.3);
        }

        /* Results styles */
        .verification-results {
          text-align: center;
          padding: 2rem;
          background: rgba(0, 30, 60, 0.3);
          border-radius: 12px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(0, 164, 255, 0.2);
        }

        .result-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .score-display {
          margin: 2rem auto;
          position: relative;
          width: 150px;
          height: 150px;
        }

        .score-circle {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          font-weight: bold;
          color: white;
          box-shadow: 0 0 20px rgba(0, 164, 255, 0.3);
          position: relative;
        }

        .score-circle::before {
          content: "";
          position: absolute;
          inset: 5px;
          border-radius: 50%;
          background: rgba(0, 20, 40, 0.9);
          z-index: -1;
        }

        .result-feedback {
          margin: 1.5rem 0;
          font-size: 1.1rem;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.9);
        }

        .access-granted {
          background: rgba(0, 200, 83, 0.1);
          border: 1px solid rgba(0, 200, 83, 0.3);
          border-radius: 10px;
          padding: 1.5rem;
          margin: 2rem 0;
        }

        .access-badge {
          display: inline-block;
          background: linear-gradient(45deg, #00c853, #69f0ae);
          color: rgba(0, 0, 0, 0.8);
          font-weight: bold;
          padding: 0.4rem 1rem;
          border-radius: 30px;
          margin-bottom: 0.8rem;
        }

        .result-actions {
          margin-top: 2rem;
        }

        .success-button,
        .retry-button {
          padding: 0.8rem 2rem;
          border-radius: 30px;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          border: none;
        }

        .success-button {
          background: linear-gradient(45deg, #00c853, #69f0ae);
          color: rgba(0, 0, 0, 0.8);
        }

        .retry-button {
          background: linear-gradient(45deg, #0088ff, #00a4ff);
          color: white;
        }

        @media (max-width: 600px) {
          .verification-portal {
            padding: 0.5rem;
          }

          .verification-question-container {
            padding: 1rem;
          }

          .verification-options.true-false {
            flex-direction: column;
            gap: 0.8rem;
          }

          .score-display {
            width: 120px;
            height: 120px;
          }

          .score-circle {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
};
