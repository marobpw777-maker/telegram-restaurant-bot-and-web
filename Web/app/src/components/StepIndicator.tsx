import { Check } from 'lucide-react';

interface Step {
  label: string;
  description?: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="w-full">
      {/* Desktop Version */}
      <div className="hidden md:flex items-center justify-center gap-4">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;

          return (
            <div key={index} className="flex items-center">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`step-dot ${
                    isCompleted ? 'completed' : isActive ? 'active' : 'pending'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span
                  className={`text-xs mt-2 font-medium ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`step-line mx-4 ${
                    isCompleted ? 'completed' : 'pending'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile Version */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">
            Шаг {currentStep + 1} из {steps.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {steps[currentStep]?.label}
          </span>
        </div>
        <div className="flex gap-1">
          {steps.map((_, index) => {
            const isCompleted = index < currentStep;
            const isActive = index === currentStep;

            return (
              <div
                key={index}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  isCompleted
                    ? 'bg-success'
                    : isActive
                    ? 'bg-primary'
                    : 'bg-muted'
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
