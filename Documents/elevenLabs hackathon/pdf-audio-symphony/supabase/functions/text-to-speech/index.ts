
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { text, voiceId, language, stability, clarity } = await req.json();
    const apiKey = Deno.env.get('ELEVENLABS_API_KEY');

    console.log('Received request parameters:', { 
      textLength: text?.length, 
      voiceId,
      language,
      stability, 
      clarity,
      hasApiKey: !!apiKey,
      apiKeyFirstChars: apiKey ? `${apiKey.substring(0, 4)}...` : 'none'
    });

    if (!text || !voiceId) {
      throw new Error('Missing required parameters: text and voiceId are required');
    }

    if (!apiKey) {
      console.error('ElevenLabs API key not found in environment variables');
      throw new Error('ElevenLabs API key is not configured');
    }

    // First verify the API key with a simple voice list request
    const verifyResponse = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': apiKey
      }
    });

    if (!verifyResponse.ok) {
      const verifyError = await verifyResponse.text();
      console.error('API Key verification failed:', verifyError);
      throw new Error('Invalid ElevenLabs API key');
    }

    // Make request to ElevenLabs API
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    console.log('Making request to ElevenLabs:', url);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2", // Using multilingual model to support different languages
          voice_settings: {
            stability,
            similarity_boost: clarity
          },
          language // This will inform ElevenLabs which language the text is in
        })
      });

      console.log('ElevenLabs response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ElevenLabs API error response:', errorText);
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      console.log('Audio buffer received, size:', audioBuffer.byteLength);

      // Convert array buffer to base64
      const uint8Array = new Uint8Array(audioBuffer);
      let base64Audio = '';
      for (let i = 0; i < uint8Array.length; i++) {
        base64Audio += String.fromCharCode(uint8Array[i]);
      }
      base64Audio = btoa(base64Audio);
      
      return new Response(
        JSON.stringify({ data: base64Audio }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      throw new Error(`Failed to call ElevenLabs API: ${fetchError.message}`);
    }

  } catch (error) {
    console.error('Edge Function error:', error.message);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to process text-to-speech request'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
})
