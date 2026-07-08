"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

export interface FilterState {
  status: string[];       // [] = all
  doctorId: string;       // '' = all
  from: string;           // 'YYYY-MM-DD'
  to: string;             // 'YYYY-MM-DD'
  type: string;           // '' = all
  search: string;
  page: number;
}

export function useAppointmentFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getDefaults = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const hasPatientId = searchParams.get("patientId");
    return {
      status: [] as string[],
      doctorId: "",
      from: hasPatientId ? "" : `${currentYear}-${currentMonth}-01`,
      to: hasPatientId ? "" : now.toISOString().split("T")[0],
      type: "",
      search: "",
      page: 1,
    };
  };

  const defaults = getDefaults();

  const parseUrlParams = useCallback((): FilterState => {
    const statusParam = searchParams.get("status");
    const doctorIdParam = searchParams.get("doctorId");
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const typeParam = searchParams.get("type");
    const searchParam = searchParams.get("search");
    const pageParam = searchParams.get("page");
    const hasPatientId = searchParams.get("patientId");

    const currentDefaults = {
      status: [] as string[],
      doctorId: "",
      from: hasPatientId ? "" : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`,
      to: hasPatientId ? "" : new Date().toISOString().split("T")[0],
      type: "",
      search: "",
      page: 1,
    };

    return {
      status: statusParam ? statusParam.split(",").filter(Boolean) : currentDefaults.status,
      doctorId: doctorIdParam || currentDefaults.doctorId,
      from: fromParam !== null ? fromParam : currentDefaults.from,
      to: toParam !== null ? toParam : currentDefaults.to,
      type: typeParam || currentDefaults.type,
      search: searchParam || currentDefaults.search,
      page: pageParam ? parseInt(pageParam, 10) || 1 : currentDefaults.page,
    };
  }, [searchParams]);

  const [filters, setFilters] = useState<FilterState>(() => parseUrlParams());
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  const [dateError, setDateError] = useState<string | null>(null);

  // Sync state with URL when URL changes (e.g. on navigation or load)
  useEffect(() => {
    const parsed = parseUrlParams();
    setFilters(parsed);
    setDebouncedSearch(parsed.search);
  }, [searchParams, parseUrlParams]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      if (debouncedSearch !== filters.search) {
        updateFilter("search", debouncedSearch);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [debouncedSearch]);

  // Validate date range
  useEffect(() => {
    if (filters.from && filters.to && new Date(filters.from) > new Date(filters.to)) {
      setDateError("Start date must be before end date.");
    } else {
      setDateError(null);
    }
  }, [filters.from, filters.to]);

  const updateUrl = useCallback((newFilters: FilterState) => {
    const params = new URLSearchParams();
    const defaultsObj = getDefaults();

    if (newFilters.status.length > 0) {
      params.set("status", newFilters.status.join(","));
    }
    if (newFilters.doctorId) {
      params.set("doctorId", newFilters.doctorId);
    }
    if (newFilters.from !== defaultsObj.from) {
      params.set("from", newFilters.from);
    }
    if (newFilters.to !== defaultsObj.to) {
      params.set("to", newFilters.to);
    }
    if (newFilters.type) {
      params.set("type", newFilters.type);
    }
    if (newFilters.search) {
      params.set("search", newFilters.search);
    }
    if (newFilters.page > 1) {
      params.set("page", String(newFilters.page));
    }

    // Keep patientId if present
    const patientId = searchParams.get("patientId");
    if (patientId) {
      params.set("patientId", patientId);
    }

    const queryStr = params.toString();
    router.replace(`${pathname}${queryStr ? `?${queryStr}` : ""}`, { scroll: false });
  }, [router, pathname, searchParams]);

  const updateFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => {
      const updated = { ...prev, [key]: value };
      if (key !== "page") {
        updated.page = 1;
      }
      setTimeout(() => {
        updateUrl(updated);
      }, 0);
      return updated;
    });
  }, [updateUrl]);

  const resetFilters = useCallback(() => {
    const freshDefaults = getDefaults();
    setDebouncedSearch("");
    setFilters(freshDefaults);
    
    const params = new URLSearchParams();
    const patientId = searchParams.get("patientId");
    if (patientId) {
      params.set("patientId", patientId);
    }
    const queryStr = params.toString();
    router.replace(`${pathname}${queryStr ? `?${queryStr}` : ""}`, { scroll: false });
  }, [router, pathname, searchParams]);

  const isDefault = () => {
    const defaultsObj = getDefaults();
    return (
      filters.status.length === 0 &&
      filters.doctorId === defaultsObj.doctorId &&
      filters.from === defaultsObj.from &&
      filters.to === defaultsObj.to &&
      filters.type === defaultsObj.type &&
      filters.search === "" &&
      filters.page === 1
    );
  };

  return {
    filters,
    setSearch: setDebouncedSearch,
    searchVal: debouncedSearch,
    updateFilter,
    resetFilters,
    isDirty: !isDefault(),
    dateError,
  };
}
