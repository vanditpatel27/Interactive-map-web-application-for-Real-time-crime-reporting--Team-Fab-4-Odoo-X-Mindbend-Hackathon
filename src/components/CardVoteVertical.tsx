"use client"
import { ICrimeReport, IVote } from "@/types"
import { motion } from "framer-motion"
import { ArrowBigDown, ArrowBigUp, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "@/libs/utils"

interface CardVoteVerticalProps {
    report: ICrimeReport;
    horizontal?: boolean;
}

export default function CardVoteVertical({ report, horizontal = false }: CardVoteVerticalProps) {
    const [voteCount, setVoteCount] = useState(report.upvotes - report.downvotes);
    const [userVote, setUserVote] = useState<IVote["vote"] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [animateCount, setAnimateCount] = useState(false);
  
    useEffect(() => {
      setIsLoading(true);
      fetch(`/api/user/report/vote/${report._id}`)
        .then((res) => res.json())
        .then((data: { vote: IVote }) => setUserVote(data?.vote?.vote || null))
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }, [report._id]);
  
    const onVote = async (reportId: string, vote: "upvote" | "downvote") => {
      if (isLoading) return;
      
      setIsLoading(true);
      
      try {
        const res = await fetch(`/api/user/report/vote/${reportId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ vote }),
        });
        
        const data = await res.json();
        
        setUserVote(data.vote.vote);
        setAnimateCount(true);
        
        // Handle vote count changes
        if (vote === "upvote" && data.message === 'ADDED') setVoteCount(v => v+1);
        if (vote === "downvote" && data.message === 'ADDED') setVoteCount(v => v-1);
        if (vote === "upvote" && data.message === 'REMOVED') setVoteCount(v => v-1);
        if (vote === "downvote" && data.message === 'REMOVED') setVoteCount(v => v+1);
        if (vote === "upvote" && data.message === 'UPDATED') setVoteCount(v => v+2);
        if (vote === "downvote" && data.message === 'UPDATED') setVoteCount(v => v-2);
        
        // Reset animation state after delay
        setTimeout(() => setAnimateCount(false), 300);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    // Animation variants
    const countVariants = {
      animate: { scale: [1, 1.2, 1], transition: { duration: 0.3 } },
      initial: { scale: 1 }
    };

    if (horizontal) {
      return (
        <div className="flex items-center justify-between gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.1 }}
            onClick={() => onVote(report._id, "upvote")}
            disabled={isLoading}
            className={cn(
              "p-1 rounded-full transition-all hover:bg-primary/10",
              userVote === "upvote" 
                ? "text-primary bg-primary/5" 
                : "text-muted-foreground",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
            aria-label="Upvote"
          >
            <ArrowBigUp className="h-4 w-4" />
          </motion.button>
          
          <motion.span 
            className={cn(
              "font-medium text-xs px-2",
              voteCount > 0 ? "text-primary" : voteCount < 0 ? "text-destructive" : "text-foreground"
            )}
            variants={countVariants}
            animate={animateCount ? "animate" : "initial"}
          >
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : voteCount}
          </motion.span>
          
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.1 }}
            onClick={() => onVote(report._id, "downvote")}
            disabled={isLoading}
            className={cn(
              "p-1 rounded-full transition-all hover:bg-destructive/10",
              userVote === "downvote" 
                ? "text-destructive bg-destructive/5" 
                : "text-muted-foreground",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
            aria-label="Downvote"
          >
            <ArrowBigDown className="h-4 w-4" />
          </motion.button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center p-2 bg-card/80 rounded-l-lg shadow-sm border-r border-border/50">
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.1 }}
          onClick={() => onVote(report._id, "upvote")}
          disabled={isLoading}
          className={cn(
            "p-1.5 rounded-full transition-all hover:bg-primary/10",
            userVote === "upvote" 
              ? "text-primary bg-primary/5" 
              : "text-muted-foreground",
            isLoading && "opacity-50 cursor-not-allowed"
          )}
          aria-label="Upvote"
        >
          <ArrowBigUp className="h-5 w-5" />
        </motion.button>
        
        <motion.span 
          className={cn(
            "font-medium text-sm py-2",
            voteCount > 0 ? "text-primary" : voteCount < 0 ? "text-destructive" : "text-foreground"
          )}
          variants={countVariants}
          animate={animateCount ? "animate" : "initial"}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : voteCount}
        </motion.span>
        
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.1 }}
          onClick={() => onVote(report._id, "downvote")}
          disabled={isLoading}
          className={cn(
            "p-1.5 rounded-full transition-all hover:bg-destructive/10",
            userVote === "downvote" 
              ? "text-destructive bg-destructive/5" 
              : "text-muted-foreground",
            isLoading && "opacity-50 cursor-not-allowed"
          )}
          aria-label="Downvote"
        >
          <ArrowBigDown className="h-5 w-5" />
        </motion.button>
      </div>
    );
}