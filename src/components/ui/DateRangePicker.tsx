import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale'; // Import pt-BR locale
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange, DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css'; // Import base styles

import * as Popover from '@radix-ui/react-popover';

interface DateRangePickerProps {
  initialRange?: DateRange;
  onRangeChange: (range: DateRange | undefined) => void;
  className?: string;
}

// Removed the large CSS comment block from here.
// The styles are defined in src/index.css

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  initialRange,
  onRangeChange,
  className,
}) => {
  const [range, setRange] = useState<DateRange | undefined>(initialRange);

  const handleSelect = (selectedRange: DateRange | undefined) => {
    setRange(selectedRange);
    onRangeChange(selectedRange); // Notify parent component
  };

  return (
    <div className={className}>
      <Popover.Root>
        <Popover.Trigger asChild>
          <button
            id="date"
            className="w-full sm:w-[300px] justify-start text-left font-normal px-4 py-2 border border-border-light dark:border-border-dark rounded-lg focus:border-primary-light focus:ring-primary-light dark:focus:border-primary-dark dark:focus:ring-primary-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark hover:bg-muted-light dark:hover:bg-muted-dark transition duration-150 ease-in-out flex items-center text-sm"
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-text-secondary-light dark:text-text-secondary-dark" />
            {range?.from ? (
              range.to ? (
                <>
                  {format(range.from, 'dd/MM/y', { locale: ptBR })} -{' '}
                  {format(range.to, 'dd/MM/y', { locale: ptBR })}
                </>
              ) : (
                format(range.from, 'dd/MM/y', { locale: ptBR })
              )
            ) : (
              <span>Selecione um período</span>
            )}
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="w-auto p-0 bg-surface-light dark:bg-surface-dark rounded-md shadow-lg border border-border-light dark:border-border-dark z-50" // Ensure high z-index
            align="start"
            sideOffset={5}
          >
            <DayPicker
              locale={ptBR} // Set locale to Portuguese (Brazil)
              initialFocus
              mode="range"
              defaultMonth={range?.from}
              selected={range}
              onSelect={handleSelect}
              numberOfMonths={2}
              className="rdp" // Add class for custom styling
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
};
