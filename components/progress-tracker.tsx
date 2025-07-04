'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProgressInfo } from '@/lib/types/websocket-types';

interface ProgressTrackerProps {
  progress: ProgressInfo;
  className?: string;
  compact?: boolean;
}

export function ProgressTracker({ progress, className, compact = false }: ProgressTrackerProps) {
  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">{progress.current_step}</span>
          <span className="font-medium">{progress.percentage}%</span>
        </div>
        <Progress value={progress.percentage} className="h-1.5" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Main Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium">Overall Progress</h4>
          <span className="text-sm text-gray-600">{progress.percentage}%</span>
        </div>
        <Progress value={progress.percentage} className="h-2" />
      </div>

      {/* Current Step */}
      {progress.current_step && (
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-blue-500 animate-pulse" />
          <span className="text-gray-700">{progress.current_step}</span>
        </div>
      )}

      {/* Completed Steps */}
      {progress.steps_completed.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-medium text-gray-600">Completed</h5>
          <div className="space-y-1">
            {progress.steps_completed.map((step, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                <span className="text-xs text-gray-600">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time Remaining */}
      {progress.estimated_time_remaining && (
        <div className="text-xs text-gray-500">
          Estimated time remaining: {formatTimeRemaining(progress.estimated_time_remaining)}
        </div>
      )}

      {/* Agent Statuses */}
      {progress.agentStatuses && progress.agentStatuses.length > 0 && (
        <div className="pt-2 border-t">
          <h5 className="text-xs font-medium text-gray-600 mb-2">Agent Activity</h5>
          <div className="space-y-1.5">
            {progress.agentStatuses.map((agent) => (
              <AgentStatusItem key={agent.agentId} agent={agent} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AgentStatusItem({ agent }: { agent: ProgressInfo['agentStatuses'][0] }) {
  const getStatusIcon = () => {
    switch (agent.status) {
      case 'working':
        return <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'error':
        return <Circle className="h-3 w-3 text-red-500" />;
      default:
        return <Circle className="h-3 w-3 text-gray-400" />;
    }
  };

  return (
    <div className="flex items-center gap-2">
      {getStatusIcon()}
      <span className="text-xs text-gray-700 flex-1">{agent.agentName}</span>
      {agent.currentTask && agent.status === 'working' && (
        <span className="text-xs text-gray-500 truncate max-w-[150px]">
          {agent.currentTask}
        </span>
      )}
      {agent.progress !== undefined && agent.status === 'working' && (
        <span className="text-xs text-gray-600">{agent.progress}%</span>
      )}
    </div>
  );
}

function formatTimeRemaining(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} seconds`;
  } else if (seconds < 3600) {
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.ceil((seconds % 3600) / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
}

// Inline progress indicator for tight spaces
export function ProgressIndicator({ percentage }: { percentage: number }) {
  return (
    <div className="flex items-center gap-2">
      <Progress value={percentage} className="h-1 w-16" />
      <span className="text-xs text-gray-600">{percentage}%</span>
    </div>
  );
}