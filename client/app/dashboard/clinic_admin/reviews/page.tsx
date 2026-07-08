"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  useGetClinicAdminReviewsQuery,
  useRespondToReviewMutation,
  useUpdateReviewStatusMutation,
  useGetReviewAnalyticsQuery,
  useLazyExportReviewsQuery
} from "@/store/api/clinicApi";
import {
  Star,
  MessageSquare,
  AlertTriangle,
  Check,
  X,
  FileSpreadsheet,
  TrendingUp,
  Inbox,
  Sparkles,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import PageHeader from "@/components/shared/PageHeader";
import { toast } from "react-hot-toast";

export default function ClinicReviewsModerationPage() {
  const t = useTranslations("clinicAdminReviews");
  const tReviews = useTranslations("reviews");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const isUrdu = locale === "ur";
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sort, setSort] = useState<string>("recent");
  const [page, setPage] = useState<number>(1);

  // Response text area states
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState<string>("");

  // API Hooks
  const { data: reviewsData, isLoading: isLoadingReviews } = useGetClinicAdminReviewsQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    sort,
    page
  });

  const { data: analyticsData, isLoading: isLoadingAnalytics } = useGetReviewAnalyticsQuery(undefined);

  const [respondToReview, { isLoading: isResponding }] = useRespondToReviewMutation();
  const [updateReviewStatus, { isLoading: isUpdatingStatus }] = useUpdateReviewStatusMutation();
  const [triggerExport] = useLazyExportReviewsQuery();

  const reviews = reviewsData?.data?.reviews || [];
  const pagination = reviewsData?.data?.pagination;
  const stats = analyticsData?.data;

  const handleExport = async () => {
    try {
      const csvText = await triggerExport().unwrap();
      const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `clinic_reviews_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(isUrdu ? "جائزے کامیابی سے برآمد ہو گئے۔" : "Reviews exported successfully");
    } catch (err) {
      toast.error(isUrdu ? "جائزے برآمد کرنے میں ناکامی۔" : "Failed to export reviews");
    }
  };

  const handleStatusUpdate = async (reviewId: string, newStatus: string, dismissFlags = false) => {
    try {
      await updateReviewStatus({ reviewId, status: newStatus, dismissFlags }).unwrap();
      toast.success(
        isUrdu
          ? (newStatus === 'hidden' ? "جائزہ کامیابی سے چھپا دیا گیا۔" : "جائزہ کامیابی سے اپ ڈیٹ ہو گیا۔")
          : `Review ${newStatus === 'hidden' ? 'hidden' : 'updated'} successfully`
      );
    } catch (err: any) {
      toast.error(err?.data?.message || (isUrdu ? "حیثیت اپ ڈیٹ کرنے میں ناکامی۔" : "Failed to update review status"));
    }
  };

  const handleResponseSubmit = async (reviewId: string) => {
    if (!responseText.trim()) return;
    try {
      await respondToReview({ reviewId, text: responseText }).unwrap();
      toast.success(isUrdu ? "جواب کامیابی سے پوسٹ ہو گیا۔" : "Response posted successfully");
      setRespondingTo(null);
      setResponseText("");
    } catch (err: any) {
      toast.error(err?.data?.message || (isUrdu ? "جواب پوسٹ کرنے میں ناکامی۔" : "Failed to post response"));
    }
  };

  return (
    <div dir={isUrdu ? "rtl" : "ltr"} className="space-y-6 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      <PageHeader
        title={t("title")}
        description={t("description")}
        action={
          <Button
            onClick={handleExport}
            className="rounded-2xl font-black uppercase tracking-widest text-[10px] bg-[#00b495] hover:bg-[#00b495]/90 text-white shadow-lg shadow-[#00b495]/20"
          >
            <FileSpreadsheet className="mx-2 h-4 w-4" />
            {t("exportCsv")}
          </Button>
        }
      />

      {/* Analytics Cards Dashboard */}
      {isLoadingAnalytics ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white border border-border-light rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Card 1: Overall */}
          <div className="bg-white rounded-3xl border border-border-light p-6 shadow-sm flex items-center justify-between relative overflow-hidden group">
            <div className={`absolute top-0 ${isUrdu ? 'right-0' : 'left-0'} w-1.5 h-full bg-[#00b495]`} />
            <div>
              <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{t("averageRating")}</p>
              <h4 className="text-3xl font-black text-text-primary mt-1 flex items-baseline gap-1">
                {stats.overallRating?.toFixed(1) || "0.0"}
                <span className="text-xs font-bold text-text-secondary">/ 5</span>
              </h4>
              <p className="text-[10px] font-bold text-[#00b495] mt-1">{t("basedOn", { count: stats.totalReviews || 0 })}</p>
            </div>
            <TrendingUp className="h-10 w-10 text-[#00b495] opacity-20 group-hover:scale-110 transition-transform" />
          </div>

          {/* Card 2: Flags */}
          <div className="bg-white rounded-3xl border border-border-light p-6 shadow-sm flex items-center justify-between relative overflow-hidden group">
            <div className={`absolute top-0 ${isUrdu ? 'right-0' : 'left-0'} w-1.5 h-full bg-amber-500`} />
            <div>
              <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{t("activeFlags")}</p>
              <h4 className="text-3xl font-black text-text-primary mt-1">
                {stats.flaggedReviews || 0}
              </h4>
              <p className="text-[10px] font-bold text-amber-600 mt-1">{t("requiresReview")}</p>
            </div>
            <AlertTriangle className="h-10 w-10 text-amber-500 opacity-20 group-hover:scale-110 transition-transform" />
          </div>

          {/* Card 3: Response Rate */}
          <div className="bg-white rounded-3xl border border-border-light p-6 shadow-sm flex items-center justify-between relative overflow-hidden group">
            <div className={`absolute top-0 ${isUrdu ? 'right-0' : 'left-0'} w-1.5 h-full bg-blue-500`} />
            <div>
              <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{t("responseRate")}</p>
              <h4 className="text-3xl font-black text-text-primary mt-1">
                {stats.responseRate || 0}%
              </h4>
              <p className="text-[10px] font-bold text-blue-600 mt-1">{t("patientInteractions")}</p>
            </div>
            <MessageSquare className="h-10 w-10 text-blue-500 opacity-20 group-hover:scale-110 transition-transform" />
          </div>

          {/* Card 4: Verified Visits */}
          <div className="bg-white rounded-3xl border border-border-light p-6 shadow-sm flex items-center justify-between relative overflow-hidden group">
            <div className={`absolute top-0 ${isUrdu ? 'right-0' : 'left-0'} w-1.5 h-full bg-emerald-500`} />
            <div>
              <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{t("verifiedVisitsPercent")}</p>
              <h4 className="text-3xl font-black text-text-primary mt-1">
                {stats.verifiedVisitsPercent || 0}%
              </h4>
              <p className="text-[10px] font-bold text-emerald-600 mt-1">{t("confirmedVisits")}</p>
            </div>
            <Sparkles className="h-10 w-10 text-emerald-500 opacity-20 group-hover:scale-110 transition-transform" />
          </div>
        </div>
      ) : null}

      {/* Categories Breakdown */}
      {stats?.categoryAverages && (
        <div className="bg-white rounded-3xl border border-border-light p-6 shadow-sm">
          <h4 className="text-xs font-black text-text-primary uppercase tracking-widest mb-4">
            {t("categoryAverages")}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
            {Object.entries(stats.categoryAverages).map(([cat, val]: [string, any]) => (
              <div key={cat} className="p-4 bg-slate-50 rounded-2xl border border-border-light/70 text-center">
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider capitalize truncate">
                  {tReviews(`categories.${cat}`, { defaultValue: cat })}
                </p>
                <p className="text-xl font-black text-[#00b495] mt-1">{val?.toFixed(1) || "0.0"}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters and List */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Filter Controls */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-3xl border border-border-light p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-black text-text-primary uppercase tracking-widest">{t("filters")}</h4>

            {/* Status Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-wider">{t("status")}</label>
              <div className="flex flex-col gap-1.5">
                {[
                  { value: "all", label: t("allReviews") },
                  { value: "published", label: t("activeOnly") },
                  { value: "flagged", label: t("flaggedOnly") },
                  { value: "removed", label: t("hiddenOnly") }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setStatusFilter(opt.value);
                      setPage(1);
                    }}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all border ${
                      statusFilter === opt.value
                        ? "bg-[#00b495]/10 border-[#00b495]/30 text-[#00b495]"
                        : "bg-transparent border-transparent text-text-secondary hover:bg-slate-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-wider">{t("sortBy")}</label>
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    setPage(1);
                  }}
                  className={`w-full appearance-none bg-slate-50 border border-border-light rounded-xl px-4 py-2.5 ${isUrdu ? 'pl-8' : 'pr-8'} text-xs font-bold text-text-primary focus:outline-none`}
                >
                  <option value="recent">{t("mostRecent")}</option>
                  <option value="highest">{t("highestRated")}</option>
                  <option value="lowest">{t("lowestRated")}</option>
                </select>
                <ChevronDown className={`absolute ${isUrdu ? 'left-3' : 'right-3'} top-3.5 h-3 w-3 text-text-secondary pointer-events-none`} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Reviews List */}
        <div className="lg:col-span-3 space-y-4">
          {isLoadingReviews ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-44 bg-white border border-border-light rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] border border-border-light p-12 text-center">
              <Inbox className="h-16 w-16 text-text-primary opacity-20 mx-auto mb-4" />
              <h3 className="text-xl font-black text-text-primary uppercase tracking-tight">{t("noReviewsFound")}</h3>
              <p className="text-sm text-text-secondary mt-1">{t("noReviewsDesc")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((rev: any) => (
                <div
                  key={rev._id}
                  className={`bg-white rounded-3xl border p-6 shadow-sm space-y-4 transition-all ${
                    rev.status === "flagged" ? "border-amber-400 bg-amber-50/10" : "border-border-light"
                  }`}
                >
                  {/* Review Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3">
                        {rev.patientPhoto ? (
                          <img src={rev.patientPhoto} alt={rev.patientName} className="h-10 w-10 object-cover rounded-full border border-border-light" />
                        ) : (
                          <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-[#00b495] border">
                            {rev.patientName?.[0] || "P"}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-sm font-black text-text-primary">{rev.patientName}</h5>
                            <span className="text-[10px] font-bold text-text-secondary">
                              {new Date(rev.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3.5 w-3.5 ${star <= rev.overallRating ? "fill-primary text-primary" : "text-slate-200"}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {rev.isVerifiedVisit && (
                        <span className="px-2 py-0.5 bg-[#00b495]/10 text-[#00b495] rounded-full text-[9px] font-black uppercase">
                          {t("verifiedVisitBadge")}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        rev.status === 'flagged' ? 'bg-amber-100 text-amber-700' :
                        rev.status === 'removed' ? 'bg-red-100 text-red-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {rev.status === 'published' ? (isUrdu ? "فعال" : "Active") : 
                         rev.status === 'flagged' ? (isUrdu ? "فلیگ شدہ" : "Flagged") :
                         (isUrdu ? "پوشیدہ" : "Hidden")}
                      </span>
                    </div>
                  </div>

                  {/* Title & Comment */}
                  <div className="space-y-1">
                    {rev.title && <h4 className="text-sm font-black text-text-primary">{rev.title}</h4>}
                    {rev.comment && <p className="text-xs text-text-secondary leading-relaxed">{rev.comment}</p>}
                  </div>

                  {/* Category Ratings Breakdown */}
                  {rev.categoryRatings && (
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2">
                      {Object.entries(rev.categoryRatings).map(([cat, val]: [string, any]) => (
                        <div key={cat} className="p-2 bg-slate-50 border rounded-xl text-center">
                          <p className="text-[8px] font-bold text-text-secondary uppercase truncate">
                            {tReviews(`categories.${cat}`, { defaultValue: cat })}
                          </p>
                          <p className="text-xs font-black text-[#00b495]">{val}/5</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Flag reports description if flagged */}
                  {rev.status === "flagged" && rev.flagReports && rev.flagReports.length > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                      <p className="font-extrabold flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4" /> {t("flaggedForReview")}
                      </p>
                      <ul className={`list-disc ${isUrdu ? 'pr-5' : 'pl-5'} font-bold space-y-0.5`}>
                        {rev.flagReports.map((report: any, idx: number) => (
                          <li key={idx}>
                            {t("reason")} <span className="font-extrabold capitalize">{tReviews(`flagReasons.${report.reason}`, { defaultValue: report.reason })}</span> ({t("reportedOn", { date: new Date(report.reportedAt).toLocaleDateString() })})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Response Text display */}
                  {rev.clinicResponse?.text && (
                    <div className="bg-[#f6f8f8] border border-border-light rounded-2xl p-4 space-y-1">
                      <p className="text-[9px] font-black text-[#00b495] uppercase tracking-wider">{t("yourResponse")}</p>
                      <p className="text-xs text-text-secondary leading-relaxed">{rev.clinicResponse.text}</p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border-light/65">
                    {/* Moderation status actions */}
                    <div className="flex gap-2">
                      {rev.status === "flagged" && (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => handleStatusUpdate(rev._id, "published", true)}
                            className="h-9 px-4 rounded-xl text-[10px] border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-black uppercase tracking-wider"
                          >
                            <Check className="mx-1 h-3.5 w-3.5" /> {t("dismissFlag")}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleStatusUpdate(rev._id, "removed")}
                            className="h-9 px-4 rounded-xl text-[10px] border-red-500 text-red-600 hover:bg-red-50 font-black uppercase tracking-wider"
                          >
                            <X className="mx-1 h-3.5 w-3.5" /> {t("hideReview")}
                          </Button>
                        </>
                      )}
                      {rev.status === "removed" && (
                        <Button
                          variant="outline"
                          onClick={() => handleStatusUpdate(rev._id, "published")}
                          className="h-9 px-4 rounded-xl text-[10px] border-[#00b495] text-[#00b495] hover:bg-[#00b495]/5 font-black uppercase tracking-wider"
                        >
                          {t("unhideReview")}
                        </Button>
                      )}
                    </div>

                    {/* Respond Drawer / Form Trigger */}
                    {respondingTo === rev._id ? (
                      <div className="w-full space-y-3 pt-2">
                        <textarea
                          placeholder={t("writeResponse")}
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          maxLength={1000}
                          className="w-full rounded-2xl border-border-light bg-background p-3 text-sm focus:ring-[#00b495] focus:border-[#00b495]"
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => setRespondingTo(null)}>
                            {tCommon("cancel")}
                          </Button>
                          <Button
                            size="sm"
                            disabled={isResponding}
                            onClick={() => handleResponseSubmit(rev._id)}
                            className="bg-[#00b495] hover:bg-[#009e82] text-white"
                          >
                            {t("submitResponse")}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setRespondingTo(rev._id);
                          setResponseText(rev.clinicResponse?.text || "");
                        }}
                        className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider border-[#00b495] text-[#00b495] hover:bg-[#00b495]/5"
                      >
                        {rev.clinicResponse?.text ? t("editResponse") : t("respond")}
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-6">
                  <Button
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="text-xs"
                  >
                    {tCommon("previous")}
                  </Button>
                  <span className="text-xs font-bold text-text-secondary self-center px-2">
                    {isUrdu ? `${pagination.totalPages} میں سے صفحہ ${page}` : `Page ${page} of ${pagination.totalPages}`}
                  </span>
                  <Button
                    variant="outline"
                    disabled={page === pagination.totalPages}
                    onClick={() => setPage(page + 1)}
                    className="text-xs"
                  >
                    {tCommon("next")}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
