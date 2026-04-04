"use client";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useGetDoctorsQuery } from "@/store/api/clinicApi";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { toast } from "react-hot-toast";

interface FilterFormData {
  doctorId: string;
  status: string;
  from: string;
  to: string;
}

interface AppointmentFiltersProps {
  onFilter: (filters: any) => void;
}

export default function AppointmentFilters({
  onFilter,
}: AppointmentFiltersProps) {
  const { data: doctorsData } = useGetDoctorsQuery(undefined);
  const { control, handleSubmit, reset } = useForm<FilterFormData>({
    defaultValues: {
      doctorId: "",
      status: "",
      from: "",
      to: "",
    },
  });

  const doctors = doctorsData?.data || [];

  const onSubmit = (data: FilterFormData) => {
    const filters: any = {};
    if (data.doctorId) filters.doctorId = data.doctorId;
    if (data.status) filters.status = data.status;
    if (data.from) filters.from = data.from;
    if (data.to) filters.to = data.to;
    onFilter(filters);
    toast.success("Filters applied successfully");
  };

  const handleClear = () => {
    reset();
    onFilter({});
    toast.success("Filters cleared");
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700"
    >
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        Filter Appointments
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Controller
          name="doctorId"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Doctor
              </label>
              <select
                {...field}
                className="w-full px-4 py-2 border border-gray-200 dark:border-[#27272a] rounded-lg bg-white dark:bg-[#1f1f23] text-gray-900 dark:text-[#e4e4e7] placeholder:text-gray-400 dark:placeholder:text-[#52525b] focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="">All Doctors</option>
                {Array.isArray(doctors) && doctors.map((doctor: any) => (
                  <option key={doctor._id} value={doctor._id}>
                    {doctor.userId?.name || "N/A"}
                  </option>
                ))}
              </select>
            </div>
          )}
        />

        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                {...field}
                className="w-full px-4 py-2 border border-gray-200 dark:border-[#27272a] rounded-lg bg-white dark:bg-[#1f1f23] text-gray-900 dark:text-[#e4e4e7] placeholder:text-gray-400 dark:placeholder:text-[#52525b] focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no-show">No Show</option>
              </select>
            </div>
          )}
        />

        <Controller
          name="from"
          control={control}
          render={({ field }) => (
            <Input label="From Date" type="date" {...field} />
          )}
        />

        <Controller
          name="to"
          control={control}
          render={({ field }) => <Input label="To Date" type="date" {...field} />}
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit">Apply Filters</Button>
        <Button type="button" variant="outline" onClick={handleClear}>
          Clear Filters
        </Button>
      </div>
    </form>
  );
}
