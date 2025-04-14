import { BaseAgent, AgentConfig } from "./base-agent";

export interface VerificationQuestion {
  id: string;
  question: string;
  options?: string[];
  answerType: "text" | "multiple-choice" | "true-false";
  difficulty: 1 | 2 | 3; // 1=easy, 3=hard
  correctAnswer?: string; // Used for grading
}

export interface VerificationChallenge {
  id: string;
  questions: VerificationQuestion[];
  expiresAt: string;
  accessTier: number; // What tier this challenge unlocks
}

export interface VerificationSession {
  userId: string;
  verificationLevel: number;
  challenges: string[]; // IDs of completed challenges
  accessExpiration: string;
  lastVerifiedAt: string;
}

export interface VerificationResult {
  success: boolean;
  score: number;
  accessGranted: boolean;
  newAccessLevel?: number;
  feedback: string;
}

export class VerificationAgent extends BaseAgent {
  // Cache for challenges to avoid regenerating them
  private challengeCache: Map<number, VerificationChallenge> = new Map();

  constructor(config: AgentConfig, storachaClient?: any) {
    super(config, storachaClient);
  }

  /**
   * Generate a verification challenge for a fan
   */
  async generateChallenge(
    difficulty: number,
    existingChallenges: string[] = []
  ): Promise<VerificationChallenge> {
    // Check cache first
    const cachedChallenge = this.challengeCache.get(difficulty);
    if (cachedChallenge) {
      return cachedChallenge;
    }

    // Get content knowledge from Storacha for context
    const artistContent = await this.retrieveData("artist_content");

    // Format artist content for the prompt
    const contentContext = artistContent
      ? JSON.stringify(artistContent).substring(0, 2000) // Limit context size
      : "The artist is a music band called PAPA with several albums and performances.";

    // Generate questions based on difficulty
    const prompt = `You are creating a fan verification challenge for a music artist's fans.
    Create ${
      difficulty === 1 ? 3 : difficulty === 2 ? 4 : 5
    } questions about the artist.
    
    The questions should test knowledge about the artist that only true fans would know.
    Make the questions ${
      difficulty === 1
        ? "basic"
        : difficulty === 2
        ? "intermediate"
        : "advanced"
    } difficulty.
    
    Some context about the artist:
    ${contentContext}
    
    For each question, provide:
    1. A unique ID
    2. The question text
    3. The answer type (text, multiple-choice, or true-false)
    4. If multiple-choice, provide 4 options
    5. The correct answer
    6. The difficulty level (${difficulty})
    
    Format your response as a JSON array of questions.`;

    try {
      const completionResult = await this.generateCompletion(prompt, {
        temperature: 0.8, // Higher creativity for varied questions
        maxTokens: 1500,
      });

      // Parse the generated questions
      let questions: VerificationQuestion[];
      try {
        const jsonStr = completionResult.trim().replace(/```json|```/g, "");
        questions = JSON.parse(jsonStr);
      } catch (e) {
        console.error("Failed to parse AI-generated questions:", e);
        // Fallback to some default questions if parsing fails
        questions = this.getDefaultQuestions(difficulty);
      }

      // Create the challenge
      const challenge: VerificationChallenge = {
        id: `challenge_${Date.now()}`,
        questions,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min expiry
        accessTier: difficulty,
      };

      // Store in cache
      this.challengeCache.set(difficulty, challenge);

      // Store the challenge in Storacha for persistence
      await this.storeData(`challenges/${challenge.id}`, challenge);

      return challenge;
    } catch (error) {
      console.error("Error generating verification challenge:", error);
      // Return fallback challenges
      return {
        id: `fallback_challenge_${Date.now()}`,
        questions: this.getDefaultQuestions(difficulty),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        accessTier: difficulty,
      };
    }
  }

  /**
   * Evaluate a fan's responses to a challenge
   */
  async evaluateResponses(
    userId: string,
    challengeId: string,
    responses: Record<string, string>
  ): Promise<VerificationResult> {
    try {
      // Retrieve the challenge
      const challenge = await this.retrieveData(`challenges/${challengeId}`);
      if (!challenge) {
        throw new Error(`Challenge not found: ${challengeId}`);
      }

      // Calculate score
      let correctAnswers = 0;
      const questionCount = challenge.questions.length;

      for (const question of challenge.questions) {
        const response = responses[question.id];
        if (!response) continue;

        // Compare the response to the correct answer
        // This is a simple implementation - could be more sophisticated
        const userAnswer = response.trim().toLowerCase();
        const correctAnswer = question.correctAnswer?.trim().toLowerCase();

        if (userAnswer === correctAnswer) {
          correctAnswers++;
        }
      }

      const score = (correctAnswers / questionCount) * 100;
      const passingScore = 70; // 70% to pass
      const success = score >= passingScore;

      // Get user's current verification session
      let session = await this.retrieveData(`sessions/${userId}`);
      if (!session) {
        session = {
          userId,
          verificationLevel: 0,
          challenges: [],
          accessExpiration: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(), // 1 week
          lastVerifiedAt: new Date().toISOString(),
        };
      }

      // Update session if successful
      let accessGranted = false;
      let newAccessLevel = session.verificationLevel;
      if (success && challenge.accessTier > session.verificationLevel) {
        accessGranted = true;
        newAccessLevel = challenge.accessTier;
        session.verificationLevel = challenge.accessTier;
        session.challenges.push(challengeId);
        session.lastVerifiedAt = new Date().toISOString();

        // Store updated session
        await this.storeData(`sessions/${userId}`, session);
      }

      // Generate feedback based on score
      const feedback = this.generateFeedback(
        score,
        success,
        correctAnswers,
        questionCount
      );

      return {
        success,
        score,
        accessGranted,
        newAccessLevel: accessGranted ? newAccessLevel : undefined,
        feedback,
      };
    } catch (error) {
      console.error("Error evaluating verification responses:", error);
      return {
        success: false,
        score: 0,
        accessGranted: false,
        feedback:
          "An error occurred while evaluating your responses. Please try again.",
      };
    }
  }

  /**
   * Generate feedback for the user based on their score
   */
  private generateFeedback(
    score: number,
    success: boolean,
    correctAnswers: number,
    totalQuestions: number
  ): string {
    if (success) {
      if (score === 100) {
        return "Perfect! You're definitely a superfan. You've been granted access to exclusive content!";
      } else {
        return `Great job! You got ${correctAnswers} out of ${totalQuestions} questions correct. You've been granted access to exclusive content!`;
      }
    } else {
      return `Thanks for trying! You got ${correctAnswers} out of ${totalQuestions} questions correct. Try again with some easier questions to gain access.`;
    }
  }

  /**
   * Get default questions as a fallback
   */
  private getDefaultQuestions(difficulty: number): VerificationQuestion[] {
    const questions: VerificationQuestion[] = [
      {
        id: "default_q1",
        question: "What is the name of PAPA's first album?",
        answerType: "text",
        difficulty: 1,
        correctAnswer: "First Album", // Replace with actual data
      },
      {
        id: "default_q2",
        question: "In which year was PAPA formed?",
        answerType: "multiple-choice",
        options: ["2005", "2010", "2015", "2020"],
        difficulty: 1,
        correctAnswer: "2010", // Replace with actual data
      },
      {
        id: "default_q3",
        question: "PAPA's music is primarily influenced by rock and folk.",
        answerType: "true-false",
        difficulty: 1,
        correctAnswer: "true", // Replace with actual data
      },
    ];

    // Return subset based on difficulty
    return questions.slice(0, difficulty + 2);
  }

  /**
   * Check if a user has access to a certain content tier
   */
  async checkAccess(userId: string, requiredTier: number): Promise<boolean> {
    try {
      const session = await this.retrieveData(`sessions/${userId}`);
      if (!session) return false;

      // Check if verification is expired
      const expirationDate = new Date(session.accessExpiration);
      if (expirationDate < new Date()) return false;

      // Check if user has required tier
      return session.verificationLevel >= requiredTier;
    } catch (error) {
      console.error("Error checking access:", error);
      return false;
    }
  }
}
