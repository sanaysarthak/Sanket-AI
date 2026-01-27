# Sanket AI

## Project Overview
A unified AI-powered intelligence dashboard for empowering law enforcement with a unified view of disparate data sources. From social signals to CCTV feeds, Sanket AI fuses intelligence in real-time to accelerate decision-making and ensure seamless cross-agency collaboration.

## Quick Setup

### 1. Start the Backend
```bash
cd backend
# Download spaCy model
python -m spacy download en_core_web_sm
# Run Server
python -m uvicorn backend.main:app --reload --port 9000
```
The backend runs on `http://localhost:9000`.

### 2. Start the Frontend (Next.js)
```bash
cd frontend
# Install dependencies
npm install
# Run Dev Server
npm run dev
```
Open `http://localhost:4000` to view the **Sanket AI - Intelligence Dashboard**.


## Features
- **Data Ingestion**: Mocks Social Media, CCTV, and Police data.
- **AI Enrichment**: Uses spaCy for NER and NetworkX for Link Analysis.
- **Real-time Dashboard**: Visualizes incidents on a map and feed.
- **Alerting**: Detects high-risk patterns (e.g., Crowds + Protests).
