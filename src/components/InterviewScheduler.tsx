import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Candidate } from '@/src/types';
import { CalendarIcon, Clock, Users, Video } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface InterviewSchedulerProps {
  candidate: Candidate | null;
  isOpen: boolean;
  onClose: () => void;
  onScheduled: (candidateId: string, date: Date) => void;
}

export function InterviewScheduler({ candidate, isOpen, onClose, onScheduled }: InterviewSchedulerProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState('10:00');
  const [type, setType] = useState('technical');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!candidate) return null;

  const handleSchedule = () => {
    if (!date) return;
    
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      toast.success(`Interview scheduled for ${candidate.name} on ${format(date, 'MMM d')} at ${time}`);
      onScheduled(candidate.id, date);
      setIsSubmitting(false);
      onClose();
    }, 1200);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] rounded-2xl border-slate-200 shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 bg-slate-50/50 border-b border-slate-200">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-800">
            <CalendarIcon className="h-5 w-5 text-indigo-600" /> Initialize Protocol
          </DialogTitle>
          <DialogDescription className="text-xs font-medium text-slate-500">
            Provisioning interview session for {candidate.name}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Session Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white text-xs font-semibold">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technical" className="text-xs font-medium">Technical Screening</SelectItem>
                <SelectItem value="culture" className="text-xs font-medium">Culture Fit</SelectItem>
                <SelectItem value="manager" className="text-xs font-medium">Hiring Manager</SelectItem>
                <SelectItem value="offer" className="text-xs font-medium">Offer Discussion</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Calendar Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full h-10 rounded-xl border-slate-200 justify-start text-left text-xs font-semibold bg-white",
                      !date && "text-slate-400"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5 text-indigo-500" />
                    {date ? format(date, "PPP") : <span>Select date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-xl border-slate-200 shadow-xl">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Node Time</Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-indigo-500" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="09:00" className="text-xs">09:00 AM</SelectItem>
                  <SelectItem value="10:00" className="text-xs">10:00 AM</SelectItem>
                  <SelectItem value="11:00" className="text-xs">11:00 AM</SelectItem>
                  <SelectItem value="13:00" className="text-xs">01:00 PM</SelectItem>
                  <SelectItem value="14:00" className="text-xs">02:00 PM</SelectItem>
                  <SelectItem value="15:00" className="text-xs">03:00 PM</SelectItem>
                  <SelectItem value="16:00" className="text-xs">04:00 PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
              <Video className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">Transport Layer</p>
              <p className="text-xs font-bold text-indigo-900">Google Meet (Auto-Provisioned)</p>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 bg-slate-50 border-t border-slate-200 gap-2">
          <Button variant="ghost" className="text-xs font-bold text-slate-400" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleSchedule} disabled={isSubmitting || !date} className="h-10 px-8 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold shadow-lg shadow-indigo-100">
            {isSubmitting ? 'Provisioning...' : 'Confirm Invite'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
