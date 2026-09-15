LangGraph AI



A full-stack AI chat application built with LangGraph, Gemini, Tavily, FastAPI, React, Clerk, and MongoDB.

The application can answer normal questions and use Tavily web search when up-to-date information is required. It also maintains chat history so conversations can continue across messages.

🚀 Features

💬 AI-powered chat interface

🧠 LangGraph-based conversation workflow

🤖 Google Gemini for AI responses

🌐 Tavily web search for current information

🔎 Automatic tool calling for web searches

👤 Clerk authentication

💾 MongoDB-based chat history

⚡ FastAPI backend

⚛️ React frontend

📡 SSE streaming for real-time responses

🔗 Search result URLs displayed in the chat

🆕 New Chat support

🌓 Light/Dark theme support

📱 Responsive ChatGPT-style interface

🏗️ Architecture

React Frontend
      │
      │ SSE
      ▼
FastAPI Backend
      │
      ▼
   LangGraph
      │
      ├── Gemini LLM
      │      │
      │      └── Tool decision
      │
      └── Tavily Search
             │
             └── Web Search Results
      │
      ▼
   MongoDB
   Chat History

🛠️ Tech Stack

Frontend

React

Vite

JavaScript

CSS

Clerk

Backend

Python

FastAPI

LangGraph

LangChain

Google Gemini

Tavily

MongoDB

Motor

Authentication

Clerk

AI / Search

Google Gemini

Tavily Search

📂 Project Structure

LangGraph-AI/
│
├── backend/
│   ├── main.py
│   ├── .env
│   ├── requirements.txt
│   │
│   ├── auth/
│   │   ├── __init__.py
│   │   └── clerk.py
│   │
│   └── database/
│       ├── __init__.py
│       └── db.py
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── assets/
│   └── screenshot.png
│
└── README.md

⚙️ Environment Variables

Create a .env file inside the backend folder:

GEMINI_API_KEY=your_gemini_api_key
TAVILY_API_KEY=your_tavily_api_key

MONGODB_URL=your_mongodb_connection_string
MONGODB_DB=langgraph_chat

CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_JWT_KEY=your_clerk_jwt_key
CLERK_AUTHORIZED_PARTIES=http://localhost:5173

Never commit your .env file or API keys to GitHub.

▶️ Run Locally

1. Clone the repository

git clone https://github.com/vedchaudhary2005/LangGraph-AI.git
cd LangGraph-AI

2. Backend Setup

Go to the backend directory:

cd backend

Create and activate a virtual environment:

python -m venv venv
venv\Scripts\activate

Install dependencies:

pip install -r requirements.txt

Start FastAPI:

fastapi dev main.py

The backend will run at:

http://127.0.0.1:8000

FastAPI documentation:

http://127.0.0.1:8000/docs

3. Frontend Setup

Open another terminal:

cd frontend
npm install
npm run dev

The frontend will normally run at:

http://localhost:5173

🔄 How It Works

When a user sends a message:

React sends the message to the FastAPI backend.

Clerk authenticates the request.

Previous messages are loaded from MongoDB.

The conversation is passed into the LangGraph workflow.

Gemini decides whether a normal response is enough or whether web search is required.

If web search is needed, LangGraph calls Tavily.

Tavily returns current web results.

Gemini uses those results to generate the final response.

The response is streamed back to the React frontend using SSE.

The conversation is saved in MongoDB.

🌐 Web Search

The application uses Tavily when the user asks for information that may require current web data, such as:

Search the web for latest AI news

The workflow is:

User Question
      ↓
Gemini
      ↓
Need Web Search?
   ↙         ↘
 No           Yes
 ↓             ↓
Answer       Tavily
               ↓
          Search Results
               ↓
             Gemini
               ↓
          Final Answer

💾 Chat History

Chat messages are stored in MongoDB using a conversation/thread ID.

This allows the application to:

Continue previous conversations

Keep user and assistant messages together

Restore conversations after refreshing the page

Keep separate chats under different conversation IDs

MongoDB is used as the current source of truth for chat history.

🔐 Authentication

The application uses Clerk to authenticate users.

Only authenticated users can access the protected chat endpoints.

📡 Streaming

Responses are delivered using Server-Sent Events (SSE).

This allows the frontend to display the AI response progressively instead of waiting for the entire response to finish.

The frontend can also receive events for:

Generated content

Web search start

Search result URLs

Stream completion

🧠 LangGraph Workflow

The current graph follows a simple tool-calling workflow:

        ┌─────────────┐
        │    Gemini   │
        └──────┬──────┘
               │
        Tool call needed?
          /           \
        Yes            No
         │              │
         ▼              ▼
   Tavily Search       END
         │
         ▼
      Gemini
         │
         ▼
        END

This provides the foundation for extending the application into more advanced Agentic RAG / AI agent workflows.

🔒 Security

API keys and sensitive configuration should always be stored in environment variables.

Make sure .env is included in .gitignore:

.env
.env.*
!.env.example
venv/
__pycache__/

📌 Future Improvements

Agentic RAG workflow

More LangGraph tools

Better source/citation display

Improved web-search relevance

Persistent LangGraph checkpointing

Better conversation management

PDF/document RAG integration

More advanced agent workflows

👨‍💻 Author

Ved Chaudhary

GitHub: vedchaudhary2005

Portfolio: vedportfolioo.netlify.app

⭐ If you like this project

Give the repository a ⭐ on GitHub and feel free to explore the code.
