import * as React from "react";
import { formatDisplayDateLong } from '@/utils/timezoneUtils';
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Earliest selectable year in dropdown (default: 2020) */
  fromYear?: number;
  /** Latest selectable year in dropdown (default: 2030) */
  toYear?: number;
  /** Disable specific dates */
  disabledDates?: (date: Date) => boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  className,
  fromYear = 2020,
  toYear = 2030,
  disabledDates,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (date: Date | undefined) => {
    onChange(date);
    setOpen(false);
  };

  const handleToday = () => {
    onChange(new Date());
    setOpen(false);
  };

  const handleClear = () => {
    onChange(undefined);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? formatDisplayDateLong(value) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          captionLayout="dropdown-buttons"
          selected={value}
          onSelect={handleSelect}
          disabled={disabledDates}
          fromYear={fromYear}
          toYear={toYear}
          defaultMonth={value}
          initialFocus
        />
        <div className="flex items-center justify-between border-t px-3 py-2">
          <Button variant="ghost" size="sm" onClick={handleClear}>
            Clear
          </Button>
          <Button variant="ghost" size="sm" onClick={handleToday}>
            Today
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
