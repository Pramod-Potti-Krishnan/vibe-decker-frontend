'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle, Send } from 'lucide-react';
import { ClarificationQuestion } from '@/lib/types/director-messages';

interface QuestionResponseProps {
  question: ClarificationQuestion;
  onSubmit: (response: string) => void;
  disabled?: boolean;
}

export function QuestionResponse({ question, onSubmit, disabled = false }: QuestionResponseProps) {
  const [response, setResponse] = useState('');
  const [selectedOption, setSelectedOption] = useState('');

  const handleSubmit = () => {
    const answer = question.options ? selectedOption : response;
    if (answer.trim()) {
      onSubmit(answer);
      setResponse('');
      setSelectedOption('');
    }
  };

  const getCategoryColor = () => {
    switch (question.category) {
      case 'audience':
        return 'border-blue-200 bg-blue-50';
      case 'content':
        return 'border-green-200 bg-green-50';
      case 'style':
        return 'border-purple-200 bg-purple-50';
      case 'technical':
        return 'border-orange-200 bg-orange-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getCategoryLabel = () => {
    switch (question.category) {
      case 'audience':
        return 'Target Audience';
      case 'content':
        return 'Content Details';
      case 'style':
        return 'Style & Design';
      case 'technical':
        return 'Technical Requirements';
      default:
        return 'General Question';
    }
  };

  return (
    <Card className={`w-full ${getCategoryColor()}`}>
      <CardHeader>
        <div className="flex items-start gap-3">
          <HelpCircle className="h-5 w-5 text-gray-600 mt-0.5" />
          <div className="flex-1">
            <CardTitle className="text-base">
              {getCategoryLabel()}
              {question.required && (
                <span className="ml-2 text-xs text-red-500">*Required</span>
              )}
            </CardTitle>
            <CardDescription className="mt-1">
              {question.question}
            </CardDescription>
            {question.context && (
              <p className="text-sm text-gray-600 mt-2 italic">
                {question.context}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {question.options ? (
          <RadioGroup 
            value={selectedOption} 
            onValueChange={setSelectedOption}
            disabled={disabled}
          >
            <div className="space-y-2">
              {question.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label 
                    htmlFor={`option-${index}`} 
                    className="flex-1 cursor-pointer text-sm"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        ) : (
          <Textarea
            placeholder="Type your answer here..."
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            className="min-h-[100px] bg-white"
            disabled={disabled}
          />
        )}
        
        <div className="mt-4 flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={disabled || (!response.trim() && !selectedOption)}
            size="sm"
          >
            <Send className="h-4 w-4 mr-2" />
            Submit Answer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Quick response buttons for common answers
export function QuickResponses({ 
  suggestions, 
  onSelect,
  disabled = false
}: { 
  suggestions: string[]; 
  onSelect: (response: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {suggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => onSelect(suggestion)}
          disabled={disabled}
          className="text-xs"
        >
          {suggestion}
        </Button>
      ))}
    </div>
  );
}