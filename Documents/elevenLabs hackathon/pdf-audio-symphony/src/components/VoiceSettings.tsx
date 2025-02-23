
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Slider } from './ui/slider';

interface Voice {
  id: string;
  name: string;
}

interface Language {
  id: string;
  name: string;
}

interface VoiceSettingsProps {
  voices: Voice[];
  selectedVoice: string;
  onVoiceChange: (voiceId: string) => void;
  languages: Language[];
  selectedLanguage: string;
  onLanguageChange: (languageId: string) => void;
  stability: number;
  onStabilityChange: (value: number) => void;
  clarity: number;
  onClarityChange: (value: number) => void;
}

export const VoiceSettings = ({
  voices,
  selectedVoice,
  onVoiceChange,
  languages,
  selectedLanguage,
  onLanguageChange,
  stability,
  onStabilityChange,
  clarity,
  onClarityChange,
}: VoiceSettingsProps) => {
  return (
    <Card className="p-6 w-full max-w-3xl mx-auto mt-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Voice</Label>
          <Select value={selectedVoice} onValueChange={onVoiceChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a voice" />
            </SelectTrigger>
            <SelectContent>
              {voices.map((voice) => (
                <SelectItem key={voice.id} value={voice.id}>
                  {voice.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Language</Label>
          <Select value={selectedLanguage} onValueChange={onLanguageChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((language) => (
                <SelectItem key={language.id} value={language.id}>
                  {language.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Stability</Label>
          <Slider
            value={[stability]}
            min={0}
            max={1}
            step={0.1}
            onValueChange={(values) => onStabilityChange(values[0])}
          />
        </div>

        <div className="space-y-2">
          <Label>Clarity + Enhancement</Label>
          <Slider
            value={[clarity]}
            min={0}
            max={1}
            step={0.1}
            onValueChange={(values) => onClarityChange(values[0])}
          />
        </div>
      </div>
    </Card>
  );
};
