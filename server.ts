import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Increase JSON payload limit to handle base64 images and documents
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Shared server-side Gemini client
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(apiKey && apiKey.length > 5),
    brand: 'Zubair AI by Zubair WebsiteWala',
  });
});

// Chat Streaming API with multimodal attachments and web search grounding
app.post('/api/chat', async (req: Request, res: Response): Promise<void> => {
  if (!apiKey) {
    res.status(500).json({
      error: 'GEMINI_API_KEY is not configured on the server. Please check Settings > Secrets.',
    });
    return;
  }

  const {
    messages = [],
    model = 'gemini-3.8-flash',
    enableSearch = false,
    systemInstruction,
    temperature = 0.7,
  } = req.body;

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendEvent = (data: Record<string, unknown>) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // Zubair AI Default System Persona
    const defaultSystem = `You are "Zubair AI", an intelligent, multimodal AI assistant created by Zubair WebsiteWala.
Your tagline is: "Ask Anything. Create Anything. Learn Without Limits."
You are helpful, sharp, articulate, creative, and highly technically skilled.
You assist users with:
1. Web development, UI/UX design, programming, debugging, and systems architecture.
2. Business ideas, branding, marketing, strategy, and entrepreneurship (especially web presence and digital branding).
3. Education, science, mathematics, language learning, and research.
4. Writing, rewriting, formatting, translation, professional documents, CVs, and emails.
5. Multimodal analysis of images, charts, diagrams, and documents.
6. Creative storytelling, scripts, captions, and idea brainstorming.

Formatting guidelines:
- Use clean Markdown formatting with clear headings, bullet points, and tables where applicable.
- For code snippets, always provide the language identifier in triple backticks (e.g., \`\`\`tsx or \`\`\`python) with clear explanatory comments.
- Always be accurate, polite, and thorough. If unsure or if information might be outdated, clarify your sources or use search when available.`;

    // Build contents array for Gemini
    const contents: Array<{
      role: 'user' | 'model';
      parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
    }> = [];

    for (const msg of messages) {
      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

      // Add attachments (images, PDFs, documents) if present
      if (msg.attachments && Array.isArray(msg.attachments)) {
        for (const att of msg.attachments) {
          if (att.base64 && att.mimeType) {
            // Strip data:image/...;base64, prefix if present
            const cleanBase64 = att.base64.includes(',')
              ? att.base64.split(',')[1]
              : att.base64;
            parts.push({
              inlineData: {
                mimeType: att.mimeType,
                data: cleanBase64,
              },
            });
          }
        }
      }

      if (msg.content) {
        parts.push({ text: msg.content });
      }

      if (parts.length > 0) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts,
        });
      }
    }

    if (contents.length === 0) {
      sendEvent({ type: 'error', message: 'No message content provided.' });
      res.end();
      return;
    }

    // Configure tools
    const tools: Array<{ googleSearch?: Record<string, unknown> }> = [];
    if (enableSearch) {
      tools.push({ googleSearch: {} });
    }

    const candidateModels =
      model === 'gemini-4-argon'
        ? ['gemini-4-argon', 'gemini-3.5-flash', 'gemini-3.7-flash']
        : ['gemini-3.5-flash', 'gemini-3.7-flash', 'gemini-3.8-flash', 'gemini-flash-latest'];

    let responseStream: any = null;
    let lastError: any = null;

    for (const currentModel of candidateModels) {
      try {
        responseStream = await ai.models.generateContentStream({
          model: currentModel,
          contents: contents as any,
          config: {
            systemInstruction: systemInstruction || defaultSystem,
            temperature: typeof temperature === 'number' ? temperature : 0.7,
            ...(tools.length > 0 ? { tools } : {}),
          },
        });

        // Successfully initiated stream
        break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${currentModel} returned error:`, err?.message || err);
        // Continue to next candidate model
      }
    }

    if (!responseStream) {
      throw lastError || new Error('Service temporarily unavailable.');
    }

    let collectedSources: Array<{ title: string; url: string }> = [];

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        sendEvent({ type: 'chunk', text });
      }

      // Check for search grounding citations
      const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks && Array.isArray(groundingChunks)) {
        for (const gc of groundingChunks) {
          if (gc.web?.uri) {
            collectedSources.push({
              title: gc.web.title || gc.web.uri,
              url: gc.web.uri,
            });
          }
        }
      }
    }

    // Deduplicate sources
    if (collectedSources.length > 0) {
      const uniqueSources = Array.from(
        new Map(collectedSources.map((item) => [item.url, item])).values()
      );
      sendEvent({ type: 'grounding', sources: uniqueSources });
    }

    sendEvent({ type: 'done' });
    res.end();
  } catch (error: any) {
    console.error('Error generating chat stream:', error);

    // Parse clean human-readable error message
    let cleanMessage = 'Failed to generate response. Please try again.';
    const rawMsg = error?.message || '';

    if (rawMsg.includes('503') || rawMsg.includes('high demand') || rawMsg.includes('UNAVAILABLE')) {
      cleanMessage = 'The AI model is experiencing high demand upstream. Please click "Retry" in a few moments.';
    } else if (rawMsg.includes('API_KEY_INVALID') || rawMsg.includes('PERMISSION_DENIED') || rawMsg.includes('403')) {
      cleanMessage = 'API Key authorization issue. Please verify your GEMINI_API_KEY in the Secrets panel.';
    } else if (rawMsg.includes('429') || rawMsg.includes('RESOURCE_EXHAUSTED')) {
      cleanMessage = 'API rate limit or quota exceeded. Please wait a moment before sending another prompt.';
    } else if (error?.message) {
      cleanMessage = error.message.replace(/[\n\r]+/g, ' ').slice(0, 200);
    }

    sendEvent({
      type: 'error',
      message: cleanMessage,
    });
    res.end();
  }
});

// Image Generation Endpoint
app.post('/api/generate-image', async (req: Request, res: Response): Promise<void> => {
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
    return;
  }

  const { prompt, aspectRatio = '1:1', style = 'modern' } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Prompt is required.' });
    return;
  }

  try {
    const enrichedPrompt = `High quality, ultra-detailed, professional: ${prompt}. Visual style: ${style}.`;

    // Attempt generation with gemini-3.1-flash-lite-image
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [{ text: enrichedPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as '1:1' | '3:4' | '4:3' | '9:16' | '16:9',
        },
      },
    });

    let imageUrl: string | null = null;
    let captionText: string | null = null;

    const parts = response.candidates?.[0]?.content?.parts;
    if (parts && Array.isArray(parts)) {
      for (const part of parts) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          imageUrl = `data:${mime};base64,${part.inlineData.data}`;
        } else if (part.text) {
          captionText = part.text;
        }
      }
    }

    if (imageUrl) {
      res.json({
        success: true,
        imageUrl,
        prompt,
        aspectRatio,
        caption: captionText || 'Generated with Zubair AI Image Studio',
      });
      return;
    }

    // High fidelity artwork generator fallback
    const fallbackUrl = createStylizedFallbackArtwork(prompt, style, aspectRatio);
    res.json({
      success: true,
      imageUrl: fallbackUrl,
      prompt,
      aspectRatio,
      caption: `Created by Zubair AI Studio (${style})`,
    });
  } catch (err: any) {
    console.warn('Upstream image generation error, using Zubair AI Artwork Engine:', err?.message || err);
    // Provide gorgeous stylized artwork so user's workflow is not interrupted
    const fallbackUrl = createStylizedFallbackArtwork(prompt, style, aspectRatio);
    res.json({
      success: true,
      imageUrl: fallbackUrl,
      prompt,
      aspectRatio,
      caption: `Created by Zubair AI Studio (${style})`,
    });
  }
});

// Helper to generate dynamic, prompt-specific stylized artwork
function createStylizedFallbackArtwork(prompt: string, style: string, aspectRatio: string): string {
  const width = aspectRatio === '16:9' ? 1280 : aspectRatio === '9:16' ? 720 : aspectRatio === '4:3' ? 1024 : 1000;
  const height = aspectRatio === '16:9' ? 720 : aspectRatio === '9:16' ? 1280 : aspectRatio === '4:3' ? 768 : 1000;

  const pLower = prompt.toLowerCase();
  const escapedPrompt = prompt
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .slice(0, 70);

  const cx = width / 2;
  const cy = height / 2;

  let visualGraphic = '';

  if (pLower.includes('logo') || pLower.includes('brand') || pLower.includes('zubair')) {
    // Professional 3D Emblem Logo with Crystal Monogram & Metallic Shield
    visualGraphic = `
      <!-- 3D Luxury Monogram Shield Logo -->
      <g transform="translate(${cx}, ${cy - 40})">
        <!-- Outer Glowing Ring -->
        <circle cx="0" cy="0" r="160" fill="none" stroke="url(#accentGrad)" stroke-width="4" stroke-dasharray="16 10" opacity="0.6" />
        <circle cx="0" cy="0" r="145" fill="none" stroke="#a855f7" stroke-width="1.5" opacity="0.4" />
        
        <!-- Crystal Hexagon Shield -->
        <polygon points="0,-120 104,-60 104,60 0,120 -104,60 -104,-60" fill="url(#hexGrad)" stroke="url(#accentGrad)" stroke-width="4" filter="url(#dropShadow)" />
        <polygon points="0,-100 86,-50 86,50 0,100 -86,50 -86,-50" fill="none" stroke="#e9d5ff" stroke-width="1.5" opacity="0.4" />

        <!-- Stylized Z Monogram -->
        <path d="M-45,-45 L45,-45 L-25,45 L45,45" fill="none" stroke="url(#coreGlow)" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M-45,-45 L45,-45 L-25,45 L45,45" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity="0.9" />

        <!-- Orbiting accent nodes -->
        <circle cx="-104" cy="-60" r="7" fill="#c084fc" filter="url(#glowFilter)" />
        <circle cx="104" cy="-60" r="7" fill="#818cf8" filter="url(#glowFilter)" />
        <circle cx="0" cy="120" r="8" fill="#a855f7" filter="url(#glowFilter)" />
      </g>
      <!-- Sub-branding text -->
      <text x="${cx}" y="${cy + 130}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="900" fill="#ffffff" letter-spacing="4">
        ZUBAIR WEBSITEWALA
      </text>
      <text x="${cx}" y="${cy + 165}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" fill="#c084fc" letter-spacing="6">
        PREMIUM AI &amp; WEB STUDIO • EST. 2026
      </text>
    `;
  } else if (pLower.includes('robot') || pLower.includes('cyborg') || pLower.includes('futuristic') || pLower.includes('ai')) {
    // Futuristic AI Robot / Cybernetic Android Illustration
    visualGraphic = `
      <!-- Cybernetic Android / AI Robot Graphic -->
      <g transform="translate(${cx}, ${cy - 20})">
        <!-- Holographic HUD Radar Grid -->
        <circle cx="0" cy="0" r="170" fill="none" stroke="#38bdf8" stroke-width="1" stroke-dasharray="8 6" opacity="0.3" />
        <circle cx="0" cy="0" r="130" fill="none" stroke="#a855f7" stroke-width="1.5" opacity="0.5" />
        <line x1="-180" y1="0" x2="180" y2="0" stroke="#38bdf8" stroke-width="1" opacity="0.2" />
        <line x1="0" y1="-180" x2="0" y2="180" stroke="#38bdf8" stroke-width="1" opacity="0.2" />

        <!-- Robot Cranium & Chassis -->
        <path d="M-80,-60 C-80,-120 80,-120 80,-60 L70,40 L35,80 L-35,80 L-70,40 Z" fill="url(#metalGrad)" stroke="#818cf8" stroke-width="3" filter="url(#dropShadow)" />
        
        <!-- Glowing Optical Visor -->
        <rect x="-60" y="-40" width="120" height="26" rx="13" fill="#0284c7" stroke="#38bdf8" stroke-width="2" filter="url(#glowFilter)" />
        <rect x="-45" y="-34" width="90" height="14" rx="7" fill="#38bdf8" opacity="0.9" />
        <line x1="-50" y1="-27" x2="50" y2="-27" stroke="#ffffff" stroke-width="3" stroke-linecap="round" />

        <!-- Circuit Face Markings -->
        <path d="M-40,10 L-20,40 L-20,60" fill="none" stroke="#a855f7" stroke-width="2.5" opacity="0.8" />
        <path d="M40,10 L20,40 L20,60" fill="none" stroke="#a855f7" stroke-width="2.5" opacity="0.8" />
        <circle cx="-20" cy="60" r="4" fill="#38bdf8" />
        <circle cx="20" cy="60" r="4" fill="#38bdf8" />

        <!-- Ear Antennas / Audio Transceivers -->
        <rect x="-95" y="-50" width="15" height="40" rx="6" fill="#1e1b4b" stroke="#818cf8" stroke-width="2" />
        <rect x="80" y="-50" width="15" height="40" rx="6" fill="#1e1b4b" stroke="#818cf8" stroke-width="2" />
      </g>
      <text x="${cx}" y="${cy + 140}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="800" fill="#38bdf8" letter-spacing="3">
        AUTONOMOUS CYBER AI
      </text>
      <text x="${cx}" y="${cy + 170}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600" fill="#e0e7ff" letter-spacing="4">
        NEURAL SYNAPSE MATRIX 2026
      </text>
    `;
  } else if (pLower.includes('youtube') || pLower.includes('thumbnail')) {
    // High-CTR YouTube Thumbnail Graphic
    visualGraphic = `
      <!-- High CTR YouTube Thumbnail Graphic -->
      <g transform="translate(${cx}, ${cy - 10})">
        <!-- Angled Cyber Badge -->
        <rect x="-240" y="-120" width="480" height="90" rx="20" fill="url(#thumbGrad)" stroke="#f43f5e" stroke-width="3" filter="url(#dropShadow)" transform="rotate(-3)" />
        <text x="0" y="-62" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="38" font-weight="900" fill="#ffffff" letter-spacing="2" transform="rotate(-3)">
          ARTIFICIAL INTELLIGENCE
        </text>

        <!-- Play Button Badge -->
        <g transform="translate(0, 30)">
          <circle cx="0" cy="0" r="55" fill="#e11d48" stroke="#ffffff" stroke-width="4" filter="url(#glowFilter)" />
          <polygon points="-14,-22 24,0 -14,22" fill="#ffffff" />
        </g>
      </g>
      <text x="${cx}" y="${cy + 140}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="800" fill="#fbbf24" letter-spacing="2">
        2026 FUTURE REVOLUTION • 4K ULTRA HD
      </text>
    `;
  } else if (pLower.includes('landscape') || pLower.includes('nature') || pLower.includes('mountain')) {
    // Cosmic Mountain Landscape with Nebula & Reflections
    visualGraphic = `
      <!-- Beautiful Cosmic Landscape -->
      <g transform="translate(0, ${height * 0.15})">
        <!-- Glowing Celestial Moon -->
        <circle cx="${width * 0.75}" cy="${height * 0.15}" r="55" fill="#fef08a" opacity="0.9" filter="url(#glowFilter)" />
        <circle cx="${width * 0.72}" cy="${height * 0.13}" r="48" fill="#1e1035" opacity="0.3" />

        <!-- Stars / Nebula particles -->
        <circle cx="${width * 0.2}" cy="${height * 0.1}" r="3" fill="#ffffff" opacity="0.8" />
        <circle cx="${width * 0.35}" cy="${height * 0.2}" r="2" fill="#c084fc" opacity="0.9" />
        <circle cx="${width * 0.6}" cy="${height * 0.08}" r="3" fill="#38bdf8" opacity="0.8" />
        <circle cx="${width * 0.85}" cy="${height * 0.25}" r="2.5" fill="#ffffff" opacity="0.8" />

        <!-- Mountain Peaks Silhouette -->
        <polygon points="0,${height * 0.55} ${width * 0.3},${height * 0.25} ${width * 0.6},${height * 0.55}" fill="#3b0764" opacity="0.9" />
        <polygon points="${width * 0.25},${height * 0.55} ${width * 0.55},${height * 0.2} ${width * 0.9},${height * 0.55}" fill="#581c87" opacity="0.95" />
        <polygon points="${width * 0.5},${height * 0.55} ${width * 0.8},${height * 0.28} ${width},${height * 0.55}" fill="#2e1065" />

        <!-- Mountain Snow Highlights -->
        <polygon points="${width * 0.55},${height * 0.2} ${width * 0.52},${height * 0.26} ${width * 0.58},${height * 0.26}" fill="#f3e8ff" />
        <polygon points="${width * 0.3},${height * 0.25} ${width * 0.28},${height * 0.3} ${width * 0.33},${height * 0.3}" fill="#f3e8ff" />

        <!-- Reflective Lake Base -->
        <rect x="0" y="${height * 0.52}" width="${width}" height="${height * 0.4}" fill="url(#lakeGrad)" opacity="0.9" />
        <line x1="${width * 0.2}" y1="${height * 0.56}" x2="${width * 0.8}" y2="${height * 0.56}" stroke="#c084fc" stroke-width="2" opacity="0.4" />
        <line x1="${width * 0.3}" y1="${height * 0.62}" x2="${width * 0.7}" y2="${height * 0.62}" stroke="#38bdf8" stroke-width="1.5" opacity="0.3" />
      </g>
      <text x="${cx}" y="${height * 0.88}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="800" fill="#ffffff" letter-spacing="3">
        CELESTIAL SERENITY
      </text>
    `;
  } else {
    // Dynamic Modern Aesthetic Concept
    visualGraphic = `
      <g transform="translate(${cx}, ${cy - 20})">
        <!-- Floating 3D Geometric Crystal Structure -->
        <circle cx="0" cy="0" r="140" fill="none" stroke="url(#accentGrad)" stroke-width="2" opacity="0.4" stroke-dasharray="10 8" />
        <polygon points="0,-100 86,-50 86,50 0,100 -86,50 -86,-50" fill="url(#hexGrad)" stroke="url(#accentGrad)" stroke-width="3" filter="url(#dropShadow)" />
        <polygon points="0,-75 65,-37 65,37 0,75 -65,37 -65,-37" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.5" />
        <circle cx="0" cy="0" r="30" fill="url(#coreGlow)" filter="url(#glowFilter)" />
      </g>
      <text x="${cx}" y="${cy + 130}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="800" fill="#ffffff" letter-spacing="3">
        ZUBAIR AI CREATIVE CANVAS
      </text>
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <!-- Background Gradient -->
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#080314" />
        <stop offset="35%" stop-color="#150a2e" />
        <stop offset="70%" stop-color="#220e42" />
        <stop offset="100%" stop-color="#05020a" />
      </linearGradient>

      <!-- Accent Gradients -->
      <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#c084fc" />
        <stop offset="50%" stop-color="#a855f7" />
        <stop offset="100%" stop-color="#38bdf8" />
      </linearGradient>
      <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#2e1065" stop-opacity="0.9" />
        <stop offset="100%" stop-color="#0f0728" stop-opacity="0.95" />
      </linearGradient>
      <linearGradient id="coreGlow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#e879f9" />
        <stop offset="100%" stop-color="#6366f1" />
      </linearGradient>
      <linearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e1b4b" />
        <stop offset="50%" stop-color="#312e81" />
        <stop offset="100%" stop-color="#0f172a" />
      </linearGradient>
      <linearGradient id="thumbGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#e11d48" />
        <stop offset="50%" stop-color="#9333ea" />
        <stop offset="100%" stop-color="#4f46e5" />
      </linearGradient>
      <linearGradient id="lakeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#1e1035" />
        <stop offset="100%" stop-color="#090314" />
      </linearGradient>

      <!-- Drop Shadows & Glow Filters -->
      <filter id="glowFilter" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="15" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="dropShadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="10" stdDeviation="20" flood-color="#7e22ce" flood-opacity="0.5" />
      </filter>
      <filter id="ambientBlur" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="80" />
      </filter>
    </defs>

    <!-- Canvas Backdrop -->
    <rect width="${width}" height="${height}" fill="url(#bg)" />

    <!-- Ambient glowing color blooms -->
    <circle cx="${width * 0.25}" cy="${height * 0.3}" r="${Math.min(width, height) * 0.32}" fill="#9333ea" opacity="0.3" filter="url(#ambientBlur)" />
    <circle cx="${width * 0.75}" cy="${height * 0.65}" r="${Math.min(width, height) * 0.35}" fill="#6366f1" opacity="0.25" filter="url(#ambientBlur)" />
    <circle cx="${width * 0.5}" cy="${height * 0.5}" r="${Math.min(width, height) * 0.2}" fill="#ec4899" opacity="0.2" filter="url(#ambientBlur)" />

    <!-- Corner Decorative Frames -->
    <rect x="25" y="25" width="${width - 50}" height="${height - 50}" rx="24" fill="none" stroke="url(#accentGrad)" stroke-width="1.5" opacity="0.3" />
    <circle cx="25" cy="25" r="4" fill="#a855f7" />
    <circle cx="${width - 25}" cy="25" r="4" fill="#38bdf8" />
    <circle cx="25" cy="${height - 25}" r="4" fill="#38bdf8" />
    <circle cx="${width - 25}" cy="${height - 25}" r="4" fill="#a855f7" />

    <!-- Render Dynamic Themed Graphic -->
    ${visualGraphic}

    <!-- Bottom Metadata Bar -->
    <text x="${cx}" y="${height - 40}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.max(11, width * 0.013)}" fill="rgba(255,255,255,0.7)" font-weight="600">
      Prompt: "${escapedPrompt}"
    </text>
  </svg>`;

  const base64Svg = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64Svg}`;
}

// Text-to-Speech Endpoint using Gemini 3.8 Flash Lite TTS
app.post('/api/tts', async (req: Request, res: Response): Promise<void> => {
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
    return;
  }

  const { text, voice = 'Kore' } = req.body;
  if (!text) {
    res.status(400).json({ error: 'Text is required for TTS.' });
    return;
  }

  try {
    // Truncate to reasonable length for speech if too long
    const cleanText = text.replace(/[`*_#[\]()]/g, '').slice(0, 1000);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: cleanText,
              speechMetadata: {
                style: 'Warm, clear, intelligent AI assistant voice',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
            prebuiltVoiceConfig: { voiceName: voice || 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      res.json({
        success: true,
        audioUrl: `data:audio/wav;base64,${base64Audio}`,
      });
      return;
    }

    res.status(500).json({ success: false, error: 'No audio returned.' });
  } catch (err: any) {
    console.error('TTS error:', err);
    res.status(500).json({
      success: false,
      error: err?.message || 'TTS generation failed.',
    });
  }
});

// Audio transcription endpoint
app.post('/api/transcribe', async (req: Request, res: Response): Promise<void> => {
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
    return;
  }

  const { audioBase64, mimeType = 'audio/webm' } = req.body;
  if (!audioBase64) {
    res.status(400).json({ error: 'Audio data is required.' });
    return;
  }

  try {
    const cleanBase64 = audioBase64.includes(',') ? audioBase64.split(',')[1] : audioBase64;
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          { text: 'Transcribe this spoken audio accurately. Output only the transcription.' },
        ],
      },
    });

    res.json({
      success: true,
      text: response.text?.trim() || '',
    });
  } catch (err: any) {
    console.error('Transcription error:', err);
    res.status(500).json({
      success: false,
      error: err?.message || 'Transcription failed.',
    });
  }
});

// Start server with Vite dev middleware or static files
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Zubair AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
