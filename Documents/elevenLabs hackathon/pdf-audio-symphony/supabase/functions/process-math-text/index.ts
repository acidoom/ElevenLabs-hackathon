
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Math processing utility functions
const processMathFormulas = (text: string): string => {
  let processedText = text;
  
  // Basic LaTeX-like formula replacements
  const mathReplacements = [
    { pattern: /\\sqrt{([^}]+)}/g, replace: 'the square root of $1' },
    { pattern: /([a-z\d]+)\^(\d+)/g, replace: '$1 to the power of $2' },
    { pattern: /\\int_([^}]+)\^([^}]+)/g, replace: 'the integral from $1 to $2' },
    { pattern: /\\sum_([^}]+)\^([^}]+)/g, replace: 'the sum from $1 to $2' },
    { pattern: /\\frac{([^}]+)}{([^}]+)}/g, replace: 'the fraction of $1 over $2' },
    { pattern: /\\pi/g, replace: 'pi' },
    { pattern: /\\alpha/g, replace: 'alpha' },
    { pattern: /\\beta/g, replace: 'beta' },
    { pattern: /\\gamma/g, replace: 'gamma' },
    { pattern: /\\infty/g, replace: 'infinity' },
    { pattern: /\\equiv/g, replace: 'is equivalent to' },
    { pattern: /\\approx/g, replace: 'is approximately equal to' },
    { pattern: /\\neq/g, replace: 'is not equal to' },
    { pattern: /\\geq/g, replace: 'is greater than or equal to' },
    { pattern: /\\leq/g, replace: 'is less than or equal to' },
  ];

  mathReplacements.forEach(({ pattern, replace }) => {
    processedText = processedText.replace(pattern, replace);
  });

  return processedText;
};

// Graph and figure interpretation
const processGraphs = (text: string): string => {
  let processedText = text;
  
  // Enhance figure references with more context
  processedText = processedText.replace(
    /Figure (\d+)[:.]\s*([^.!?]+)/gi,
    'Let me describe Figure $1: $2'
  );

  return processedText;
};

// Text refinement for better speech
const refineText = (text: string): string => {
  // Split into sentences
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  const refinedSentences = sentences.map(sentence => {
    let refined = sentence.trim();
    
    // Add context for equations
    if (refined.match(/equation|formula/i)) {
      refined = `Let's look at ${refined}`;
    }
    
    // Break up long sentences
    if (refined.length > 150) {
      const midpoint = refined.lastIndexOf(',', 150);
      if (midpoint !== -1) {
        refined = refined.substring(0, midpoint + 1) + 
                 ' and ' + 
                 refined.substring(midpoint + 1);
      }
    }
    
    return refined;
  });

  return refinedSentences.join(' ');
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text) {
      throw new Error('No text provided');
    }

    console.log('Processing text:', text);

    // Process the text through our pipeline
    const mathProcessed = processMathFormulas(text);
    const graphProcessed = processGraphs(mathProcessed);
    const finalText = refineText(graphProcessed);

    console.log('Processed text:', finalText);

    return new Response(
      JSON.stringify({ 
        processedText: finalText,
        original: text 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
