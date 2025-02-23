import React, { useState } from 'react';
import { PDFUploader } from '@/components/PDFUploader';
import { AudioPlayer } from '@/components/AudioPlayer';
import { VoiceSettings } from '@/components/VoiceSettings';
import { PDFPreview } from '@/components/PDFPreview';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import * as pdfjs from 'pdfjs-dist';
import { Sparkles, Sigma, Pi, Plus } from 'lucide-react';

// Initialize PDF.js worker
if (typeof window !== 'undefined') {
  const worker = new Worker(
    new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url),
    { type: 'module' }
  );
  pdfjs.GlobalWorkerOptions.workerPort = worker;
}

// Use predefined voices from ElevenLabs
const MOCK_VOICES = [
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi' },
];

const LANGUAGES = [
  { id: 'en', name: 'English' },
  { id: 'es', name: 'Spanish' },
  { id: 'fr', name: 'French' },
  { id: 'de', name: 'German' },
  { id: 'it', name: 'Italian' },
  { id: 'pl', name: 'Polish' },
];

const Index = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [selectedVoice, setSelectedVoice] = useState(MOCK_VOICES[0].id);
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0].id);
  const [stability, setStability] = useState(0.5);
  const [clarity, setClarity] = useState(0.5);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const { toast } = useToast();

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      let text = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(' ');
      }
      
      return text;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF');
    }
  };

  const handleUpload = async (file: File) => {
    setIsProcessing(true);
    setPdfFile(file);
    
    try {
      // Extract text from PDF
      console.log('Starting PDF text extraction...', { fileName: file.name, fileSize: file.size });
      const text = await extractTextFromPDF(file);
      console.log('Text extraction complete', { textLength: text.length });
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', file);

      // Upload PDF to backend
      console.log('Uploading PDF to backend...', { fileName: file.name });
      const uploadResponse = await fetch('http://localhost:8000/api/upload-pdf', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadResponse.text();
      console.log('Upload response received:', uploadData);

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload PDF: ${uploadData}`);
      }

      // Convert text to speech using backend API
      const ttsPayload = {
        text: text.slice(0, 5000), // Limit text length to avoid issues
        voiceId: selectedVoice,
        language: selectedLanguage,
        stability,
        clarity
      };

      console.log('Sending text-to-speech request:', {
        textLength: ttsPayload.text.length,
        voiceId: ttsPayload.voiceId,
        language: ttsPayload.language,
      });

      const ttsResponse = await fetch('http://localhost:8000/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ttsPayload),
      });

      if (!ttsResponse.ok) {
        const errorText = await ttsResponse.text();
        console.error('TTS error response:', {
          status: ttsResponse.status,
          statusText: ttsResponse.statusText,
          error: errorText
        });
        throw new Error(`Failed to generate audio: ${errorText}`);
      }

      console.log('Audio generation successful, creating blob...');
      const audioBlob = await ttsResponse.blob();
      console.log('Audio blob created', {
        type: audioBlob.type,
        size: audioBlob.size
      });
      
      // Clean up previous URL if it exists
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      toast({
        title: "PDF processed successfully",
        description: "Your audio is ready to play",
      });
    } catch (error: any) {
      console.error('Error processing PDF:', error);
      toast({
        title: "Error processing PDF",
        description: error.message || 'An unknown error occurred. Check the console for more details.',
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Clean up blob URL when component unmounts
  React.useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-4 mb-4">
            <Sigma className="w-8 h-8 text-primary/80" />
            <Pi className="w-8 h-8 text-primary/60" />
            <h1 className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
              MathToSpeech
            </h1>
            <Plus className="w-8 h-8 text-primary/60" />
            <Sparkles className="w-8 h-8 text-primary/80 animate-pulse" />
          </div>
          <p className="text-lg text-muted-foreground mt-2 max-w-lg mx-auto">
            Transform your mathematical documents into natural-sounding audio with our advanced text-to-speech technology
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-8">
          <div className="glass p-6 rounded-lg shadow-soft animate-fade-in" style={{animationDelay: '0.2s'}}>
            <VoiceSettings
              voices={MOCK_VOICES}
              selectedVoice={selectedVoice}
              onVoiceChange={setSelectedVoice}
              languages={LANGUAGES}
              selectedLanguage={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
              stability={stability}
              onStabilityChange={setStability}
              clarity={clarity}
              onClarityChange={setClarity}
            />
          </div>

          <div className="glass p-6 rounded-lg shadow-soft animate-fade-in" style={{animationDelay: '0.4s'}}>
            <PDFUploader onUpload={handleUpload} />
            
            {pdfFile && (
              <>
                <div className="text-center mt-4">
                  <p className="text-sm text-muted-foreground">
                    Current file: {pdfFile.name}
                  </p>
                </div>
                <PDFPreview 
                  file={pdfFile} 
                  currentTime={currentTime} 
                  totalDuration={duration}
                />
              </>
            )}
          </div>

          {isProcessing && (
            <div className="text-center mt-8 animate-pulse">
              <p className="text-muted-foreground">Processing your PDF...</p>
            </div>
          )}

          {audioUrl && (
            <div className="glass p-6 rounded-lg shadow-soft animate-fade-in">
              <AudioPlayer 
                audioUrl={audioUrl}
                onTimeUpdate={(time, duration) => {
                  setCurrentTime(time);
                  setDuration(duration);
                }}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
