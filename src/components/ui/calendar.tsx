import * as React from "react"
import { DayPicker } from "react-day-picker"
import { it } from 'date-fns/locale'
import "react-day-picker/style.css"

import { cn } from "../../lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
    className,
    ...props
}: CalendarProps) {
    return (
        <div className={cn("p-3", className)}>
            <style>{`
                .rdp-root {
                    --rdp-accent-color: #6366f1; /* indigo-500 */
                    --rdp-background-color: #312e81; /* indigo-900 */
                    --rdp-accent-background-color: #3730a3; /* indigo-800 */
                }
                .rdp-day {
                    color: #e2e8f0; /* slate-200 */
                }
                .rdp-day_disabled {
                    opacity: 0.25;
                }
                .rdp-day_selected {
                    color: #ffffff;
                    font-weight: bold;
                }
                .rdp-day:hover:not(.rdp-day_disabled) {
                    background-color: #1e293b; /* slate-800 */
                }
                .rdp-nav_button {
                    color: #e2e8f0;
                }
                .rdp-nav_button:hover {
                    background-color: #1e293b;
                }
            `}</style>
            <DayPicker
                locale={it}
                showOutsideDays={true}
                {...props}
            />
        </div>
    )
}
Calendar.displayName = "Calendar"

export { Calendar }
