"use client";

import Link from "next/link";
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
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ICrimeReport } from "@/types";
import CardVoteVertical from "./CardVoteVertical";

const statusIcons = {
  verified: Shield,
  investigating: Clock,
  resolved: CircleCheckBig,
  "not verified": AlertTriangle,
};

const statusColors = {
  verified: "bg-green-500/10 text-green-600 hover:bg-green-500/20",
  investigating: "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20",
  resolved: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20",
  "not verified": "bg-red-500/10 text-red-600 hover:bg-red-500/20",
};

interface CompactCrimeCardProps {
  report: ICrimeReport;
}

export function CompactCrimeCard({ report }: CompactCrimeCardProps) {
  const StatusIcon = statusIcons[report.status as keyof typeof statusIcons] || AlertTriangle;
  const statusColor = statusColors[report.status as keyof typeof statusColors] || "bg-gray-500/10 text-gray-600";
  const hasImage = report.images && report.images.length > 0;
  
  const formattedDate = (() => {
    try {
      return formatDistanceToNow(new Date(report.createdAt));
    } catch (error) {
      return "unknown time";
    }
  })();

  return (
    <Card className="overflow-hidden border transition-all duration-200 hover:shadow-md hover:border-primary/20">
      <Link href={`/${report._id}`} className="block">
        <div className="flex p-3 gap-3 sm:gap-4">
          {/* Vote Column */}
          <div className="hidden sm:block">
            <CardVoteVertical report={report} />
          </div>

          {/* Thumbnail - conditional rendering */}
          {hasImage && (
            <div className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden">
              <img
                src={report.images[0]}
                alt={report.title}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                loading="lazy"
              />
            </div>
          )}

          {/* Content Column */}
          <div className="flex-1 min-w-0">
            {/* Top metadata row with badge */}
            <div className="flex flex-wrap items-center gap-2 text-xs mb-1">
              <Badge className={`font-normal ${statusColor}`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {report.status}
              </Badge>
              
              <span className="text-muted-foreground">
                {report.isAnonymous ? "Anonymous" : report.author?.name || "Unknown"}
                <span className="mx-1">•</span>
                {formattedDate} ago
              </span>
            </div>

            {/* Title */}
            <h3 className="font-medium text-sm sm:text-base line-clamp-1 sm:line-clamp-2 group-hover:text-primary transition-colors">
              {report.title}
            </h3>

            {/* Bottom metadata row */}
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate max-w-[120px] sm:max-w-none">{report.location_name}</span>
              </div>
              
              {/* Mobile vote count */}
              <div className="sm:hidden flex items-center gap-1">
                <span className="text-primary">{report.upvotes - report.downvotes}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3 flex-shrink-0" />
                {report.comments?.length || 0}
              </div>
              
              <div className="hidden sm:flex items-center gap-1">
                <Share2 className="h-3 w-3 flex-shrink-0" />
                Share
              </div>
            </div>
          </div>
          
          {/* View indicator (only on desktop) */}
          <div className="hidden sm:flex items-center text-muted-foreground">
            <ExternalLink className="h-4 w-4" />
          </div>
        </div>
      </Link>
    </Card>
  );
}