import type { NextApiRequest, NextApiResponse } from "next";
import { VerificationAgent } from "../../../agents/verification-agent";
import OpenAI from "openai";

// In an actual implementation, you would want to store challenges and sessions in a database
// For this example, we'll use in-memory storage as a demonstration
const challengeStore: Record<string, any> = {};
const sessionStore: Record<string, any> = {};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Make sure this is a POST request
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  // Initialize OpenAI with the server's API key
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    // Create a verification agent just for this request
    // In production, you might want to have a more persistent agent with caching
    const agent = new VerificationAgent(
      {
        model: "gpt-3.5-turbo", // Use a less expensive model for production
        temperature: 0.7,
      },
      null // We'll handle storage separately in this API route
    );

    // Initialize with the server-side API key
    await agent.initialize(process.env.OPENAI_API_KEY);

    // Get the request body
    const { action, userId, difficulty, challengeId, responses } = req.body;

    // If no user ID provided, generate a temporary one
    const effectiveUserId = userId || `temp_user_${Date.now()}`;

    // Handle different actions
    switch (action) {
      case "generate":
        // Generate a verification challenge based on difficulty
        const difficultyLevel = parseInt(difficulty || "1", 10);

        if (
          isNaN(difficultyLevel) ||
          difficultyLevel < 1 ||
          difficultyLevel > 3
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid difficulty level. Must be 1, 2, or 3.",
          });
        }

        try {
          // Generate a new challenge
          const challenge = await generateChallenge(agent, difficultyLevel);

          // Store the challenge for later verification
          challengeStore[challenge.id] = challenge;

          // Return the challenge without correct answers
          const clientChallenge = {
            ...challenge,
            questions: challenge.questions.map((q) => ({
              id: q.id,
              question: q.question,
              options: q.options,
              answerType: q.answerType,
              difficulty: q.difficulty,
              // Don't include the correct answer
            })),
          };

          return res.status(200).json({
            success: true,
            challenge: clientChallenge,
          });
        } catch (error) {
          console.error("Error generating challenge:", error);
          return res.status(500).json({
            success: false,
            message: "Failed to generate verification challenge",
          });
        }

      case "evaluate":
        // Evaluate responses to a challenge
        if (!challengeId || !responses) {
          return res.status(400).json({
            success: false,
            message: "Missing challengeId or responses",
          });
        }

        // Get the stored challenge
        const challenge = challengeStore[challengeId];
        if (!challenge) {
          return res.status(404).json({
            success: false,
            message: "Challenge not found or expired",
          });
        }

        try {
          // Evaluate the responses
          const result = await evaluateResponses(
            agent,
            effectiveUserId,
            challenge,
            responses
          );

          // Store session if access was granted
          if (result.accessGranted) {
            sessionStore[effectiveUserId] = {
              userId: effectiveUserId,
              verificationLevel: result.newAccessLevel || 1,
              challenges: [challengeId],
              accessExpiration: new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000
              ).toISOString(), // 1 week
              lastVerifiedAt: new Date().toISOString(),
            };
          }

          return res.status(200).json({
            success: true,
            result,
          });
        } catch (error) {
          console.error("Error evaluating responses:", error);
          return res.status(500).json({
            success: false,
            message: "Failed to evaluate verification responses",
          });
        }

      case "checkAccess":
        // Check if a user has access to a certain tier
        const { requiredTier } = req.body;

        if (!requiredTier) {
          return res.status(400).json({
            success: false,
            message: "Missing requiredTier",
          });
        }

        const session = sessionStore[effectiveUserId];
        if (!session) {
          return res.status(200).json({
            success: true,
            hasAccess: false,
            message: "User not verified",
          });
        }

        // Check if verification is expired
        const expirationDate = new Date(session.accessExpiration);
        if (expirationDate < new Date()) {
          return res.status(200).json({
            success: true,
            hasAccess: false,
            message: "Verification expired",
          });
        }

        // Check if user has required tier
        const hasAccess =
          session.verificationLevel >= parseInt(requiredTier, 10);

        return res.status(200).json({
          success: true,
          hasAccess,
          currentTier: session.verificationLevel,
        });

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid action",
        });
    }
  } catch (error) {
    console.error("Error in verification API:", error);
    return res.status(500).json({
      success: false,
      message: "Server error processing verification request",
    });
  }
}

// Helper function to generate a challenge
async function generateChallenge(agent: VerificationAgent, difficulty: number) {
  const artistContent = {
    bandName: "PAPA",
    albums: [
      {
        title: "Tender Madness",
        year: 2013,
        songs: ["Young Rut", "If You're My Girl", "Forgotten Days"],
      },
      {
        title: "A Good Woman Is Hard To Find",
        year: 2011,
        songs: ["Let's Make You Pregnant", "Ain't It So"],
      },
    ],
    members: ["Darren Weiss", "Danny Presant"],
    bio: "PAPA is an American rock band from Los Angeles, formed in 2008.",
  };

  // Mock implementation - in production this would use the actual agent
  // and retrieve content from your storage
  return {
    id: `challenge_${Date.now()}`,
    questions: [
      {
        id: "q1",
        question: "What was PAPA's first album?",
        answerType: "text",
        difficulty: 1,
        correctAnswer: "A Good Woman Is Hard To Find",
      },
      {
        id: "q2",
        question: "In which year was PAPA formed?",
        answerType: "multiple-choice",
        options: ["2005", "2008", "2010", "2012"],
        difficulty: 1,
        correctAnswer: "2008",
      },
      {
        id: "q3",
        question: "Who is the drummer of PAPA?",
        answerType: "text",
        difficulty: 2,
        correctAnswer: "Darren Weiss",
      },
      {
        id: "q4",
        question: "Which song is from the album 'Tender Madness'?",
        answerType: "multiple-choice",
        options: [
          "Let's Make You Pregnant",
          "Young Rut",
          "I Am The Lion King",
          "Cotton Candy",
        ],
        difficulty: 2,
        correctAnswer: "Young Rut",
      },
    ].slice(0, difficulty + 2), // Return difficulty + 2 questions
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min expiry
    accessTier: difficulty,
  };
}

// Helper function to evaluate responses
async function evaluateResponses(
  agent: VerificationAgent,
  userId: string,
  challenge: any,
  responses: Record<string, string>
) {
  // Calculate score
  let correctAnswers = 0;
  const questionCount = challenge.questions.length;

  for (const question of challenge.questions) {
    const response = responses[question.id];
    if (!response) continue;

    // Compare the response to the correct answer
    const userAnswer = response.trim().toLowerCase();
    const correctAnswer = question.correctAnswer?.trim().toLowerCase();

    if (userAnswer === correctAnswer) {
      correctAnswers++;
    }
  }

  const score = (correctAnswers / questionCount) * 100;
  const passingScore = 70; // 70% to pass
  const success = score >= passingScore;

  // Generate feedback
  let feedback;
  if (success) {
    if (score === 100) {
      feedback =
        "Perfect! You're definitely a superfan. You've been granted access to exclusive content!";
    } else {
      feedback = `Great job! You got ${correctAnswers} out of ${questionCount} questions correct. You've been granted access to exclusive content!`;
    }
  } else {
    feedback = `Thanks for trying! You got ${correctAnswers} out of ${questionCount} questions correct. Try again with some easier questions to gain access.`;
  }

  return {
    success,
    score,
    accessGranted: success,
    newAccessLevel: success ? challenge.accessTier : undefined,
    feedback,
  };
}
