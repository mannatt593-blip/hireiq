const { GoogleGenAI, Type } = require("@google/genai");

const apiKey = process.env.GEMINI_API_KEY;
const modelName =
  process.env.GEMINI_MODEL || "gemini-3.6-flash";

if (!apiKey) {
  console.warn(
    "Warning: GEMINI_API_KEY is not configured."
  );
}

const ai = new GoogleGenAI({
  apiKey,
});

const extractCandidateProfile = async (resumeText) => {
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is missing in server/.env"
    );
  }

  if (!resumeText || !resumeText.trim()) {
    throw new Error("Resume text is empty");
  }

  const prompt = `
You are HireIQ's resume parsing engine.

Extract a structured candidate profile from the resume text below.

IMPORTANT:
- Use only information explicitly present in the resume.
- Never invent details.
- If a field is unavailable, return an empty string or empty array.
- Keep skills as clean skill names.
- Experience should be a numeric number of years when possible.
- Education should be a concise description.
- Certifications and projects should contain only explicitly mentioned items.

Return:

name
email
phone
location
headline
experience_years
skills
education
certifications
projects

RESUME TEXT:
${resumeText}
`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,

    config: {
      responseMimeType: "application/json",

      responseSchema: {
        type: Type.OBJECT,

        properties: {
          name: {
            type: Type.STRING,
          },

          email: {
            type: Type.STRING,
          },

          phone: {
            type: Type.STRING,
          },

          location: {
            type: Type.STRING,
          },

          headline: {
            type: Type.STRING,
          },

          experience_years: {
            type: Type.NUMBER,
          },

          skills: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            },
          },

          education: {
            type: Type.STRING,
          },

          certifications: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            },
          },

          projects: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            },
          },
        },

        required: [
          "name",
          "email",
          "phone",
          "location",
          "headline",
          "experience_years",
          "skills",
          "education",
          "certifications",
          "projects",
        ],
      },
    },
  });

  if (!response.text) {
    throw new Error(
      "AI returned an empty resume profile"
    );
  }

  let profile;

  try {
    profile = JSON.parse(response.text);
  } catch {
    throw new Error(
      "AI returned invalid resume profile JSON"
    );
  }

  return {
    name: profile.name || "Unknown Candidate",
    email: profile.email || "",
    phone: profile.phone || "",
    location: profile.location || "",
    headline: profile.headline || "",
    experience_years:
      Number(profile.experience_years) || 0,

    skills: Array.isArray(profile.skills)
      ? profile.skills
      : [],

    education: profile.education || "",

    certifications: Array.isArray(
      profile.certifications
    )
      ? profile.certifications
      : [],

    projects: Array.isArray(profile.projects)
      ? profile.projects
      : [],
  };
};

module.exports = {
  extractCandidateProfile,
};