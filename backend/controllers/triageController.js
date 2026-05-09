import OpenAI from 'openai';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Groq (OpenAI compatible)
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || '',
  baseURL: 'https://api.groq.com/openai/v1',
});

/**
 * Triage Chat Controller
 * Uses Groq AI (Llama 3.3) for lightning-fast voice triage.
 */
export async function triageChat(req, res) {
  try {
    const { messages } = req.body;
    
    // Prepare messages for Groq/OpenAI format
    const groqMessages = messages.map(m => ({
      role: m.role === 'bot' ? 'assistant' : m.role,
      content: m.text,
    }));

    if (!process.env.GROQ_API_KEY) {
      throw new Error('Groq API Key missing');
    }

    const completion = await groq.chat.completions.create({
      messages: groqMessages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiText = completion.choices[0]?.message?.content || "";
    const provider = "groq";


    let triageResult = null;

    // Check if TRIAGE_COMPLETE is in the response
    if (aiText.includes('TRIAGE_COMPLETE:')) {
      try {
        const jsonStr = aiText.split('TRIAGE_COMPLETE:')[1].trim();
        const cleanJson = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleanJson);
        
        triageResult = {
          urgency: data.urgency?.toLowerCase() || 'medium',
          symptoms: Array.isArray(data.symptoms) ? data.symptoms : (typeof data.symptoms === 'string' ? data.symptoms.split(',') : []),
          summary: data.summary,
          doctorType: data.doctor || 'General Physician',
          updatedAt: new Date()
        };

        if (req.user && req.user.id) {
          await User.findByIdAndUpdate(req.user.id, { lastTriage: triageResult });
        }
      } catch (e) {
        console.error("Error parsing TRIAGE_COMPLETE JSON:", e);
      }
    }

    res.json({ 
      reply: aiText,
      provider,
      ...(triageResult || {})
    });

  } catch (e) {
    console.error(`[${new Date().toISOString()}] Error in triageChat:`, e.message);
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
    })
  }
}
