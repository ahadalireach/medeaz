"use client";

import { useState, use } from "react";
import {
  useGetPublicClinicByIdQuery,
  useGetClinicReviewsQuery,
  useVoteReviewHelpfulMutation,
  useFlagReviewMutation
} from "@/store/api/patientApi";
import {
  Star,
  MapPin,
  Phone,
  ThumbsUp,
  AlertTriangle,
  MessageSquare,
  ChevronDown,
  X,
  Languages
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";

export default function PublicClinicProfilePage({ params }: { params: Promise<{ clinicId: string }> }) {
  const { clinicId } = use(params);
  const t = useTranslations();

  // Filters & Page
  const [activeTab, setActiveTab] = useState<"about" | "reviews">("reviews");
  const [sort, setSort] = useState<string>("recent");
  const [ratingFilter, setRatingFilter] = useState<string>("");
  const [langFilter, setLangFilter] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  // Modals / Overlays
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [flagModal, setFlagModal] = useState<{ isOpen: boolean; reviewId: string } | null>(null);
  const [flagReason, setFlagReason] = useState<string>("fake");

  // API Calls
  const { data: clinicData, isLoading: isLoadingClinic } = useGetPublicClinicByIdQuery(clinicId);
  const { data: reviewsData, isLoading: isLoadingReviews } = useGetClinicReviewsQuery({
    clinicId,
    sort,
    rating: ratingFilter || undefined,
    lang: langFilter || undefined,
    page
  });

  const [voteReviewHelpful] = useVoteReviewHelpfulMutation();
  const [flagReview] = useFlagReviewMutation();

  const clinic = clinicData?.data;
  const reviews = reviewsData?.data?.reviews || [];
  const summary = reviewsData?.data?.summary;
  const pagination = reviewsData?.data?.pagination;

  if (isLoadingClinic) {
    return (
      <div className="min-h-screen bg-[#f6f8f8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00b495] mx-auto mb-4"></div>
          <p className="text-sm font-bold text-text-secondary">Loading Profile...</p>
        </div>
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="min-h-screen bg-[#f6f8f8] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md text-center shadow-lg border border-border-light">
          <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-black text-text-primary mb-2">Clinic Not Found</h3>
          <p className="text-sm text-text-secondary mb-6">The requested clinic profile does not exist or may have been removed.</p>
          <Link href="/dashboard/patient/appointments">
            <Button className="w-full">Back to Appointments</Button>
          </Link>
        </div>
      </div>
    );
  }

  // --- RADAR CHART CALCULATION ---
  const categories = summary?.categories || {
    cleanliness: 0,
    waitTime: 0,
    frontDesk: 0,
    facility: 0,
    accessibility: 0,
    valueForMoney: 0
  };

  const radarCategories = [
    { label: "Cleanliness", value: categories.cleanliness },
    { label: "Wait Time", value: categories.waitTime },
    { label: "Front Desk", value: categories.frontDesk },
    { label: "Facility", value: categories.facility },
    { label: "Accessibility", value: categories.accessibility },
    { label: "Value", value: categories.valueForMoney }
  ];

  const center = 120;
  const maxVal = 5;
  const radius = 80;

  // Generate background grid hexagons
  const gridLevels = [1, 2, 3, 4, 5];
  const gridPoints = gridLevels.map(level => {
    const pointsRatio = level / maxVal;
    return radarCategories.map((_, i) => {
      const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2;
      const x = center + radius * pointsRatio * Math.cos(angle);
      const y = center + radius * pointsRatio * Math.sin(angle);
      return `${x},${y}`;
    }).join(" ");
  });

  // Data polygon points
  const dataPoints = radarCategories.map((cat, i) => {
    const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2;
    const valRatio = (cat.value || 0) / maxVal;
    const x = center + radius * valRatio * Math.cos(angle);
    const y = center + radius * valRatio * Math.sin(angle);
    return `${x},${y}`;
  }).join(" ");

  // Label placements
  const labels = radarCategories.map((cat, i) => {
    const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2;
    const textDistRatio = 1.25;
    const x = center + radius * textDistRatio * Math.cos(angle);
    const y = center + radius * textDistRatio * Math.sin(angle);
    return {
      x,
      y,
      label: cat.label,
      value: cat.value || 0,
      anchor: (Math.cos(angle) > 0.1 ? "start" : Math.cos(angle) < -0.1 ? "end" : "middle") as "start" | "end" | "middle"
    };
  });

  const handleVote = async (reviewId: string, vote: "helpful" | "not-helpful") => {
    try {
      await voteReviewHelpful({ reviewId, vote }).unwrap();
      toast.success("Thank you for your vote");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to submit vote");
    }
  };

  const handleFlagSubmit = async () => {
    if (!flagModal) return;
    try {
      await flagReview({ reviewId: flagModal.reviewId, reason: flagReason }).unwrap();
      toast.success("Review reported successfully");
      setFlagModal(null);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to report review");
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8f8] py-8 px-4 sm:px-6 lg:px-8">
      {/* Clinic Premium Header Card */}
      <div className="max-w-5xl mx-auto bg-white rounded-3xl border border-border-light p-6 sm:p-10 shadow-sm relative overflow-hidden mb-8">
        <div className="absolute top-0 left-0 w-2 h-full bg-[#00b495]" />
        
        <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl font-black text-text-primary tracking-tight font-figtree">
              {clinic.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-text-secondary">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-[#00b495]" />
                <span>{clinic.address}</span>
              </div>
              {clinic.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-[#00b495]" />
                  <span>{clinic.phone}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-[#00b495]/10 text-[#00b495] px-3 py-1 rounded-full text-xs font-black">
                <Star className="h-3.5 w-3.5 fill-[#00b495] text-[#00b495]" />
                <span>{summary?.overall || clinic.clinicRating?.overall || "0.0"}</span>
              </div>
              <span className="text-xs font-bold text-text-secondary">
                ({summary?.totalReviews || clinic.clinicRating?.totalReviews || 0} reviews)
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Link href="/dashboard/patient/book-appointment">
              <Button className="bg-[#00b495] text-white hover:bg-[#009e82] font-black uppercase tracking-widest text-[10px] px-6 h-12 rounded-2xl shadow-lg shadow-[#00b495]/20">
                Book Appointment
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-t border-border-light mt-8 pt-6 gap-6">
          <button
            onClick={() => setActiveTab("reviews")}
            className={`text-xs font-black uppercase tracking-widest pb-3 border-b-2 transition-all ${
              activeTab === "reviews" ? "border-[#00b495] text-[#00b495]" : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            Reviews ({summary?.totalReviews || 0})
          </button>
          <button
            onClick={() => setActiveTab("about")}
            className={`text-xs font-black uppercase tracking-widest pb-3 border-b-2 transition-all ${
              activeTab === "about" ? "border-[#00b495] text-[#00b495]" : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            About Clinic
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        {activeTab === "about" ? (
          <div className="bg-white rounded-3xl border border-border-light p-6 sm:p-8 space-y-6">
            <h3 className="text-xl font-black text-text-primary">About Clinic</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Welcome to {clinic.name}. We provide premium healthcare services with a team of professional doctors.
            </p>
            {clinic.doctors && clinic.doctors.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-black text-text-primary uppercase tracking-wider">Affiliated Doctors</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {clinic.doctors.map((doc: any) => (
                    <div key={doc._id} className="p-4 bg-surface rounded-2xl border border-border-light flex gap-3 items-center">
                      <div className="h-12 w-12 rounded-full overflow-hidden bg-slate-100 border shrink-0">
                        {doc.userId?.photo ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={doc.userId.photo} alt={doc.fullName} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-bold text-sm">Dr</div>
                        )}
                      </div>
                      <div>
                        <h5 className="text-sm font-bold text-text-primary">Dr. {doc.fullName || doc.userId?.name}</h5>
                        <p className="text-[10px] font-bold text-text-secondary uppercase">{doc.specialization}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT COLUMN: Visual Summary (Radar & Stats) */}
            <div className="lg:col-span-1 space-y-6">
              {/* Score breakdown & Radar Chart */}
              <div className="bg-white rounded-3xl border border-border-light p-6 shadow-sm flex flex-col items-center">
                <h4 className="text-sm font-black text-text-primary uppercase tracking-widest mb-6 w-full text-left">
                  Clinic Performance
                </h4>

                {/* Radar SVG */}
                <div className="relative w-full max-w-[240px] flex justify-center mb-6">
                  <svg width="240" height="240" viewBox="0 0 240 240" className="overflow-visible">
                    {/* Background hexagons */}
                    {gridPoints.map((points, idx) => (
                      <polygon
                        key={idx}
                        points={points}
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="1"
                      />
                    ))}

                    {/* Radial lines from center */}
                    {radarCategories.map((_, i) => {
                      const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2;
                      const x = center + radius * Math.cos(angle);
                      const y = center + radius * Math.sin(angle);
                      return (
                        <line
                          key={i}
                          x1={center}
                          y1={center}
                          x2={x}
                          y2={y}
                          stroke="#e2e8f0"
                          strokeWidth="1"
                        />
                      );
                    })}

                    {/* Actual data polygon */}
                    {dataPoints && (
                      <polygon
                        points={dataPoints}
                        fill="rgba(0, 180, 149, 0.15)"
                        stroke="#00b495"
                        strokeWidth="2.5"
                        className="transition-all duration-500 ease-out"
                      />
                    )}

                    {/* Outer category labels */}
                    {labels.map((label, idx) => (
                      <text
                        key={idx}
                        x={label.x}
                        y={label.y}
                        textAnchor={label.anchor}
                        className="text-[9px] font-black fill-text-primary"
                        dy="3"
                      >
                        {label.label} ({label.value})
                      </text>
                    ))}
                  </svg>
                </div>

                {/* Overall Stats block */}
                <div className="w-full border-t border-border-light pt-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black text-text-secondary uppercase tracking-wider">Overall Rating</p>
                      <p className="text-2xl font-black text-text-primary">{summary?.overall || "0.0"} <span className="text-xs text-text-secondary">/ 5</span></p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 bg-[#00b495]/10 text-[#00b495] rounded-full text-xs font-black uppercase tracking-wider">
                        {summary?.verifiedVisitsPercent || 0}% Verified
                      </span>
                    </div>
                  </div>

                  {/* Distribution bars */}
                  <div className="space-y-2 pt-2">
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const count = summary?.distribution?.[stars] || 0;
                      const pct = summary?.totalReviews ? (count / summary.totalReviews) * 100 : 0;
                      return (
                        <div key={stars} className="flex items-center gap-3 text-xs">
                          <span className="w-4 font-bold text-text-secondary">{stars}★</span>
                          <div className="h-2 bg-slate-100 rounded-full flex-1 overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-6 text-right font-bold text-text-secondary">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Interactive Reviews List */}
            <div className="lg:col-span-2 space-y-6">
              {/* Filtering & Sorting Controls */}
              <div className="bg-white rounded-3xl border border-border-light p-4 shadow-sm flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-3">
                  {/* Rating filter */}
                  <div className="relative">
                    <select
                      value={ratingFilter}
                      onChange={(e) => {
                        setRatingFilter(e.target.value);
                        setPage(1);
                      }}
                      className="appearance-none bg-slate-50 border border-border-light rounded-xl px-4 py-2 pr-8 text-xs font-bold text-text-primary focus:outline-none focus:ring-1 focus:ring-[#00b495]"
                    >
                      <option value="">All Ratings</option>
                      <option value="5">5 Stars</option>
                      <option value="4">4 Stars</option>
                      <option value="3">3 Stars</option>
                      <option value="2">2 Stars</option>
                      <option value="1">1 Star</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 h-3 w-3 text-text-secondary pointer-events-none" />
                  </div>

                  {/* Language filter */}
                  <div className="relative">
                    <select
                      value={langFilter}
                      onChange={(e) => {
                        setLangFilter(e.target.value);
                        setPage(1);
                      }}
                      className="appearance-none bg-slate-50 border border-border-light rounded-xl px-4 py-2 pr-8 text-xs font-bold text-text-primary focus:outline-none focus:ring-1 focus:ring-[#00b495]"
                    >
                      <option value="">All Languages</option>
                      <option value="en">English Only</option>
                      <option value="ur">اردو Only</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 h-3 w-3 text-text-secondary pointer-events-none" />
                  </div>
                </div>

                {/* Sort */}
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(e) => {
                      setSort(e.target.value);
                      setPage(1);
                    }}
                    className="appearance-none bg-slate-50 border border-border-light rounded-xl px-4 py-2 pr-8 text-xs font-bold text-text-primary focus:outline-none focus:ring-1 focus:ring-[#00b495]"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="highest">Highest Rated</option>
                    <option value="lowest">Lowest Rated</option>
                    <option value="helpful">Most Helpful</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3 h-3 w-3 text-text-secondary pointer-events-none" />
                </div>
              </div>

              {/* Reviews List */}
              {isLoadingReviews ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-44 animate-pulse bg-white border border-border-light rounded-3xl" />
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                <div className="bg-white rounded-3xl border border-border-light p-10 text-center">
                  <MessageSquare className="h-12 w-12 text-text-primary opacity-25 mx-auto mb-4" />
                  <p className="text-sm font-bold text-text-secondary">No reviews match the selected filters.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev: any) => (
                    <div key={rev._id} className="bg-white rounded-3xl border border-border-light p-6 shadow-sm space-y-4">
                      {/* Review Card Header */}
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-slate-100 rounded-full overflow-hidden border flex items-center justify-center font-black text-[#00b495]">
                            {rev.patientAvatar ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={rev.patientAvatar} alt={rev.patientName} className="h-full w-full object-cover" />
                            ) : (
                              rev.patientName[0]
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-sm font-black text-text-primary">{rev.patientName}</h5>
                              {rev.patientCity && <span className="text-[10px] font-bold text-text-secondary">from {rev.patientCity}</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-3 w-3 ${star <= rev.overallRating ? "fill-primary text-primary" : "text-slate-200"}`}
                                  />
                                ))}
                              </div>
                              <span className="text-[9px] font-bold text-text-secondary">
                                {new Date(rev.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {rev.isVerifiedVisit && (
                            <span className="px-2 py-0.5 bg-[#00b495]/10 text-[#00b495] rounded-full text-[9px] font-black uppercase tracking-wider">
                              Verified Visit
                            </span>
                          )}
                          {rev.language === "ur" && (
                            <span className="p-1 bg-slate-100 rounded-lg text-slate-500">
                              <Languages className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title & Comment */}
                      <div className="space-y-1">
                        {rev.title && <h4 className="text-sm font-black text-text-primary">{rev.title}</h4>}
                        {rev.comment && (
                          <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line" dir={rev.language === "ur" ? "rtl" : "ltr"}>
                            {rev.comment}
                          </p>
                        )}
                      </div>

                      {/* Photo Grid */}
                      {rev.photos && rev.photos.length > 0 && (
                        <div className="flex gap-2">
                          {rev.photos.map((url: string, i: number) => (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              key={i}
                              src={url}
                              alt="Review attachment"
                              onClick={() => setSelectedPhoto(url)}
                              className="h-16 w-16 object-cover rounded-xl border border-border-light cursor-pointer hover:opacity-85 transition-opacity"
                            />
                          ))}
                        </div>
                      )}

                      {/* Clinic Response Banner */}
                      {rev.clinicResponse?.text && (
                        <div className="bg-[#f6f8f8] border border-border-light/60 rounded-2xl p-4 flex gap-3 relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-[#00b495]" />
                          <MessageSquare className="h-5 w-5 text-[#00b495] shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-text-primary uppercase tracking-widest">
                              Response from {clinic.name}
                            </p>
                            <p className="text-xs text-text-secondary leading-relaxed">
                              {rev.clinicResponse.text}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Helpful & Flag Footer Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-border-light/45">
                        <button
                          onClick={() => handleVote(rev._id, "helpful")}
                          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-text-secondary hover:text-[#00b495] transition-colors"
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                          <span>Helpful ({rev.helpfulVotes || 0})</span>
                        </button>

                        <button
                          onClick={() => setFlagModal({ isOpen: true, reviewId: rev._id })}
                          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-text-secondary hover:text-red-500 transition-colors"
                        >
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>Report</span>
                        </button>
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
                        Previous
                      </Button>
                      <span className="text-xs font-bold text-text-secondary self-center px-2">
                        Page {page} of {pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        disabled={page === pagination.totalPages}
                        onClick={() => setPage(page + 1)}
                        className="text-xs"
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Expanded Photo Overlay */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <button className="absolute right-4 top-4 text-white p-2">
            <X className="h-6 w-6" />
          </button>
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={selectedPhoto} alt="Zoomed view" className="max-w-full max-h-[90vh] object-contain rounded-2xl" />
        </div>
      )}

      {/* Flag Report Modal Overlay */}
      {flagModal?.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-border-light relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setFlagModal(null)} className="absolute right-4 top-4 p-2 text-text-secondary hover:text-text-primary">
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-black text-text-primary tracking-tight mb-2">Report Review</h3>
            <p className="text-xs text-text-secondary mb-4">Please select a reason for reporting this review to clinic moderation.</p>

            <div className="space-y-3">
              {[
                { value: "fake", label: "Fake Review (never visited / malicious)" },
                { value: "offensive", label: "Offensive or inappropriate content" },
                { value: "spam", label: "Spam or promotional material" },
                { value: "other", label: "Other / generic violation" }
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-3 p-3 rounded-xl border border-border-light hover:bg-slate-50 cursor-pointer text-xs font-bold text-text-primary">
                  <input
                    type="radio"
                    name="flagReason"
                    value={opt.value}
                    checked={flagReason === opt.value}
                    onChange={(e) => setFlagReason(e.target.value)}
                    className="h-4 w-4 text-[#00b495] focus:ring-[#00b495] border-gray-300"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-border-light">
              <Button variant="outline" onClick={() => setFlagModal(null)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleFlagSubmit} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest text-[10px]">
                Submit Report
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
