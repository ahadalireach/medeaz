"use client";

import { useGetDoctorsQuery } from "@/store/api/clinicApi";
import { SearchableDoctorDropdown } from "./SearchableDoctorDropdown";
import { Search, X } from "lucide-react";

interface AppointmentFiltersProps {
  filters: {
    status: string[];
    doctorId: string;
    from: string;
    to: string;
    type: string;
    search: string;
  };
  searchVal: string;
  setSearch: (val: string) => void;
  updateFilter: (key: any, value: any) => void;
  resetFilters: () => void;
  isDirty: boolean;
  dateError: string | null;
}

export default function AppointmentFilters({
  filters,
  searchVal,
  setSearch,
  updateFilter,
  resetFilters,
  isDirty,
  dateError,
}: AppointmentFiltersProps) {
  const { data: doctorsData, isLoading: isLoadingDoctors, isError: isDoctorsError } = useGetDoctorsQuery({ limit: 100 });
  const doctors = doctorsData?.data?.doctors || [];

  const statusOptions = [
    { label: "All", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Confirmed", value: "confirmed" },
    { label: "Completed", value: "completed" },
    { label: "Cancelled", value: "cancelled" },
  ];

  const typeOptions = [
    { label: "All", value: "" },
    { label: "In-Person", value: "consultation" },
    { label: "Online", value: "online" },
    { label: "Follow-up", value: "follow-up" },
  ];

  const handleStatusClick = (val: string) => {
    if (val === "all") {
      updateFilter("status", []);
    } else {
      let nextStatus = [...filters.status];
      if (nextStatus.includes(val)) {
        nextStatus = nextStatus.filter((s) => s !== val);
      } else {
        nextStatus.push(val);
      }
      updateFilter("status", nextStatus);
    }
  };

  const getChipStyle = (isActive: boolean) => {
    return isActive
      ? "bg-[#00b495] text-white border-[#00b495]"
      : "bg-white text-[#374151] border-gray-200 hover:bg-gray-50";
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary">
            Filters
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Filter, search, and manage your clinic appointments
          </p>
        </div>
        {isDirty && (
          <button
            id="reset-filters-btn"
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition-all border border-red-200"
          >
            <X className="h-3.5 w-3.5" />
            Reset Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Input */}
        <div>
          <label className="block text-xs font-black text-text-primary uppercase tracking-widest mb-2">
            Search Patient
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              id="search-patient-input"
              type="text"
              placeholder="Name or phone..."
              value={searchVal}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl bg-white text-sm font-semibold text-text-primary placeholder:text-gray-400 focus:ring-2 focus:ring-[#00b495] focus:outline-none"
            />
          </div>
        </div>

        {/* Doctor Selector */}
        <SearchableDoctorDropdown
          doctors={doctors}
          selectedId={filters.doctorId}
          onChange={(id) => updateFilter("doctorId", id)}
          isLoading={isLoadingDoctors}
          isError={isDoctorsError}
        />

        {/* Date From */}
        <div>
          <label className="block text-xs font-black text-text-primary uppercase tracking-widest mb-2">
            From Date
          </label>
          <input
            id="from-date-picker"
            type="date"
            value={filters.from}
            onChange={(e) => updateFilter("from", e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white text-sm font-semibold text-text-primary focus:ring-2 focus:ring-[#00b495] focus:outline-none"
          />
        </div>

        {/* Date To */}
        <div>
          <label className="block text-xs font-black text-text-primary uppercase tracking-widest mb-2">
            To Date
          </label>
          <input
            id="to-date-picker"
            type="date"
            value={filters.to}
            onChange={(e) => updateFilter("to", e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white text-sm font-semibold text-text-primary focus:ring-2 focus:ring-[#00b495] focus:outline-none"
          />
        </div>
      </div>

      {dateError && (
        <p id="date-validation-error" className="text-red-500 text-xs font-bold bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
          {dateError}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2 border-t border-gray-100">
        {/* Status Multi-select Chips */}
        <div>
          <label className="block text-xs font-black text-text-primary uppercase tracking-widest mb-2">
            Status
          </label>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((opt) => {
              const isActive =
                opt.value === "all"
                  ? filters.status.length === 0
                  : filters.status.includes(opt.value);
              return (
                <button
                  id={`status-chip-${opt.value}`}
                  key={opt.value}
                  type="button"
                  onClick={() => handleStatusClick(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${getChipStyle(
                    isActive
                  )}`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Appointment Type Pills */}
        <div>
          <label className="block text-xs font-black text-text-primary uppercase tracking-widest mb-2">
            Type
          </label>
          <div className="flex flex-wrap gap-2">
            {typeOptions.map((opt) => {
              const isActive = filters.type === opt.value;
              const safeId = opt.value || "all";
              return (
                <button
                  id={`type-pill-${safeId}`}
                  key={opt.value}
                  type="button"
                  onClick={() => updateFilter("type", opt.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${getChipStyle(
                    isActive
                  )}`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
