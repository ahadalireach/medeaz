"use client";

import { useState, useEffect } from "react";
import { useGetWeeklyScheduleQuery, useUpdateScheduleMutation, useCreateAppointmentMutation } from "@/store/api/doctorApi";
import { toast } from "react-hot-toast";
import { 
  ChevronLeft, ChevronRight, Calendar, User, Clock, 
  CheckCircle2, XCircle, AlertTriangle, Play, CalendarPlus, X, RefreshCw, Save, Loader
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { useTranslations } from "next-intl";
import { socket } from "@/lib/socket";
import { 
  startOfWeek, endOfWeek, addWeeks, subWeeks, format, isSameDay, parseISO, addDays
} from "date-fns";
import { enUS } from "date-fns/locale";

const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 4) + 8; // 8 AM to 8 PM
  if (hour >= 20) return null;
  const min = (i % 4) * 15;
  return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
}).filter(Boolean) as string[];

export default function SchedulePage() {
  const t = useTranslations();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [localSchedule, setLocalSchedule] = useState<Record<string, string[]>>({
    monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
  });
  
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const formattedDateParam = format(currentDate, 'yyyy-MM-dd');

  const { data, isLoading, refetch } = useGetWeeklyScheduleQuery(formattedDateParam);
  const [updateSchedule, { isLoading: saving }] = useUpdateScheduleMutation();
  const [createAppointment] = useCreateAppointmentMutation();

  useEffect(() => {
    if (data?.data?.availabilitySlots) {
      setLocalSchedule(data.data.availabilitySlots);
    }
  }, [data]);

  useEffect(() => {
    socket.on("schedule_updated", () => refetch());
    return () => { socket.off("schedule_updated"); };
  }, [refetch]);

  const handlePreviousWeek = () => setCurrentDate(prev => subWeeks(prev, 1));
  const handleNextWeek = () => setCurrentDate(prev => addWeeks(prev, 1));

  const toggleSlotAvailability = (dayName: string, time: string, isCurrentlyAvailable: boolean) => {
    setLocalSchedule((prev) => {
      const dayData = prev[dayName] || [];
      const newSlots = isCurrentlyAvailable
        ? dayData.filter(s => s !== time)
        : [...dayData, time];
      
      return { ...prev, [dayName]: newSlots };
    });
  };

  const handleSave = async () => {
    try {
      await updateSchedule({ schedule: localSchedule }).unwrap();
      toast.success(t('toast.scheduleSaved') || "Schedule saved successfully");
      refetch();
    } catch (e) {
      toast.error(t('common.error') || "Failed to save schedule");
    }
  };

  const handleCreateFollowUp = async (days: number) => {
    if (!selectedAppointment) return;
    const futureDate = addDays(new Date(selectedAppointment.appointmentDate), days);
    
    try {
      await createAppointment({
        patientId: selectedAppointment.patientId,
        dateTime: `${format(futureDate, 'yyyy-MM-dd')}T10:00:00.000Z`,
        duration: 15,
        type: 'follow-up'
      }).unwrap();
      toast.success(`Follow-up appointment created for ${format(futureDate, 'MMM d, yyyy')}`);
      setSelectedAppointment(null);
    } catch (e: any) {
      toast.error(e?.data?.message || "Failed to create follow-up");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <div className="grid grid-cols-4 gap-4">
           <Skeleton className="h-24 w-full rounded-2xl" />
           <Skeleton className="h-24 w-full rounded-2xl" />
           <Skeleton className="h-24 w-full rounded-2xl" />
           <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  const { availabilitySlots, appointments, utilizationMetrics, dailyCounts, weeklyStats } = data?.data || {};

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-primary/20 text-primary border-primary/30';
      case 'in-progress': return 'bg-purple-500/20 text-purple-700 border-purple-500/30';
      case 'confirmed': return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-700 border-red-500/30';
      default: return 'bg-amber-500/20 text-amber-700 border-amber-500/30';
    }
  };

  const daysArr = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="grid grid-cols-1 w-full">
      <div className="space-y-6 animate-in fade-in duration-500 min-w-0 w-full">
      {/* Header / Week Navigator */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#18181b] p-4 rounded-2xl shadow-sm border border-black/5 dark:border-white/10">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            {t('nav.schedule') || "Schedule Management"}
          </h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-all disabled:opacity-50 text-sm shadow-md"
          >
            {saving ? (
              <>
                <Loader className="h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> {t('doctor.saveSchedule') || "Save"}
              </>
            )}
          </button>
        </div>
        <div className="flex items-center gap-2 bg-surface p-1.5 rounded-xl">
          <button onClick={handlePreviousWeek} className="p-2 hover:bg-white dark:hover:bg-[#27272a] rounded-lg transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="px-4 py-2 font-bold text-sm">
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </div>
          <button onClick={handleNextWeek} className="p-2 hover:bg-white dark:hover:bg-[#27272a] rounded-lg transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Weekly Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="bg-white dark:bg-[#18181b] p-5 rounded-2xl shadow-sm border border-black/5 dark:border-white/10">
            <div className="text-sm font-semibold text-text-secondary">Weekly Appointments</div>
            <div className="text-3xl font-black mt-2 text-primary">{weeklyStats?.totalAppointments || 0}</div>
         </div>
         <div className="bg-white dark:bg-[#18181b] p-5 rounded-2xl shadow-sm border border-black/5 dark:border-white/10">
            <div className="text-sm font-semibold text-text-secondary">Unique Patients</div>
            <div className="text-3xl font-black mt-2 text-gray-900 dark:text-white">{weeklyStats?.totalPatients || 0}</div>
         </div>
         <div className="bg-white dark:bg-[#18181b] p-5 rounded-2xl shadow-sm border border-black/5 dark:border-white/10">
            <div className="text-sm font-semibold text-text-secondary">Follow-Ups Due</div>
            <div className="text-3xl font-black mt-2 text-amber-500">{weeklyStats?.followUpsDue || 0}</div>
         </div>
         <div className="bg-primary/5 p-5 rounded-2xl shadow-sm border border-primary/20 relative overflow-hidden">
            <div className="text-sm font-semibold text-primary">Doctor Utilization</div>
            <div className="text-3xl font-black mt-2 text-primary">{utilizationMetrics?.percentage || 0}%</div>
            <div className="absolute bottom-0 left-0 h-1 bg-primary/20 w-full">
               <div className="h-full bg-primary" style={{ width: `${utilizationMetrics?.percentage || 0}%` }}></div>
            </div>
         </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-[#18181b] rounded-2xl border border-black/5 dark:border-white/10 shadow-sm overflow-hidden flex flex-col w-full min-w-0">
         <div className="flex overflow-x-auto pb-4">
            {/* Times Column */}
            <div className="flex-none w-[70px] sm:w-[80px] shrink-0 flex flex-col border-r border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
              <div className="h-32 border-b border-gray-100 dark:border-white/5 p-3"></div>
              {TIME_SLOTS.map(time => (
                <div key={time} className="h-12 border-b border-gray-100 dark:border-white/5 text-[10px] sm:text-xs font-medium text-gray-500 p-2 text-right relative">
                   <span className="-mt-3 block absolute right-2 bg-gray-50/50 dark:bg-[#18181b] px-1 rounded">{time}</span>
                </div>
              ))}
            </div>

            {/* Day Columns */}
            {daysArr.map(dayName => {
               const dayDate = addDays(weekStart, daysArr.indexOf(dayName));
               const dateStr = format(dayDate, 'yyyy-MM-dd');
               const stats = dailyCounts?.[dateStr] || { appointments: 0, patients: 0, availableSlotsRemaining: 0 };
               const dayAppointments = appointments?.filter((a: any) => a.appointmentDate === dateStr) || [];
               
               return (
                 <div key={dateStr} className="flex-1 min-w-[140px] sm:min-w-[180px] flex flex-col border-r border-gray-100 dark:border-white/5 relative group">
                   <div className="h-32 border-b border-gray-100 dark:border-white/5 p-3 bg-white dark:bg-[#18181b] sticky top-0 z-10">
                      <div className="font-bold text-gray-900 dark:text-white capitalize">{dayName}</div>
                      <div className="text-sm text-gray-500">{format(dayDate, 'MMM d')}</div>
                      <div className="mt-2 text-[10px] sm:text-xs bg-primary/10 text-primary font-bold px-2 py-1 rounded-lg w-fit">
                        {stats.appointments} Appts • {stats.patients} Pts
                      </div>
                      <div className="text-[10px] mt-1 font-semibold text-gray-500">
                        {stats.availableSlotsRemaining} Slots Avail
                      </div>
                   </div>
                   
                   <div className="relative">
                      {TIME_SLOTS.map(time => {
                         const isAvailable = localSchedule?.[dayName]?.includes(time);
                         // Check if this slot is covered by an appointment so we don't show "Available" text under it
                         const isCovered = dayAppointments.some((a: any) => {
                            const [h1, m1] = a.startTime.split(':').map(Number);
                            const [h2, m2] = time.split(':').map(Number);
                            const [eh1, em1] = a.endTime.split(':').map(Number);
                            const appStartMins = h1 * 60 + m1;
                            const slotMins = h2 * 60 + m2;
                            const appEndMins = eh1 * 60 + em1;
                            return slotMins >= appStartMins && slotMins < appEndMins;
                         });

                         return (
                           <div key={time} 
                                onClick={() => toggleSlotAvailability(dayName, time, isAvailable)}
                                className={`h-12 border-b border-gray-100 dark:border-white/5 cursor-pointer transition-colors ${isAvailable ? 'bg-primary hover:bg-primary-hover text-white' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                           >
                              {isAvailable && !isCovered && (
                                <div className="h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                   <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest">+</span>
                                </div>
                              )}
                           </div>
                         );
                      })}

                      {/* Appointments Overlay */}
                      {dayAppointments.map((app: any) => {
                         const topIndex = TIME_SLOTS.indexOf(app.startTime);
                         if (topIndex === -1) return null;
                         
                         const [sh, sm] = app.startTime.split(':').map(Number);
                         const [eh, em] = app.endTime.split(':').map(Number);
                         const durationMins = (eh * 60 + em) - (sh * 60 + sm);
                         const heightMultiplier = Math.max(1, Math.ceil(durationMins / 15));
                         
                         return (
                            <div 
                              key={app.appointmentId} 
                              className={`absolute left-1 right-1 rounded-lg border shadow-sm p-2 overflow-hidden hover:z-20 transition-all cursor-pointer ${getStatusStyle(app.status)}`}
                              style={{
                                top: `${topIndex * 48 + 2}px`, // 48px per h-12 slot, 2px offset
                                height: `${heightMultiplier * 48 - 4}px`,
                              }}
                              onClick={() => setSelectedAppointment(app)}
                            >
                               <div className="flex items-center gap-1.5 mb-1 w-full">
                                 {app.patientPhoto ? (
                                   <img src={app.patientPhoto} alt="" className="w-4 h-4 rounded-full object-cover shrink-0" />
                                 ) : (
                                   <div className="w-4 h-4 rounded-full bg-black/10 flex items-center justify-center shrink-0">
                                     <User size={10} />
                                   </div>
                                 )}
                                 <div className="font-bold text-xs sm:text-sm truncate text-black">{app.patientName || "Patient"}</div>
                               </div>
                               {heightMultiplier > 1 && (
                                 <div className="text-[10px] sm:text-xs truncate text-black font-semibold mt-0.5">{app.startTime} - {app.endTime}</div>
                               )}
                               {app.appointmentType === 'follow-up' && (
                                 <div className="absolute bottom-1 right-1 bg-amber-500 text-white rounded-full p-0.5">
                                   <RefreshCw size={8} />
                                 </div>
                               )}
                            </div>
                         );
                      })}
                   </div>
                 </div>
               );
            })}
         </div>
         </div>
      </div>

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-[#18181b] rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
             <button onClick={() => setSelectedAppointment(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white">
                <X size={20} />
             </button>
             
             <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-full bg-surface flex items-center justify-center border shrink-0">
                  {selectedAppointment.patientPhoto ? (
                    <img src={selectedAppointment.patientPhoto} className="h-full w-full rounded-full object-cover" />
                  ) : <User size={20} className="text-gray-400" />}
                </div>
                <div className="min-w-0 flex-1">
                   <h3 className="font-bold text-lg truncate">{selectedAppointment.patientName || "Patient"}</h3>
                   <p className="text-xs text-text-secondary uppercase tracking-widest font-bold truncate">{selectedAppointment.appointmentType}</p>
                </div>
             </div>

             <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center bg-surface p-3 rounded-xl border">
                   <div className="text-sm font-semibold flex items-center gap-2"><Clock size={16}/> Time</div>
                   <div className="text-sm font-medium">{selectedAppointment.startTime} - {selectedAppointment.endTime}</div>
                </div>
                <div className="flex justify-between items-center bg-surface p-3 rounded-xl border">
                   <div className="text-sm font-semibold flex items-center gap-2"><CheckCircle2 size={16}/> Status</div>
                   <div className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest px-2 py-1 rounded-md ${getStatusStyle(selectedAppointment.status)}`}>
                      {selectedAppointment.status}
                   </div>
                </div>
             </div>

             <div className="border-t border-black/5 dark:border-white/10 pt-4">
                <h4 className="text-xs font-black text-text-secondary mb-3 uppercase tracking-widest">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-2">
                   <button 
                     onClick={() => handleCreateFollowUp(7)}
                     className="flex items-center justify-center gap-2 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 p-2 text-xs font-bold rounded-xl transition-colors"
                   >
                     <RefreshCw size={14}/> Follow-up (7d)
                   </button>
                   <button 
                     onClick={() => handleCreateFollowUp(14)}
                     className="flex items-center justify-center gap-2 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 p-2 text-xs font-bold rounded-xl transition-colors"
                   >
                     <RefreshCw size={14}/> Follow-up (14d)
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
