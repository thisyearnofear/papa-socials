import type { NextApiRequest, NextApiResponse } from 'next';
import { VerificationAgent } from '../../../agents/verification-agent';

interface ExtendedResponse extends NextApiResponse {
  success: boolean;
  message?: string;
  challenge?: Record<string, unknown>;
  result?: Record<string, unknown>;
}

interface ChallengeRequest {
  action: string;
  userId: string;
  difficulty?: number;
  challengeId?: string;
  responses?: Record<string, string>;
}

const handler = async (req: NextApiRequest, res: ExtendedResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // Destructure only the properties we need from the request body
  const { action, difficulty = 1, challengeId, responses } = req.body as ChallengeRequest;

  try {
    const agent = new VerificationAgent({
      model: 'gpt-3.5-turbo',
      temperature: 0.7
    });

    // Initialize with API key
    await agent.initialize(process.env.OPENAI_API_KEY);

    // Artist content as array for challenge generation
    const artistContentArray = [
      "Latest album: Summer Memories (2023)",
      "First EP: Zeno (2019)",
      "Most popular song: Distance (2022)",
      "Band formed in Los Angeles, 2015",
      "Genre: Alternative Rock/Indie",
      "Known for: High-energy live shows, intricate lyrics",
      "Current members: 4",
      "Notable venues played: The Echo, Bottom of the Hill"
    ];

    // Artist content as object for response evaluation
    const artistContentRecord = {
      latestAlbum: "Summer Memories (2023)",
      firstEp: "Zeno (2019)",
      popularSong: "Distance (2022)",
      formation: "Band formed in Los Angeles, 2015",
      genre: "Alternative Rock/Indie",
      knownFor: "High-energy live shows, intricate lyrics",
      members: "4",
      venues: "The Echo, Bottom of the Hill"
    };

    switch (action) {
      case 'generate':
        const challenge = await agent.generateChallenge(difficulty, artistContentArray);
        return res.status(200).json({ success: true, challenge });

      case 'evaluate':
        if (!challengeId || !responses) {
          return res.status(400).json({
            success: false,
            message: 'Missing challengeId or responses'
          });
        }

        // Convert responses object to a JSON string for evaluation
        const formattedResponses = JSON.stringify(responses);

        const result = await agent.evaluateResponses(challengeId, formattedResponses, artistContentRecord);
        return res.status(200).json({ success: true, result });

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }

  } catch (error) {
    console.error('Error in verification API:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export default handler;
