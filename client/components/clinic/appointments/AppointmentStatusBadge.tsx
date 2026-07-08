import { useTranslations } from "next-intl";

interface AppointmentStatusBadgeProps {
  status: string;
}

export default function AppointmentStatusBadge({ status }: AppointmentStatusBadgeProps) {
  const t = useTranslations();
  
  const getStatusLabel = (status: string) => {
    const normalized = (status || "").toLowerCase();
    const labels: Record<string, string> = {
      pending: t('appointment.status.pending') || "Pending",
      confirmed: t('appointment.status.confirmed') || "Confirmed",
      reserved: t('appointment.status.reserved') || "Reserved",
      accepted: t('appointment.status.accepted') || "Accepted",
      completed: t('appointment.status.completed') || "Completed",
      cancelled: t('appointment.status.cancelled') || "Cancelled",
      'in-progress': t('appointment.status.in-progress') || "In Progress",
      'no-show': t('appointment.status.no-show') || "No Show",
    };
    return labels[normalized] || normalized.replace(/-/g, " ");
  };

  const getStatusStyle = (status: string) => {
    const normalized = (status || "").toLowerCase();
    switch (normalized) {
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "confirmed":
      case "accepted":
        return "bg-[#e6f8f4] text-[#00b495] border-[#b3e9df]";
      case "cancelled":
      case "no-show":
        return "bg-red-100 text-red-800 border-red-200";
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(status)}`}>
      {getStatusLabel(status)}
    </span>
  );
}
