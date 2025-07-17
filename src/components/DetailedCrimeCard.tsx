"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MapPin,
  AlertTriangle,
  Shield,
  Clock,
  ArrowBigUp,
  ArrowBigDown,
  Calendar,
  MoreVertical,
  CircleCheckBig,
  Image,
  ZoomInIcon,
  ZoomOutIcon,
  Edit,
  Trash,
  FileCheck,
  UserCog,
  ShieldAlert,
  MessageCircle,
  Eye,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import type { ICrimeReport } from "@/types";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import ReactPlayer from "react-player";
import toast from "react-hot-toast";

import { useUserLoaded, useUser } from "@/hooks/user";

import {
  StatusUpdateModal,
  SuspicionLevelModal,
} from "./status-suspicion-modals";

const statusIcons = {
  verified: Shield,
  investigating: Clock,
  resolved: CircleCheckBig,
  "not verified": AlertTriangle,
};

const statusColors = {
  verified: "bg-green-500",
  investigating: "bg-yellow-500",
  resolved: "bg-blue-500",
  "not verified": "bg-red-500",
};

const suspicionColors = {
  high: "text-red-500 bg-red-100 border-red-200",
  medium: "text-yellow-500 bg-yellow-100 border-yellow-200", 
  low: "text-green-500 bg-green-100 border-green-200"
};

interface DetailedCrimeCardProps {
  report: ICrimeReport;
  onVote: (reportId: string, direction: "upvote" | "downvote") => void;
  userVote: "upvote" | "downvote" | null;
  voteCount: number;
  isAuthor: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function DetailedCrimeCard({
  report,
  onVote,
  userVote,
  voteCount,
  isAuthor,
  onEdit,
  onDelete,
}: DetailedCrimeCardProps) {
  const StatusIcon = statusIcons[report.status as keyof typeof statusIcons];

  const [user, setUser] = useUser();
  const [userLoaded, _] = useUserLoaded();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isRequestingPublic, setIsRequestingPublic] = useState(false);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isSuspicionModalOpen, setIsSuspicionModalOpen] = useState(false);

  const images = report.images || [];
  const videos = report.videos || [];

  // Get suspicion level category
  const getSuspicionLevel = () => {
    if (report.suspicionLevel >= 75) return "low";
    if (report.suspicionLevel >= 40) return "medium";
    return "high";
  };
  
  const suspicionLevel = getSuspicionLevel();

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleMakePublicRequest = async () => {
    setIsRequestingPublic(true);
    try {
      const response = await fetch(`/api/user/report/anonymous-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ crimeReportId: report._id }),
      });

      if (response.ok) {
        toast.success("Request to make report public has been sent to admins.");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to send request. Please try again.");
      }
    } catch (error) {
      console.error("Error requesting to make report public:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsRequestingPublic(false);
    }
  };

  const onUpdateStatus = () => {
    setIsStatusModalOpen(true);
  };

  const onSetSuspicionLevel = () => {
    setIsSuspicionModalOpen(true);
  };

  if (!userLoaded) return <div className="text-center">Loading...</div>;
  if (!user) return <div className="text-center">Not logged in</div>;

  return (
    <>
      <Card className="w-full shadow-md transition-shadow hover:shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
            <div>
              <CardTitle className="text-xl sm:text-2xl font-bold mb-1">
                {report.title}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
                <span className="font-semibold">
                  {report.isAnonymous ? "Anonymous" : report.author?.name}
                </span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(report.createdAt))} ago</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 self-start">
              <Badge
                variant="outline"
                className={`${
                  statusColors[report.status as keyof typeof statusColors]
                } text-white px-2 py-1 rounded-full transition-colors`}
              >
                <StatusIcon className="w-3 h-3 mr-1" />
                <span className="text-xs font-medium">
                  {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                </span>
              </Badge>
              {(isAuthor || user.role === "admin") && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {/* Author-specific actions */}
                    {isAuthor && (
                      <>
                        <DropdownMenuItem
                          onClick={onEdit}
                          className="cursor-pointer flex items-center py-2"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Report
                        </DropdownMenuItem>
                        {report.isAnonymous && (
                          <DropdownMenuItem
                            onClick={handleMakePublicRequest}
                            className="cursor-pointer flex items-center py-2"
                            disabled={isRequestingPublic}
                          >
                            <UserCog className="w-4 h-4 mr-2" />
                            {isRequestingPublic
                              ? "Requesting..."
                              : "Request Public"}
                          </DropdownMenuItem>
                        )}
                      </>
                    )}

                    {/* Admin-specific actions */}
                    {user.role === "admin" && (
                      <>
                        <DropdownMenuItem
                          onClick={onUpdateStatus}
                          className="cursor-pointer flex items-center py-2"
                        >
                          <FileCheck className="w-4 h-4 mr-2" />
                          Update Status
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={onSetSuspicionLevel}
                          className="cursor-pointer flex items-center py-2"
                        >
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Set Suspicion Level
                        </DropdownMenuItem>
                      </>
                    )}

                    {/* Delete action available to both roles */}
                    <DropdownMenuItem
                      onClick={onDelete}
                      className="cursor-pointer text-red-500 flex items-center py-2"
                    >
                      <Trash className="w-4 h-4 mr-2" />
                      Delete Report
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={`flex items-center gap-1 px-2 py-1 rounded-full border ${suspicionColors[suspicionLevel]}`}
            >
              <ShieldAlert className="h-3 w-3" />
              <span className="text-xs">
                Suspicion: {suspicionLevel.charAt(0).toUpperCase() + suspicionLevel.slice(1)}
              </span>
            </Badge>
            
            <div className="flex items-center text-xs text-muted-foreground gap-1 px-2 py-1 bg-slate-50 rounded-full">
              <Eye className="w-3 h-3" />
              <span>482 views</span>
            </div>
            
            <div className="flex items-center text-xs text-muted-foreground gap-1 px-2 py-1 bg-slate-50 rounded-full">
              <MessageCircle className="w-3 h-3" />
              <span>24 comments</span>
            </div>
          </div>
          
          <p className="text-base sm:text-lg leading-relaxed">{report.description}</p>

          <div className="flex flex-col sm:flex-row gap-4 text-sm">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{report.location_name}</span>
            </div>
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span>
                {format(new Date(report.createdAt), "MMMM d, yyyy 'at' h:mm a")}
              </span>
            </div>
          </div>

          {images.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="text-sm font-medium">Evidence Images ({images.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {images.map((image, index) => (
                  <div
                    key={index}
                    className="relative cursor-pointer overflow-hidden rounded-lg aspect-video bg-slate-50 group"
                    onClick={() => openLightbox(index)}
                  >
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`Evidence ${index + 1}`}
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="bg-white bg-opacity-90 p-2 rounded-full">
                        <ZoomInIcon className="w-5 h-5 text-slate-800" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {videos.length > 0 && (
            <div className="mt-6 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Video Evidence ({videos.length})</h3>
                {report.videoDescription && (
                  <p className="text-xs text-muted-foreground line-clamp-1">{report.videoDescription}</p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {videos.map((video, index) => (
                  <div
                    key={index}
                    className="aspect-video rounded-lg overflow-hidden border border-gray-100 shadow-sm"
                  >
                    <ReactPlayer
                      url={video}
                      width="100%"
                      height="100%"
                      controls
                      light={true}
                      playIcon={
                        <div className="bg-white bg-opacity-90 p-3 rounded-full">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
                          </svg>
                        </div>
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-1 pt-2 border-t">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onVote(report._id, "upvote")}
              className={`rounded-full ${
                userVote === "upvote"
                  ? "text-green-600 bg-green-50 hover:bg-green-100 hover:text-green-700"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              <ArrowBigUp className="w-5 h-5 mr-1" />
              <span className="text-sm font-medium">Upvote</span>
            </Button>
            <span className="text-sm font-semibold mx-1">{voteCount}</span>
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => onVote(report._id, "downvote")}
              className={`rounded-full ${
                userVote === "downvote"
                  ? "text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              <ArrowBigDown className="w-5 h-5 mr-1" />
              <span className="text-sm font-medium">Downvote</span>
            </Button>
          </div>
        </CardContent>

        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          index={lightboxIndex}
          slides={images.map((image) => ({ src: image }))}
          plugins={[Zoom]}
          zoom={{
            maxZoomPixelRatio: 5,
            zoomInMultiplier: 2,
          }}
          carousel={{
            preload: 3,
          }}
          render={{
            iconZoomIn: () => <ZoomInIcon />,
            iconZoomOut: () => <ZoomOutIcon />,
          }}
        />
      </Card>

      <StatusUpdateModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        reportId={report._id}
        currentStatus={report.status}
      />

      <SuspicionLevelModal
        isOpen={isSuspicionModalOpen}
        onClose={() => setIsSuspicionModalOpen(false)}
        reportId={report._id}
        currentSuspicionLevel={report.suspicionLevel || 0}
      />
    </>
  );
}