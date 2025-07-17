"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { Input } from "./ui/input";

// Add these interfaces
interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  currentStatus: string;
}

interface SuspicionModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  currentSuspicionLevel: number;
}

export function StatusUpdateModal({
  isOpen,
  onClose,
  reportId,
  currentStatus,
}: StatusModalProps) {
  const [status, setStatus] = useState(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateStatus = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/report/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportId,
          status,
        }),
      });

      if (response.ok) {
        toast.success("Status updated successfully");
        onClose();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("An error occurred while updating status");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Report Status</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not verified">Not Verified</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="investigating">Investigating</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="fake">Fake</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleUpdateStatus} disabled={isUpdating}>
            {isUpdating ? "Updating..." : "Update Status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SuspicionLevelModal({
  isOpen,
  onClose,
  reportId,
  currentSuspicionLevel,
}: SuspicionModalProps) {
  const [suspicionLevel, setSuspicionLevel] = useState(
    currentSuspicionLevel.toString()
  );
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateSuspicion = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/report/suspicion`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportId,
          suspicionLevel: parseInt(suspicionLevel),
        }),
      });

      if (response.ok) {
        toast.success("Suspicion level updated successfully");
        onClose();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update suspicion level");
      }
    } catch (error) {
      console.error("Error updating suspicion level:", error);
      toast.error("An error occurred while updating suspicion level");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set Suspicion Level</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <label htmlFor="suspicionLevel" className="text-sm font-medium">
            Suspicion Level
          </label>
          <Input
            id="suspicionLevel"
            type="number"
            min="0"
            max="3"
            value={suspicionLevel}
            onChange={(e) => setSuspicionLevel(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleUpdateSuspicion} disabled={isUpdating}>
            {isUpdating ? "Updating..." : "Update Suspicion Level"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
