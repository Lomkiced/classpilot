"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, LogOut, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "logout";
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "warning",
  isLoading = false,
}: ConfirmDialogProps) {
  const Icon = variant === "danger" ? Trash2 : variant === "logout" ? LogOut : AlertTriangle;
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="flex flex-col sm:flex-row gap-4 items-center sm:items-start text-center sm:text-left">
          <div className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border sm:h-10 sm:w-10",
            variant === "danger" ? "bg-red-50 text-red-600 border-red-100" : 
            variant === "logout" ? "bg-blue-50 text-blue-600 border-blue-100" :
            "bg-orange-50 text-orange-600 border-orange-100"
          )}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex-1 pt-1">
            <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
            <DialogDescription className="mt-2 text-sm text-gray-500">
              {description}
            </DialogDescription>
          </div>
        </DialogHeader>
        <DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant === "danger" ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              "w-full sm:w-auto",
              variant === "logout" && "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow"
            )}
          >
            {isLoading ? "Please wait..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
