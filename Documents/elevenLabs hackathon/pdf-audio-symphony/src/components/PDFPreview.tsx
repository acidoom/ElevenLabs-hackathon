
import React, { useEffect, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { Card } from './ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';

interface PDFPreviewProps {
  file: File | null;
  currentTime?: number;
  totalDuration?: number;
}

export const PDFPreview = ({ file, currentTime = 0, totalDuration = 0 }: PDFPreviewProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [textItems, setTextItems] = useState<{ str: string; transform: number[]; width: number; height: number; }[]>([]);
  const [viewportScale, setViewportScale] = useState(1);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const generatePreview = async () => {
      if (!file) {
        setPreviewUrl(null);
        setTextItems([]);
        return;
      }

      setIsLoading(true);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        
        // Calculate scale to fit the width (assuming a standard width of 800px)
        const desiredWidth = 800;
        const viewport = page.getViewport({ scale: 1.0 });
        const scale = desiredWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });
        
        setViewportScale(scale);
        setDimensions({
          width: scaledViewport.width,
          height: scaledViewport.height
        });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (!context) {
          throw new Error('Could not get canvas context');
        }

        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;

        // Get text content with positions
        const textContent = await page.getTextContent();
        const items = textContent.items.map((item: any) => ({
          str: item.str,
          transform: item.transform,
          width: item.width,
          height: item.height
        }));
        setTextItems(items);

        await page.render({
          canvasContext: context,
          viewport: scaledViewport
        }).promise;

        setPreviewUrl(canvas.toDataURL());
      } catch (error) {
        console.error('Error generating PDF preview:', error);
      } finally {
        setIsLoading(false);
      }
    };

    generatePreview();

    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [file]);

  // Calculate which text items should be highlighted based on current time
  const calculateHighlightedItems = () => {
    if (!totalDuration || !currentTime || textItems.length === 0) return new Set();
    
    // Calculate how many items should be highlighted based on progress
    const progress = currentTime / totalDuration;
    const itemsToHighlight = Math.floor(textItems.length * progress);
    
    return new Set(textItems.slice(0, itemsToHighlight).map(item => item.str));
  };

  const highlightedItems = calculateHighlightedItems();

  if (!file) return null;

  return (
    <Card className="p-4 mt-4 overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">PDF Preview</h3>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
        
        <CollapsibleContent>
          <div className="relative">
            {isLoading ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : previewUrl ? (
              <div className="relative w-full overflow-hidden rounded-lg">
                <img 
                  src={previewUrl} 
                  alt="PDF Preview" 
                  className="w-full h-auto object-contain"
                />
                <div className="absolute inset-0 pointer-events-none">
                  <svg 
                    width={dimensions.width} 
                    height={dimensions.height} 
                    viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%'
                    }}
                  >
                    {textItems.map((item, index) => (
                      <rect
                        key={index}
                        x={item.transform[4] * viewportScale}
                        y={dimensions.height - (item.transform[5] * viewportScale) - (item.height * viewportScale)}
                        width={item.width * viewportScale}
                        height={item.height * viewportScale}
                        fill={highlightedItems.has(item.str) ? "rgba(59, 130, 246, 0.2)" : "transparent"}
                      />
                    ))}
                  </svg>
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80 pointer-events-none" />
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Preview not available
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
