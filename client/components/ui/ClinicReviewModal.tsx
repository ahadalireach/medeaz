"use client";

import { useState, useEffect } from "react";
import { Star, X, ArrowLeft, ArrowRight, Camera, Trash2, CheckCircle2, Globe } from "lucide-react";
import { Button } from "./Button";
import { toast } from "react-hot-toast";
import { useTranslations, useLocale } from "next-intl";
import {
  useSubmitClinicReviewMutation,
  useUpdateClinicReviewMutation,
  useDeleteClinicReviewMutation,
  useGetMyClinicReviewQuery
} from "@/store/api/patientApi";

interface ClinicReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  clinicId: string;
  clinicName: string;
  reviewId?: string; // If review already exists, can pass it to open in read-only / manage view
}

export function ClinicReviewModal({ isOpen, onClose, appointmentId, clinicId, clinicName, reviewId }: ClinicReviewModalProps) {
  const t = useTranslations();
  const locale = useLocale();
  const isRtl = locale === "ur";
  const [step, setStep] = useState(1);

  // Form states
  const [overallRating, setOverallRating] = useState(5);
  const [categories, setCategories] = useState({
    cleanliness: 5,
    waitTime: 5,
    frontDesk: 5,
    facility: 5,
    accessibility: 5,
    valueForMoney: 5
  });
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [language, setLanguage] = useState<"en" | "ur">("en");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);

  // API hooks
  const [submitClinicReview, { isLoading: isSubmitting }] = useSubmitClinicReviewMutation();
  const [updateClinicReview, { isLoading: isUpdating }] = useUpdateClinicReviewMutation();
  const [deleteClinicReview, { isLoading: isDeleting }] = useDeleteClinicReviewMutation();

  // Fetch own review if reviewId is present
  const { data: myReviewData, isLoading: isLoadingReview } = useGetMyClinicReviewQuery(clinicId, {
    skip: !reviewId && !clinicId
  });

  const existingReview = myReviewData?.data;

  // Load existing review data if editing/viewing
  useEffect(() => {
    if (existingReview) {
      setOverallRating(existingReview.overallRating || 5);
      setCategories({
        cleanliness: existingReview.categoryRatings?.cleanliness || 5,
        waitTime: existingReview.categoryRatings?.waitTime || 5,
        frontDesk: existingReview.categoryRatings?.frontDesk || 5,
        facility: existingReview.categoryRatings?.facility || 5,
        accessibility: existingReview.categoryRatings?.accessibility || 5,
        valueForMoney: existingReview.categoryRatings?.valueForMoney || 5
      });
      setTitle(existingReview.title || "");
      setComment(existingReview.comment || "");
      setLanguage(existingReview.language || "en");
      setPhotos(existingReview.photos || []);
    }
  }, [existingReview]);

  if (!isOpen) return null;

  const handleAddPhoto = () => {
    if (!photoUrl) return;
    if (photos.length >= 3) {
      toast.error(t('reviews.maxPhotosError', { defaultValue: 'Maximum 3 photos allowed' }));
      return;
    }
    setPhotos([...photos, photoUrl]);
    setPhotoUrl("");
  };

  const handleRemovePhoto = (idx: number) => {
    setPhotos(photos.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        clinicId,
        appointmentId,
        overallRating,
        categoryRatings: categories,
        title,
        comment,
        language,
        photos
      };

      if (reviewId || existingReview?._id) {
        const id = reviewId || existingReview._id;
        await updateClinicReview({ id, ...payload }).unwrap();
        toast.success(t('reviews.submitSuccess'));
      } else {
        await submitClinicReview(payload).unwrap();
        toast.success(t('reviews.submitSuccess'));
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to submit review");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t('reviews.confirmDelete', { defaultValue: "Are you sure you want to delete this review?" }))) return;
    try {
      const id = reviewId || existingReview?._id;
      if (id) {
        await deleteClinicReview({ id, clinicId }).unwrap();
        toast.success("Review deleted successfully");
        onClose();
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete review");
    }
  };

  const categoryKeys = Object.keys(categories) as Array<keyof typeof categories>;

  // Read-only View Mode if reviewId is present and we're not explicitly editing
  if (reviewId && step === 1) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div dir={isRtl ? "rtl" : "ltr"} className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg border border-border-light relative">
          <button onClick={onClose} className={`absolute ${isRtl ? "left-4" : "right-4"} top-4 p-2 text-text-secondary hover:text-text-primary`}>
            <X className="h-5 w-5" />
          </button>

          <h3 className="text-2xl font-black text-[#00b495] tracking-tight mb-2">
            {t('reviews.yourReview', { defaultValue: 'Your Clinic Review' })}
          </h3>
          <p className="text-sm text-text-secondary mb-6">{clinicName}</p>

          {isLoadingReview ? (
            <div className="py-10 text-center text-sm font-bold text-text-secondary">{isRtl ? "لوڈنگ..." : "Loading..."}</div>
          ) : existingReview ? (
            <div className="space-y-6">
              {/* Overall Rating Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-border-light flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">{t('reviews.overall')}</p>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`h-6 w-6 ${star <= overallRating ? "fill-primary text-primary" : "text-slate-300"}`} />
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-[#00b495]/10 text-[#00b495] rounded-full text-xs font-black uppercase tracking-wider">
                    {t('reviews.verifiedVisit')}
                  </span>
                </div>
              </div>

              {/* Title & Comment */}
              <div className="space-y-2">
                {existingReview.title && <h4 className="text-base font-extrabold text-text-primary">{existingReview.title}</h4>}
                {existingReview.comment && <p className="text-sm text-text-secondary bg-surface p-4 rounded-xl leading-relaxed border border-border-light/50">{existingReview.comment}</p>}
              </div>

              {/* Category Breakdown (Radar style or progress bars) */}
              <div className="grid grid-cols-2 gap-4">
                {categoryKeys.map((cat) => (
                  <div key={cat} className="p-3 bg-surface rounded-xl border border-border-light/50">
                    <p className="text-xs font-bold text-text-secondary capitalize">{t(`reviews.categories.${cat}`, { defaultValue: cat })}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-1.5 bg-slate-100 rounded-full flex-1 overflow-hidden">
                        <div className="h-full bg-[#00b495] rounded-full" style={{ width: `${(categories[cat] / 5) * 100}%` }} />
                      </div>
                      <span className="text-xs font-black text-text-primary">{categories[cat]}/5</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Photos */}
              {photos.length > 0 && (
                <div className="flex gap-3">
                  {photos.map((p, i) => (
                    <img key={i} src={p} alt="Review" className="h-20 w-20 object-cover rounded-xl border border-border-light" />
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-8">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  {t('common.close')}
                </Button>
                {new Date().getTime() - new Date(existingReview.createdAt).getTime() < 48 * 60 * 60 * 1000 ? (
                  <Button onClick={() => setStep(2)} className="flex-1 bg-primary text-white">
                    {t('common.edit')}
                  </Button>
                ) : (
                  <p className="text-xs font-bold text-red-500 text-center w-full mt-2">
                    {t('reviews.editWindow')}
                  </p>
                )}
                {new Date().getTime() - new Date(existingReview.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000 && (
                  <Button onClick={handleDelete} disabled={isDeleting} className="bg-red-500 hover:bg-red-600 text-white">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-sm font-bold text-red-500">{isRtl ? "جائزہ نہیں ملا یا حذف کر دیا گیا ہے۔" : "Review not found or has been deleted."}</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div dir={isRtl ? "rtl" : "ltr"} className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-lg border border-border-light relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className={`absolute ${isRtl ? "left-4" : "right-4"} top-4 p-2 text-text-secondary hover:text-text-primary`}>
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">
            {t('reviews.step', { step, total: 4 })}
          </span>
          <h3 className="text-2xl font-black text-text-primary tracking-tight mt-2">
            {t('reviews.writeReview')}
          </h3>
          <p className="text-sm text-text-secondary mt-1">
            {t('reviews.yourExperience', { clinic: clinicName })}
          </p>
        </div>

        {/* STEP 1: Categories */}
        {step === 1 && (
          <div className="space-y-5 animate-in slide-in-from-right duration-250">
            {categoryKeys.map((cat) => (
              <div key={cat} className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-text-primary capitalize">
                    {t(`reviews.categories.${cat}`, { defaultValue: cat })}
                  </label>
                  <span className="text-xs font-black text-primary">{categories[cat]} / 5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={categories[cat]}
                  onChange={(e) => setCategories({ ...categories, [cat]: parseInt(e.target.value, 10) })}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#00b495]"
                />
              </div>
            ))}

            <div className="flex justify-end gap-3 pt-6 border-t border-border-light">
              <Button onClick={() => setStep(2)} className="w-full sm:w-auto font-black uppercase tracking-widest text-[10px]">
                {t('common.next')} <ArrowRight className={`ml-2 h-4 w-4 ${isRtl ? "scale-x-[-1]" : ""}`} />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Overall, Title, Comment */}
        {step === 2 && (
          <div className="space-y-5 animate-in slide-in-from-right duration-250">
            {/* Overall Stars */}
            <div className="space-y-2 text-center py-2 bg-slate-50 rounded-2xl border border-border-light/80">
              <label className="text-sm font-extrabold text-text-primary block">
                {t('reviews.overall')}
              </label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setOverallRating(star)} className="p-1 transition-all hover:scale-110">
                    <Star className={`h-8 w-8 ${star <= overallRating ? "fill-primary text-primary" : "text-slate-300"}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-text-primary uppercase tracking-wider">{t('form.title', { defaultValue: 'Title' })}</label>
              <input
                type="text"
                placeholder={t('reviews.titlePlaceholder', { defaultValue: 'Summarize your experience...' })}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                className="w-full rounded-2xl border-border-light bg-background p-3 text-sm focus:ring-primary focus:border-primary font-bold"
              />
            </div>

            {/* Comment */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black text-text-primary uppercase tracking-wider">{t('form.comment', { defaultValue: 'Comment' })}</label>
                <span className="text-[10px] font-bold text-text-secondary">{comment.length} / 1000</span>
              </div>
              <textarea
                placeholder={t('reviews.commentPlaceholder', { defaultValue: 'Share details of your experience...' })}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={1000}
                className="w-full rounded-2xl border-border-light bg-background p-3 text-sm focus:ring-primary focus:border-primary min-h-[120px] font-bold"
              />
            </div>

            <div className="flex justify-between gap-3 pt-6 border-t border-border-light">
              <Button variant="outline" onClick={() => setStep(1)} className="font-black uppercase tracking-widest text-[10px]">
                <ArrowLeft className={`mr-2 h-4 w-4 ${isRtl ? "scale-x-[-1]" : ""}`} /> {t('common.back')}
              </Button>
              <Button onClick={() => setStep(3)} className="font-black uppercase tracking-widest text-[10px]">
                {t('common.next')} <ArrowRight className={`ml-2 h-4 w-4 ${isRtl ? "scale-x-[-1]" : ""}`} />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Language and Photos */}
        {step === 3 && (
          <div className="space-y-5 animate-in slide-in-from-right duration-250">
            {/* Language Selection */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-border-light flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                <span className="text-sm font-bold text-text-primary">{t('reviews.reviewLanguage', { defaultValue: 'Review Language' })}</span>
              </div>
              <div className="flex gap-1 p-0.5 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={`px-3 py-1 text-xs font-black rounded-lg transition-all ${language === "en" ? "bg-white text-primary shadow-sm" : "text-text-secondary"}`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("ur")}
                  className={`px-3 py-1 text-xs font-black rounded-lg transition-all ${language === "ur" ? "bg-white text-primary shadow-sm" : "text-text-secondary"}`}
                >
                  اردو
                </button>
              </div>
            </div>

            {/* Photos Uploader */}
            <div className="space-y-3">
              <label className="text-xs font-black text-text-primary uppercase tracking-wider">{t('reviews.addPhotos', { defaultValue: 'Add Photos (Max 3)' })}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={t('reviews.pasteUrl', { defaultValue: 'Paste Image URL...' })}
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="flex-1 rounded-2xl border-border-light bg-background p-3 text-sm focus:ring-primary focus:border-primary font-bold"
                />
                <Button onClick={handleAddPhoto} variant="outline" className="rounded-2xl h-auto">
                  {t('reviews.add', { defaultValue: 'Add' })}
                </Button>
              </div>

              {/* Photos List Preview */}
              {photos.length > 0 && (
                <div className="flex gap-3 pt-2">
                  {photos.map((p, idx) => (
                    <div key={idx} className="relative h-16 w-16 group rounded-xl overflow-hidden border border-border-light">
                      <img src={p} alt="Review upload" className="h-full w-full object-cover" />
                      <button
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between gap-3 pt-6 border-t border-border-light">
              <Button variant="outline" onClick={() => setStep(2)} className="font-black uppercase tracking-widest text-[10px]">
                <ArrowLeft className={`mr-2 h-4 w-4 ${isRtl ? "scale-x-[-1]" : ""}`} /> {t('common.back')}
              </Button>
              <Button onClick={() => setStep(4)} className="font-black uppercase tracking-widest text-[10px]">
                {t('reviews.preview', { defaultValue: 'Preview' })} <ArrowRight className={`ml-2 h-4 w-4 ${isRtl ? "scale-x-[-1]" : ""}`} />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: Live Preview */}
        {step === 4 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-250">
            <div className="p-5 rounded-3xl border border-border-light bg-slate-50/50 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center font-black text-primary text-xs">
                    P
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-text-primary">{t('reviews.patientPreview', { defaultValue: 'Patient Preview' })}</h5>
                    <p className="text-[9px] font-bold text-text-secondary">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
                <span className="text-[9px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {t('reviews.verifiedVisit', { defaultValue: 'Verified Visit' })}
                </span>
              </div>

              {/* Stars */}
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className={`h-4 w-4 ${star <= overallRating ? "fill-primary text-primary" : "text-slate-200"}`} />
                ))}
              </div>

              {title && <h4 className="text-sm font-black text-text-primary mb-1">{title}</h4>}
              {comment && <p className="text-xs text-text-secondary leading-relaxed mb-4">{comment}</p>}

              {/* Photos */}
              {photos.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {photos.map((p, i) => (
                    <img key={i} src={p} alt="Preview" className="h-12 w-12 object-cover rounded-lg border border-border-light" />
                  ))}
                </div>
              )}

              {/* Categories */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-3 border-t border-border-light/60">
                {categoryKeys.map((cat) => (
                  <div key={cat} className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-text-secondary capitalize">{cat}</span>
                    <span className="text-[10px] font-black text-text-primary">{categories[cat]}/5</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between gap-3 pt-6 border-t border-border-light">
              <Button variant="outline" onClick={() => setStep(3)} className="font-black uppercase tracking-widest text-[10px]">
                <ArrowLeft className={`mr-2 h-4 w-4 ${isRtl ? "scale-x-[-1]" : ""}`} /> {t('common.back')}
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting || isUpdating} className="flex-1 font-black uppercase tracking-widest text-[10px] bg-primary text-white">
                {isSubmitting || isUpdating ? t('reviews.submitting', { defaultValue: "Submitting..." }) : t('reviews.submitReview', { defaultValue: "Submit Review" })}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
