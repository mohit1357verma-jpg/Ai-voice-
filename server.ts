import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Previews cache to provide instant voice sampling without repeated API quota consumption
const previewCache = new Map<string, { audioBase64: string; mimeType: string }>();

// Helper function to create standard 44-byte WAV header for raw PCM
function createWavHeader(dataLength: number, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  header.writeUInt32LE(byteRate, 28);
  const blockAlign = numChannels * (bitsPerSample / 8);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataLength, 40);
  return header;
}

// Ensure audio buffer has valid RIFF WAV header
function ensureWavBuffer(rawBuffer: Buffer, sampleRate = 24000): Buffer {
  if (rawBuffer.length >= 12) {
    const isRiff = rawBuffer.subarray(0, 4).toString('ascii') === 'RIFF';
    const isWave = rawBuffer.subarray(8, 12).toString('ascii') === 'WAVE';
    if (isRiff && isWave) {
      return rawBuffer;
    }
  }
  const header = createWavHeader(rawBuffer.length, sampleRate, 1, 16);
  return Buffer.concat([header, rawBuffer]);
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '15mb' }));

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      app: 'Easy Voice AI',
      time: new Date().toISOString(),
    });
  });

  // Voices list endpoint
  app.get('/api/voices', (req: Request, res: Response) => {
    const voices = [
      {
        id: 'Kore',
        name: 'Kore',
        gender: 'female',
        tone: 'Warm & Natural',
        toneHi: 'मधुर और स्वाभाविक (महिला)',
        bestFor: 'News, Audiobooks, Announcements',
        bestForHi: 'समाचार, ऑडियोबुक, घोषणाएँ',
        description: 'Balanced, warm, and natural female voice with crystal clear Hindi & English pronunciation.',
        descriptionHi: 'स्पष्ट, संतुलित और मनमोहक महिला आवाज़। हिंदी और अंग्रेज़ी दोनों के लिए सबसे उपयुक्त।',
      },
      {
        id: 'Puck',
        name: 'Puck',
        gender: 'male',
        tone: 'Energetic & Youthful',
        toneHi: 'उत्साही और युवा (पुरुष)',
        bestFor: 'Social Media, Advertisements, Podcasts',
        bestForHi: 'सोशल मीडिया, विज्ञापन, पॉडकास्ट',
        description: 'Bright, lively, and energetic voice ideal for engaging storytelling and modern content.',
        descriptionHi: 'रोमांचक, ऊर्जावान और युवा पुरुष आवाज़, जो दर्शकों का ध्यान तुरंत आकर्षित करती है।',
      },
      {
        id: 'Fenrir',
        name: 'Fenrir',
        gender: 'male',
        tone: 'Deep & Authoritative',
        toneHi: 'गंभीर और प्रभावशाली (पुरुष)',
        bestFor: 'Documentaries, Narration, Formal Speeches',
        bestForHi: 'डॉक्यूमेंट्री, गंभीर आख्यान, औपचारिक भाषण',
        description: 'Deep, resonant, and commanding voice with a rich cinematic timber.',
        descriptionHi: 'गहरी, प्रभावशाली और वजनदार आवाज़, डॉक्यूमेंट्री और आधिकारिक प्रस्तुतियों के लिए उत्तम।',
      },
      {
        id: 'Zephyr',
        name: 'Zephyr',
        gender: 'female',
        tone: 'Calm & Soothing',
        toneHi: 'शांत और सौम्य (महिला)',
        bestFor: 'Meditation, Poetry, Bedtime Stories',
        bestForHi: 'ध्यान, कविता, सुकून भरी कहानियाँ',
        description: 'Smooth, serene, and calming voice with gentle pacing and soft inflections.',
        descriptionHi: 'सुकून देने वाली, शांत और सौम्य महिला आवाज़। कविता पाठ और ध्यान के लिए आदर्श।',
      },
      {
        id: 'Charon',
        name: 'Charon',
        gender: 'male',
        tone: 'Mature & Professional',
        toneHi: 'परिपक्व और पेशेवर (पुरुष)',
        bestFor: 'Corporate, Education, Technical Tutorials',
        bestForHi: 'व्यावसायिक, शिक्षा, तकनीकी मार्गदर्शन',
        description: 'Steady, articulate, and mature voice suited for instructional guides and education.',
        descriptionHi: 'स्थिर, स्पष्ट और अनुभवी आवाज़। शैक्षणिक और तकनीकी सामग्री के लिए बेहतरीन।',
      },
    ];
    res.json({ voices });
  });

  // TTS Synthesis endpoint
  app.post('/api/tts', async (req: Request, res: Response) => {
    try {
      const {
        text,
        voice = 'Kore',
        language = 'hi-IN',
        style = 'natural',
        speed = 1.0,
      } = req.body;

      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({
          error: 'कृपया बोलने के लिए टेक्स्ट दर्ज करें / Please provide text to convert.',
        });
      }

      if (text.length > 3000) {
        return res.status(400).json({
          error: 'टेक्स्ट की लंबाई 3000 वर्णों से कम होनी चाहिए / Text must be under 3000 characters.',
        });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: 'Gemini API कुंजी अनुपलब्ध है। कृपया AI Studio Settings > Secrets में GEMINI_API_KEY जोड़ें।',
          details: 'GEMINI_API_KEY is not configured on the server environment.',
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      // Map style & language into explicit speech metadata instructions
      let styleInstruction = 'Natural, conversational, well-articulated, and human-like.';
      switch (style) {
        case 'professional':
          styleInstruction = 'Professional, articulate, authoritative, news anchor or broadcast style with pristine diction.';
          break;
        case 'friendly':
          styleInstruction = 'Warm, cheerful, friendly, welcoming, and smiling conversational tone.';
          break;
        case 'storytelling':
          styleInstruction = 'Expressive, dramatic, immersive storytelling with emotional cadence and natural pauses.';
          break;
        case 'energetic':
          styleInstruction = 'Energetic, motivational, fast-paced, vibrant, and enthusiastic presentation.';
          break;
        default:
          styleInstruction = 'Natural, balanced, pleasant, and easy-to-understand conversational speech.';
      }

      if (speed <= 0.8) {
        styleInstruction += ' Spoken slowly and clearly with measured pauses for easy listening.';
      } else if (speed >= 1.25) {
        styleInstruction += ' Spoken at a brisk, energetic tempo while maintaining crystal clear clarity.';
      }

      if (language.startsWith('hi')) {
        styleInstruction += ' Pronounce Hindi words authentically with native cadence, proper matra articulation, and natural Indian intonation.';
      } else if (language.startsWith('en-IN')) {
        styleInstruction += ' Pronounce English with a clear, polite Indian English accent and natural rhythm.';
      }

      // Try gemini-3.8-flash-tts first (as specified in user requirements), with fallback to gemini-3.8-flash-lite-tts
      const modelsToTry = ['gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts'];
      let lastError: any = null;
      let finalAudioBase64 = '';
      let usedModel = '';

      for (const modelName of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: text.trim(),
                    speechMetadata: {
                      style: styleInstruction,
                    },
                  },
                ],
              },
            ],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: voice },
                },
              },
            },
          });

          const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
          if (inlineData?.data) {
            finalAudioBase64 = inlineData.data;
            usedModel = modelName;
            break;
          }
        } catch (err: any) {
          console.warn(`Model ${modelName} attempt error:`, err?.message || err);
          lastError = err;
        }
      }

      if (!finalAudioBase64) {
        throw lastError || new Error('ऑडियो जनरेट नहीं हो सका। कृपया दोबारा प्रयास करें।');
      }

      // Decode and ensure standard 44-byte WAV header
      const rawBuffer = Buffer.from(finalAudioBase64, 'base64');
      const wavBuffer = ensureWavBuffer(rawBuffer, 24000);
      const safeAudioBase64 = wavBuffer.toString('base64');

      // Approximate duration based on 24kHz 16-bit mono PCM (48000 bytes per second)
      const pcmBytes = Math.max(0, wavBuffer.length - 44);
      const estimatedSeconds = Number((pcmBytes / 48000).toFixed(2));

      return res.json({
        success: true,
        audioBase64: safeAudioBase64,
        mimeType: 'audio/wav',
        modelUsed: usedModel,
        voice,
        duration: estimatedSeconds,
        timestamp: Date.now(),
      });
    } catch (error: any) {
      console.error('TTS Generation error:', error);
      const message = error?.message || 'स्पीच जनरेशन के दौरान त्रुटि हुई';
      return res.status(500).json({
        error: message,
        details: error?.statusText || error?.toString(),
      });
    }
  });

  // Instant voice preview endpoint (cached for fast feedback)
  app.post('/api/tts/preview', async (req: Request, res: Response) => {
    try {
      const { voice = 'Kore', lang = 'hi' } = req.body;
      const cacheKey = `${voice}_${lang}`;

      if (previewCache.has(cacheKey)) {
        const cached = previewCache.get(cacheKey)!;
        return res.json({
          success: true,
          audioBase64: cached.audioBase64,
          mimeType: cached.mimeType,
          cached: true,
        });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: 'Gemini API Key missing',
        });
      }

      const previewText =
        lang === 'hi'
          ? `नमस्ते! मैं ${voice} हूँ। Easy Voice AI में आपका स्वागत है।`
          : `Hello! I am ${voice}. Welcome to Easy Voice AI.`;

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: previewText,
                speechMetadata: {
                  style: 'Warm, natural and welcoming greeting.',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });

      const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      if (!inlineData?.data) {
        throw new Error('Preview audio could not be generated');
      }

      const rawBuffer = Buffer.from(inlineData.data, 'base64');
      const wavBuffer = ensureWavBuffer(rawBuffer, 24000);
      const safeAudioBase64 = wavBuffer.toString('base64');

      previewCache.set(cacheKey, {
        audioBase64: safeAudioBase64,
        mimeType: 'audio/wav',
      });

      return res.json({
        success: true,
        audioBase64: safeAudioBase64,
        mimeType: 'audio/wav',
        cached: false,
      });
    } catch (err: any) {
      console.error('Voice preview error:', err);
      return res.status(500).json({ error: err?.message || 'Preview generation failed' });
    }
  });

  // Serve static assets or mount Vite dev middleware
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Easy Voice AI server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
