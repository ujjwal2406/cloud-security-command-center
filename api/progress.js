// Vercel Serverless Function: GET & POST /api/progress with PDF Notes Vault

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

let memoryStore = {
  completedDays: {},
  completedProjects: {},
  certifications: {},
  streak: 1,
  lastActiveDate: new Date().toISOString().split('T')[0]
};

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json(memoryStore);
  }

  if (req.method === 'POST') {
    try {
      const data = req.body;
      if (data) {
        memoryStore = { ...memoryStore, ...data };
      }
      return res.status(200).json({ success: true, message: "Progress & PDF notes recorded to cloud server!" });
    } catch (e) {
      return res.status(400).json({ error: "Invalid JSON data" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
