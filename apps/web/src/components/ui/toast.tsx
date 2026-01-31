"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastProps {
  id: string;
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: (id: string) => void;
}

export function Toast({ id, message, type = "success", duration = 2000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger fade-in animation on mount
    const frame = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // Wait for fade-out animation
  }, [id, onClose]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, handleClose]);

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg transition-all duration-300 transform ${
        type === "success"
          ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
          : type === "error"
            ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
            : "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
      } ${isExiting ? "opacity-0" : isVisible ? "opacity-100" : "opacity-0"}`}
    >
      <div className="shrink-0">{icons[type]}</div>
      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{message}</p>
      <button
        onClick={handleClose}
        className="ml-auto shrink-0 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        <X className="h-4 w-4 text-gray-400" />
      </button>
    </div>
  );
}
