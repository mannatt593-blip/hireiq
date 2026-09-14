const { GoogleGenAI, Type } = require("@google/genai");

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("Warning: GEMINI_API_KEY is not configured.");
}

const ai = new GoogleGenAI({
  apiKey,
});

// Primary → fallback models
const MODELS = [
  process.env.GEMINI_MODEL || "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-2.5-flash",
];

const screenCandidate = async ({ job, candidate }) => {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing in server/.env");
  }

  const prompt = `
You are HireIQ's AI recruitment screening engine.

Evaluate the candidate against the job objectively.
Do not invent experience, skills, certifications, or education.
Use only the information provided below.

JOB
Title:
${job.title || "Not provided"}

Department:
${job.department || "Not provided"}

Location:
${job.location || "Not provided"}

Employment Type:
${job.employment_type || "Not provided"}

Experience Level:
${job.experience_level || "Not provided"}

Job Description:
${job.description || "Not provided"}

Job Requirements:
${job.requirements || "Not provided"}

CANDIDATE
Name:
${candidate.name || "Not provided"}

Headline:
${candidate.headline || "Not provided"}

Experience:
${candidate.experience_years ?? "Not provided"} years

Skills:
${candidate.skills || "Not provided"}

Education:
${candidate.education || "Not provided"}

Instructions:
1. Evaluate skill relevance.
2. Evaluate experience relevance.
3. Evaluate education relevance.
4. Identify explicitly supported skills.
5. Identify important missing required skills.
6. Produce an overall match score from 0 to 100.
7. Produce confidence from 0 to 100.
8. Give a concise recruiter recommendation.
9. Give a concise explanation.

Scoring guidance:
- Skills: 50%
- Experience: 25%
- Education: 15%
- Overall profile relevance: 10%

Do not treat missing information as positive evidence.
`;

  let lastError = null;

  for (const model of [...new Set(MODELS)]) {
    try {
      console.log(`AI screening: trying model ${model}`);

      const response = await ai.models.generateContent({
        model,

        contents: prompt,

        config: {
          responseMimeType: "application/json",

          responseSchema: {
            type: Type.OBJECT,

            properties: {
              match_score: {
                type: Type.NUMBER,
              },

              confidence_score: {
                type: Type.NUMBER,
              },

              skills_match_score: {
                type: Type.NUMBER,
              },

              experience_match_score: {
                type: Type.NUMBER,
              },

              education_match_score: {
                type: Type.NUMBER,
              },

              matched_skills: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                },
              },

              missing_skills: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                },
              },

              recommendation: {
                type: Type.STRING,
              },

              ai_summary: {
                type: Type.STRING,
              },
            },

            required: [
              "match_score",
              "confidence_score",
              "skills_match_score",
              "experience_match_score",
              "education_match_score",
              "matched_skills",
              "missing_skills",
              "recommendation",
              "ai_summary",
            ],
          },
        },
      });

      const text = response.text;

      if (!text) {
        throw new Error("AI returned an empty response");
      }

      const result = JSON.parse(text);

      console.log(`AI screening successful with ${model}`);

      return {
        match_score: clampScore(result.match_score),
        confidence_score: clampScore(result.confidence_score),
        skills_match_score: clampScore(
          result.skills_match_score
        ),
        experience_match_score: clampScore(
          result.experience_match_score
        ),
        education_match_score: clampScore(
          result.education_match_score
        ),

        matched_skills: Array.isArray(
          result.matched_skills
        )
          ? result.matched_skills
          : [],

        missing_skills: Array.isArray(
          result.missing_skills
        )
          ? result.missing_skills
          : [],

        recommendation:
          result.recommendation || "Needs Review",

        ai_summary:
          result.ai_summary ||
          "AI analysis completed.",

        model_used: model,
      };
    } catch (error) {
      lastError = error;

      const errorText = String(
        error?.message || error
      ).toLowerCase();

      const temporaryFailure =
        errorText.includes("503") ||
        errorText.includes("unavailable") ||
        errorText.includes("high demand") ||
        errorText.includes("temporarily");

      console.error(
        `AI model ${model} failed:`,
        error?.message || error
      );

      // Try another model only for temporary provider failures.
      if (!temporaryFailure) {
        throw error;
      }
    }
  }

  throw new Error(
    lastError?.message ||
      "All Gemini models are temporarily unavailable."
  );
};

const clampScore = (value) => {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return 0;
  }

  return Number(
    Math.min(100, Math.max(0, number)).toFixed(2)
  );
};

module.exports = {
  screenCandidate,
};