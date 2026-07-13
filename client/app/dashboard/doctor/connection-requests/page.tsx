"use client";

import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Building2, Inbox, Check, X } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import {
  useGetIncomingConnectionRequestsQuery,
  useAcceptConnectionRequestMutation,
  useDeclineConnectionRequestMutation,
  doctorApi
} from "@/store/api/doctorApi";
import { useChatSocket } from "@/providers/ChatSocketProvider";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { resolveMediaUrl } from "@/lib/media";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useTranslations } from "next-intl";

interface ConnectionRequest {
  _id: string;
  status: "pending" | "accepted" | "declined";
  clinicId?: {
    _id?: string;
    name: string;
    photo?: string;
    address?: string;
  };
  message?: string;
  createdAt: string;
  respondedAt?: string;
}

export default function ConnectionRequestsPage() {
  const t = useTranslations("connectionRequests");
  const [activeTab, setActiveTab] = useState<"pending" | "accepted" | "declined">("pending");
  const dispatch = useDispatch();
  const { data, isLoading } = useGetIncomingConnectionRequestsQuery(undefined);
  const [acceptRequest, { isLoading: isAccepting }] = useAcceptConnectionRequestMutation();
  const [declineRequest, { isLoading: isDeclining }] = useDeclineConnectionRequestMutation();

  const { socket } = useChatSocket();

  useEffect(() => {
    if (!socket) return;

    const handleNewRequest = (data: { clinicName: string }) => {
      const msg = t("wantsToAdd");
      toast(`${data.clinicName} ${msg}`, { icon: 'ℹ️' });
      dispatch(doctorApi.util.invalidateTags(['ConnectionRequests']));
    };

    socket.on('clinic_connection_request', handleNewRequest);
    return () => {
      socket.off('clinic_connection_request', handleNewRequest);
    };
  }, [socket, dispatch, t]);

  const requests: ConnectionRequest[] = data?.data || [];
  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const acceptedRequests = requests.filter((r) => r.status === 'accepted');
  const declinedRequests = requests.filter((r) => r.status === 'declined');

  const filteredRequests = activeTab === 'pending' ? pendingRequests
    : activeTab === 'accepted' ? acceptedRequests
      : declinedRequests;

  const handleAccept = async (request: ConnectionRequest) => {
    try {
      await acceptRequest(request._id).unwrap();
      toast.success(`Joined ${request.clinicId?.name || "Clinic"}!`);
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Failed to accept request");
    }
  };

  const handleDecline = async (request: ConnectionRequest) => {
    try {
      await declineRequest(request._id).unwrap();
      toast.success("Request declined.");
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Failed to decline request");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("title")} description={t("subtitle")} />
        <TableSkeleton rows={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
      />

      <div className="flex gap-4 border-b border-border-light pb-2">
        <button
          onClick={() => setActiveTab('pending')}
          className={`font-semibold text-sm pb-2 border-b-2 transition-colors ${activeTab === 'pending' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
        >
          {t("pendingLabel", { count: pendingRequests.length })}
        </button>
        <button
          onClick={() => setActiveTab('accepted')}
          className={`font-semibold text-sm pb-2 border-b-2 transition-colors ${activeTab === 'accepted' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
        >
          {t("acceptedStatus")}
        </button>
        <button
          onClick={() => setActiveTab('declined')}
          className={`font-semibold text-sm pb-2 border-b-2 transition-colors ${activeTab === 'declined' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
        >
          {t("declinedStatus")}
        </button>
      </div>

      {/* List */}
      <div className="space-y-4 mt-6">
        <AnimatePresence>
          {filteredRequests.length > 0 ? (
            filteredRequests.map((request: ConnectionRequest) => (
              <motion.div
                key={request._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, overflow: 'hidden', marginTop: 0, marginBottom: 0, padding: 0, borderWidth: 0 }}
                className="bg-white border border-border-light rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
              >
                {/* Left: Clinic Info */}
                <div className="flex items-center gap-4 min-w-[240px]">
                  <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center border border-border-light overflow-hidden shrink-0">
                    {request.clinicId?.photo ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={resolveMediaUrl(request.clinicId.photo)}
                        alt={request.clinicId.name || "Clinic"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Building2 className="h-6 w-6 text-text-secondary" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-text-primary">
                      {request.clinicId?.name || "Unknown Clinic"}
                    </h3>
                    <p className="text-[13px] text-text-secondary flex items-center gap-1">
                      {request.clinicId?.address || t("noAddress")}
                    </p>
                  </div>
                </div>

                {/* Center: Details */}
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">
                    {activeTab === 'pending' && t("wantsToAdd")}
                    {activeTab === 'accepted' && t("youAccepted")}
                    {activeTab === 'declined' && t("youDeclined")}
                  </p>
                  {request.message && (
                    <p className="text-[13px] italic text-[#6b7280] mt-1">{request.message}</p>
                  )}
                  <p className="text-xs text-[#9ca3af] mt-2 font-inter">
                    {activeTab === 'pending' ? t("sent") : t("responded")}{" "}
                    {formatDistanceToNow(
                      new Date(activeTab === 'pending' ? request.createdAt : (request.respondedAt || request.createdAt)),
                      { addSuffix: true }
                    )}
                  </p>
                </div>

                {/* Right: Actions */}
                {activeTab === 'pending' && (
                  <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0 shrink-0">
                    <button
                      disabled={isAccepting || isDeclining}
                      onClick={() => handleDecline(request)}
                      className="flex-1 md:flex-none px-5 py-2.5 rounded-xl border-[1.5px] border-[#e5e7eb] text-[#374151] text-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {t("decline")}
                    </button>
                    <button
                      disabled={isAccepting || isDeclining}
                      onClick={() => handleAccept(request)}
                      className="flex-1 md:flex-none px-5 py-2.5 rounded-xl bg-[#00b495] text-white text-sm font-semibold hover:bg-[#009b80] transition-colors disabled:opacity-50 shadow-sm shadow-emerald-500/20 cursor-pointer"
                    >
                      {t("accept")}
                    </button>
                  </div>
                )}
                {activeTab === 'accepted' && (
                  <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700 text-sm font-semibold flex items-center gap-1.5">
                    <Check className="h-4 w-4" /> {t("inClinic")}
                  </div>
                )}
                {activeTab === 'declined' && (
                  <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-sm font-semibold flex items-center gap-1.5">
                    <X className="h-4 w-4" /> {t("declinedStatus")}
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-border-light rounded-3xl bg-slate-50/50"
            >
              <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center shadow-sm border border-border-light mb-6">
                <Inbox className="h-10 w-10 text-[#d1d5db]" />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2">
                {t("noRequests", { status: t(`${activeTab}Status` as string) })}
              </h3>
              <p className="text-sm text-text-secondary max-w-sm">
                {activeTab === 'pending'
                  ? t("searchHelp")
                  : t("noReps", { status: t(`${activeTab}Status` as string) })}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
