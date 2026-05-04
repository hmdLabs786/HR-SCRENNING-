import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { extractTextFromPDF } from '@/src/lib/pdf';
import { screenCandidate } from '@/src/lib/ai';
import { Candidate, ScreeningResult } from '@/src/types';
import { toast } from 'sonner';

interface CVUploadProps {
  onCandidateAdded: (candidate: Candidate) => void;
  jobDescription: string;
}

export function CVUpload({ onCandidateAdded, jobDescription }: CVUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [currentFile, setCurrentFile] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    if (!jobDescription) {
      toast.error('Please provide a job description first');
      return;
    }

    try {
      setIsUploading(true);
      setCurrentFile(file.name);
      
      toast.info(`Processing ${file.name}...`);
      
      const resumeText = await extractTextFromPDF(file);
      const screening: ScreeningResult = await screenCandidate(resumeText, jobDescription);

      const newCandidate: Candidate = {
        id: Math.random().toString(36).substring(7),
        name: file.name.replace('.pdf', ''),
        email: 'extract@from.resume', // In a real app, I'd extract this with AI too
        status: screening.score > 70 ? 'SHORTLISTED' : 'SCREENED',
        score: screening.score,
        matchReasoning: screening.reasoning,
        skills: screening.skillsMatch,
        resumeText: resumeText,
        appliedDate: new Date().toISOString(),
      };

      onCandidateAdded(newCandidate);
      toast.success(`${file.name} processed successfully! Score: ${screening.score}`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to process resume. Please try again.');
    } finally {
      setIsUploading(false);
      setCurrentFile(null);
    }
  };

  return (
    <Card className="border-dashed border-2 border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer group relative overflow-hidden rounded-xl">
      <CardContent className="p-8 flex flex-col items-center justify-center space-y-4">
        <div className="p-3 bg-indigo-50 rounded-xl group-hover:scale-110 transition-transform shadow-sm">
          {isUploading ? (
            <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
          ) : (
            <Upload className="h-6 w-6 text-indigo-600" />
          )}
        </div>
        <div className="text-center">
          <h3 className="text-sm font-bold text-slate-800">{isUploading ? `Analyzing ${currentFile}` : 'Ingest Candidate Profile'}</h3>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-1">
            {isUploading ? 'Agent extracting semantic tokens' : 'Drop PDF Resume to begin screening'}
          </p>
        </div>
        {!isUploading && (
          <div className="relative pt-2">
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={handleFileUpload}
              accept=".pdf"
              disabled={isUploading}
            />
            <Button variant="outline" className="text-xs font-bold px-8 h-9 rounded-lg border-slate-200 group-hover:bg-white group-hover:border-indigo-200" disabled={isUploading}>
              Browse Files
            </Button>
          </div>
        )}
        
        {/* Animated background subtle effect */}
        {isUploading && (
          <motion.div 
            className="absolute inset-0 bg-indigo-50/30 -z-10"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
        )}
      </CardContent>
    </Card>
  );
}
