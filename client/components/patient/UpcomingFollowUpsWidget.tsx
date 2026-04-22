import Link from "next/link";
import { format } from "date-fns";
import { Calendar, Building2, ChevronRight, Stethoscope } from "lucide-react";

export default function UpcomingFollowUpsWidget({ followUps }: { followUps: any[] }) {
    if (!followUps || followUps.length === 0) return null;

    return (
        <div className="rounded-2xl border-l-4 border-l-primary border-y border-r border-black/5 bg-white p-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-text-primary">
                    Upcoming Follow-ups
                </h2>
                <Link
                    href="/dashboard/patient/records"
                    className="flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-hover"
                >
                    View all
                    <ChevronRight className="h-4 w-4" />
                </Link>
            </div>

            <div className="mt-6 flex flex-col gap-4">
                {followUps.map((followUp: any, index: number) => (
                    <div
                        key={followUp._id || index}
                        className="flex flex-col gap-3 rounded-xl border border-border-light bg-background/50 p-4 transition-colors hover:bg-background :bg-ink-soft"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="font-semibold text-text-primary">
                                    Follow-up for {followUp.diagnosis}
                                </p>
                                <div className="mt-1 flex items-center gap-2 text-sm text-text-secondary">
                                    <Stethoscope className="h-3.5 w-3.5" />
                                    <span>Dr. {followUp.doctorId?.doctorProfile?.fullName || followUp.doctorId?.name || "Doctor"}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 text-right">
                                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                                    {format(new Date(followUp.followUpDate), "MMM d, yyyy")}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-medium text-text-secondary">
                            {followUp.clinicId && (
                                <div className="flex items-center gap-1">
                                    <Building2 className="h-3.5 w-3.5" />
                                    <span>{followUp.clinicId.name}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
