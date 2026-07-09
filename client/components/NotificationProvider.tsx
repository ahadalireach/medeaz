"use client";

import { useEffect, ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { socket, connectSocket, disconnectSocket } from "@/lib/socket";
import {
  addNotification,
  setNotifications,
} from "@/store/slices/notificationSlice";
import { toast } from "react-hot-toast";
import { Bell, Volume2 } from "lucide-react";

import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { patientApi } from "@/store/api/patientApi";
import { chatApi } from "@/store/api/chatApi";
import { doctorApi } from "@/store/api/doctorApi";
import { clinicApi } from "@/store/api/clinicApi";

export default function NotificationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.auth.user);
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations();

  const translateNotificationKey = (
    key?: string,
    params?: Record<string, any>,
  ) => {
    if (!key) return "";
    try {
      const normalizedKey = key.startsWith("notifications.") ? key.replace("notifications.", "") : key;
      return t(`notifications.${normalizedKey}`, params || {});
    } catch {
      return "";
    }
  };

  const localizeNotification = (title: string, message: string) => {
    if (locale !== "ur") return { title, message };

    const titleMap: Record<string, string> = {
      "New Appointment Request": "نئی اپائنٹمنٹ درخواست",
      "Appointment Confirmed": "اپائنٹمنٹ تصدیق ہو گئی",
      "Appointment Cancelled": "اپائنٹمنٹ منسوخ ہو گئی",
      "Appointment Started": "اپائنٹمنٹ شروع ہو گئی",
      "Appointment Completed": "اپائنٹمنٹ مکمل ہو گئی",
      "New Prescription Received": "نیا نسخہ موصول ہوا",
      "Revenue Earned": "آمدنی حاصل ہوئی",
      "Platform Revenue Earned": "کلینک آمدنی حاصل ہوئی",
      "New Booking at Clinic": "کلینک میں نئی بکنگ",
      "Connection Request Approved": "کنکشن درخواست منظور ہو گئی",
      "Connection Request Rejected": "کنکشن درخواست مسترد ہو گئی",
      "Follow-up Reminder": "فالو اپ یاد دہانی",
      "Appointment Reminder (24h)": "اپائنٹمنٹ یاد دہانی (24 گھنٹے)",
      "Appointment Reminder (1h)": "اپائنٹمنٹ یاد دہانی (1 گھنٹہ)",
    };

    return {
      title: titleMap[title] || title,
      message: message
        .replace("has booked a consultation for", "نے مشاورت بک کی ہے برائے")
        .replace("has been confirmed.", "تصدیق ہو گئی ہے۔")
        .replace("has been cancelled.", "منسوخ کر دی گئی ہے۔")
        .replace(
          "has started your consultation.",
          "نے آپ کی مشاورت شروع کر دی ہے۔",
        )
        .replace("is now complete.", "اب مکمل ہو چکی ہے۔")
        .replace("has issued a new prescription", "نے نیا نسخہ جاری کیا ہے")
        .replace(
          "has approved your connection request.",
          "نے آپ کی کنکشن درخواست منظور کر لی ہے۔",
        )
        .replace(
          "has rejected your connection request.",
          "نے آپ کی کنکشن درخواست مسترد کر دی ہے۔",
        )
        .replace("A new appointment", "ایک نئی اپائنٹمنٹ"),
    };
  };

  const normalizeNotification = (notification: any) => {
    const translatedTitle = translateNotificationKey(
      notification.titleKey,
      notification.bodyParams,
    );
    const translatedMessage = translateNotificationKey(
      notification.bodyKey,
      notification.bodyParams,
    );

    if (translatedTitle || translatedMessage) {
      return {
        ...notification,
        title: translatedTitle || notification.title,
        message: translatedMessage || notification.message,
      };
    }

    const localized = localizeNotification(
      notification.title,
      notification.message,
    );
    return {
      ...notification,
      title: localized.title,
      message: localized.message,
    };
  };

  const getPortalFromNotification = (notification: any) => {
    if (notification?.portal && notification.portal !== "general") return notification.portal;
    const actionUrl = notification?.actionUrl || notification?.link || "";
    const match = String(actionUrl).match(
      /\/dashboard\/(patient|doctor|clinic_admin)(\/|$)/,
    );
    return match ? match[1] : (notification?.portal || "general");
  };

  const getPortalFromPathname = (currentPathname: string) => {
    const segments = String(currentPathname || "")
      .split("/")
      .filter(Boolean);
    const dashboardIndex = segments.indexOf("dashboard");

    if (dashboardIndex >= 0 && segments[dashboardIndex + 1]) {
      return segments[dashboardIndex + 1];
    }

    const supportedPortal = segments.find((segment) =>
      ["patient", "doctor", "clinic_admin"].includes(segment),
    );
    return supportedPortal || "general";
  };

  useEffect(() => {
    const socketUserId = user?._id || user?.id;
    const portalFromPath = getPortalFromPathname(pathname);

    if (socketUserId) {
      connectSocket(socketUserId);
      socket.emit("join", { userId: socketUserId, portal: portalFromPath }); // Ensure the user is in their room

      const handleConnect = () => {
        socket.emit("join", { userId: socketUserId, portal: portalFromPath });
      };

      socket.on("connect", handleConnect);

      socket.on("notification", (notification: any) => {
        const notificationPortal = getPortalFromNotification(notification);
        if (notificationPortal && notificationPortal !== portalFromPath && notificationPortal !== "general") {
          return;
        }

        const localizedNotification = normalizeNotification(notification);

        dispatch(addNotification(localizedNotification));

        // Auto-refresh records when new prescription notification arrives
        if (notification.type === "new_prescription") {
          dispatch(patientApi.util.invalidateTags(["Records", "Dashboard"]));
        }

        // Auto-refresh connection requests and profiles when connection status changes
        if (notification.type === "connection_accepted") {
          dispatch(clinicApi.util.invalidateTags(["Doctors", "Overview", "Staff", "ConnectionRequests"]));
          dispatch(doctorApi.util.invalidateTags(["DoctorProfile", "Schedule", "ConnectionRequests"]));
        }

        if (notification.type === "doctor_left_clinic") {
          dispatch(clinicApi.util.invalidateTags(["Doctors", "Overview", "Staff", "ConnectionRequests"]));
          dispatch(doctorApi.util.invalidateTags(["DoctorProfile", "Schedule", "Appointments"]));
        }

        if (notification.type === "clinic_connection_request") {
          dispatch(doctorApi.util.invalidateTags(["ConnectionRequests"]));
        }

        if (notification.type === "connection_declined") {
          dispatch(clinicApi.util.invalidateTags(["ConnectionRequests"]));
        }

        // Play notification sound
        try {
          const audio = new Audio("/sounds/notification.mp3");
          audio.volume = 0.5;
          audio.play().catch(() => {});
        } catch (e) {}

        // Suppress standard toast for follow-ups to prevent duplicate alerts,
        // as ChatSocketProvider already shows a beautiful custom green toast for these.
        if (notification.type === "follow_up_assigned" || notification.type === "follow_up_reminder") {
          return;
        }

        // Show real-time toast
        const isOpdCalled = notification.type === "opd_token_called" || 
                            String(localizedNotification.title || "").toLowerCase().includes("opd token has been called");

        if (isOpdCalled) {
          const calledTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const isUrdu = locale === "ur";
          
          toast.custom(
            (t) => (
              <div
                className={`${
                  t.visible ? "animate-enter" : "animate-leave"
                } max-w-md w-full bg-slate-950 border-2 border-[#00b495] shadow-[0_10px_30px_rgba(0,180,149,0.25)] rounded-[24px] pointer-events-auto flex flex-col overflow-hidden`}
              >
                <div className="p-5 flex items-start gap-4">
                  <div className="shrink-0 pt-0.5">
                    <div className="h-12 w-12 rounded-full bg-[#00b495]/20 border border-[#00b495] flex items-center justify-center animate-bounce">
                      <Volume2 className="h-6 w-6 text-[#00b495] animate-pulse" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black tracking-widest uppercase bg-[#00b495] text-white px-2 py-0.5 rounded-md">
                        {isUrdu ? "فوری کال" : "URGENT CALL"}
                      </span>
                      <span className="text-[10px] font-bold tracking-wider bg-white/10 text-slate-300 px-2 py-0.5 rounded-md">
                        {calledTime}
                      </span>
                    </div>
                    <h4 className="text-base font-black text-white mt-1.5 leading-tight">
                      {localizedNotification.title || (isUrdu ? "آپ کی باری آگئی ہے!" : "Your OPD Token is Called!")}
                    </h4>
                    <p className="mt-1 text-xs font-bold text-slate-300 leading-relaxed">
                      {localizedNotification.message}
                    </p>
                  </div>
                </div>
                <div className="border-t border-white/10 bg-white/5 px-5 py-3 flex items-center justify-end">
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="px-4 py-1.5 bg-[#00b495] hover:bg-[#009b80] text-white text-xs font-black rounded-xl transition-all shadow-md shadow-teal-500/10 cursor-pointer"
                  >
                    {isUrdu ? "ٹھیک ہے، میں آ رہا ہوں" : "OK, I'm Coming!"}
                  </button>
                </div>
              </div>
            ),
            { duration: 12000 }
          );
        } else {
          toast.custom(
            (t) => (
              <div
                className={`${t.visible ? "animate-enter" : "animate-leave"} max-w-md w-full bg-white  shadow-lg rounded-3xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 border border-border-light `}
              >
                <div className="flex-1 w-0 p-4">
                  <div className="flex items-start">
                    <div className="shrink-0 pt-0.5">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bell className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-bold text-text-primary">
                        {localizedNotification.title}
                      </p>
                      <p className="mt-1 text-sm text-text-secondary">
                        {localizedNotification.message}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex border-l border-border-light">
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="w-full border border-transparent rounded-none rounded-r-3xl p-4 flex items-center justify-center text-sm font-bold text-primary hover:text-primary-hover focus:outline-none"
                  >
                    Close
                  </button>
                </div>
              </div>
            ),
            { duration: 5000 },
          );
        }
      });

      socket.on("conversation_updated", () => {
        dispatch(chatApi.util.invalidateTags(["Conversations", "Messages"]));
      });

      socket.on("notification:unread_flush", (payload: any) => {
        const incoming = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.notifications)
            ? payload.notifications
            : [];
        if (!incoming.length) return;

        const merged = incoming
          .filter((notification: any) => {
            const portal = getPortalFromNotification(notification);
            return portal === portalFromPath || portal === "general";
          })
          .map((n: any) => normalizeNotification(n));
        if (!merged.length) return;
        dispatch(setNotifications(merged));
      });

      socket.on("appointment_started", (data: any) => {
        // Play sound for specific events as well
        try {
          const audio = new Audio("/sounds/notification.mp3");
          audio.volume = 0.5;
          audio.play().catch(() => {});
        } catch (e) {}
        // Removed redundant toast as standard notification already shows
      });

      socket.on("prescription_ready", (data: any) => {
        try {
          const audio = new Audio("/sounds/notification.mp3");
          audio.volume = 0.5;
          audio.play().catch(() => {});
        } catch (e) {}
        // Invalidate RTK Query cache so records list + dashboard refresh automatically
        dispatch(patientApi.util.invalidateTags(["Records", "Dashboard"]));
      });

      socket.on("doctor_availability_changed", (data: any) => {
        console.log("Global: doctor_availability_changed", data);
        dispatch(doctorApi.util.invalidateTags(["DoctorProfile"]));
        dispatch(clinicApi.util.invalidateTags(["Doctors"]));
        dispatch(patientApi.util.invalidateTags(["Doctors"]));
      });

      const handleDoctorAcceptedRequest = (data: any) => {
        dispatch(clinicApi.util.invalidateTags(["Doctors", "Overview", "Staff", "ConnectionRequests"]));
      };

      const handleDoctorLeftClinic = (data: any) => {
        dispatch(clinicApi.util.invalidateTags(["Doctors", "Overview", "Staff", "ConnectionRequests"]));
      };

      const handleClinicConnectionRequest = (data: any) => {
        dispatch(doctorApi.util.invalidateTags(["ConnectionRequests"]));
      };

      socket.on("doctor_accepted_request", handleDoctorAcceptedRequest);
      socket.on("doctor_left_clinic", handleDoctorLeftClinic);
      socket.on("clinic_connection_request", handleClinicConnectionRequest);

      return () => {
        socket.off("notification");
        socket.off("notification:unread_flush");
        socket.off("appointment_started");
        socket.off("prescription_ready");
        socket.off("doctor_availability_changed");
        socket.off("doctor_accepted_request", handleDoctorAcceptedRequest);
        socket.off("doctor_left_clinic", handleDoctorLeftClinic);
        socket.off("clinic_connection_request", handleClinicConnectionRequest);
        socket.off("conversation_updated");
        socket.off("new_message");
        socket.off("conversation_deleted");
        socket.off("connect", handleConnect);
        disconnectSocket();
      };
    }
  }, [user, dispatch, pathname]);

  useEffect(() => {
    if (user?._id || user?.id) {
      const handleNewMessage = (data: any) => {
        // Invalidate chat queries to refresh conversation list and unread counts
        dispatch(chatApi.util.invalidateTags(["Conversations", "Messages"]));

        // If not in chat, show a toast
        if (!pathname.includes("/chat")) {
          const senderName = data.senderName || "Someone";
          toast.success(`New message from ${senderName}`, {
            icon: "💬",
            id: `msg-${data.conversationId}`, // Prevent duplicate toasts for same conversation
          });
        }
      };

      const handleConversationDeleted = (data: any) => {
        dispatch(chatApi.util.invalidateTags(["Conversations", "Messages"]));
      };

      socket.on("new_message", handleNewMessage);
      socket.on("conversation_deleted", handleConversationDeleted);
      socket.on("conversation_updated", handleNewMessage);

      return () => {
        socket.off("new_message", handleNewMessage);
        socket.off("conversation_deleted", handleConversationDeleted);
        socket.off("conversation_updated", handleNewMessage);
      };
    }
  }, [user, dispatch, pathname]);

  return <>{children}</>;
}
