/**
 * TruncatedText — smart-truncate `<span>` that surfaces full text in a
 * primitive Tooltip when overflow is hidden. `text=null/undefined` renders an
 * em-dash placeholder.
 *
 * Promoted from `@/components/ui/truncated-text` 2026-05-23 during the JLTT
 * migration so consumers can satisfy the primitives-only compliance gate (6a) without forking.
 */

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/primitives/overlays/Tooltip';
import { smartTruncate } from '@/utils/textTruncation';

interface TruncatedTextProps {
  text: string | null | undefined;
  maxLength: number;
  minChars?: number;
  className?: string;
}

export function TruncatedText({
  text,
  maxLength,
  minChars = 5,
  className = '',
}: TruncatedTextProps) {
  if (!text) {
    return <span className={`text-muted-foreground ${className}`}>-</span>;
  }

  const truncated = smartTruncate(text, maxLength, minChars);
  if (text.length <= maxLength) {
    return <span className={className}>{text}</span>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`cursor-help ${className}`}>{truncated}</span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-xs break-words">{text}</p>
      </TooltipContent>
    </Tooltip>
  );
}
