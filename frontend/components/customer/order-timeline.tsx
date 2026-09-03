import { CheckCircle2, Circle, Clock } from "lucide-react";

interface TimelineEvent {
  title: string;
  date?: string;
  description?: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

interface OrderTimelineProps {
  events: TimelineEvent[];
}

export function OrderTimeline({ events }: OrderTimelineProps) {
  return (
    <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 md:ml-4 space-y-8 py-2">
      {events.map((event, idx) => (
        <div key={idx} className="relative pl-8">
          {/* Timeline Dot */}
          <div className="absolute -left-[11px] top-0 flex items-center justify-center">
            {event.isCompleted ? (
              <div className="rounded-full bg-white dark:bg-slate-950 p-0.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
            ) : event.isCurrent ? (
              <div className="rounded-full bg-white dark:bg-slate-950 p-0.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-indigo-500">
                  <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                </div>
              </div>
            ) : (
              <div className="rounded-full bg-white dark:bg-slate-950 p-0.5">
                <Circle className="h-5 w-5 text-slate-300 dark:text-slate-700" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className={`flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1 sm:gap-4 ${!event.isCompleted && !event.isCurrent ? 'opacity-60' : ''}`}>
            <div>
              <h4 className={`text-base font-semibold ${event.isCompleted || event.isCurrent ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                {event.title}
              </h4>
              {event.description && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md">
                  {event.description}
                </p>
              )}
            </div>
            
            {event.date && (
              <div className="flex items-center text-xs font-medium text-slate-400 dark:text-slate-500 mt-1 sm:mt-0 shrink-0">
                <Clock className="mr-1 h-3.5 w-3.5" />
                {event.date}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
