"use client";

import { useMemo, useState } from "react";
import { useDeleteRevenueHistoryRecordMutation, useGetRevenueHistoryQuery, useClearRevenueHistoryMutation } from "@/store/api/doctorApi";
import { useTranslations } from "next-intl";
import { Trash2, Loader2, Calendar, User, Banknote } from "lucide-react";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import toast from "react-hot-toast";
import PageHeader from "@/components/shared/PageHeader";

export default function DoctorRevenuePage() {
  const t = useTranslations();
  const { data, isLoading, refetch } = useGetRevenueHistoryQuery({ page: 1, limit: 200 });
  const [deleteRecord] = useDeleteRevenueHistoryRecordMutation();
  const [clearAll, { isLoading: clearing }] = useClearRevenueHistoryMutation();
  const [showClearModal, setShowClearModal] = useState(false);

  // Track which specific row(s) are being deleted
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const entries = data?.data?.entries || [];

  // Total is computed from ALL entries — deleting a log record doesn't reduce earned revenue
  const total = useMemo(() => entries.reduce((sum: number, e: any) => sum + (e.doctorShare || 0), 0), [entries]);

  const onDelete = async (id: string) => {
    setDeletingIds((prev) => new Set(prev).add(id));
    try {
      await deleteRecord(id).unwrap();
      toast.success(t("doctor.revenueHistory.recordDeleted"));
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || t("common.error"));
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const onClear = async () => {
    setShowClearModal(true);
  };

  const handleConfirmClear = async () => {
    try {
      await clearAll().unwrap();
      toast.success(t("doctor.revenueHistory.cleared"));
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || t("common.error"));
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Revenue & earnings"
        description={t("doctor.revenueHistory.subtitle")}
        action={
          <button
            onClick={onClear}
            disabled={clearing || !entries.length}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 disabled:opacity-50 transition-opacity"
          >
            {clearing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {clearing ? (t("common.loading") || "Clearing...") : t("doctor.revenueHistory.deleteAll")}
          </button>
        }
      />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-[#1a1a1a] shadow-sm">
        <p className="text-sm font-bold text-gray-500 dark:text-gray-400">{t("doctor.revenueHistory.totalEarned")}</p>
        <p className="mt-1 text-3xl font-black text-primary">{total.toLocaleString()} {t("common.pkr")}</p>
      </div>

      <div className="space-y-4 md:hidden">
        {isLoading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500 dark:border-gray-700 dark:bg-[#1a1a1a]">{t("common.loading")}</div>
        ) : entries.length ? entries.map((entry: any) => (
          <div key={entry._id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-[#1a1a1a]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{t("doctor.revenueHistory.date")}</p>
                <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                  <Calendar className="h-4 w-4 text-primary" />
                  {new Date(entry.occurredAt).toLocaleDateString()}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{t("doctor.revenueHistory.earned")}</p>
                <p className="mt-1 text-base font-black text-primary">{Number(entry.doctorShare || 0).toLocaleString()} {t("common.pkr")}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-gray-50 p-3 dark:bg-white/5">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{t("doctor.revenueHistory.patient")}</p>
                <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                  <User className="h-4 w-4 text-primary" />
                  {entry.patientUserId?.name || entry.patientName || t("common.noData")}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3 dark:bg-white/5">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{t("doctor.revenueHistory.total")}</p>
                <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                  <Banknote className="h-4 w-4 text-primary" />
                  {Number(entry.totalCost || 0).toLocaleString()} {t("common.pkr")}
                </p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-gray-100 p-3 dark:border-white/10">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{t("doctor.revenueHistory.consultationFee")}</p>
                <p className="mt-1 font-semibold text-gray-900 dark:text-white">{Number(entry.consultationFee || 0).toLocaleString()} {t("common.pkr")}</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-3 dark:border-white/10">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{t("doctor.revenueHistory.medicineCost")}</p>
                <p className="mt-1 font-semibold text-gray-900 dark:text-white">{Number(entry.medicineCost || 0).toLocaleString()} {t("common.pkr")}</p>
              </div>
            </div>
          </div>
        )) : (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500 dark:border-gray-700 dark:bg-[#1a1a1a]">{t("doctor.revenueHistory.empty")}</div>
        )}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-[#1a1a1a] md:block">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left">{t("doctor.revenueHistory.date")}</th>
              <th className="px-4 py-3 text-left">{t("doctor.revenueHistory.patient")}</th>
              <th className="px-4 py-3 text-left">{t("doctor.revenueHistory.consultationFee")}</th>
              <th className="px-4 py-3 text-left">{t("doctor.revenueHistory.medicineCost")}</th>
              <th className="px-4 py-3 text-left">{t("doctor.revenueHistory.total")}</th>
              <th className="px-4 py-3 text-left">{t("doctor.revenueHistory.earned")}</th>
              <th className="px-4 py-3 text-left">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="px-4 py-6" colSpan={7}>{t("common.loading")}</td></tr>
            ) : entries.length ? entries.map((entry: any) => {
              const isDeleting = deletingIds.has(entry._id);
              return (
                <tr key={entry._id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-3">{new Date(entry.occurredAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{entry.patientUserId?.name || t("common.noData")}</td>
                  <td className="px-4 py-3">{Number(entry.consultationFee || 0).toLocaleString()} {t("common.pkr")}</td>
                  <td className="px-4 py-3">{Number(entry.medicineCost || 0).toLocaleString()} {t("common.pkr")}</td>
                  <td className="px-4 py-3">{Number(entry.totalCost || 0).toLocaleString()} {t("common.pkr")}</td>
                  <td className="px-4 py-3 font-bold text-primary">{Number(entry.doctorShare || 0).toLocaleString()} {t("common.pkr")}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onDelete(entry._id)}
                      disabled={isDeleting}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                </tr>
              );
            }) : (
              <tr><td className="px-4 py-6" colSpan={7}>{t("doctor.revenueHistory.empty")}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmationModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleConfirmClear}
        title={t("doctor.revenueHistory.deleteAll")}
        message={t("doctor.revenueHistory.clearConfirm")}
        confirmText={t("common.delete")}
      />
    </div>
  );
}
