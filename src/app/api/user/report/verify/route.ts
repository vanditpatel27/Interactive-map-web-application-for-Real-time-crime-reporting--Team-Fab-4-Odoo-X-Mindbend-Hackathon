// app/api/reports/verification/route.ts
import { dbConnect } from '@/db/mongodb/connect';
import { getAuth } from '@/libs/auth';
import { NextResponse, NextRequest } from 'next/server';
import mongoose from 'mongoose';
import CrimeReport from '@/db/mongodb/models/CrimeReport';

interface ICrimeReport {
    _id: string;
    title: string;
    description: string;
    location_name: string;
    location: {
        type: string;
        coordinates: number[];
    };
    images: string[];
    videos: string[];
    videoDescription?: string;
    reportedBy: string;
    upvotes: number;
    downvotes: number;
    comments: string[];
    verified: boolean;
    verificationScore?: number;
    status: 'verified' | 'investigating' | 'resolved' | 'not verified' | 'fake';
    crimeTime: Date;
    isAnonymous?: boolean;
    suspicionLevel: number;
    isBanned: boolean;
    updatedAt: Date;
    createdAt: Date;
    author?: {
        name: string;
        avatar: string;
    };
}

interface VerificationMetrics {
    totalReports: number;
    verifiedReports: number;
    fakeReports: number;
    averageVerificationScore: number;
    statusBreakdown: {
        verified: number;
        investigating: number;
        resolved: number;
        notVerified: number;
        fake: number;
    };
    recentTrends: {
        last24Hours: number;
        lastWeek: number;
        lastMonth: number;
    };
}

async function calculateVerificationMetrics(reports: ICrimeReport[]): Promise<VerificationMetrics> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const metrics: VerificationMetrics = {
        totalReports: reports.length,
        verifiedReports: reports.filter(r => r.verified).length,
        fakeReports: reports.filter(r => r.status === 'fake').length,
        averageVerificationScore: 0,
        statusBreakdown: {
            verified: 0,
            investigating: 0,
            resolved: 0,
            notVerified: 0,
            fake: 0
        },
        recentTrends: {
            last24Hours: 0,
            lastWeek: 0,
            lastMonth: 0
        }
    };

    // Calculate breakdown by status
    reports.forEach(report => {
        metrics.statusBreakdown[report.status === 'not verified' ? 'notVerified' : report.status]++;
    });

    // Calculate trends
    metrics.recentTrends = {
        last24Hours: calculateAverageScore(reports.filter(r => r.createdAt >= yesterday)),
        lastWeek: calculateAverageScore(reports.filter(r => r.createdAt >= lastWeek)),
        lastMonth: calculateAverageScore(reports.filter(r => r.createdAt >= lastMonth))
    };

    // Calculate overall verification score
    metrics.averageVerificationScore = calculateOverallScore(reports);

    return metrics;
}

function calculateAverageScore(reports: ICrimeReport[]): number {
    if (reports.length === 0) return 0;

    const score = reports.reduce((total, report) => {
        let reportScore = 0;

        // Status weight (40%)
        const statusWeights = {
            verified: 100,
            resolved: 80,
            investigating: 50,
            'not verified': 20,
            fake: 0
        };
        reportScore += statusWeights[report.status] * 0.4;

        // Vote weight (30%)
        const voteScore = report.upvotes + report.downvotes === 0 ? 50 :
            (report.upvotes / (report.upvotes + report.downvotes)) * 100;
        reportScore += voteScore * 0.3;

        // Suspicion level inverse weight (30%)
        const trustScore = 100 - report.suspicionLevel;
        reportScore += trustScore * 0.3;

        return total + reportScore;
    }, 0);

    return Number((score / reports.length).toFixed(2));
}

function calculateOverallScore(reports: ICrimeReport[]): number {
    if (reports.length === 0) return 0;

    const weights = {
        recentActivity: 0.3,
        verificationRate: 0.4,
        communityTrust: 0.3
    };

    // Recent activity score
    const recentReports = reports.filter(r => 
        r.createdAt >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    const recentScore = calculateAverageScore(recentReports);

    // Verification rate
    const verificationRate = (reports.filter(r => r.verified).length / reports.length) * 100;

    // Community trust (based on votes)
    const totalVotes = reports.reduce((sum, r) => sum + r.upvotes + r.downvotes, 0);
    const positiveVotes = reports.reduce((sum, r) => sum + r.upvotes, 0);
    const communityTrust = totalVotes === 0 ? 50 : (positiveVotes / totalVotes) * 100;

    const overallScore = (
        recentScore * weights.recentActivity +
        verificationRate * weights.verificationRate +
        communityTrust * weights.communityTrust
    );

    return Number(overallScore.toFixed(2));
}

export async function GET(request: NextRequest) {
    try {
        const loggedInUser = await getAuth(request);
        if (!loggedInUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        // Fetch reports from database
        const reports = await CrimeReport.find({
            isBanned: false
        }).sort({ createdAt: -1 });

        // Calculate verification metrics
        const metrics = await calculateVerificationMetrics(reports);

        return NextResponse.json({
            success: true,
            metrics,
            timestamp: new Date()
        });

    } catch (error) {
        console.error('Error: ', error);
        return NextResponse.json({ error: 'Something went wrong...' }, { status: 500 });
    }
}