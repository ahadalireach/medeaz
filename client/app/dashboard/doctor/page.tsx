"use client";

import { useGetTodayQueueQuery } from "@/store/api/doctorApi";
import Link from "next/link";
import { Mic, Users, Calendar, FileText, Clock } from "lucide-react";

export default function DoctorDashboard() {
  const { data, isLoading, error } = useGetTodayQueueQuery(undefined);

  const todayQueue = data?.data?.appointments || [];
  const stats = {
    todayAppointments: data?.data?.stats?.total || 0,
    pendingAppointments: data?.data?.stats?.pending || 0,
    completedAppointments: data?.data?.stats?.completed || 0,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black tracking-tight">Dashboard</h1>
        <p className="text-text-secondary mt-1 sm:mt-2 text-base sm:text-lg">
          Welcome back! Here's your overview for today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-border-light hover:border-primary transition-all hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-xs sm:text-sm font-medium">Today's Appointments</p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black mt-2 sm:mt-3">
                {stats.todayAppointments}
              </p>
            </div>
            <div className="h-12 w-12 sm:h-14 sm:w-14 bg-primary-bg rounded-xl flex items-center justify-center">
              <Calendar className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-border-light hover:border-primary transition-all hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-xs sm:text-sm font-medium">Pending</p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black mt-2 sm:mt-3">
                {stats.pendingAppointments}
              </p>
            </div>
            <div className="h-12 w-12 sm:h-14 sm:w-14 bg-primary-bg rounded-xl flex items-center justify-center">
              <Clock className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-border-light hover:border-primary transition-all hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-xs sm:text-sm font-medium">Completed</p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black mt-2 sm:mt-3">
                {stats.completedAppointments}
              </p>
            </div>
            <div className="h-12 w-12 sm:h-14 sm:w-14 bg-primary-bg rounded-xl flex items-center justify-center">
              <FileText className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Link
          href="/dashboard/doctor/prescriptions/new"
          className="group bg-linear-to-br from-primary to-primary-hover p-6 sm:p-8 rounded-2xl text-white hover:shadow-2xl transition-all"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="h-12 w-12 sm:h-16 sm:w-16 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Mic className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold">Voice Prescription</h3>
              <p className="text-white/90 mt-0.5 sm:mt-1 text-sm sm:text-base">Create prescription with AI</p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/doctor/patients"
          className="group bg-white p-6 sm:p-8 rounded-2xl border border-border-light hover:border-primary hover:shadow-lg transition-all"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="h-12 w-12 sm:h-16 sm:w-16 bg-primary-bg rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-black">My Patients</h3>
              <p className="text-text-secondary mt-0.5 sm:mt-1 text-sm sm:text-base">View patient records</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Today's Queue */}
      <div className="bg-white rounded-2xl border border-border-light">
        <div className="p-4 sm:p-6 border-b border-border-light">
          <h2 className="text-xl sm:text-2xl font-bold text-black">Today's Queue</h2>
          <p className="text-text-secondary mt-1 text-sm sm:text-base">
            Appointments scheduled for today
          </p>
        </div>
        <div className="p-4 sm:p-6">
          {todayQueue.length === 0 ? (
            <div className="text-center py-16">
              <div className="h-16 w-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-text-muted" />
              </div>
              <p className="text-text-secondary text-lg">No appointments for today</p>
              <p className="text-text-muted text-sm mt-1">Time to catch up on paperwork!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayQueue.map((appointment: any) => (
                <div
                  key={appointment._id}
                  className="flex items-center justify-between p-5 bg-surface/50 hover:bg-surface rounded-xl transition-colors border border-transparent hover:border-border"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {appointment.patientId?.name?.[0] || "P"}
                    </div>
                    <div>
                      <h3 className="font-semibold text-black text-lg">
                        {appointment.patientId?.name || "Patient"}
                      </h3>
                      <p className="text-text-secondary text-sm">
                        {new Date(appointment.dateTime).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                        appointment.status === "pending"
                          ? "bg-primary-bg text-primary"
                          : appointment.status === "confirmed"
                          ? "bg-blue-50 text-blue-600"
                          : appointment.status === "in-progress"
                          ? "bg-orange-50 text-orange-600"
                          : "bg-green-50 text-green-600"
                      }`}
                    >
                      {appointment.status}
                    </span>
                    <Link
                      href={`/dashboard/doctor/appointments`}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
