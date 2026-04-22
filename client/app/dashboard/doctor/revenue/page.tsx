"use client";

import { useMemo, useState } from "react";
import { useDeleteRevenueHistoryRecordMutation, useGetRevenueHistoryQuery, useClearRevenueHistoryMutation } from "@/store/api/doctorApi";
import { useTranslations } from "next-intl";
import { Trash2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function DoctorRevenuePage() {
  const t = useTranslations();
  const { data, isLoading, refetch } = useGetRevenueHistoryQuery({ page: 1, limit: 200 });
  const [deleteRecord] = useDeleteRevenueHistoryRecordMutation();
  const [clearAll, { isLoading: clearing }] = useClearRevenueHistoryMutation();

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
    try {
      await clearAll().unwrap();
      toast.success(t("doctor.revenueHistory.cleared"));
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || t("common.error"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">{t("doctor.revenueHistory.title")}</h1>
          <p className="mt-1 text-sm text-text-secondary">{t("doctor.revenueHistory.subtitle")}</p>
        </div>
        <button
          onClick={onClear}
          disabled={clearing || !entries.length}
          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          {t("doctor.revenueHistory.deleteAll")}
        </button>
      </div>

      <div className="rounded-2xl border border-border-light bg-white p-5">
        <p className="text-sm font-bold text-text-secondary">{t("doctor.revenueHistory.totalEarned")}</p>
        <p className="mt-1 text-3xl font-black text-primary">{total.toLocaleString()} {t("common.pkr")}</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border-light bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-background">
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
                <tr key={entry._id} className="border-t border-border-light">
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
    </div>
  );
}
