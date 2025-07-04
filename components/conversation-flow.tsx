'use client';

import React from 'react';
import { CheckCircle, Circle, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PresentationPhase } from '@/lib/types/director-messages';
import { usePresentationPhase } from '@/contexts/presentation-context';

interface ConversationStep {
  id: string;
  label: string;
  description: string;
  phase: PresentationPhase['current'];
  icon?: React.ReactNode;
}

const CONVERSATION_STEPS: ConversationStep[] = [
  {
    id: 'requirements',
    label: 'Gathering Requirements',
    description: 'Understanding your presentation needs',
    phase: 'gathering_requirements',
    icon: <AlertCircle className="h-4 w-4" />
  },
  {
    id: 'structure',
    label: 'Creating Structure',
    description: 'Building your presentation outline',
    phase: 'creating_structure',
    icon: <Clock className="h-4 w-4" />
  },
  {
    id: 'approval',
    label: 'Review & Approval',
    description: 'Review and approve the structure',
    phase: 'awaiting_approval',
    icon: <Circle className="h-4 w-4" />
  },
  {
    id: 'enhancement',
    label: 'Enhancing Content',
    description: 'Adding details and visual elements',
    phase: 'enhancing',
    icon: <Clock className="h-4 w-4" />
  },
  {
    id: 'complete',
    label: 'Complete',
    description: 'Your presentation is ready',
    phase: 'complete',
    icon: <CheckCircle className="h-4 w-4" />
  }
];

export function ConversationFlow() {
  const phase = usePresentationPhase();
  
  const getCurrentStepIndex = () => {
    if (!phase) return -1;
    return CONVERSATION_STEPS.findIndex(step => step.phase === phase.current);
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="w-full px-4 py-6">
      <div className="relative">
        {/* Progress line */}
        <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gray-200">
          <div 
            className="absolute top-0 left-0 w-full bg-blue-500 transition-all duration-500"
            style={{ 
              height: `${Math.max(0, (currentStepIndex / (CONVERSATION_STEPS.length - 1)) * 100)}%` 
            }}
          />
        </div>

        {/* Steps */}
        <div className="relative space-y-8">
          {CONVERSATION_STEPS.map((step, index) => {
            const isComplete = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isPending = index > currentStepIndex;

            return (
              <div key={step.id} className="flex items-start gap-4">
                {/* Step indicator */}
                <div className={cn(
                  "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white transition-colors",
                  isComplete && "border-blue-500 bg-blue-500 text-white",
                  isCurrent && "border-blue-500 bg-white text-blue-500",
                  isPending && "border-gray-300 bg-white text-gray-400"
                )}>
                  {isComplete ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : isCurrent ? (
                    <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </div>

                {/* Step content */}
                <div className="flex-1 pb-2">
                  <h3 className={cn(
                    "font-medium transition-colors",
                    isComplete && "text-gray-900",
                    isCurrent && "text-blue-600",
                    isPending && "text-gray-400"
                  )}>
                    {step.label}
                  </h3>
                  <p className={cn(
                    "text-sm transition-colors",
                    isComplete && "text-gray-600",
                    isCurrent && "text-gray-700",
                    isPending && "text-gray-400"
                  )}>
                    {step.description}
                  </p>
                  
                  {/* Progress indicator for current step */}
                  {isCurrent && phase?.progress !== undefined && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{phase.progress}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${phase.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Compact version for smaller spaces
export function ConversationFlowCompact() {
  const phase = usePresentationPhase();
  
  const getCurrentStepIndex = () => {
    if (!phase) return -1;
    return CONVERSATION_STEPS.findIndex(step => step.phase === phase.current);
  };

  const currentStepIndex = getCurrentStepIndex();
  const currentStep = CONVERSATION_STEPS[currentStepIndex];

  if (!currentStep) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2">
        {CONVERSATION_STEPS.map((step, index) => {
          const isComplete = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          
          return (
            <React.Fragment key={step.id}>
              <div className={cn(
                "h-2 w-2 rounded-full transition-colors",
                isComplete && "bg-blue-500",
                isCurrent && "bg-blue-500 animate-pulse",
                !isComplete && !isCurrent && "bg-gray-300"
              )} />
              {index < CONVERSATION_STEPS.length - 1 && (
                <div className={cn(
                  "h-0.5 w-8 transition-colors",
                  isComplete && "bg-blue-500",
                  "bg-gray-300"
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>
      
      <div className="flex-1 text-sm">
        <span className="font-medium">{currentStep.label}</span>
        {phase?.progress !== undefined && (
          <span className="text-gray-500 ml-2">({phase.progress}%)</span>
        )}
      </div>
    </div>
  );
}