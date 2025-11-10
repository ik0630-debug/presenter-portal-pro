import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressTrackerProps {
  currentStep: number;
  completedSteps: number[];
}

const steps = [
  { number: 1, label: '프로필 정보' },
  { number: 2, label: '강연료/교통비' },
  { number: 3, label: '발표자료' },
  { number: 4, label: '동의서' },
  { number: 5, label: '참석 확인' },
  { number: 6, label: '현장 안내' },
];

export const ProgressTracker = ({ currentStep, completedSteps }: ProgressTrackerProps) => {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.number);
          const isCurrent = currentStep === step.number;
          
          return (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all",
                    isCompleted && "bg-primary text-primary-foreground",
                    isCurrent && !isCompleted && "bg-primary/20 text-primary border-2 border-primary",
                    !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : step.number}
                </div>
                <span className={cn(
                  "text-xs mt-2 text-center",
                  isCurrent && "font-semibold text-primary",
                  !isCurrent && "text-muted-foreground"
                )}>
                  {step.label}
                </span>
              </div>
              
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "h-1 flex-1 mx-2 transition-all",
                    isCompleted ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
