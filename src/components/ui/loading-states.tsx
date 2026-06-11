/**
 * Loading States Components
 * Provides consistent loading UI across the application
 */

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  RefreshCw,
  Upload,
  CheckCircle,
  Folder,
  Search,
  Database,
  Wifi
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingSpinner as PrimitiveLoadingSpinner } from '@/components/primitives/shell';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

/**
 * Shim → `@/components/primitives/shell/LoadingSpinner`.
 * Translates legacy `text` prop to primitive's `label`. New code imports the primitive directly.
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className, text }) => (
  <PrimitiveLoadingSpinner size={size} className={className} label={text} />
);

/**
 * Loading state for project selection
 */
export const ProjectSelectionLoading: React.FC = () => {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
};

/**
 * Loading state for NAS folder browser
 */
export const NASFolderBrowserLoading: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Search bar skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-9 w-9" />
      </div>
      
      {/* Path display skeleton */}
      <Skeleton className="h-8 w-full" />
      
      {/* Folder list skeleton */}
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 border rounded">
            <Skeleton className="h-5 w-5" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Loading state for project validation
 */
export const ProjectValidationLoading: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-32" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-16 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
};

/**
 * Loading state for file upload
 */
export const FileUploadLoading: React.FC<{ text?: string }> = ({ text = 'Uploading files...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <Upload className="h-12 w-12 text-blue-600 animate-pulse" />
      <div className="text-center space-y-2">
        <p className="font-medium">{text}</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Please wait...</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Loading state with progress indicator
 */
interface ProgressLoadingProps {
  progress: number;
  text?: string;
  subText?: string;
}

export const ProgressLoading: React.FC<ProgressLoadingProps> = ({ 
  progress, 
  text = 'Processing...', 
  subText 
}) => {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <p className="font-medium">{text}</p>
        {subText && <p className="text-sm text-muted-foreground">{subText}</p>}
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      <div className="text-center text-sm text-muted-foreground">
        {Math.round(progress)}% complete
      </div>
    </div>
  );
};

/**
 * Loading state for operations with specific icons
 */
interface OperationLoadingProps {
  operation: 'verifying' | 'connecting' | 'searching' | 'saving';
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const OperationLoading: React.FC<OperationLoadingProps> = ({ 
  operation, 
  text,
  size = 'md'
}) => {
  const getIcon = () => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8'
    };

    const iconClass = cn('animate-spin text-blue-600', sizeClasses[size]);

    switch (operation) {
      case 'verifying':
        return <CheckCircle className={iconClass} />;
      case 'connecting':
        return <Wifi className={iconClass} />;
      case 'searching':
        return <Search className={iconClass} />;
      case 'saving':
        return <Database className={iconClass} />;
      default:
        return <RefreshCw className={iconClass} />;
    }
  };

  const getDefaultText = () => {
    switch (operation) {
      case 'verifying':
        return 'Verifying...';
      case 'connecting':
        return 'Connecting...';
      case 'searching':
        return 'Searching...';
      case 'saving':
        return 'Saving...';
      default:
        return 'Loading...';
    }
  };

  return (
    <div className="flex items-center justify-center gap-2">
      {getIcon()}
      <span className="text-sm text-muted-foreground">{text || getDefaultText()}</span>
    </div>
  );
};

/**
 * Full page loading overlay
 */
interface LoadingOverlayProps {
  text?: string;
  subText?: string;
  progress?: number;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  text = 'Loading...', 
  subText,
  progress 
}) => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
            <div className="space-y-2">
              <p className="font-medium text-lg">{text}</p>
              {subText && <p className="text-sm text-muted-foreground">{subText}</p>}
            </div>
            {progress !== undefined && (
              <div className="space-y-2">
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">{Math.round(progress)}% complete</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Inline loading state for buttons
 */
interface ButtonLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
}

export const ButtonLoading: React.FC<ButtonLoadingProps> = ({ 
  isLoading, 
  children, 
  loadingText 
}) => {
  if (isLoading) {
    return (
      <>
        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
        {loadingText || 'Loading...'}
      </>
    );
  }

  return <>{children}</>;
};

/**
 * Table loading skeleton
 */
interface TableLoadingProps {
  rows?: number;
  columns?: number;
}

export const TableLoading: React.FC<TableLoadingProps> = ({ 
  rows = 5, 
  columns = 4 
}) => {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex gap-4 p-2 border-b">
        {[...Array(columns)].map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      
      {/* Rows */}
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-2">
          {[...Array(columns)].map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};

export default LoadingSpinner;
