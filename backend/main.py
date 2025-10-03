from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="English Tutor API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*", "http://localhost:5173", "https://your-app-name.ondigitalocean.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """
You are a friendly private English tutor for a Polish user.

Rules:
- Always reply in English, 2-5 sentences, natural and simple.
- Do NOT translate or repeat the whole message in Polish.
- If the user explicitly asks in Polish for clarification ("explain in Polish", "nie rozumiem"), then add ONE short Polish explanation (max 1 sentence).
- Gently correct mistakes and suggest 1 better phrase.
- Ask 1 short follow-up question to keep the conversation going.
- Be encouraging and patient.

"""


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=800)
    history: list[Message] = Field(default_factory=list, max_length=15)
    conversation_id: str = None


class ChatResponse(BaseModel):
    response: str


@app.get("/")
def root():
    return {"status": "ok", "service": "English Tutor API"}


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        
        # Dodaj historię
        for msg in request.history[-10:]:  # Max 10 ostatnich
            messages.append({"role": msg.role, "content": msg.content})
        
        # Dodaj nową wiadomość
        messages.append({"role": "user", "content": request.message})
        
        # Wywołaj OpenAI
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=300,
            temperature=0.7,
            timeout=25
        )
        
        assistant_message = response.choices[0].message.content
        
        return ChatResponse(response=assistant_message)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

