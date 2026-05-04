import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Candidate } from '@/src/types';
import { 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Mail, 
  Phone, 
  FileText,
  Brain,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';

interface CandidateDetailsProps {
  candidate: Candidate | null;
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (candidate: Candidate) => void;
}

export function CandidateDetails({ candidate, isOpen, onClose, onSchedule }: CandidateDetailsProps) {
  if (!candidate) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border-slate-200 shadow-2xl p-0">
        <div className="bg-slate-50/50 p-8 border-b border-slate-200 relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 rounded-2xl bg-white flex items-center justify-center text-3xl font-bold text-slate-800 shadow-sm border border-slate-200">
                {candidate.name[0]}
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">{candidate.name}</DialogTitle>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white px-2 py-0.5 rounded border border-slate-200"><Mail className="h-3 w-3" /> {candidate.email}</span>
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white px-2 py-0.5 rounded border border-slate-200"><FileText className="h-3 w-3" /> Semantic Data Verified</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Agent Score</div>
              <div className={`text-4xl font-black ${candidate.score! > 75 ? 'text-emerald-500' : candidate.score! > 50 ? 'text-indigo-500' : 'text-slate-400'}`}>
                {candidate.score}<span className="text-xs font-normal ml-0.5">%</span>
              </div>
            </div>
          </div>
          {/* Subtle grid pattern for technical feel */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
          <div className="space-y-6">
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                <Brain className="h-3.5 w-3.5 text-indigo-500" /> Intent Analysis
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 italic font-medium">
                "{candidate.matchReasoning}"
              </p>
            </div>

            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Detected Tokens
              </h4>
              <div className="flex flex-wrap gap-2">
                {candidate.skills.map((skill, i) => (
                  <Badge key={i} variant="secondary" className="bg-white text-slate-600 border-slate-200 px-3 py-1 text-[10px] font-bold uppercase tracking-tighter">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
             <div className="p-4 border rounded-xl bg-slate-50/50 space-y-4 border-slate-100">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-indigo-500" /> Execution Chain
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600">
                    <div className="h-5 w-5 rounded-lg bg-emerald-500 flex items-center justify-center text-white text-[10px] shadow-sm">✓</div>
                    <span className="flex-1">Profile Received</span>
                    <span className="text-[10px] text-slate-300 uppercase font-bold">{format(new Date(candidate.appliedDate), 'MMM d')}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600">
                    <div className="h-5 w-5 rounded-lg bg-emerald-500 flex items-center justify-center text-white text-[10px] shadow-sm">✓</div>
                    <span className="flex-1">Semantic Screening Complete</span>
                    <span className="text-[10px] text-slate-300 uppercase font-bold">{format(new Date(candidate.appliedDate), 'MMM d')}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-medium text-slate-400">
                    <div className="h-5 w-5 rounded-lg border border-slate-200" />
                    <span className="flex-1">Interview Protocol</span>
                    <span className="text-[10px] text-slate-300 uppercase font-bold">Await</span>
                  </div>
                </div>
             </div>

             <div className="p-5 border rounded-xl bg-indigo-600 space-y-4 border-none shadow-lg shadow-indigo-100">
                <h4 className="text-[10px] font-bold text-white/70 uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5" /> Agent Recommendation
                </h4>
                <p className="text-[11px] text-white/90 leading-relaxed font-medium">Strong architectural alignment in React. System suggests immediate progression to interview phase.</p>
                <Button className="w-full h-10 gap-2 group bg-white text-indigo-600 hover:bg-slate-50 font-bold text-xs" onClick={() => onSchedule(candidate)}>
                  Initialize Interview <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </Button>
             </div>
          </div>
        </div>

        <DialogFooter className="bg-slate-50 border-t border-slate-200 p-4 gap-2">
          <Button variant="ghost" className="text-xs font-bold text-slate-400" onClick={onClose}>Exit View</Button>
          <div className="flex-1" />
          <Button variant="outline" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-rose-600 hover:bg-rose-50 border-slate-200 h-9">Reject</Button>
          <Button variant="outline" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border-slate-200 h-9">Advance</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
