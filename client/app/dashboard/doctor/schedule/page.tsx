"use client";

import { useState, useEffect } from "react";
import { useGetScheduleQuery, useUpdateScheduleMutation } from "@/store/api/doctorApi";
import { toast } from "react-hot-toast";
import { Save, Loader } from "lucide-react";

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 8; hour < 20; hour++) {
    for (let minute of [0, 30]) {
      const h = hour.toString().padStart(2, '0');
      const m = minute.toString().padStart(2, '0');
      slots.push(`${h}:${m}`);
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

export default function SchedulePage() {
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
        loading: "Saving schedule...",
        success: "Schedule saved successfully",
        error: "Failed to save schedule"
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-black">Schedule</h1>
          <p className="text-text-secondary mt-2 text-lg">
            Manage your weekly availability
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
              Saving...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              Save Schedule
            </>
          )}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-border-light overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-8 gap-px bg-border-light">
            <div className="bg-white p-4 font-semibold text-text-primary">Time</div>
            {DAYS.map((day) => (
              <div key={day.key} className="bg-white p-4 font-semibold text-text-primary text-center">
                {day.label}
              </div>
            ))}
          </div>

          {TIME_SLOTS.map((slot) => (
            <div key={slot} className="grid grid-cols-8 gap-px bg-border-light">
              <div className="bg-white p-3 text-sm text-text-secondary font-medium">
                {slot}
              </div>
              {DAYS.map((day) => {
                const isSelected = localSchedule[day.key]?.includes(slot);
                return (
                  <button
                    key={`${day.key}-${slot}`}
                    onClick={() => toggleSlot(day.key, slot)}
                    className={`p-3 transition-colors ${
                      isSelected
                        ? "bg-primary hover:bg-primary-hover text-white"
                        : "bg-surface hover:bg-surface/70 text-text-muted"
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
