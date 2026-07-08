"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import {
    useGetDoctorProfileQuery,
    useUpdateDoctorProfileMutation,
    useLeaveClinicMutation
} from "@/store/api/doctorApi";
import { useUpdateProfileMutation } from "@/store/api/authApi";
import {
    Building2,
    LogOut,
    AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { Modal } from "@/components/ui/Modal";
import {
    UserIcon,
    MapPinIcon,
    CameraIcon,
    TrashIcon,
    GearIcon,
    ClockIcon,
    ShieldCheckIcon,
    EyeIcon,
    PenIcon,
    LayersIcon,
    UserCheckIcon,
    UserPlusIcon,
    CheckedIcon
} from "@/icons";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { toast } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { setCredentials } from "@/store/slices/authSlice";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslations } from "next-intl";
import PageHeader from "@/components/shared/PageHeader";
import { resolveMediaUrl } from "@/lib/media";

const profileSchema = z.object({
    name: z.string().min(3, "Full name is required (min 3 chars)"),
    phone: z.string().min(10, "Valid contact number is required"),
    specialization: z.string().min(3, "Please select your specialization"),
    bio: z.string().min(20, "Please provide a bio (at least 20 characters)"),
    experience: z.coerce.number().min(1, "Experience is required"),
    consultationFee: z.coerce.number().min(100, "Consultation fee is required (min 100)"),
    education: z.array(z.object({
        degree: z.string().min(2, "Degree is required"),
        institution: z.string().min(2, "Institution is required"),
        year: z.coerce.number().min(1950, "Valid year is required")
    })).min(1, "At least one education record is required"),
    location: z.object({
        address: z.string().min(5, "Clinic address is required"),
        city: z.string().min(2, "Please select a city"),
    })
});

const PAKISTANI_MEDICAL_INSTITUTIONS = [
    "King Edward Medical University, Lahore",
    "Aga Khan University, Karachi",
    "Dow University of Health Sciences, Karachi",
    "Fatima Jinnah Medical University, Lahore",
    "Liaquat University of Medical & Health Sciences, Jamshoro",
    "Khyber Medical University, Peshawar",
    "Rawalpindi Medical University",
    "Nishtar Medical University, Multan",
    "Faisalabad Medical University",
    "Jinnah Sindh Medical University, Karachi",
    "Baqai Medical University, Karachi",
    "Hamdard University, Karachi",
    "Shifa Tameer-e-Millat University, Islamabad",
    "Foundation University, Islamabad",
    "Army Medical College, Rawalpindi",
    "Allama Iqbal Medical College, Lahore",
    "Services Institute of Medical Sciences, Lahore",
    "Quetta Institute of Medical Sciences",
    "Gandhara University, Peshawar",
    "Ziauddin University, Karachi",
    "Other/International"
];

const PAKISTANI_CITIES = [
    "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad",
    "Multan", "Peshawar", "Quetta", "Gujranwala", "Sialkot",
    "Bahawalpur", "Sargodha", "Sukkur", "Larkana", "Sheikhupura",
    "Rahim Yar Khan", "Jhang", "Dera Ghazi Khan", "Gujrat",
    "Sahiwal", "Wah Cantonment", "Mardan", "Kasur", "Okara", "Mingora"
].sort();

const MEDICAL_SPECIALTIES = [
    "General Physician", "Cardiologist", "Dermatologist", "Pediatrician",
    "Orthopedic Surgeon", "Gynecologist", "Neurologist", "Ophthalmologist",
    "ENT Specialist", "Psychiatrist", "Radiologist", "Urologist",
    "Dentist", "Nutritionist", "Homeopath", "Physiotherapist"
].sort();



export default function DoctorProfilePage() {
    const t = useTranslations();
    const { data: profileData, isLoading: isFetching } = useGetDoctorProfileQuery(undefined);
    const [updateDoctorProfile, { isLoading: isUpdating }] = useUpdateDoctorProfileMutation();
    const [updateUserAuth] = useUpdateProfileMutation();
    const userAuth = useSelector((state: any) => state.auth.user);
    const dispatch = useDispatch();

    const [profileImage, setProfileImage] = useState<string>("");
    const [imageFile, setImageFile] = useState<File | null>(null);

    const [leaveClinic, { isLoading: isLeavingClinic }] = useLeaveClinicMutation();
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
    const [leaveConfirmName, setLeaveConfirmName] = useState("");

    const { register, control, handleSubmit, reset, setValue, formState: { errors } } = useForm<any>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: "",
            phone: "",
            bio: "",
            experience: 0,
            consultationFee: 0,
            specialization: "",
            education: [{ degree: "", institution: "", year: new Date().getFullYear() }],
            location: {
                address: "",
                city: "",
            }
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "education"
    });

    useEffect(() => {
        if (profileData?.data) {
            const doc = profileData.data;
            const userData = doc.userId;

            reset({
                name: userData?.name || "",
                phone: userData?.phone || "",
                bio: doc.bio || "",
                experience: doc.experience || 0,
                consultationFee: doc.consultationFee || 0,
                specialization: doc.specialization || "",
                education: doc.education?.length > 0 ? doc.education : [{ degree: "", institution: "", year: new Date().getFullYear() }],
                location: {
                    address: doc.location?.address || "",
                    city: doc.location?.city || "",
                }
            });

            if (userData?.photo) {
                setProfileImage(userData.photo.startsWith('http') || userData.photo.startsWith('data:') ? userData.photo : `${process.env.NEXT_PUBLIC_API_URL}${userData.photo}`);
            }
        }
    }, [profileData, reset]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Image size must be less than 5MB");
                return;
            }
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setProfileImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const onInvalid = (errors: any) => {
        const firstError = Object.values(errors)[0] as any;
        if (firstError.message) {
            toast.error(firstError.message);
        } else if (typeof firstError === 'object') {
            // Handle nested errors like location or education
            const nestedError = Object.values(firstError)[0] as any;
            toast.error(nestedError.message || "Please fill all required fields");
        }
    };

    const onSubmit = async (formData: any) => {
        try {
            // 1. Update User Auth Info (Name, Phone & Photo) — send JSON, not FormData
            let photoPayload: string | undefined = undefined;
            if (imageFile) {
                // Convert file to base64 data URL so it can travel in JSON
                photoPayload = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(imageFile);
                });
            }

            const authResult = await updateUserAuth({
                name: formData.name,
                phone: formData.phone,
                ...(photoPayload ? { photo: photoPayload } : {}),
            }).unwrap();

            // 2. Update Doctor Clinical Info
            await updateDoctorProfile({
                bio: formData.bio,
                experience: parseInt(formData.experience),
                education: formData.education,
                languages: formData.languages,
                consultationFee: parseInt(formData.consultationFee),
                specialization: formData.specialization,
                name: formData.name,
                phone: formData.phone,
                location: formData.location,
            }).unwrap();

            // 3. Update local state
            const accessToken = localStorage.getItem("accessToken");
            dispatch(setCredentials({
                user: { ...authResult.data, ...formData },
                accessToken: accessToken || ""
            }));
            localStorage.setItem("user", JSON.stringify({ ...authResult.data, ...formData }));

            toast.success("Profile updated successfully");
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to update profile");
        }
    };

    if (isFetching) return (
        <div className="flex items-center justify-center min-h-100">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <PageHeader
                title="Your profile"
                description={t('doctor.profile.subtitle')}
                action={
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-3 sm:gap-4 bg-slate-50 dark:bg-slate-900/50 p-2 sm:p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="text-center px-3 sm:px-4 border-r border-slate-200 dark:border-slate-700">
                                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500">{t('clinic.period.month')}</p>
                                <p className="text-base sm:text-lg font-black text-primary">{(profileData?.data as any)?.stats?.monthlyCompleted || 0}</p>
                            </div>
                            <div className="text-center px-3 sm:px-4 border-r border-slate-200 dark:border-slate-700">
                                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500">{t('clinic.period.week')}</p>
                                <p className="text-base sm:text-lg font-black text-primary">{(profileData?.data as any)?.stats?.weeklyCompleted || 0}</p>
                            </div>
                            <div className="text-center px-3 sm:px-4">
                                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500">{t('clinic.period.all')}</p>
                                <p className="text-base sm:text-lg font-black text-primary">{(profileData?.data as any)?.stats?.totalCompleted || 0}</p>
                            </div>
                        </div>
                        {profileData?.data?.isVerified && (
                            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full border border-primary/20">
                                <ShieldCheckIcon size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">{t('doctor.profile.verified')}</span>
                            </div>
                        )}
                    </div>
                }
            />

            <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-8">
                {/* Visual Identity Section */}
                <Card className="p-8">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="relative group">
                            <div className="h-32 w-32 rounded-3xl overflow-hidden border-4 border-slate-100 dark:border-slate-800 shadow-xl transition-all group-hover:scale-105">
                                {profileImage ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800">
                                        <UserIcon size={56} className="text-gray-300 dark:text-gray-600" />
                                    </div>
                                )}
                            </div>
                            <label htmlFor="photo-upload" className="absolute -bottom-2 -right-2 h-10 w-10 bg-primary text-white rounded-xl flex items-center justify-center cursor-pointer shadow-lg hover:bg-primary-hover transition-colors">
                                <CameraIcon size={20} />
                                <input id="photo-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                            </label>
                        </div>

                        <div className="flex-1 space-y-4 w-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label={t('doctor.profile.fullName')} placeholder="e.g. Dr. Jane Doe" {...register("name")} error={errors.name?.message as string} />
                                <Input label={t('doctor.profile.phone')} placeholder="+92 300 1234567" {...register("phone")} error={errors.phone?.message as string} />
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Professional Overview */}
                <Card className="p-8 space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                <LayersIcon size={20} className="text-primary" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('doctor.profile.expertise')}</h2>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col space-y-1">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">{t('doctor.profile.specialization')}</label>
                                <select
                                    {...register("specialization")}
                                    className={`lens-input h-11 ${errors.specialization ? 'border-red-500 focus:border-red-500' : ''}`}
                                >
                                    <option value="">{t('common.select')}...</option>
                                    {MEDICAL_SPECIALTIES.map(spec => (
                                        <option key={spec} value={spec}>{spec}</option>
                                    ))}
                                </select>
                                {errors.specialization && <span className="text-xs text-red-500">{errors.specialization.message as string}</span>}
                            </div>
                            <Input
                                label={t('doctor.profile.experience')}
                                type="number"
                                placeholder="10"
                                {...register("experience")}
                                error={errors.experience?.message as string}
                            />
                            <Input
                                label={t('doctor.profile.consultationFee')}
                                type="number"
                                placeholder="2000"
                                {...register("consultationFee")}
                                error={errors.consultationFee?.message as string}
                            />
                        </div>

                        <div>
                            <label className="lens-label">{t('doctor.profile.bio')}</label>
                            <textarea
                                rows={4}
                                className={`lens-input h-auto py-3 resize-none ${errors.bio ? 'border-red-500 focus:border-red-500' : ''}`}
                                placeholder="Share your professional journey, specialties, and approach to patient care..."
                                {...register("bio")}
                            ></textarea>
                            {errors.bio && <span className="text-xs text-red-500 mt-1 block">{errors.bio.message as string}</span>}
                        </div>
                    </div>
                </Card>

                {/* Education Section */}
                <Card className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                <UserCheckIcon size={20} className="text-primary" />
                            </div>
                            <h2 className="text-xl font-black text-text-primary tracking-tighter">{t('doctor.profile.education')}</h2>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ degree: "", institution: "", year: new Date().getFullYear() })}
                            className="rounded-xl px-6 font-black uppercase tracking-widest text-[10px] border-primary/20 text-primary hover:bg-primary/5 transition-all"
                        >
                            <UserPlusIcon size={16} className="mr-1" /> {t('common.add')}
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex flex-col md:flex-row gap-4 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-black/5 dark:border-white/5 group relative items-end">
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Input
                                        label={t('doctor.profile.educationDegree') || "Degree"}
                                        placeholder="e.g. MBBS"
                                        {...register(`education.${index}.degree` as const)}
                                        className="h-12" error={(errors.education as any)?.[index]?.degree?.message as string}
                                    />
                                    <div className="flex flex-col space-y-1 w-full">
                                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                                            {t('doctor.profile.educationInstitution') || "Institution"}
                                        </label>
                                        <select
                                            {...register(`education.${index}.institution` as const)}
                                            className={`flex h-12 w-full rounded-2xl border bg-white dark:bg-slate-900/50 px-5 py-2 text-base text-slate-900 dark:text-slate-100 transition-all font-medium focus-visible:outline-none ${(errors.education as any)?.[index]?.institution ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/10' : 'border-slate-200 dark:border-slate-700/60 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10'}`}
                                        >
                                            <option value="">{t('common.select')}...</option>
                                            {PAKISTANI_MEDICAL_INSTITUTIONS.map(inst => (
                                                <option key={inst} value={inst}>{inst}</option>
                                            ))}
                                        </select>
                                        {(errors.education as any)?.[index]?.institution && <span className="text-xs text-red-500 mt-1 block">{(errors.education as any)?.[index]?.institution?.message as string}</span>}
                                    </div>
                                    <Input
                                        label={t('doctor.profile.graduationYear') || "Graduation Year"}
                                        type="number"
                                        placeholder="Year"
                                        {...register(`education.${index}.year` as const)}
                                        className="h-12" error={(errors.education as any)?.[index]?.year?.message as string}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors mb-0.5"
                                >
                                    <TrashIcon size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Clinic Affiliation Section */}
                <Card className="p-8 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Building2 size={20} className="text-primary" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Clinic Affiliation</h2>
                    </div>

                    {(profileData?.data as any)?.clinicId ? (
                        <div className="border border-[#e5e7eb] rounded-[14px] p-6 relative">
                            <div className="text-[13px] uppercase text-[#00b495] tracking-wider font-bold mb-4">
                                Current Clinic
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center border border-border-light overflow-hidden shrink-0">
                                    {(profileData?.data as any)?.clinicId?.photo ? (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img
                                            src={resolveMediaUrl((profileData?.data as any)?.clinicId.photo)}
                                            alt={(profileData?.data as any)?.clinicId?.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Building2 className="h-6 w-6 text-text-secondary" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-text-primary">
                                        {(profileData?.data as any)?.clinicId?.name}
                                    </h3>
                                    <p className="text-[13px] text-text-secondary">
                                        {(profileData?.data as any)?.clinicId?.city}
                                    </p>
                                    <p className="text-xs text-text-muted mt-1">
                                        Member since {(profileData?.data as any)?.statusUpdatedAt ? format(new Date((profileData?.data as any).statusUpdatedAt), 'MMM d, yyyy') : 'Recently'}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsLeaveModalOpen(true)}
                                className="absolute bottom-6 rtl:left-6 ltr:right-6 border-[1.5px] border-[#fca5a5] text-[#ef4444] rounded-[10px] px-4 py-2 flex items-center gap-2 hover:bg-[#ef44440f] transition-colors font-medium text-[13px]"
                            >
                                <LogOut size={14} className="rtl:rotate-180" />
                                {t('leaveClinic.button') || 'Leave Clinic'}
                            </button>
                        </div>
                    ) : (
                        <div className="p-6 border border-border-light rounded-[14px] bg-slate-50/50 flex flex-col items-center justify-center text-center space-y-2">
                            <Building2 className="h-8 w-8 text-text-muted mb-2" />
                            <p className="text-sm font-bold text-text-primary">No clinic affiliation.</p>
                            <p className="text-xs text-text-secondary">Join a clinic by accepting a connection request.</p>
                        </div>
                    )}
                </Card>

                {/* Clinic Location Section */}
                <Card className="p-8 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                            <MapPinIcon size={20} className="text-primary" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('doctor.profile.clinicInfo')}</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="lens-label">{t('form.city')}</label>
                            <select
                                {...register("location.city")}
                                onChange={(e) => {
                                    const city = e.target.value;
                                    setValue("location.city", city);
                                }}
                                className={`lens-input h-11 ${(errors.location as any)?.city ? 'border-red-500' : ''}`}
                            >
                                <option value="">{t('common.select')}...</option>
                                {PAKISTANI_CITIES.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                            {(errors.location as any)?.city && <span className="text-xs text-red-500 mt-1 block">{(errors.location as any)?.city?.message as string}</span>}
                        </div>
                        <Input
                            label={t('form.address')}
                            placeholder="e.g. Suite 402, Medical Center, Block 4"
                            {...register("location.address")}
                            error={(errors.location as any)?.address?.message as string}
                        />
                    </div>
                </Card >

                {/* Availability Section */}
                < Card className="p-8 space-y-6" >
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                            <ClockIcon size={20} className="text-primary" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('doctor.dashboard.viewSchedule')}</h2>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                        {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => {
                            const dayFullNames: Record<string, string> = {
                                mon: 'monday', tue: 'tuesday', wed: 'wednesday',
                                thu: 'thursday', fri: 'friday', sat: 'saturday', sun: 'sunday'
                            };
                            const schedule = (profileData?.data as any)?.schedule;
                            const daySlots = schedule ? schedule[dayFullNames[day]] : null;
                            const isAvailable = Array.isArray(daySlots) && daySlots.length > 0;

                            return (
                                <div key={day} className={`p-3 rounded-2xl border text-center transition-all ${isAvailable ? 'bg-primary/5 border-primary/20' : 'bg-slate-50 dark:bg-slate-900/40 border-black/5 dark:border-white/5 opacity-50'}`}>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">{day}</p>
                                    <p className={`text-[10px] font-black mt-1 ${isAvailable ? 'text-primary' : 'text-gray-400'}`}>
                                        {isAvailable ? `${daySlots.length} Slots` : 'Off'}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex justify-start">
                        <Link href="/dashboard/doctor/schedule" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                            <UserPlusIcon size={12} />
                            {t('doctor.manageAvailability')}
                        </Link>
                    </div>
                </Card >


                {/* Submit Actions */}
                < div className="flex items-center justify-end gap-4" >
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => reset()}
                        disabled={isUpdating}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        type="submit"
                        className="lens-btn-primary min-w-50"
                        disabled={isUpdating}
                    >
                        <CheckedIcon size={18} className="mr-2" />
                        {isUpdating ? t('common.loading') : t('doctor.profile.saveProfile')}
                    </Button>
                </div >
            </form >

            <Modal
                isOpen={isLeaveModalOpen}
                onClose={() => {
                    setIsLeaveModalOpen(false);
                    setLeaveConfirmName("");
                }}
                title=""
            >
                <div className="flex flex-col space-y-4">
                    <div className="flex justify-center">
                        <AlertTriangle className="h-8 w-8 text-[#f59e0b]" />
                    </div>
                    <h2 className="text-xl font-bold text-center text-[#0a1628] dark:text-white">
                        {t('leaveClinic.title', { clinicName: (profileData?.data as any)?.clinicId?.name }) || `Leave ${(profileData?.data as any)?.clinicId?.name}?`}
                    </h2>
                    <div className="space-y-2 text-sm text-[#374151] dark:text-slate-300">
                        <ul className="list-disc pl-5 space-y-1">
                            <li>{t('leaveClinic.consequence1') || 'Your schedule will be completely reset'}</li>
                            <li>{t('leaveClinic.consequence2') || 'All your upcoming appointments at this clinic will be cancelled'}</li>
                            <li>{t('leaveClinic.consequence3') || 'Patients will be notified automatically'}</li>
                        </ul>
                    </div>
                    <div className="bg-[#fef9c3] border border-[#fde047] rounded-[10px] p-3 text-[13px] text-[#854d0e]">
                        {t('leaveClinic.warning') || "This cannot be undone. You'll need a new invitation to rejoin."}
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-text-primary">
                            {t('leaveClinic.typeToConfirm') || 'Type your name to confirm:'}
                        </label>
                        <Input
                            value={leaveConfirmName}
                            onChange={(e) => setLeaveConfirmName(e.target.value)}
                            placeholder={userAuth?.name}
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                                setIsLeaveModalOpen(false);
                                setLeaveConfirmName("");
                            }}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            className={`flex-1 ${leaveConfirmName.toLowerCase() === userAuth?.name?.toLowerCase() ? 'bg-red-500 hover:bg-red-600 border-red-500' : 'opacity-50 cursor-not-allowed'}`}
                            disabled={leaveConfirmName.toLowerCase() !== userAuth?.name?.toLowerCase() || isLeavingClinic}
                            onClick={async () => {
                                try {
                                    await leaveClinic(undefined).unwrap();
                                    toast.success(`You've left ${(profileData?.data as any)?.clinicId?.name}. Your schedule has been reset.`);
                                    setIsLeaveModalOpen(false);
                                    setLeaveConfirmName("");
                                } catch (error: any) {
                                    toast.error(error?.data?.message || "Failed to leave clinic");
                                }
                            }}
                        >
                            {isLeavingClinic ? t('leaveClinic.leaving') || "Leaving..." : t('leaveClinic.button') || "Leave Clinic"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div >
    );
}
