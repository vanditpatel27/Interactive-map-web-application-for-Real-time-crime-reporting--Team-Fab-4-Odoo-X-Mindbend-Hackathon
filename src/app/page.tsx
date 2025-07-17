"use client"

import { useState, useEffect } from "react"
import { CrimeCard } from "@/components/CrimeCard"
import { CompactCrimeCard } from "@/components/CompactCrimeCard"
import { Sidebar } from "@/components/Sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Filter, SlidersHorizontal, LayoutList, LayoutGrid } from "lucide-react"
import ReactPaginate from "react-paginate"
import { ICrimeReport } from "@/types"

// const divisions = ["All", "Dhaka", "Chittagong", "Rajshahi", "Khulna", "Barisal", "Sylhet", "Rangpur", "Mymensingh"]
const sortOptions = ["Most Recent", "Most Upvoted", "Highest Verification Score"]

interface ApiResponse {
  contents: ICrimeReport[]
  totalItems: number
  totalPages: number
  currentPage: number
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("")
  // const [selectedDivision, setSelectedDivision] = useState("All")
  const [selectedSort, setSelectedSort] = useState("Most Recent")
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<"full" | "compact">("full")
  const [crimeReports, setCrimeReports] = useState<ICrimeReport[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)

  useEffect(() => {
    fetchCrimeReports()
  }, [searchQuery, selectedSort, currentPage])

  const fetchCrimeReports = async () => {
    try {
      const response = await fetch(
        `/api/report?page=${currentPage + 1}&search=${searchQuery}&sort=${selectedSort}`,
      )
      const data: ApiResponse = await response.json()
      setCrimeReports(data.contents)
      setTotalPages(data.totalPages)
    } catch (error) {
      console.error("Failed to fetch crime reports:", error)
    }
  }


  const handlePageChange = (selectedItem: { selected: number }) => {
    setCurrentPage(selectedItem.selected)
  }

  const CrimeCardComponent = viewMode === "full" ? CrimeCard : CompactCrimeCard

  return (
    <div className="flex min-h-screen">
      {/* <Sidebar /> */}
      <main className="flex-1">
        <div className="container mx-auto py-6 px-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Input
                  placeholder="Search crimes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </div>
              <Button className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode(viewMode === "full" ? "compact" : "full")}
              >
                {viewMode === "full" ? <LayoutList className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
              </Button>
            </div>

            {showFilters && (
              <Card className="animate-in">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {/* <Select value={selectedDivision} onValueChange={setSelectedDivision}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Division" />
                      </SelectTrigger>
                      <SelectContent>
                        {divisions.map((division) => (
                          <SelectItem key={division} value={division}>
                            {division}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select> */}
                    <Select value={selectedSort} onValueChange={setSelectedSort}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="mt-6 space-y-4">
            {crimeReports.map((report) => (
              <CrimeCardComponent
                key={report._id}
                report={report}
              />
            ))}
            {crimeReports.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No crimes found matching your criteria</div>
            )}
          </div>

          <ReactPaginate
            previousLabel={"Previous"}
            nextLabel={"Next"}
            breakLabel={"..."}
            pageCount={totalPages}
            marginPagesDisplayed={2}
            pageRangeDisplayed={5}
            onPageChange={handlePageChange}
            containerClassName={"flex justify-center items-center space-x-2 mt-8"}
            pageClassName={
              "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            }
            previousClassName={
              "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            }
            nextClassName={
              "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            }
            disabledClassName={"opacity-50 cursor-not-allowed"}
            activeClassName={"bg-primary text-primary-foreground"}
          />
        </div>
      </main>
    </div>
  )
}

