"use client"

import { useState, useMemo } from "react"
import { CrimeCard } from "./CrimeCard"
import { crimeReports } from "@/libs/dummy-data"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

interface CrimeFeedProps {
  searchQuery: string
  selectedDivision: string
  selectedCrimeType: string
  selectedSort: string
}

export default function CrimeFeed({ 
  searchQuery, 
  selectedDivision, 
  selectedCrimeType, 
  selectedSort 
}: CrimeFeedProps) {
  const [userVotes, setUserVotes] = useState<Record<string, "upvote" | "downvote" | null>>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleVote = (reportId: string, direction: "upvote" | "downvote") => {
    setUserVotes((prev) => ({
      ...prev,
      [reportId]: prev[reportId] === direction ? null : direction,
    }))
  }

  const filteredAndSortedReports = useMemo(() => {
    // Simulate loading for better UX
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 300)

    return crimeReports
      .filter((report:any) => {
        const matchesSearch = searchQuery
          ? report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            report.description.toLowerCase().includes(searchQuery.toLowerCase())
          : true
        const matchesDivision = selectedDivision === "All" || report.location_name.includes(selectedDivision)
        const matchesType = selectedCrimeType === "All" || report.status === selectedCrimeType
        return matchesSearch && matchesDivision && matchesType
      })
      .sort((a:any, b:any) => {
        switch (selectedSort) {
          case "Most Recent":
            return b.createdAt.getTime() - a.createdAt.getTime()
          case "Most Upvoted":
            return b.upvotes - b.downvotes - (a.upvotes - a.downvotes)
          case "Highest Verification Score":
            return Number(b.verified) - Number(a.verified)
          default:
            return 0
        }
      })
  }, [searchQuery, selectedDivision, selectedCrimeType, selectedSort])

  return (
    <section className="w-full max-w-4xl mx-auto px-4 md:px-6">
      {/* Active filters display */}
      <div className="mb-4 flex flex-wrap gap-2">
        {searchQuery && (
          <span className="bg-primary/10 text-primary text-sm rounded-full px-3 py-1">
            Search: {searchQuery}
          </span>
        )}
        {selectedDivision !== "All" && (
          <span className="bg-primary/10 text-primary text-sm rounded-full px-3 py-1">
            Division: {selectedDivision}
          </span>
        )}
        {selectedCrimeType !== "All" && (
          <span className="bg-primary/10 text-primary text-sm rounded-full px-3 py-1">
            Type: {selectedCrimeType}
          </span>
        )}
      </div>

      {/* Results count */}
      <div className="mb-4 text-sm text-muted-foreground">
        {filteredAndSortedReports.length} {filteredAndSortedReports.length === 1 ? 'result' : 'results'} • Sorted by {selectedSort}
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Results grid - responsive layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            {filteredAndSortedReports.map((report:any) => (
              <CrimeCard 
                key={report._id} 
                report={report} 
                onVote={handleVote} 
                userVote={userVotes[report._id]} 
              />
            ))}
          </div>

          {/* Empty state */}
          {filteredAndSortedReports.length === 0 && (
            <Alert className="my-8">
              <AlertDescription className="flex flex-col items-center justify-center py-8 text-center">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-medium mb-2">No crimes found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or search query
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Load more button - only shown when there are results */}
          {filteredAndSortedReports.length > 0 && (
            <div className="mt-8 flex justify-center">
              <button className="px-4 py-2 border border-input rounded-md hover:bg-accent transition-colors">
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}