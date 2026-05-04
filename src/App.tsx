import React, { useState, useEffect } from 'react';
import { Candidate } from './types';
import { CVUpload } from './components/CVUpload';
import { CandidateDetails } from './components/CandidateDetails';
import { InterviewScheduler } from './components/InterviewScheduler';
import { db, OperationType, handleFirestoreError } from './lib/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  setDoc,
} from 'firebase/firestore';
import { useFirebase } from './lib/FirebaseProvider';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  FileText, 
  CheckCircle2, 
  Calendar, 
  Search,
  Settings,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  LogIn,
  LogOut,
  Loader2,
  MoreVertical
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Toaster } from '@/components/ui/sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function App() {
  const { user, loading, isLoggingIn, login, logout } = useFirebase();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobDescription, setJobDescription] = useState<string>(
    "We are looking for a Senior Frontend Engineer to build high-performance React applications. Requirements: 5+ years React, 3+ years TypeScript, experience with Vite, Tailwind CSS, and cloud deployment. Passion for UX and animation is a plus."
  );
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // UI State
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  const [jobEditorOpen, setJobEditorOpen] = useState(false);
  const [tempJD, setTempJD] = useState(jobDescription);

  // Fetch job config
  useEffect(() => {
    if (!user) return;
    const configRef = doc(db, 'config', 'current_jd');
    const unsub = onSnapshot(configRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setJobDescription(data.description);
        setTempJD(data.description);
      }
    }, (error) => {
      console.warn("Job config not found or permission denied");
    });
    return unsub;
  }, [user]);

  // Fetch candidates
  useEffect(() => {
    if (!user) {
      setCandidates([]);
      return;
    }

    const q = query(collection(db, 'candidates'), orderBy('score', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Candidate));
      setCandidates(docs);
    }, (error) => {
      if (error.message.includes("permission-denied")) {
        console.error("Access denied to candidates list. Are you an admin?");
        toast.error("Permission denied. Only authorized HR can view candidates.");
      } else {
        handleFirestoreError(error, OperationType.LIST, 'candidates');
      }
    });

    return unsub;
  }, [user]);

  const saveJD = async () => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'config', 'current_jd'), {
        title: "Senior Frontend Developer",
        description: tempJD,
        updatedAt: new Date().toISOString()
      });
      setJobEditorOpen(false);
      toast.success("Job description updated successfully.");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'config/current_jd');
    }
  };

  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'shortlisted') return matchesSearch && c.status === 'SHORTLISTED';
    if (activeTab === 'pending') return matchesSearch && (c.status === 'PENDING' || c.status === 'SCREENED');
    if (activeTab === 'scheduled') return matchesSearch && c.status === 'INTERVIEW_SCHEDULED';
    return matchesSearch;
  });

  const addCandidate = async (candidate: Candidate) => {
    try {
      await setDoc(doc(db, 'candidates', candidate.id), candidate);
      if (candidate.score! > 85) {
        setSelectedCandidate(candidate);
        setDetailsOpen(true);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `candidates/${candidate.id}`);
    }
  };

  const handleRowClick = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setDetailsOpen(true);
  };

  const openScheduler = (candidate: Candidate) => {
    setDetailsOpen(false);
    setSelectedCandidate(candidate);
    setSchedulerOpen(true);
  };

  const handleScheduled = async (id: string, date: Date) => {
    try {
      await updateDoc(doc(db, 'candidates', id), {
        status: 'INTERVIEW_SCHEDULED',
        interviewDate: date.toISOString()
      });
      setSchedulerOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `candidates/${id}`);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background">
        <div className="bg-white p-12 rounded-3xl shadow-xl border border-slate-200 max-w-md w-full text-center space-y-8">
           <div className="bg-indigo-600 h-16 w-16 rounded-2xl flex items-center justify-center text-white font-bold text-3xl mx-auto shadow-lg shadow-indigo-200">C</div>
           <div>
              <h1 className="text-2xl font-bold tracking-tight mb-2">CipherHR</h1>
              <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Autonomous Talent Screening</p>
           </div>
           <Button 
             onClick={login} 
             disabled={isLoggingIn}
             className="w-full py-6 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all"
           >
              {isLoggingIn ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              {isLoggingIn ? 'Authenticating...' : 'Authenticate with Google'}
           </Button>
           <div className="flex items-center gap-2 justify-center">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-agent-glow"></div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Cloud Agent Online</p>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans text-slate-900 pb-20">
      <Toaster position="top-right" richColors />
      
      {/* Detail Dialogs */}
      <CandidateDetails 
        candidate={selectedCandidate} 
        isOpen={detailsOpen} 
        onClose={() => setDetailsOpen(false)}
        onSchedule={openScheduler}
      />
      
      <InterviewScheduler
        candidate={selectedCandidate}
        isOpen={schedulerOpen}
        onClose={() => setSchedulerOpen(false)}
        onScheduled={handleScheduled}
      />

      {/* Job Editor Dialog */}
      <Dialog open={jobEditorOpen} onOpenChange={setJobEditorOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-xl border-slate-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Pipeline Settings</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium">
              Updating the semantic core used by the screening agent.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="jd" className="mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Job Logic / Requirements</Label>
            <textarea
              id="jd"
              className="w-full h-48 p-4 rounded-xl border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
              value={tempJD}
              onChange={(e) => setTempJD(e.target.value)}
              placeholder="Describe the role requirements..."
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" className="text-xs font-bold" onClick={() => setJobEditorOpen(false)}>Discard</Button>
            <Button onClick={saveJD} className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700">Update Weights</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-0 h-full w-64 border-r border-slate-200 bg-white flex flex-col p-4 shrink-0 z-20 hidden lg:flex">
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">C</div>
          <span className="font-bold text-lg tracking-tight">CipherHR</span>
        </div>
        
        <nav className="space-y-1 flex-1">
          <Button variant="ghost" className="w-full justify-start gap-3 py-2.5 px-4 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-semibold group">
            <Users className="h-4 w-4" /> Agent Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 py-2.5 px-4 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-semibold">
            <FileText className="h-4 w-4" /> All Candidates
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 py-2.5 px-4 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-semibold">
            <Calendar className="h-4 w-4" /> Scheduled
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 py-2.5 px-4 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-semibold">
            <Settings className="h-4 w-4" /> Pipeline Settings
          </Button>
        </nav>

        <div className="mt-auto p-4 bg-slate-50 rounded-xl border border-slate-100 group cursor-pointer hover:bg-slate-100 transition-colors" onClick={logout}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-agent-glow"></div>
            <span className="text-[10px] font-bold uppercase text-slate-500">Agent Active</span>
          </div>
          <div className="flex items-center gap-2 mt-3">
             <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600 overflow-hidden">
                {user.photoURL ? <img src={user.photoURL} alt="User" /> : (user.displayName?.[0] || 'U')}
             </div>
             <div className="flex-1 min-w-0">
               <div className="text-[11px] font-bold text-slate-900 truncate uppercase tracking-tighter">{user.displayName || 'Admin'}</div>
             </div>
             <LogOut className="h-3 w-3 text-slate-300" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 flex flex-col min-h-screen">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-lg font-bold tracking-tight text-slate-800">Candidate Screening Agent</h1>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter leading-none mb-1">Active Pipeline</p>
              <p className="text-xs font-bold text-slate-700 leading-none">Senior Product Designer (SF-102)</p>
            </div>
            <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-400 border border-slate-200 text-[11px] shadow-sm">JD</div>
          </div>
        </header>

        <div className="p-6 grid grid-cols-12 gap-6 max-w-[1400px] mx-auto w-full">
          {/* Left Column */}
          <div className="col-span-12 xl:col-span-8 flex flex-col gap-6">
            <CVUpload onCandidateAdded={addCandidate} jobDescription={jobDescription} />

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
              <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2">Screening Queue</span>
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-slate-200/50 p-0.5 rounded-lg border border-slate-200">
                    <TabsList className="bg-transparent h-7">
                      <TabsTrigger value="all" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm px-3 text-[10px] font-bold">All</TabsTrigger>
                      <TabsTrigger value="shortlisted" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm px-3 text-[10px] font-bold">Top Match</TabsTrigger>
                      <TabsTrigger value="scheduled" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm px-3 text-[10px] font-bold">Scheduled</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div className="relative w-40 hidden lg:block">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                  <Input 
                    placeholder="Quick find..." 
                    className="pl-8 h-7 rounded-lg text-xs bg-white border-slate-200 shadow-none focus-visible:ring-primary/20"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/30">
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="py-2.5 font-bold text-[9px] text-slate-400 uppercase tracking-widest pl-6">Profile Details</TableHead>
                      <TableHead className="py-2.5 font-bold text-[9px] text-slate-400 uppercase tracking-widest">Match Index</TableHead>
                      <TableHead className="py-2.5 font-bold text-[9px] text-slate-400 uppercase tracking-widest text-right pr-6">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout" initial={false}>
                      {filteredCandidates.map((candidate) => (
                        <motion.tr
                          layout
                          key={candidate.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => handleRowClick(candidate)}
                          className={`group hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 ${
                            candidate.score! > 90 ? 'bg-indigo-50/20' : ''
                          }`}
                        >
                          <TableCell className="py-3 pl-6">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-500 text-xs">
                                {candidate.name[0]}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-slate-700 leading-none mb-1">{candidate.name}</div>
                                <div className="text-[10px] text-slate-400 font-medium">Applied {format(new Date(candidate.appliedDate), 'MMM d')}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-1 w-16 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div 
                                  className={`h-full ${candidate.score! > 75 ? 'bg-emerald-500' : candidate.score! > 50 ? 'bg-indigo-500' : 'bg-slate-300'}`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${candidate.score}%` }}
                                />
                              </div>
                              <span className={`font-bold text-xs ${candidate.score! > 75 ? 'text-emerald-600' : 'text-slate-500'}`}>{candidate.score}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                             <div className="flex items-center justify-end gap-3">
                               <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tighter ${
                                 candidate.status === 'SHORTLISTED' 
                                   ? 'bg-emerald-100 text-emerald-700' 
                                   : candidate.status === 'INTERVIEW_SCHEDULED'
                                   ? 'bg-indigo-100 text-indigo-700'
                                   : 'bg-slate-100 text-slate-500'
                               }`}>
                                 {candidate.status.replace('_', ' ')}
                               </span>
                               <ChevronRight className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                             </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                    {filteredCandidates.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="h-32 text-center text-slate-400 italic text-[11px]">
                          Empty State: No candidates found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-start">
                <div>
                   <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pipeline Health</h3>
                   <div className="text-2xl font-black text-slate-800">8.4<span className="text-xs text-slate-400 font-normal ml-1">/ 10</span></div>
                </div>
                <div className="h-8 w-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                   <Sparkles className="h-4 w-4 text-indigo-600" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                   <div className="text-xl font-bold text-slate-800">{candidates.length}</div>
                   <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Total Pool</div>
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                   <div className="text-xl font-bold text-indigo-600">{candidates.filter(c => c.score! > 80).length}</div>
                   <div className="text-[9px] font-bold text-indigo-400 uppercase tracking-tighter mt-1 text-indigo-600">Top Match</div>
                </div>
              </div>

              <div className="p-4 border border-dashed rounded-xl bg-slate-50/30 space-y-3 group relative overflow-hidden">
                 <div className="flex justify-between items-center relative z-10">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Weights</h4>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {setTempJD(jobDescription); setJobEditorOpen(true);}}>
                       <Settings className="h-3 w-3 text-slate-300 hover:text-indigo-500 transition-colors" />
                    </Button>
                 </div>
                 <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-4 italic relative z-10 border-l-2 border-indigo-200 pl-3">
                   "{jobDescription}"
                 </p>
                 <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 rotate-12">
                   <FileText className="h-10 w-10 text-indigo-600" />
                 </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
               <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Calendar className="h-3.5 w-3.5 text-emerald-500" /> Recent Logic Triggers
               </h3>
               <div className="space-y-4">
                 {candidates.slice(0, 3).map((c, i) => (
                   <div key={i} className="flex gap-3 items-start relative pl-1.5">
                      <div className="absolute left-0 top-1 bottom-0 w-[1px] bg-slate-100" />
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 border border-white relative z-10 ring-2 ring-emerald-50 shadow-agent-glow" />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                           <p className="text-xs font-bold text-slate-700 truncate">{c.name}</p>
                           <span className="text-[9px] font-bold text-emerald-600">{c.score}% Match</span>
                        </div>
                        <p className="text-[10px] text-slate-400 italic">Screened {format(new Date(c.appliedDate), 'HH:mm')}</p>
                      </div>
                   </div>
                 ))}
               </div>
               <Button className="w-full mt-4 text-[11px] font-bold py-5 bg-slate-900 border-none hover:bg-slate-800 shadow-sm transition-all">
                  Confirm Agent Results
               </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

