# Future Me Hackathon

## Overview
Future Me is a web application built for the Google Cloud Agentic AI Day Hackathon. It provides real-time financial insights by connecting securely to your Fi Money account, analyzing your financial data, and visualizing your financial profile and trajectory.

## Features
- **Secure Fi MCP Connection:** Connect to your Fi Money account using the MCP protocol with end-to-end encryption.
- **Profile Analysis:** Upload or fetch your financial data and get a detailed analysis of your net worth, liabilities, credit score, and career trajectory.
- **Interactive Graph:** Visualize your financial profile and relationships using a node-based graph (React Flow).
- **Persona Selector & Chat:** Explore different financial personas and chat with an AI agent for personalized advice.
- **Sample Data:** Try the app with a sample profile if you don't want to connect your real account.

## Tech Stack
- **Frontend:** React, Vite, Tailwind CSS, React Flow, Lucide Icons
- **Backend:** Node.js (API endpoints for analysis and MCP connection)
- **State Management:** React hooks, Zustand (via React Flow)

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- pnpm or npm

### Setup

1. **Setup connection to the MCP Server**
```sh
    git clone https://github.com/epiFi/fi-mcp-dev.git
    git clone https://github.com/dockerFile.git
    cp dockerFile/Dockerfile fi-mcp-dev
    docker compose up -d
```
    
    
2. **Clone the repository:**
   ```sh
   git clone https://github.com/fridayowl/future-me-hackathon.git
   cd future-me-hackathon
   ```
3. **Install dependencies:**
   ```sh
   cd frontend
   pnpm install
   # or
   npm install
   ```
4. **Start the frontend:**
   ```sh
   pnpm dev
   # or
   npm run dev
   ```
5. **(Optional) Start the backend:**
   ```sh
   cd ../backend
   pnpm install
   pnpm start
   # or
   npm install
   npm start
   ```

### Usage
- Open [http://localhost:5173](http://localhost:5173) in your browser.
- Upload your Fi MCP data or use the sample profile.
- Connect to Fi MCP for real-time analysis (requires valid credentials).
- Explore your financial profile and chat with the AI agent.

## Project Structure
```
frontend/
  src/
    components/
      ProfileSummary.jsx
      profileAnalysis.jsx
      MCPConnection.jsx
      ...
    services/
      api.js
    App.jsx
    ...
  public/
  package.json
  ...
backend/
  src/
    app.js
    services/
      geminiService.js
      profileAnalyzer.js
    data/
      fiMCPSample.json
  package.json
  ...
```

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
MIT

---
Built for Google Cloud Agentic AI Day Hackathon | Team Shogun
