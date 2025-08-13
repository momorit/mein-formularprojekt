# main.py - MINIMAL VERSION für Railway (garantiert funktionierend)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import uvicorn

# === BASIC FASTAPI SETUP ===
app = FastAPI(
    title="FormularIQ Backend - Minimal",
    description="Minimal working version",
    version="1.0.0"
)

# === BASIC CORS ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === BASIC ROUTES ===
@app.get("/")
async def root():
    return {
        "message": "FormularIQ Backend läuft!",
        "status": "healthy",
        "version": "1.0.0"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/test")
async def test():
    return {"test": "erfolgreich", "environment": os.getenv("RAILWAY_ENVIRONMENT", "local")}

# === MAIN STARTUP ===
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)