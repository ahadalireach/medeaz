"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown } from "lucide-react";

interface Doctor {
  _id: string;
  userId?: {
    name: string;
    email: string;
  };
  specialization?: string;
}

interface SearchableDoctorDropdownProps {
  doctors: Doctor[];
  selectedId: string;
  onChange: (id: string) => void;
  isLoading: boolean;
  isError: boolean;
}

export function SearchableDoctorDropdown({
  doctors,
  selectedId,
  onChange,
  isLoading,
  isError,
}: SearchableDoctorDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedDoctor = doctors.find((d) => d._id === selectedId);

  const filteredDoctors = doctors.filter((doctor) => {
    const name = doctor.userId?.name || "";
    const spec = doctor.specialization || "";
    const term = search.toLowerCase();
    return name.toLowerCase().includes(term) || spec.toLowerCase().includes(term);
  });

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs font-black text-text-primary uppercase tracking-widest mb-2">
        Doctor
      </label>
      <button
        type="button"
        disabled={isError || isLoading}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-left border border-gray-200 rounded-xl bg-white text-sm font-semibold text-text-primary flex items-center justify-between focus:ring-2 focus:ring-[#00b495] focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
      >
        <span className="truncate max-w-[90%]">
          {isLoading
            ? "Loading doctors..."
            : isError
            ? "Could not load doctors"
            : selectedDoctor
            ? `${selectedDoctor.userId?.name} (${selectedDoctor.specialization || "General"})`
            : "All Doctors"}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
      </button>

      {isOpen && !isError && !isLoading && (
        <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-gray-100 flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search doctor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-sm outline-none border-none p-1 focus:ring-0 focus:outline-none"
            />
          </div>
          <div className="overflow-y-auto max-h-48 divide-y divide-gray-50">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setSearch("");
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50 ${
                selectedId === "" ? "text-[#00b495] bg-[#e6f8f4]/30" : "text-text-primary"
              }`}
            >
              All Doctors
            </button>
            {filteredDoctors.map((doctor) => (
              <button
                key={doctor._id}
                type="button"
                onClick={() => {
                  onChange(doctor._id);
                  setSearch("");
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 flex flex-col ${
                  selectedId === doctor._id ? "text-[#00b495] bg-[#e6f8f4]/30" : "text-text-primary"
                }`}
              >
                <span className="font-semibold text-text-primary">{doctor.userId?.name || "N/A"}</span>
                <span className="text-xs text-gray-400">{doctor.specialization || "General"}</span>
              </button>
            ))}
            {filteredDoctors.length === 0 && (
              <div className="px-4 py-3 text-xs text-gray-400 text-center">
                No doctors found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
