"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  MessageSquare,
  Share2,
  MapPin,
  AlertTriangle,
  Shield,
  Clock,
  CircleCheckBig,
  ImageIcon, 
  ShieldAlert,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ICrimeReport, IVote } from "@/types";
import CardVoteVertical from "./CardVoteVertical";
import { cn } from "@/libs/utils";

const statusIcons = {
  verified: Shield,
  investigating: Clock,
  resolved: CircleCheckBig,
  "not verified": AlertTriangle,
};

const statusColors = {
  verified: "text-green-500",
  investigating: "text-yellow-500",
  resolved: "text-blue-500",
  "not verified": "text-red-500",
};

const suspicionLevelColors = {
  low: "text-green-400",
  medium: "text-yellow-400",
  high: "text-red-400",
};

interface CrimeCardProps {
  report: ICrimeReport;
}

export function CrimeCard({ report }: CrimeCardProps) {
  const StatusIcon = statusIcons[report.status as keyof typeof statusIcons];
  const additionalImages = report.images ? report.images.length - 2 : 0;
  
  const getSuspicionLevel = (level: number) => {
    if (level >= 75) return "Low";
    if (level >= 40) return "Medium";
    return "High";
  };
  
  const suspicionLevel = getSuspicionLevel(report.suspicionLevel);
  const suspicionColor = suspicionLevelColors[suspicionLevel.toLowerCase() as keyof typeof suspicionLevelColors];

  return (
    <Card className="crime-card hover:border-primary transition-all duration-200 shadow-sm hover:shadow-md overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        {/* Vote Column - Hidden on mobile, shown on larger screens */}
        <div className="hidden sm:block">
          <CardVoteVertical report={report} />
        </div>
        
        {/* Content Column */}
        <div className="flex-1 p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 ring-2 ring-primary/10">
                <AvatarImage
                  src={
                    report.isAnonymous
                      ? `https://avatar.vercel.sh/${report.reportedBy}`
                      : report.author?.avatar ||
                        `https://avatar.vercel.sh/${report.reportedBy}`
                  }
                />
                <AvatarFallback>
                  {report.isAnonymous ? "A" : report.reportedBy[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {report.isAnonymous ? "Anonymous" : report.author?.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(report.createdAt))} ago
                </span>
              </div>
            </div>
            
            {/* Mobile Vote - Shown on mobile only */}
            <div className="sm:hidden flex items-center">
              <div className="flex items-center bg-card/80 rounded-lg shadow-sm border border-border/50 px-2">
                <CardVoteVertical report={report} horizontal />
              </div>
            </div>
            
            <div className="hidden sm:flex gap-2">
              <Badge
                variant="secondary"
                className={`gap-1 ${statusColors[report.status as keyof typeof statusColors]}`}
              >
                <StatusIcon className="h-3 w-3" />
                {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
              </Badge>
              <Badge
                variant="secondary"
                className={`gap-1 ${suspicionColor}`}
              >
                <ShieldAlert className="h-3 w-3" />
                Suspicious: {suspicionLevel}
              </Badge>
            </div>
          </div>

          {/* Location Badge */}
          <Badge variant="outline" className="mb-4">
            <MapPin className="h-3 w-3 mr-1" />
            {report.location_name}
          </Badge>

          {/* Title and Description */}
          <Link href={`/${report._id}`} className="block group">
            <h3 className="text-lg font-semibold group-hover:text-primary transition-colors duration-200 line-clamp-2">
              {report.title}
            </h3>
            <p className="mt-2 text-muted-foreground line-clamp-3 text-sm">
              {report.description}
            </p>
          </Link>

          {/* Images */}
          {report.images && report.images.length > 0 && (
            <div className="mt-4">
              <div className="grid grid-cols-2 gap-2 rounded-lg overflow-hidden">
                {report.images.slice(0, 2).map((image, index) => (
                  <div key={index} className="relative aspect-video bg-muted/50">
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`Evidence ${index + 1}`}
                      className="object-cover w-full h-full transition-transform hover:scale-105 duration-300"
                    />
                    {index === 1 && additionalImages > 0 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                        <div className="text-white flex items-center gap-2">
                          <ImageIcon className="h-5 w-5" />
                          <span className="font-medium">
                            +{additionalImages} more
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status badges for mobile */}
          <div className="flex flex-wrap gap-2 mt-4 sm:hidden">
            <Badge
              variant="secondary"
              className={`gap-1 ${statusColors[report.status as keyof typeof statusColors]}`}
            >
              <StatusIcon className="h-3 w-3" />
              {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
            </Badge>
            <Badge
              variant="secondary"
              className={`gap-1 ${suspicionColor}`}
            >
              <ShieldAlert className="h-3 w-3" />
              Suspicious: {suspicionLevel}
            </Badge>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-2 border-t border-muted">
            <Link href={`/${report._id}`} className="w-full sm:w-auto">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 hover:bg-muted w-full sm:w-auto justify-center sm:justify-start"
              >
                <MessageSquare className="h-4 w-4" />
                <span>{report.comments.length} Comments</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 hover:bg-muted"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default CrimeCard;