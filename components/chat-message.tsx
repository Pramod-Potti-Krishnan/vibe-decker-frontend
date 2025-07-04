'use client';

import React, { useState } from 'react';
import { 
  User, 
  Bot, 
  HelpCircle, 
  CheckCircle, 
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ChatData, Action } from '@/lib/types/websocket-types';

interface ChatMessageProps {
  message: ChatData;
  onAction?: (actionId: string, actionType: string, data?: any) => void;
  onResponse?: (text: string, questionId?: string) => void;
}

export function ChatMessage({ message, onAction, onResponse }: ChatMessageProps) {
  const [response, setResponse] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleTextResponse = () => {
    if (response.trim() && onResponse) {
      onResponse(response, message.content.question_id);
      setResponse('');
    }
  };

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    if (onResponse) {
      onResponse(option, message.content.question_id);
    }
  };

  const handleAction = (action: Action) => {
    if (onAction) {
      onAction(action.action_id, action.type, action.data);
    }
  };

  const getIcon = () => {
    switch (message.type) {
      case 'question':
        return <HelpCircle className="h-5 w-5 text-blue-500" />;
      case 'summary':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'progress':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'action_required':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default:
        return <Bot className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTitle = () => {
    switch (message.type) {
      case 'question':
        return 'Question';
      case 'summary':
        return 'Summary';
      case 'progress':
        return 'Progress Update';
      case 'action_required':
        return 'Action Required';
      default:
        return 'Message';
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-medium text-sm">{getTitle()}</h4>
              {message.type === 'progress' && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              )}
            </div>

            {/* Message Content */}
            <div className="text-sm text-gray-700 space-y-2">
              <p>{message.content.message}</p>
              
              {message.content.context && (
                <p className="text-xs text-gray-500 italic">{message.content.context}</p>
              )}
            </div>

            {/* Progress Details */}
            {message.type === 'progress' && message.progress && isExpanded && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Overall Progress</span>
                  <span className="font-medium">{message.progress.percentage}%</span>
                </div>
                <Progress value={message.progress.percentage} className="h-2" />
                
                {message.progress.current_step && (
                  <p className="text-xs text-gray-600">
                    Current: {message.progress.current_step}
                  </p>
                )}
                
                {message.progress.steps_completed.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-gray-600 mb-1">Completed Steps:</p>
                    <div className="space-y-1">
                      {message.progress.steps_completed.map((step, index) => (
                        <div key={index} className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span className="text-xs text-gray-600">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {message.progress.estimated_time_remaining && (
                  <p className="text-xs text-gray-500">
                    Estimated time remaining: {Math.ceil(message.progress.estimated_time_remaining / 60)} minutes
                  </p>
                )}
              </div>
            )}

            {/* Question Options */}
            {message.type === 'question' && message.content.options && (
              <div className="mt-3 space-y-2">
                {message.content.options.map((option, index) => (
                  <Button
                    key={index}
                    variant={selectedOption === option ? 'default' : 'outline'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleOptionSelect(option)}
                    disabled={selectedOption !== null}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            )}

            {/* Text Input for Questions without Options */}
            {message.type === 'question' && !message.content.options && !selectedOption && (
              <div className="mt-3 space-y-2">
                <Textarea
                  placeholder="Type your response..."
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  className="min-h-[80px]"
                />
                <Button 
                  onClick={handleTextResponse}
                  disabled={!response.trim()}
                  size="sm"
                >
                  Send Response
                </Button>
              </div>
            )}

            {/* Required Badge */}
            {message.type === 'question' && message.content.required && (
              <Badge variant="secondary" className="mt-2">
                Required
              </Badge>
            )}

            {/* Action Buttons */}
            {message.actions && message.actions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {message.actions.map((action) => (
                  <Button
                    key={action.action_id}
                    variant={action.primary ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleAction(action)}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Simple message component for basic text messages
export function SimpleChatMessage({ 
  content, 
  isUser = false,
  timestamp
}: { 
  content: string; 
  isUser?: boolean;
  timestamp?: Date;
}) {
  return (
    <div className={cn(
      "flex gap-3",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>
      <div className={cn(
        "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
        isUser ? "bg-blue-500" : "bg-gray-200"
      )}>
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-4 w-4 text-gray-600" />
        )}
      </div>
      
      <div className={cn(
        "flex-1 rounded-lg px-4 py-2",
        isUser ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"
      )}>
        <p className="text-sm">{content}</p>
        {timestamp && (
          <p className={cn(
            "text-xs mt-1",
            isUser ? "text-blue-100" : "text-gray-500"
          )}>
            {timestamp.toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
}