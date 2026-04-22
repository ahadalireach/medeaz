"use client";

import { useState, useEffect } from "react";
import { useGetScheduleQuery, useUpdateScheduleMutation } from "@/store/api/doctorApi";
import { toast } from "react-hot-toast";
import { Save, Loader } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { useTranslations } from "next-intl";

const DAYS = [
  { key: "monday" },
  { key: "tuesday" },
  { key: "wednesday" },
  { key: "thursday" },
  { key: "friday" },
  { key: "saturday" },
  { key: "sunday" },
];

const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 8; hour < 20; hour++) {
    for (let minute of [0, 15, 30, 45]) {
      const h = hour.toString().padStart(2, '0');
      const m = minute.toString().padStart(2, '0');
      slots.push(`${h}:${m}`);
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

export default function SchedulePage() {
  const t = useTranslations();
  const { data, isLoading } = useGetScheduleQuery(undefined);
  const [updateSchedule, { isLoading: saving }] = useUpdateScheduleMutation();
  const [localSchedule, setLocalSchedule] = useState<Record<string, string[]>>({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: []
  });

  useEffect(() => {
    if (data?.data?.schedule) {
      setLocalSchedule(data.data.schedule);
    }
  }, [data]);

  const toggleSlot = (day: string, slot: string) => {
    setLocalSchedule((prev) => {
      const daySlots = prev[day] || [];
      const isSelected = daySlots.includes(slot);

      return {
        ...prev,
        [day]: isSelected
          ? daySlots.filter((s) => s !== slot)
          : [...daySlots, slot]
      };
    });
  };

  const handleSave = async () => {
    toast.promise(
      updateSchedule({ schedule: localSchedule }).unwrap(),
      {
        loading: t('common.loading'),
        success: t('toast.scheduleSaved'),
        error: t('common.error')
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">{t('nav.schedule')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
            {t('doctor.manageAvailability')}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition-all disabled:opacity-50 shadow-lg"
        >
            {saving ? (
            <>
              <Loader className="h-5 w-5 animate-spin" />
              {t('common.loading')}
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              {t('doctor.saveSchedule')}
            </>
          )}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-8 gap-px bg-gray-300 dark:bg-gray-600">
            <div className="bg-white dark:bg-gray-800 p-4 font-semibold text-gray-900 dark:text-gray-100">{t('doctor.timeLabel')}</div>
            {DAYS.map((day) => (
              <div key={day.key} className="bg-white dark:bg-gray-800 p-4 font-semibold text-gray-900 dark:text-gray-100 text-center">
                {t(`schedule.${day.key}` as any)}
              </div>
            ))}
          </div>

          {TIME_SLOTS.map((slot) => (
            <div key={slot} className="grid grid-cols-8 gap-px bg-gray-300 dark:bg-gray-600">
              <div className="bg-white dark:bg-gray-800 p-3 text-sm text-gray-600 dark:text-gray-400 font-medium">
                {slot}
              </div>
              {DAYS.map((day) => {
                const isSelected = localSchedule[day.key]?.includes(slot);
                return (
                  <button
                    key={`${day.key}-${slot}`}
                    onClick={() => toggleSlot(day.key, slot)}
                    className={`p-3 transition-colors ${isSelected
                        ? "bg-primary hover:bg-primary-hover text-white"
                        : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-500 dark:text-gray-400"
                      }`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
