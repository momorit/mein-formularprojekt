// src/lib/api.ts - Vereinfacht für Vercel
const API_BASE = ''; // Leer für relative URLs zu Vercel API Routes

export const api = {
  async generateInstructions(context: string) {
    const response = await fetch('/api/generate-instructions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context }),
    });
    return response.json();
  },

  async saveStudyData(data: any) {
    const response = await fetch('/api/study/save', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async checkHealth() {
    const response = await fetch('/api/health');
    return response.json();
  }
};