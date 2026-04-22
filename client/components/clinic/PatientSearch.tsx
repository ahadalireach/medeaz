"use client";

import { useState } from "react";
import { useLazySearchPatientsQuery, useGetPatientsQuery } from "@/store/api/clinicApi";
import { useRouter } from "next/navigation";
import { Search as SearchIcon, User, RefreshCcw } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "../ui/Button";
import { useTranslations } from "next-intl";

export default function PatientSearch() {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const limit = 12;
  const { data: allData, isLoading: allLoading } = useGetPatientsQuery({ page, limit });
  const [trigger, { data: searchData, isLoading: isSearching }] = useLazySearchPatientsQuery();
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      return;
    }
    try {
      setPage(1);
      await trigger({ q: searchQuery.trim(), page: 1, limit }).unwrap();
    } catch (error: any) {
      toast.error(t('common.error'));
    }
  };

  const results = searchQuery.trim()
    ? searchData?.data?.patients || []
    : allData?.data?.patients || [];
  const pagination = searchQuery.trim()
    ? searchData?.data?.pagination
    : allData?.data?.pagination;
  const isLoading = searchQuery.trim() ? isSearching : allLoading;

  const handlePageChange = async (nextPage: number) => {
    setPage(nextPage);
    if (searchQuery.trim()) {
      try {
        await trigger({ q: searchQuery.trim(), page: nextPage, limit }).unwrap();
      } catch {
        toast.error("Failed to load that page.");
      }
    }
  };

  return (
    <div className="space-y-6 animate-in">
      <form
        onSubmit={handleSearch}
        className="bg-white p-6 rounded-[2rem] border border-border-light shadow-sm"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('clinic.patientSearch.searchPlaceholder')}
              className="w-full pl-12 pr-4 py-3.5 border border-border-light rounded-2xl bg-background/50 text-text-primary placeholder:text-text-secondary focus:ring-2 focus:ring-primary focus:outline-none transition-all"
            />
          </div>
          <Button type="submit" disabled={isLoading} className="h-full py-3.5 px-8">
            {isSearching ? <RefreshCcw className="h-5 w-5 animate-spin" /> : t('common.search')}
          </Button>
        </div>
      </form>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-background animate-pulse rounded-[2rem] border border-border-light" />
          ))}
        </div>
      ) : results.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
            {results.map((patient: any) => (
              <div
                key={patient._id}
                className="bg-white p-8 rounded-[2rem] border border-border-light shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="h-20 w-20 rounded-3xl overflow-hidden mb-4 transition-all shadow-sm border border-black/5 flex items-center justify-center bg-primary/10">
                    {patient.photo ? (
                      <img
                        src={patient.photo}
                        alt={patient.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-10 w-10 text-primary" />
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-1">
                    {patient.name}
                  </h3>
                  <p className="text-sm text-text-secondary mb-6 truncate w-full">
                    {patient.email}
                  </p>

                  <div className="w-full grid grid-cols-2 gap-4 text-left p-4 bg-background rounded-2xl mb-6">
                    <div>
                      <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{t('form.gender')}</p>
                      <p className="text-sm font-semibold text-text-primary">{patient.gender || t('clinic.profile.notProvided')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{t('clinic.patientSearch.totalVisits')}</p>
                      <p className="text-sm font-semibold text-text-primary">{patient.totalVisits || 0}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push(`/dashboard/clinic_admin/patients/${patient._id}`)}
                    className="w-full py-3 bg-primary text-white rounded-2xl hover:bg-primary-hover transition-all font-bold text-sm shadow-sm"
                  >
                    {t('clinic.patientSearch.viewProfile')}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {pagination?.pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-text-secondary">
                Page {pagination.page} of {pagination.pages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(Math.max(page - 1, 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg border border-border-light text-sm font-semibold disabled:opacity-50"
                >
                  {t('common.previous')}
                </button>
                <button
                  onClick={() => handlePageChange(Math.min(page + 1, pagination.pages))}
                  disabled={page >= pagination.pages}
                  className="px-3 py-1.5 rounded-lg border border-border-light text-sm font-semibold disabled:opacity-50"
                >
                  {t('common.next')}
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white p-20 rounded-[2.5rem] border border-border-light text-center shadow-sm">
          <div className="h-20 w-20 bg-background rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="h-10 w-10 text-white/70" />
          </div>
          <h3 className="text-xl font-bold text-text-primary">{t('clinic.patientSearch.noResults')}</h3>
          <p className="text-text-secondary mt-2">
            {t('clinic.patientSearch.adjustSearch')}
          </p>
        </div>
      )}
    </div>
  );
}
