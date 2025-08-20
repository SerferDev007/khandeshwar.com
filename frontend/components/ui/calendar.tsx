"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "./utils";
import { buttonVariants } from "./button";
import { useLanguage } from "../LanguageContext";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const { language } = useLanguage();

  // Custom day names for Marathi
  const marathiDayNames = ["रवि", "सोम", "मंगळ", "बुध", "गुरु", "शुक्र", "शनि"];
  const englishDayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // Custom month names for Marathi
  const marathiMonthNames = [
    "जानेवारी",
    "फेब्रुवारी",
    "मार्च",
    "एप्रिल",
    "मे",
    "जून",
    "जुलै",
    "ऑगस्ट",
    "सप्टेंबर",
    "ऑक्टोबर",
    "नोव्हेंबर",
    "डिसेंबर",
  ];




  const calendarProps =
    language === "mr"
      ? {
          formatters: {
            formatWeekdayName: (weekday: Date) => {
              const dayIndex = weekday.getDay();
              return marathiDayNames[dayIndex];
            },
            formatCaption: (date: Date) => {
              const monthName = marathiMonthNames[date.getMonth()];
              const year = date.getFullYear();
              return `${monthName} ${year}`;
            },
          },
          components: {
            IconLeft: ({ className, ...props }: any) => (
              <ChevronLeft className={cn("size-4", className)} {...props} />
            ),
            IconRight: ({ className, ...props }: any) => (
              <ChevronRight className={cn("size-4", className)} {...props} />
            ),
          },
        }
      : {
          components: {
            IconLeft: ({ className, ...props }: any) => (
              <ChevronLeft className={cn("size-4", className)} {...props} />
            ),
            IconRight: ({ className, ...props }: any) => (
              <ChevronRight className={cn("size-4", className)} {...props} />
            ),
          },
        };

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse",
        head_row: "grid grid-cols-7 mb-2",
        head_cell:
          "text-muted-foreground rounded-md font-normal text-[0.8rem] flex items-center justify-center h-8",
        row: "grid grid-cols-7 gap-0",
        cell: cn(
          "relative p-1 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-range-end)]:rounded-r-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 p-0 font-normal aria-selected:opacity-100 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
        ),
        day_range_start:
          "day-range-start aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_range_end:
          "day-range-end aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground font-semibold ring-1 ring-primary/20",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      {...calendarProps}
      {...props}
    />
  );
}

export { Calendar };
