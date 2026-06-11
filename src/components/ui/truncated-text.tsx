
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { smartTruncate } from "@/utils/textTruncation";

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
  className = "" 
}: TruncatedTextProps) {
  if (!text) return <span className={`text-muted-foreground ${className}`}>-</span>;
  
  const truncated = smartTruncate(text, maxLength, minChars);
  const isTextTruncated = text.length > maxLength;
  
  if (!isTextTruncated) {
    return <span className={className}>{text}</span>;
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`cursor-help ${className}`}>
            {truncated}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs break-words">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
