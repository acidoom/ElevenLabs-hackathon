
import React, { useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Cloud, File, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Card } from './ui/card';

export const PDFUploader = ({ onUpload }: { onUpload: (file: File) => void }) => {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      const file = files[0];
      if (file.type !== 'application/pdf') {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file",
          variant: "destructive"
        });
        return;
      }

      onUpload(file);
    },
    [onUpload, toast]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      if (file.type !== 'application/pdf') {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file",
          variant: "destructive"
        });
        return;
      }

      onUpload(file);
    },
    [onUpload, toast]
  );

  return (
    <Card className="w-full max-w-3xl mx-auto mt-8">
      <div
        className={cn(
          "relative rounded-lg border-2 border-dashed p-12 transition-all",
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="rounded-full p-4 bg-primary/10">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <h3 className="text-lg font-semibold">Upload your PDF</h3>
            <p className="text-sm text-muted-foreground">
              Drag and drop your file here or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              PDF files up to 10MB
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
