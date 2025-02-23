from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
import os
from dotenv import load_dotenv
import PyPDF2
from io import BytesIO
from elevenlabs import set_api_key, generate
import uvicorn
from pydantic import BaseModel
from agents import process_text_with_crew

# Load environment variables
load_dotenv()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://localhost:8081",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:8081",
        "http://localhost:5173",  # Vite default development server
        "http://127.0.0.1:5173"   # Vite default development server
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set up ElevenLabs API key
set_api_key(os.getenv("ELEVEN_LABS_API_KEY"))

class TextToSpeechRequest(BaseModel):
    text: str
    voiceId: str
    language: str
    stability: float
    clarity: float

@app.post("/api/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    try:
        print(f"Received PDF file: {file.filename}, size: {file.size} bytes")
        
        # Read PDF content
        pdf_content = await file.read()
        pdf_reader = PyPDF2.PdfReader(BytesIO(pdf_content))
        
        # Extract text from all pages
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        
        # Process text through CrewAI agents
        processed_text = await process_text_with_crew(text)
        
        print(f"Processed text length: {len(processed_text)} characters")
        return JSONResponse(content={"text": processed_text})
            
    except Exception as e:
        print(f"Error processing PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

@app.post("/api/text-to-speech")
async def text_to_speech(request: TextToSpeechRequest):
    try:
        print(f"Processing text through CrewAI agents...")
        processed_text = await process_text_with_crew(request.text)
        print(f"Generating audio for processed text length: {len(processed_text)}")
        print(f"Using voice ID: {request.voiceId}")
        
        # Generate audio using ElevenLabs
        audio = generate(
            text=processed_text,
            voice=request.voiceId,
            model="eleven_monolingual_v1"
        )
        
        print("Audio generation successful")
        return StreamingResponse(BytesIO(audio), media_type="audio/mpeg")
        
    except Exception as e:
        print(f"Error generating audio: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating audio: {str(e)}")

@app.get("/")
def read_root():
    return {"message": "PDF to Audio API is running"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    ) 