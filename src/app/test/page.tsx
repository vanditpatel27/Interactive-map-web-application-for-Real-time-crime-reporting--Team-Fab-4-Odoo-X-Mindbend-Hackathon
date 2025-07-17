"use client";

import { useState, useEffect } from "react";
import { analyzeFakeReport, detectFakeImage } from "@/libs/hf-handlers";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function TestAIPage() {
    const [reports, setReports] = useState<any[]>([]); // This will hold crime reports
    const [loading, setLoading] = useState<boolean>(true); // To manage loading state

    // Fetch the reports from your API and analyze them
    useEffect(() => {
        const fetchReports = async () => {
            try {
                const response = await fetch("/api/report");
                const data = await response.json();
                setReports(data.contents); // Assuming "contents" contains the reports
                
                // Automatically analyze each report (text and image)
                const analyzedReports = await Promise.all(data.contents.map(async (report: any) => {
                    // Analyze both the title and description for fake content
                    const titleAnalysis = await analyzeFakeReport(report.title);
                    const descriptionAnalysis = await analyzeFakeReport(report.description);

                    // Analyze images if present (handle images array)
                    let imageAnalysis = null;
                    let imageCaption = null;
                    if (report.images && report.images.length > 0) {
                        // Analyze the first image in the array
                        const image = report.images[0];
                        console.log("Analyzing image:", image);
                        imageAnalysis = await detectFakeImage(image);
                        console.log("Image Analysis Response:", imageAnalysis); // Log the result
                    }

                    return {
                        ...report,
                        titleAnalysis,
                        descriptionAnalysis,
                        imageAnalysis,
                    };
                }));

                setReports(analyzedReports); // Update reports with analysis results
            } catch (error) {
                console.error("Error fetching reports:", error);
            } finally {
                setLoading(false); // Set loading to false once data is fetched
            }
        };

        fetchReports();
    }, []);

    if (loading) {
        return <div>Loading...</div>; // Show loading state while fetching
    }

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            <h1 className="text-xl font-semibold">AI Model Testing</h1>

            {/* Display fetched and analyzed reports */}
            <Card>
                <CardHeader className="font-semibold">Crime Reports</CardHeader>
                <CardContent>
                    {reports.length > 0 ? (
                        reports.map((report: any) => (
                            <div key={report._id} className="mb-4 p-4 border border-gray-200 rounded-md">
                                <h2 className="font-semibold text-lg">{report.title}</h2>
                                <p>{report.description}</p>
                                {report.images && report.images.length > 0 && (
                                    <img src={report.images[0]} alt={report.title} className="mt-2 w-48" />
                                )}

                                {/* AI Analysis Results */}
                                <div className="mt-2">
                                    {/* Title Analysis */}
                                    {report.titleAnalysis && (
                                        <div className="mt-2 p-3 rounded">
                                            <p><strong>Title Fake Probability:</strong> {report.titleAnalysis[0]?.score}</p>
                                            <p><strong>Title Label:</strong> {report.titleAnalysis[0]?.label}</p>
                                        </div>
                                    )}

                                    {/* Description Analysis */}
                                    {report.descriptionAnalysis && (
                                        <div className="mt-2 p-3 rounded">
                                            <p><strong>Description Fake Probability:</strong> {report.descriptionAnalysis[0]?.score}</p>
                                            <p><strong>Description Label:</strong> {report.descriptionAnalysis[0]?.label}</p>
                                        </div>
                                    )}

                                    {/* Image Analysis */}
                                    {report.images && report.images.length > 0 && report.imageAnalysis && (
                                        <div className="mt-2 p-3 rounded">
                                            <p><strong>Fake Image Score:</strong> {report.imageAnalysis[0]?.score}</p>
                                            <p><strong>Image Label:</strong> {report.imageAnalysis[0]?.label}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No reports available</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
