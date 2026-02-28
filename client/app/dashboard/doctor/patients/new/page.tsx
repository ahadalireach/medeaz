"use client";

import { useState } from "react";
import { useCreatePatientMutation } from "@/store/api/doctorApi";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Mail, Phone, Calendar, Droplet, MapPin } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function NewPatientPage() {
  const router = useRouter();
  const [createPatient, { isLoading }] = useCreatePatientMutation();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    bloodGroup: "",
    address: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Name
    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Name must be at least 3 characters";
    }

    // Email
    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone — REQUIRED
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[\d\s\+\-\(\)]{7,15}$/.test(formData.phone.trim())) {
      newErrors.phone = "Please enter a valid phone number";
    }

    // Date of Birth — REQUIRED
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
    } else if (new Date(formData.dateOfBirth) >= new Date()) {
      newErrors.dateOfBirth = "Date of birth cannot be today or in the future";
    }

    // Gender — REQUIRED
    if (!formData.gender) {
      newErrors.gender = "Gender is required";
    }

    // Blood Group — REQUIRED
    if (!formData.bloodGroup) {
      newErrors.bloodGroup = "Blood group is required";
    }

    // Address — REQUIRED
    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const result = await createPatient(formData).unwrap();
      toast.success(
        `Patient created! Login credentials sent to ${result.data.patient.email}`,
        { duration: 6000 }
      );
      router.push("/dashboard/doctor/patients");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to create patient");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/doctor/patients"
          className="h-10 w-10 bg-surface rounded-xl flex items-center justify-center hover:bg-surface/80 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-text-secondary" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-black">Add New Patient</h1>
          <p className="text-text-secondary mt-1">
            All fields marked <span className="text-red-500">*</span> are required
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border-light p-6">
        <div className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-muted" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => set("name", e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none text-black ${
                  errors.name ? "border-red-500 focus:border-red-500" : "border-border-light focus:border-primary"
                }`}
                placeholder="John Doe"
              />
            </div>
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-muted" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => set("email", e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none text-black ${
                  errors.email ? "border-red-500 focus:border-red-500" : "border-border-light focus:border-primary"
                }`}
                placeholder="john@example.com"
              />
            </div>
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-muted" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => set("phone", e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none text-black ${
                  errors.phone ? "border-red-500 focus:border-red-500" : "border-border-light focus:border-primary"
                }`}
                placeholder="+1 234 567 8900"
              />
            </div>
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-muted" />
              <input
                type="date"
                value={formData.dateOfBirth}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => set("dateOfBirth", e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none text-black ${
                  errors.dateOfBirth ? "border-red-500 focus:border-red-500" : "border-border-light focus:border-primary"
                }`}
              />
            </div>
            {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>}
          </div>

          {/* Gender & Blood Group */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.gender}
                onChange={(e) => set("gender", e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none text-black ${
                  errors.gender ? "border-red-500 focus:border-red-500 bg-red-50" : "border-border-light focus:border-primary"
                }`}
              >
                <option value="">Select gender...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">
                Blood Group <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Droplet className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-muted" />
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => set("bloodGroup", e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none text-black ${
                    errors.bloodGroup ? "border-red-500 focus:border-red-500" : "border-border-light focus:border-primary"
                  }`}
                >
                  <option value="">Select...</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              {errors.bloodGroup && <p className="text-red-500 text-sm mt-1">{errors.bloodGroup}</p>}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">
              Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-text-muted" />
              <textarea
                value={formData.address}
                onChange={(e) => set("address", e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none text-black resize-none ${
                  errors.address ? "border-red-500 focus:border-red-500 bg-red-50" : "border-border-light focus:border-primary"
                }`}
                rows={3}
                placeholder="Street, City, State, ZIP"
              />
            </div>
            {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
          </div>

          {/* Info Box */}
          <div className="bg-primary-bg/30 border border-primary/20 rounded-xl p-4">
            <p className="text-sm text-text-secondary">
              <span className="font-semibold text-primary">Note:</span> A temporary password
              will be auto-generated. Please share it with the patient so they can login and
              change it.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 bg-linear-to-r from-primary to-primary-hover text-white rounded-xl font-semibold hover:shadow-2xl transition-all disabled:opacity-50"
            >
              {isLoading ? "Creating..." : "Create Patient"}
            </button>
            <Link
              href="/dashboard/doctor/patients"
              className="px-6 py-3 bg-surface text-text-secondary rounded-xl font-semibold hover:bg-surface/80 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
