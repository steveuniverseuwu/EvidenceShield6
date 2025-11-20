/**
 * ZKP Progress Component
 * 
 * Displays automatic ZKP generation progress with elegant UI feedback
 */

import { Shield, CheckCircle2, AlertCircle, Loader2, Hash, FileCheck, Database } from "lucide-react";
import { ZKPStatus } from "../utils/zkp/ZKPService";

interface ZKPProgressProps {
  status: ZKPStatus;
}

export function ZKPProgress({ status }: ZKPProgressProps) {
  if (status.stage === 'idle') return null;

  const getStageInfo = () => {
    switch (status.stage) {
      case 'hashing':
        return {
          icon: Hash,
          title: 'Hashing Evidence File',
          description: 'Computing cryptographic hash of file content...',
          color: 'blue',
          progress: status.progress,
        };
      case 'generating':
        return {
          icon: Shield,
          title: 'Generating Zero-Knowledge Proof',
          description: 'Creating cryptographic proof of evidence integrity...',
          color: 'purple',
          progress: status.progress,
        };
      case 'recording':
        return {
          icon: Database,
          title: 'Recording on Blockchain',
          description: 'Storing proof on Polygon blockchain...',
          color: 'indigo',
          progress: status.progress,
        };
      case 'complete':
        return {
          icon: CheckCircle2,
          title: 'Evidence Secured Successfully!',
          description: status.proofId 
            ? `Zero-Knowledge Proof ID: ${status.proofId}` 
            : 'Complete',
          color: 'green',
          progress: 100,
        };
      case 'error':
        return {
          icon: AlertCircle,
          title: 'ZKP Generation Failed',
          description: status.error,
          color: 'red',
          progress: 0,
        };
      default:
        return null;
    }
  };

  const stageInfo = getStageInfo();
  if (!stageInfo) return null;

  const Icon = stageInfo.icon;
  const isLoading = status.stage !== 'complete' && status.stage !== 'error';
  const isError = status.stage === 'error';
  const isComplete = status.stage === 'complete';

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-900',
      subtext: 'text-blue-700',
      icon: 'text-blue-600',
      progress: 'bg-blue-600',
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-900',
      subtext: 'text-purple-700',
      icon: 'text-purple-600',
      progress: 'bg-purple-600',
    },
    indigo: {
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      text: 'text-indigo-900',
      subtext: 'text-indigo-700',
      icon: 'text-indigo-600',
      progress: 'bg-indigo-600',
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-900',
      subtext: 'text-green-700',
      icon: 'text-green-600',
      progress: 'bg-green-600',
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-900',
      subtext: 'text-red-700',
      icon: 'text-red-600',
      progress: 'bg-red-600',
    },
  };

  const colors = colorClasses[stageInfo.color as keyof typeof colorClasses];

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 ${isLoading ? 'animate-pulse' : ''}`}>
          {isLoading ? (
            <Loader2 className={`w-6 h-6 ${colors.icon} animate-spin`} />
          ) : (
            <Icon className={`w-6 h-6 ${colors.icon}`} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className={`font-semibold ${colors.text} mb-1`}>
            {stageInfo.title}
          </div>

          {/* Description */}
          <div className={`text-sm ${colors.subtext} mb-3`}>
            {stageInfo.description}
          </div>

          {/* Progress Bar */}
          {!isError && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className={colors.subtext}>
                  {isComplete ? 'Complete' : 'Processing...'}
                </span>
                <span className={`font-mono ${colors.subtext}`}>
                  {stageInfo.progress}%
                </span>
              </div>
              <div className="w-full bg-white/50 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full ${colors.progress} transition-all duration-300 ease-out ${
                    isLoading ? 'animate-pulse' : ''
                  }`}
                  style={{ width: `${stageInfo.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Additional info for complete state */}
          {isComplete && 'txHash' in status && (
            <div className="mt-3 pt-3 border-t border-green-200">
              <div className="flex items-center gap-2 text-xs">
                <FileCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-green-700 mb-1">Blockchain Transaction</div>
                  <code className="text-green-800 bg-green-100 px-2 py-1 rounded break-all block">
                    {status.txHash}
                  </code>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stage Indicator */}
      {isLoading && (
        <div className="mt-3 pt-3 border-t border-opacity-50" style={{ borderColor: 'currentColor' }}>
          <div className="flex items-center justify-center gap-2">
            {['hashing', 'generating', 'recording'].map((stage, index) => {
              const isCurrent = status.stage === stage;
              const isPast = ['hashing', 'generating', 'recording'].indexOf(status.stage) > index;
              
              return (
                <div key={stage} className="flex items-center">
                  <div
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      isCurrent
                        ? `${colors.progress} animate-pulse scale-125`
                        : isPast
                        ? colors.progress
                        : 'bg-gray-300'
                    }`}
                  />
                  {index < 2 && (
                    <div
                      className={`w-8 h-0.5 ${
                        isPast ? colors.progress : 'bg-gray-300'
                      } transition-all duration-300`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs mt-2 px-1">
            <span className={status.stage === 'hashing' ? colors.text : 'text-gray-500'}>Hash</span>
            <span className={status.stage === 'generating' ? colors.text : 'text-gray-500'}>Proof</span>
            <span className={status.stage === 'recording' ? colors.text : 'text-gray-500'}>Chain</span>
          </div>
        </div>
      )}
    </div>
  );
}
