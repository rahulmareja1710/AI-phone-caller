# -*- coding: utf-8 -*-
"""Encode1.ipynb

Automatically generated by Colab.

Original file is located at
    https://colab.research.google.com/drive/14xx4j6mksbznJ71izGmmlrJ9MnELsuAm
"""

from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import asyncio
from typing import Optional, Dict

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class ConversationRequest(BaseModel):
    customer_id: str
    message: str
    context: Optional[Dict] = None

class ConversationResponse(BaseModel):
    response: str
    action: Optional[str] = None
    metadata: Optional[Dict] = None

# Initialize AI agent
from ai_phone_agent import AIPhoneAgent  # From previous implementation
agent = AIPhoneAgent("web_agent_1", {
    "mode": "web",
    "llm_config": {
        "model": "gpt-4",
        "temperature": 0.7
    }
})

# REST endpoints
@app.post("/conversation", response_model=ConversationResponse)
async def handle_conversation(request: ConversationRequest):
    try:
        response = await agent.generate_response(
            request.customer_id,
            request.message,
            request.context
        )
        return ConversationResponse(
            response=response['message'],
            action=response.get('action'),
            metadata=response.get('metadata')
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# WebSocket endpoint for real-time communication
@app.websocket("/ws/conversation/{customer_id}")
async def websocket_conversation(websocket: WebSocket, customer_id: str):
    await websocket.accept()
    try:
        while True:
            message = await websocket.receive_text()
            request_data = json.loads(message)

            response = await agent.generate_response(
                customer_id,
                request_data['message'],
                request_data.get('context', {})
            )

            await websocket.send_json(response)
    except Exception as e:
        await websocket.close(code=1001, reason=str(e))

# Monitoring endpoints
@app.get("/health")
async def health_check():
    return {"status": "healthy", "active_conversations": len(agent.active_calls)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
    
    
    
    
    
