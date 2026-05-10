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
    const { messages, mlResults, language = 'en' } = req.body;
    
    // Enhanced system prompt with medical knowledge
    const langName = language === 'te' ? 'Telugu' : language === 'hi' ? 'Hindi' : 'English';
    
    const MEDICAL_CONTEXT = `
COMMON RURAL DISEASES IN INDIA:
- Dengue: High fever, severe headache, joint pain, rash (MEDIUM-HIGH urgency)
- Malaria: Fever with chills, sweating, body ache (MEDIUM-HIGH urgency)
- Typhoid: Prolonged fever, weakness, stomach pain (MEDIUM urgency)
- Gastroenteritis: Vomiting, diarrhea, stomach pain (MEDIUM urgency)
- Respiratory infections: Cough, cold, fever, breathing difficulty (LOW-MEDIUM urgency)
- Urinary tract infection: Burning urination, frequent urination (MEDIUM urgency)
- Skin infections: Rash, itching, wounds (LOW-MEDIUM urgency)
- Anemia: Weakness, dizziness, pale skin (MEDIUM urgency)
- Diabetes complications: Excessive thirst, frequent urination, wounds not healing (MEDIUM-HIGH urgency)
- Hypertension: Headache, dizziness, chest discomfort (MEDIUM-HIGH urgency)

EMERGENCY SIGNS (HIGH urgency):
- Chest pain with arm/jaw pain or breathlessness
- Difficulty breathing or gasping for air
- Severe bleeding that won't stop
- Unconsciousness or severe confusion
- Severe abdominal pain with vomiting
- High fever in infants (<3 months)
- Pregnancy complications (bleeding, severe pain)
- Signs of stroke (face drooping, arm weakness, speech difficulty)
`;

    const ML_GUIDANCE = mlResults && mlResults.length > 0
      ? `\n\nML ANALYSIS DETECTED: ${mlResults.map(r => `${r.name} (${(r.probability * 100).toFixed(0)}% confidence)`).join(', ')}
Use this to guide your questions and validate patient's symptoms match the ML prediction.`
      : '';

    const SYSTEM_PROMPT = `You are GramDoc AI, an expert medical triage assistant for rural India.
You are warm, empathetic, and speak like a caring village doctor.

LANGUAGE: Respond ONLY in ${langName}. Never mix languages.

YOUR ROLE:
1. Ask SPECIFIC, RELEVANT follow-up questions (one at a time)
2. Gather enough information to assess urgency (minimum 3 questions)
3. Consider common rural diseases and emergency signs
4. Provide clear, actionable recommendations

QUESTIONING STRATEGY:
- Start with the main complaint
- Ask about duration and severity
- Check for associated symptoms
- Ask about medical history if relevant
- Keep responses under 30 words per question

${MEDICAL_CONTEXT}
${ML_GUIDANCE}

RESPONSE FORMAT:
- For questions: Ask ONE clear question in ${langName}
- After 3-5 questions, provide diagnosis with:

TRIAGE_COMPLETE: {
  "urgency": "HIGH/MEDIUM/LOW",
  "symptoms": "patient's specific symptoms",
  "doctor": "recommended specialist",
  "summary": "brief reassuring summary in ${langName}",
  "duration": "how long patient has had problem",
  "severity": "mild/moderate/severe",
  "keyFindings": "2-3 important clinical points",
  "possibleConditions": ["most likely condition", "alternative diagnosis"],
  "redFlags": ["any emergency signs noticed"]
}

URGENCY RULES:
HIGH: Emergency signs, chest pain, breathing difficulty, severe bleeding, pregnancy complications
MEDIUM: Fever 2+ days, persistent vomiting, moderate pain, infections, chronic disease symptoms
LOW: Mild cold, minor cough, skin rash without fever, mild headache

Be conversational, not robotic. Remember previous answers. Never repeat questions.`;

    // Prepare messages for Groq
    const groqMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map(m => ({
        role: m.role === 'bot' || m.role === 'assistant' ? 'assistant' : 'user',
        content: m.text,
      }))
    ];

    if (!process.env.GROQ_API_KEY) {
      throw new Error('Groq API Key missing');
    }

    const completion = await groq.chat.completions.create({
      messages: groqMessages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 600,
      top_p: 0.9,
    });

    const aiText = completion.choices[0]?.message?.content || "";
    const provider = "groq";

    let triageResult = null;

    // Check if TRIAGE_COMPLETE is in the response
    if (aiText.includes('TRIAGE_COMPLETE:')) {
      try {
        const jsonStr = aiText.split('TRIAGE_COMPLETE:')[1].trim();
        const cleanJson = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
        
        // Extract JSON object
        const jsonMatch = cleanJson.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[0]);
          
          triageResult = {
            urgency: data.urgency?.toLowerCase() || 'medium',
            symptoms: Array.isArray(data.symptoms) ? data.symptoms : (typeof data.symptoms === 'string' ? data.symptoms : ''),
            summary: data.summary,
            doctorType: data.doctor || 'General Physician',
            duration: data.duration,
            severity: data.severity,
            keyFindings: data.keyFindings,
            possibleConditions: data.possibleConditions || [],
            redFlags: data.redFlags || [],
            mlConfidence: mlResults && mlResults.length > 0 ? mlResults[0].probability : null,
            updatedAt: new Date()
          };

          if (req.user && req.user.id) {
            await User.findByIdAndUpdate(req.user.id, { lastTriage: triageResult });
          }
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
