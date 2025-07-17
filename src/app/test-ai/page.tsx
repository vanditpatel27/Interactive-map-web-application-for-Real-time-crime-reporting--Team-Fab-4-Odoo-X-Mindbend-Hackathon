"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { analyzeFakeReport, detectFakeImage } from "@/libs/hf-handlers"; // Only using these two functions

export default function TestAIPage() {
    const [text, setText] = useState("");
    const [image, setImage] = useState<File | null>(null);
    const [textAnalysis, setTextAnalysis] = useState<any>(null);
    const [imageFakeResult, setImageFakeResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleTextAnalysis = async () => {
        if (!text.trim()) return;
        setLoading(true);
        try {
            const result = await analyzeFakeReport(text); // Only text analysis
            setTextAnalysis(result);
        } catch (error) {
            console.error("Text analysis failed:", error);
            // Handle error if necessary
        }
        setLoading(false);
    };

    const handleImageAnalysis = async () => {
        if (!image) return;
        setLoading(true);
        try {
            const fakeResult = await detectFakeImage(image); // Only image fake detection
            setImageFakeResult(fakeResult);
        } catch (error) {
            console.error("Image analysis failed:", error);
            // Handle error if necessary
        }
        setLoading(false);
    };

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            <h1 className="text-xl font-semibold">AI Model Testing</h1>

            {/* Text Analysis Section */}
            <Card>
                <CardHeader className="font-semibold">Test Text Analysis</CardHeader>
                <CardContent>
                    <Textarea
                        placeholder="Enter a crime report description..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                    <Button
                        onClick={handleTextAnalysis}
                        className="mt-2"
                        disabled={loading}
                    >
                        {loading ? "Analyzing..." : "Analyze Text"}
                    </Button>
                    {textAnalysis && (
                        <div className="mt-4 bg-gray-100 p-3 rounded">
                            <p><strong>Fake Probability:</strong> {textAnalysis[0]?.score}</p>
                            <p><strong>Label:</strong> {textAnalysis[0]?.label}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Image Analysis Section */}
            <Card>
                <CardHeader className="font-semibold">Test Image Analysis</CardHeader>
                <CardContent>
                    <Input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} />
                    <Button
                        onClick={handleImageAnalysis}
                        className="mt-2"
                        disabled={loading}
                    >
                        {loading ? "Analyzing..." : "Analyze Image"}
                    </Button>

                    {imageFakeResult && (
                        <div className="mt-4 bg-gray-100 p-3 rounded">
                            <p><strong>Fake Image Score:</strong> {imageFakeResult[0]?.score}</p>
                            <p><strong>Label:</strong> {imageFakeResult[0]?.label}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
