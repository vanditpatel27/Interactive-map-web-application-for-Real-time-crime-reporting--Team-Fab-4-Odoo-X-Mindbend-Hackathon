import CrimeReport from "@/db/mongodb/models/CrimeReport";
import { analyzeFakeReport, detectFakeImage } from "./hf-handlers";

interface SentimentScore {
    label: string;
    score: number;
  }
  
  interface AnalysisResult {
    imageAnalysis: SentimentScore[];
    titleAnalysis: SentimentScore[];
    descriptionAnalysis: SentimentScore[];
  }
  
export const analyzeReport = async (reportId:string, title:string, description:string, images:string[]) => {
    const titleAnalysis = await analyzeFakeReport(title) || [];
    const descriptionAnalysis = await analyzeFakeReport(description) || [];
    
    const imageAnalysis = await detectFakeImage(images[0]) || [];
    const suspicionLevel = calculateSuspicionLevel({
        titleAnalysis,
        descriptionAnalysis,
        imageAnalysis,
    });
    console.log(suspicionLevel);
    await CrimeReport.findByIdAndUpdate(reportId, { suspicionLevel });
}

export function calculateSuspicionLevel(analysis: AnalysisResult): number {
  console.log(analysis);
    // Weights for different components
    const weights = {
      image: 0.3,
      title: 0.3,
      description: 0.4
    };
    
    // Calculate image suspicion (inverse of advertisement score since ads are usually benign)
    const imageScore = 100 * (1 - (analysis.imageAnalysis.find(item => item.label === 'advertisement')?.score ?? 0));
  
    // Calculate title suspicion based on negative emotions
    const titleNegativeEmotions = analysis.titleAnalysis
      .filter(item => ['fear', 'anger', 'disgust', 'sadness'].includes(item.label))
      .reduce((sum, item) => sum + item.score, 0);
    const titleScore = 100 * titleNegativeEmotions;
  
    // Calculate description suspicion based on negative emotions
    const descriptionNegativeEmotions = analysis.descriptionAnalysis
      .filter(item => ['fear', 'anger', 'disgust', 'sadness'].includes(item.label))
      .reduce((sum, item) => sum + item.score, 0);
    const descriptionScore = 100 * descriptionNegativeEmotions;
  
    // Calculate weighted average
    const suspicionLevel = (
      imageScore * weights.image +
      titleScore * weights.title +
      descriptionScore * weights.description
    );
  
    // Round to 2 decimal places
    return Math.min(100, Math.max(0, Number(suspicionLevel.toFixed(2))));
  }
  