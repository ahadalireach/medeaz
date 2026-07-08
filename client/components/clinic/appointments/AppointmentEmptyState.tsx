import { Calendar } from "lucide-react";

interface AppointmentEmptyStateProps {
  onReset: () => void;
}

export default function AppointmentEmptyState({ onReset }: AppointmentEmptyStateProps) {
  return (
    <div className="text-center py-16 bg-white rounded-2xl mt-4 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
      <div className="h-12 w-12 rounded-full bg-[#e6f8f4] flex items-center justify-center mb-4">
        <Calendar className="h-6 w-6 text-[#00b495]" />
      </div>
      <p className="text-text-primary font-bold tracking-tight mb-2">
        No appointments match your filters.
      </p>
      <button
        onClick={onReset}
        className="text-[#00b495] hover:text-[#19bca0] text-sm font-semibold underline transition-colors"
      >
        Reset Filters
      </button>
    </div>
  );
}
