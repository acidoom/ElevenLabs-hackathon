import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Pause, Play, RotateCcw, Volume2 } from 'lucide-react';
import { Slider } from './ui/slider';
import { useToast } from '@/hooks/use-toast';

interface AudioPlayerProps {
  audioUrl: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

export const AudioPlayer = ({ audioUrl, onTimeUpdate }: AudioPlayerProps) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isReady, setIsReady] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!waveformRef.current) return;

    setIsReady(false);
    setIsPlaying(false);

    const loadAudio = async () => {
      try {
        const audio = document.createElement('audio');
        audio.src = audioUrl;
        audio.preload = 'auto';
        audioRef.current = audio;

        const wavesurfer = WaveSurfer.create({
          container: waveformRef.current!,
          waveColor: 'rgb(100, 100, 100)',
          progressColor: 'rgb(0, 0, 0)',
          cursorColor: 'transparent',
          barWidth: 2,
          barGap: 2,
          height: 64,
          barRadius: 3,
          normalize: true,
          backend: 'MediaElement',
          mediaControls: false,
          autoplay: false,
          media: audio
        });

        wavesurferRef.current = wavesurfer;

        wavesurfer.on('ready', () => {
          console.log('WaveSurfer ready');
          setIsReady(true);
          wavesurfer.setVolume(volume);
        });

        wavesurfer.on('play', () => {
          console.log('WaveSurfer playing');
          setIsPlaying(true);
        });

        wavesurfer.on('pause', () => {
          console.log('WaveSurfer paused');
          setIsPlaying(false);
        });

        wavesurfer.on('finish', () => {
          console.log('WaveSurfer finished');
          setIsPlaying(false);
        });

        wavesurfer.on('error', (error) => {
          console.error('WaveSurfer error:', error);
          toast({
            title: "Error loading audio",
            description: "There was a problem loading the audio file",
            variant: "destructive",
          });
        });

      } catch (error) {
        console.error('Error initializing audio:', error);
        toast({
          title: "Error initializing audio player",
          description: "There was a problem setting up the audio player",
          variant: "destructive",
        });
      }
    };

    loadAudio();

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    if (wavesurferRef.current && isReady) {
      const handleTimeUpdate = () => {
        const currentTime = wavesurferRef.current?.getCurrentTime() ?? 0;
        const duration = wavesurferRef.current?.getDuration() ?? 0;
        onTimeUpdate?.(currentTime, duration);
      };

      wavesurferRef.current.on('audioprocess', handleTimeUpdate);
      
      return () => {
        wavesurferRef.current?.un('audioprocess', handleTimeUpdate);
      };
    }
  }, [isReady, onTimeUpdate]);

  const togglePlayPause = () => {
    console.log('Toggle play/pause clicked, isReady:', isReady);
    if (wavesurferRef.current && isReady) {
      if (isPlaying) {
        wavesurferRef.current.pause();
      } else {
        wavesurferRef.current.play();
      }
    }
  };

  const handleReset = () => {
    console.log('Reset clicked, isReady:', isReady);
    if (wavesurferRef.current && isReady) {
      wavesurferRef.current.stop();
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (wavesurferRef.current && isReady) {
      wavesurferRef.current.setVolume(newVolume);
    }
  };

  return (
    <Card className="p-6 w-full max-w-3xl mx-auto mt-8">
      <div ref={waveformRef} className="mb-4" />
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={togglePlayPause}
          className="h-10 w-10"
          disabled={!isReady}
          type="button"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleReset}
          className="h-10 w-10"
          disabled={!isReady}
          type="button"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 ml-4">
          <Volume2 className="h-4 w-4" />
          <Slider
            className="w-32"
            value={[volume]}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            disabled={!isReady}
          />
        </div>
      </div>
    </Card>
  );
};
