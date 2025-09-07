#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { config } from 'dotenv';
import multer from 'multer';
import FormData from 'form-data';

// Load environment variables from .env file
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Claude API configuration
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

// ElevenLabs API configuration
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_STT_URL = 'https://api.elevenlabs.io/v1/speech-to-text';

if (!CLAUDE_API_KEY) {
    console.warn('Warning: CLAUDE_API_KEY environment variable not set. Chat functionality will be limited.');
}

if (!ELEVENLABS_API_KEY) {
    console.warn('Warning: ELEVENLABS_API_KEY environment variable not set. Voice functionality will be limited.');
}

// Chat endpoint
app.post('/chat', async (req, res) => {
    try {
        const { message, conversationHistory = [] } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        if (!CLAUDE_API_KEY) {
            return res.status(500).json({ 
                error: 'Claude API key not configured. Please set CLAUDE_API_KEY environment variable.' 
            });
        }

        // Prepare messages for Claude API
        const messages = [
            ...conversationHistory,
            { role: 'user', content: message }
        ];

        // Call Claude API
        const response = await axios.post(
            CLAUDE_API_URL,
            {
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 4000,
                messages: messages,
                system: "You are a helpful business partner assistant. Provide clear, actionable advice and insights to help with business decisions, strategy, and operations. Be professional, concise, and practical in your responses."
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': CLAUDE_API_KEY,
                    'anthropic-version': '2023-06-01'
                }
            }
        );

        const claudeResponse = response.data.content[0].text;

        res.json({
            response: claudeResponse,
            conversationHistory: [
                ...messages,
                { role: 'assistant', content: claudeResponse }
            ]
        });

    } catch (error: any) {
        console.error('Chat endpoint error:', error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            res.status(401).json({ error: 'Invalid Claude API key' });
        } else if (error.response?.status === 429) {
            res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
        } else {
            res.status(500).json({ error: 'Failed to process chat request' });
        }
    }
});

// Speech-to-text endpoint
app.post('/speech-to-text', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Audio file is required' });
        }

        if (!ELEVENLABS_API_KEY) {
            return res.status(500).json({ 
                error: 'ElevenLabs API key not configured. Please set ELEVENLABS_API_KEY environment variable.' 
            });
        }

        // Create form data for ElevenLabs API
        const formData = new FormData();
        formData.append('audio', req.file.buffer, {
            filename: 'audio.webm',
            contentType: req.file.mimetype || 'audio/webm'
        });
        formData.append('model_id', 'whisper-1');

        // Call ElevenLabs Speech-to-Text API
        const response = await axios.post(ELEVENLABS_STT_URL, formData, {
            headers: {
                'xi-api-key': ELEVENLABS_API_KEY,
                ...formData.getHeaders()
            }
        });

        const transcription = response.data.text;

        res.json({
            text: transcription,
            success: true
        });

    } catch (error: any) {
        console.error('Speech-to-text endpoint error:', error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            res.status(401).json({ error: 'Invalid ElevenLabs API key' });
        } else if (error.response?.status === 429) {
            res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
        } else {
            res.status(500).json({ error: 'Failed to process speech-to-text request' });
        }
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        claudeApiConfigured: !!CLAUDE_API_KEY,
        elevenlabsApiConfigured: !!ELEVENLABS_API_KEY
    });
});

// Serve the dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Business Partner Dashboard running on http://localhost:${PORT}`);
    console.log(`📊 Dashboard available at http://localhost:${PORT}`);
    console.log(`💬 Chat API endpoint: http://localhost:${PORT}/chat`);
    
    if (!CLAUDE_API_KEY) {
        console.log('⚠️  Set CLAUDE_API_KEY environment variable to enable chat functionality');
    } else {
        console.log('✅ Claude API configured and ready');
    }
    
    if (!ELEVENLABS_API_KEY) {
        console.log('⚠️  Set ELEVENLABS_API_KEY environment variable to enable voice functionality');
    } else {
        console.log('✅ ElevenLabs API configured and ready');
    }
});

export default app; 