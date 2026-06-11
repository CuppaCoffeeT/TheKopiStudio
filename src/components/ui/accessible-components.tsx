/**
 * Accessible Components
 * Enhanced components with improved accessibility features
 */

import React, { forwardRef } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Info,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Accessible Status Badge with proper ARIA labels
 */
interface AccessibleStatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'loading';
  children: React.ReactNode;
  className?: string;
  showIcon?: boolean;
  ariaLabel?: string;
}

export const AccessibleStatusBadge: React.FC<AccessibleStatusBadgeProps> = ({
  status,
  children,
  className,
  showIcon = true,
  ariaLabel
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          icon: <CheckCircle className="h-3 w-3" />,
          className: 'bg-green-100 text-green-800 border-green-200',
          ariaLabel: ariaLabel || `Success: ${children}`
        };
      case 'warning':
        return {
          icon: <AlertCircle className="h-3 w-3" />,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          ariaLabel: ariaLabel || `Warning: ${children}`
        };
      case 'error':
        return {
          icon: <XCircle className="h-3 w-3" />,
          className: 'bg-red-100 text-red-800 border-red-200',
          ariaLabel: ariaLabel || `Error: ${children}`
        };
      case 'info':
        return {
          icon: <Info className="h-3 w-3" />,
          className: 'bg-blue-100 text-blue-800 border-blue-200',
          ariaLabel: ariaLabel || `Info: ${children}`
        };
      case 'loading':
        return {
          icon: <RefreshCw className="h-3 w-3 animate-spin" />,
          className: 'bg-accent text-foreground border-border',
          ariaLabel: ariaLabel || `Loading: ${children}`
        };
      default:
        return {
          icon: null,
          className: 'bg-accent text-foreground',
          ariaLabel: ariaLabel || String(children)
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge 
      className={cn('flex items-center gap-1 text-xs border', config.className, className)}
      aria-label={config.ariaLabel}
      role="status"
    >
      {showIcon && config.icon}
      {children}
    </Badge>
  );
};

/**
 * Accessible Button with enhanced keyboard navigation and screen reader support
 */
interface AccessibleButtonProps extends ButtonProps {
  loadingText?: string;
  isLoading?: boolean;
  ariaDescribedBy?: string;
  tooltip?: string;
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ children, loadingText, isLoading, ariaDescribedBy, tooltip, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        {...props}
        disabled={props.disabled || isLoading}
        aria-describedby={ariaDescribedBy}
        title={tooltip}
        aria-busy={isLoading}
        aria-live={isLoading ? 'polite' : undefined}
      >
        {isLoading ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
            <span>{loadingText || 'Loading...'}</span>
          </>
        ) : (
          children
        )}
      </Button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';

/**
 * Accessible Alert with proper ARIA roles and live regions
 */
interface AccessibleAlertProps {
  type: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  className?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  live?: 'polite' | 'assertive' | 'off';
}

export const AccessibleAlert: React.FC<AccessibleAlertProps> = ({
  type,
  title,
  children,
  className,
  dismissible = false,
  onDismiss,
  live = 'polite'
}) => {
  const getAlertConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          className: 'border-green-200 bg-green-50 text-green-800',
          role: 'status' as const
        };
      case 'warning':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          className: 'border-yellow-200 bg-yellow-50 text-yellow-800',
          role: 'alert' as const
        };
      case 'error':
        return {
          icon: <XCircle className="h-4 w-4" />,
          className: 'border-red-200 bg-red-50 text-red-800',
          role: 'alert' as const
        };
      case 'info':
      default:
        return {
          icon: <Info className="h-4 w-4" />,
          className: 'border-blue-200 bg-blue-50 text-blue-800',
          role: 'status' as const
        };
    }
  };

  const config = getAlertConfig();

  return (
    <Alert 
      className={cn(config.className, className)}
      role={config.role}
      aria-live={live}
    >
      {config.icon}
      <div className="flex-1">
        {title && (
          <h4 className="font-medium mb-1" id={`alert-title-${Date.now()}`}>
            {title}
          </h4>
        )}
        <AlertDescription>
          {children}
        </AlertDescription>
      </div>
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-2 p-1 hover:bg-accent rounded"
          aria-label="Dismiss alert"
        >
          <XCircle className="h-4 w-4" />
        </button>
      )}
    </Alert>
  );
};

/**
 * Accessible Progress Indicator
 */
interface AccessibleProgressProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

export const AccessibleProgress: React.FC<AccessibleProgressProps> = ({
  value,
  max = 100,
  label,
  showPercentage = true,
  className
}) => {
  const percentage = Math.round((value / max) * 100);
  const progressId = `progress-${Date.now()}`;
  const labelId = `progress-label-${Date.now()}`;

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <div className="flex justify-between items-center">
          <label id={labelId} className="text-sm font-medium">
            {label}
          </label>
          {showPercentage && (
            <span className="text-sm text-muted-foreground" aria-live="polite">
              {percentage}%
            </span>
          )}
        </div>
      )}
      <div className="w-full bg-muted rounded-full h-2">
        <div
          id={progressId}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-labelledby={label ? labelId : undefined}
          aria-valuetext={`${percentage}% complete`}
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

/**
 * Accessible Skip Link for keyboard navigation
 */
export const SkipLink: React.FC<{ href: string; children: React.ReactNode }> = ({
  href,
  children
}) => {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50"
    >
      {children}
    </a>
  );
};

/**
 * Accessible Toggle Button with proper ARIA states
 */
interface AccessibleToggleProps {
  pressed: boolean;
  onToggle: (pressed: boolean) => void;
  children: React.ReactNode;
  ariaLabel?: string;
  className?: string;
}

export const AccessibleToggle: React.FC<AccessibleToggleProps> = ({
  pressed,
  onToggle,
  children,
  ariaLabel,
  className
}) => {
  return (
    <Button
      variant={pressed ? 'default' : 'outline'}
      onClick={() => onToggle(!pressed)}
      aria-pressed={pressed}
      aria-label={ariaLabel}
      className={className}
    >
      {children}
    </Button>
  );
};

/**
 * Accessible Disclosure/Collapsible with proper ARIA attributes
 */
interface AccessibleDisclosureProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const AccessibleDisclosure: React.FC<AccessibleDisclosureProps> = ({
  title,
  children,
  defaultOpen = false,
  className
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const contentId = `disclosure-content-${Date.now()}`;
  const buttonId = `disclosure-button-${Date.now()}`;

  return (
    <div className={className}>
      <button
        id={buttonId}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className="flex items-center justify-between w-full p-2 text-left font-medium hover:bg-muted rounded"
      >
        <span>{title}</span>
        {isOpen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
      <div
        id={contentId}
        role="region"
        aria-labelledby={buttonId}
        className={cn(
          'overflow-hidden transition-all duration-200',
          isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="p-2">
          {children}
        </div>
      </div>
    </div>
  );
};

/**
 * Accessible Live Region for dynamic content announcements
 */
interface LiveRegionProps {
  message: string;
  politeness?: 'polite' | 'assertive';
  atomic?: boolean;
  className?: string;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  politeness = 'polite',
  atomic = true,
  className
}) => {
  return (
    <div
      aria-live={politeness}
      aria-atomic={atomic}
      className={cn('sr-only', className)}
    >
      {message}
    </div>
  );
};

export default {
  AccessibleStatusBadge,
  AccessibleButton,
  AccessibleAlert,
  AccessibleProgress,
  SkipLink,
  AccessibleToggle,
  AccessibleDisclosure,
  LiveRegion
};
