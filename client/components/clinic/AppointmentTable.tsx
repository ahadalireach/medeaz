import { useGetAppointmentsQuery, useGetAppointmentByIdQuery, useDeleteAppointmentMutation } from "@/store/api/clinicApi";
import { format } from "date-fns";
import { TableSkeleton } from "../ui/Skeleton";
import { Calendar, Trash2 } from "lucide-react";
import { EyeIcon, UserIcon } from "@/icons";
import { useEffect, useState } from "react";
import AppointmentDetailModal from "../AppointmentDetailModal";
import { toast } from "react-hot-toast";
import { useTranslations } from "next-intl";
import { ConfirmationModal } from "../ui/ConfirmationModal";

interface AppointmentTableProps {
  filters: any;
}

export default function AppointmentTable({ filters }: AppointmentTableProps) {
  const t = useTranslations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const { data, isLoading } = useGetAppointmentsQuery({ ...filters, page, limit });
  const { data: detailData, isLoading: isDetailLoading } = useGetAppointmentByIdQuery(selectedId!, {
    skip: !selectedId,
  });
  const [deleteAppointment] = useDeleteAppointmentMutation();

  const appointments = data?.data?.appointments || [];
  const pagination = data?.data?.pagination;

  const handleOpenDetail = (id: string) => {
    setSelectedId(id);
    setIsModalOpen(true);
  };

  const getStatusLabel = (status: string) => {
    const normalized = (status || "").toLowerCase();
    const labels: Record<string, string> = {
      pending: t('appointment.status.pending'),
      confirmed: t('appointment.status.confirmed'),
      reserved: t('appointment.status.reserved'),
      accepted: t('appointment.status.accepted'),
      completed: t('appointment.status.completed'),
      cancelled: t('appointment.status.cancelled'),
      'in-progress': t('appointment.status.in-progress'),
    };

    return labels[normalized] || normalized.replace(/-/g, " ");
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAppointment(id).unwrap();
      toast.success(t('toast.appointmentDeleted'));
      setDeleteId(null);
    } catch (err: any) {
      toast.error(err?.data?.message || t('common.error'));
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      completed: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      "in-progress": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    };

    return (
      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${styles[status] || styles.pending}`}>
        {getStatusLabel(status)}
      </span>
    );
  };

  if (isLoading) {
    return <TableSkeleton rows={8} />;
  }

  return (
    <>
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 ">{t('clinic.appointments.title')}</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="text-left py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('clinic.appointments.patient')}</th>
                <th className="text-left py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('clinic.appointments.doctor')}</th>
                <th className="text-left py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('clinic.appointments.dateTime')}</th>
                <th className="text-left py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('clinic.appointments.type')}</th>
                <th className="text-center py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('clinic.appointments.status')}</th>
                <th className="text-right py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('clinic.appointments.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {appointments.map((appointment: any) => (
                <tr
                  key={appointment._id}
                  className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 overflow-hidden">
                        {appointment.patientId?.photo ? (
                          <img src={appointment.patientId.photo} alt="P" className="h-full w-full object-cover" />
                        ) : (
                          <UserIcon size={16} />
                        )}
                      </div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                        {appointment.patientId?.name || "N/A"}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400 ">
                      Dr. {appointment.doctorId?.name || "N/A"}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl inline-block">
                      <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                        {appointment.dateTime ? format(new Date(appointment.dateTime), "MMM dd • h:mm a") : "N/A"}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-xs font-bold text-slate-500 uppercase">
                    {appointment.type || "consultation"}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {getStatusBadge(appointment.status)}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setDeleteId(appointment._id)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all group/btn active:scale-90"
                    >
                      <Trash2 size={16} className="group-hover/btn:scale-110 transition-transform" />
                    </button>
                    <button
                      onClick={() => handleOpenDetail(appointment._id)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-primary hover:bg-primary/10 transition-all group/btn"
                    >
                      <EyeIcon size={16} className="group-hover/btn:scale-110 transition-transform" />
                    </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {appointments.length === 0 && (
          <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/30 rounded-[2.5rem] mt-4 border-2 border-dashed border-slate-100 dark:border-slate-800">
            <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-4 opacity-50" />
            <p className="text-slate-500 dark:text-slate-400 font-bold tracking-tight">{t('clinic.appointments.noAppointments')}</p>
          </div>
        )}

        {pagination?.pages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Page {pagination.page} of {pagination.pages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold disabled:opacity-50"
              >
                {t('common.back')}
              </button>
              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, pagination.pages))}
                disabled={page >= pagination.pages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold disabled:opacity-50"
              >
                {t('common.next')}
              </button>
            </div>
          </div>
        )}
      </div>

      <AppointmentDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        appointment={detailData?.data}
        loading={isDetailLoading}
      />

      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            handleDelete(deleteId);
          }
        }}
        title={t('modal.confirmDelete')}
        message={t('modal.cannotUndo')}
      />
    </>
  );
}
