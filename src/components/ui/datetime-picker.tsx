
import * as React from "react";
import { format, isValid } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateTimePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick a date and time",
  disabled = false,
  className
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [timeValue, setTimeValue] = React.useState(
    value && isValid(value) ? format(value, "HH:mm") : "08:00"
  );

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const [hours, minutes] = timeValue.split(":").map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        const newDateTime = new Date(selectedDate);
        newDateTime.setHours(hours, minutes, 0, 0);
        onChange(newDateTime);
      }
    }
  };

  const handleTimeChange = (newTime: string) => {
    setTimeValue(newTime);
    if (value && isValid(value)) {
      const [hours, minutes] = newTime.split(":").map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        const newDateTime = new Date(value);
        newDateTime.setHours(hours, minutes, 0, 0);
        onChange(newDateTime);
      }
    }
  };

  // Update timeValue when value prop changes from outside
  React.useEffect(() => {
    if (value && isValid(value)) {
      setTimeValue(format(value, "HH:mm"));
    }
  }, [value]);

  const displayDate = value && isValid(value) ? format(value, "PPP") : null;

  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal",
              !displayDate && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {displayDate || <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value && isValid(value) ? value : undefined}
            onSelect={handleDateSelect}
            initialFocus
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
      
      <div className="flex items-center space-x-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm">Time:</Label>
        <Input
          type="time"
          value={timeValue}
          onChange={(e) => handleTimeChange(e.target.value)}
          className="w-24"
          disabled={disabled}
          step="1800"
          title="Time must be in 30-minute increments (e.g., 08:00, 08:30, 09:00)"
        />
      </div>
    </div>
  );
}
