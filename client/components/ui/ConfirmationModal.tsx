"use client";

import { Modal } from "./Modal";
import { Button } from "./Button";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "primary";
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  variant = "danger",
}: ConfirmationModalProps) {
  const t = useTranslations();
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center gap-4">
          <div
            className={`h-20 w-20 rounded-3xl flex items-center justify-center mb-2 ${
              variant === "danger"
                ? "bg-red-500/10 text-red-500"
                : variant === "warning"
                  ? "bg-[#B45309]/10 text-[#B45309]"
                  : "bg-primary/10 text-primary"
            }`}
          >
            <AlertTriangle size={40} strokeWidth={2.5} />
          </div>
        </div>

        <p className="text-sm font-medium text-text-secondary leading-relaxed text-center">
          {message}
        </p>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 h-12 rounded-xl text-xs font-black uppercase tracking-widest"
          >
            {cancelText === "Cancel" ? t("common.cancel") : cancelText}
          </Button>
          <Button
            variant="default"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 h-12 rounded-xl text-xs font-black uppercase tracking-widest ${
              variant === "danger"
                ? "bg-red-500 text-white hover:bg-red-600"
                : variant === "warning"
                  ? "bg-[#B45309] text-white hover:bg-[#B45309]"
                  : ""
            }`}
          >
            {confirmText === "Delete"
              ? t("common.delete")
              : confirmText === "Confirm"
                ? t("common.confirm")
                : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
