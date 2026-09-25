import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from './ui/Button';
import { Mic, Square, Loader2, Sparkles, Video, ShieldAlert, Play, LogOut, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFaceTracker } from '@/lib/useFaceTracker';

export function Interview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  
  // Track spoken question to avoid re-speaking on every render
  const spokenQuestionIdRef = useRef<string | null>(null);

  const { isReady: isTrackerReady, getMetricsAndReset } = useFaceTracker(videoRef, isRecording);

  // Auto-scroll chat when speech or submitting status updates
  useEffect(() => {
    if (isRecording || submitting) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [liveTranscript, isRecording, submitting]);

  // Callback ref to attach the media stream whenever any video element mounts
  const attachVideoRef = (element: HTMLVideoElement | null) => {
    (videoRef as any).current = element;
    if (element && streamRef.current) {
      if (element.srcObject !== streamRef.current) {
        element.srcObject = streamRef.current;
      }
      element.play().catch(err => {
        console.debug('Autoplay notice:', err);
      });
    }
  };

  useEffect(() => {
    fetchSession();
    
    // Automatically start the camera when the component mounts
    startCamera();

    // Cleanup function to stop camera and audio on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      window.speechSynthesis.cancel();
    };
  }, [id]);

  // Ensure video element receives stream when transitioning between pre-start and active states
  useEffect(() => {
    if (videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch(err => console.debug('Autoplay notice:', err));
    }
  }, [started]);

  const fetchSession = async () => {
    try {
      const res = await api.get(`/sessions/${id}`);
      setSession(res.data);
      setLoading(false);
      
      if (res.data.status === 'completed') {
        navigate(`/report/${id}`);
      }
    } catch (err) {
      console.error(err);
      navigate('/');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(err => console.debug('Autoplay notice:', err));
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Camera access is strictly required for this interview. Please grant permissions and reload.');
    }
  };

  const currentQuestion = session?.questions.find(
    (q: any) => !session.attempts.some((a: any) => a.questionId === q.faqQuestionId)
  );

  // Text-to-Speech Effect — only after started
  useEffect(() => {
    if (started && currentQuestion && spokenQuestionIdRef.current !== currentQuestion.faqQuestionId) {
      spokenQuestionIdRef.current = currentQuestion.faqQuestionId;
      
      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(currentQuestion.rephrasedText);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      
      window.speechSynthesis.speak(utterance);
    }
  }, [currentQuestion, started]);

  const startRecording = async () => {
    if (!streamRef.current) {
      alert("Camera is not active. Please grant permissions.");
      return;
    }

    try {
      // Record ONLY the audio track to keep file size compact (<1MB) and prevent hitting upload limits
      const audioTracks = streamRef.current.getAudioTracks();
      if (audioTracks.length === 0) {
        alert("Microphone track is not available. Please check microphone permissions.");
        return;
      }
      const audioStream = new MediaStream(audioTracks);

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : '';

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(audioStream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      // Stop speech synthesis if the user interrupts
      window.speechSynthesis.cancel();

      mediaRecorder.start(1000);
      setIsRecording(true);
      isRecordingRef.current = true;
      setLiveTranscript('');

      // Start Web Speech API for real-time live transcription
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onresult = (event: any) => {
            let fullTranscript = '';
            for (let i = 0; i < event.results.length; i++) {
              fullTranscript += event.results[i][0].transcript + ' ';
            }
            setLiveTranscript(fullTranscript.trim());
          };

          recognition.onerror = (event: any) => {
            console.debug('Speech recognition event:', event.error);
          };

          recognition.onend = () => {
            if (isRecordingRef.current) {
              try {
                recognition.start();
              } catch (e) {}
            }
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (e) {
          console.debug('Speech recognition initialization error:', e);
        }
      }
    } catch (err) {
      console.error('Error starting media recorder:', err);
      alert('Failed to start recording.');
    }
  };

  const stopRecordingAndSubmit = () => {
    isRecordingRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }

    if (!mediaRecorderRef.current) return;
    
    mediaRecorderRef.current.onstop = async () => {
      const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
      const audioBlob = new Blob(chunksRef.current, { type: mimeType });
      await submitAnswer(audioBlob);
    };
    
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const submitAnswer = async (mediaBlob: Blob) => {
    if (!session) return;
    setSubmitting(true);
    
    const formData = new FormData();
    const unansweredQuestion = currentQuestion;
    
    if (!unansweredQuestion) return;

    formData.append('questionId', unansweredQuestion.faqQuestionId);
    const filename = mediaBlob.type.includes('mp4') ? 'answer.mp4' : 'answer.webm';
    formData.append('audioBlob', mediaBlob, filename);
    
    // Retrieve real metrics computed by MediaPipe FaceLandmarker
    const visualMetrics = getMetricsAndReset();
    formData.append('visualMetrics', JSON.stringify(visualMetrics));
    
    // TODO: Audio prosody analysis not yet implemented.
    // These are placeholder values. Real implementation would use Web Audio API
    // to compute pitch/loudness from the audio stream, and derive speechRate
    // from (transcript word count / recording duration in minutes).
    // The fusion service currently references speechRate for pacing feedback,
    // so implementing real values here will unlock those report insights.
    const audioProsodyMetrics = {
      averagePitch: 150,
      pitchVariability: 30,
      averageLoudness: 60,
      loudnessVariability: 10,
      speechRate: 140,
      pauseCount: 0,
      totalPauseDuration: 0
    };
    formData.append('audioProsodyMetrics', JSON.stringify(audioProsodyMetrics));

    try {
      const res = await api.post(`/sessions/${id}/answers`, formData);
      setLiveTranscript('');
      if (res.data.sessionComplete) {
        navigate(`/report/${id}`);
      } else {
        await fetchSession(); // Refresh to get next question
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExit = () => {
    isRecordingRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
    // Stop any recording
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    // Stop camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    window.speechSynthesis.cancel();
    navigate('/');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>;
  }

  const answeredCount = session.attempts.length;
  const totalCount = session.questions.length;

  // ─── Pre-Start Screen ──────────────────────────────────────────────────────
  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-10 rounded-2xl w-full"
        >
          {/* Camera preview */}
          <div className="w-48 h-36 mx-auto rounded-xl overflow-hidden mb-8 border border-outline/20 bg-surface-container-lowest relative">
            <video
              ref={attachVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover -scale-x-100"
            />
            <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-surface-container-highest/90 backdrop-blur-md px-2 py-1 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[9px] font-label-caps text-green-500">LIVE</span>
            </div>
          </div>

          <h1 className="font-headline-lg text-on-surface text-2xl mb-3">Ready to Begin?</h1>
          <p className="text-on-surface-variant text-sm mb-2">
            This interview contains <span className="font-semibold text-on-surface">{totalCount} questions</span> in the <span className="font-semibold text-on-surface capitalize">{session.domainId.replace(/-/g, ' ')}</span> domain.
          </p>
          <p className="text-on-surface-variant text-xs mb-8 max-w-sm mx-auto leading-relaxed">
            Your camera and microphone will be active throughout. Speak clearly and maintain eye contact for the best analysis.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              className="h-12 px-8 rounded-full shadow-lg text-base"
              onClick={() => setStarted(true)}
              disabled={!isTrackerReady}
            >
              {!isTrackerReady ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Initializing Camera AI...</>
              ) : (
                <><Play className="h-4 w-4 mr-2" /> Begin Interview</>
              )}
            </Button>
            <Button
              variant="secondary"
              className="h-12 px-6 rounded-full"
              onClick={() => navigate('/')}
            >
              <LogOut className="h-4 w-4 mr-2" /> Go Back
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Main Interview UI ────────────────────────────────────────────────────
  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full max-w-6xl mx-auto py-6 relative">
      
      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={() => setShowExitConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel p-8 rounded-2xl max-w-sm w-full border border-outline/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-error/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-error" />
                </div>
                <h3 className="font-headline-md text-on-surface">Exit Interview?</h3>
              </div>
              <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
                You've answered <span className="font-semibold text-on-surface">{answeredCount}</span> of <span className="font-semibold text-on-surface">{totalCount}</span> questions. Your progress won't be saved if you leave now.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1 rounded-lg"
                  onClick={() => setShowExitConfirm(false)}
                >
                  Continue Interview
                </Button>
                <Button
                  className="flex-1 rounded-lg bg-error hover:bg-error/90 text-on-error"
                  onClick={handleExit}
                >
                  Exit
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Column: Chat History & Input */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="font-label-caps text-outline bg-surface-variant px-3 py-1 rounded">
              QUESTION {answeredCount + 1} OF {totalCount}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm font-code-block text-on-surface-variant">
              SESSION: {id?.slice(0, 8)}
            </div>
            <Button
              variant="ghost"
              className="h-8 px-3 text-xs text-error hover:bg-error/10 rounded-lg"
              onClick={() => setShowExitConfirm(true)}
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" /> Exit
            </Button>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {/* Chat History (Attempts) */}
          <div className="flex-1 overflow-y-auto space-y-6 mb-6 pb-6 border-b border-outline/10 pr-4">
            {session.attempts.map((attempt: any, idx: number) => {
              const q = session.questions.find((sq: any) => sq.faqQuestionId === attempt.questionId);
              return (
                <div key={idx} className="space-y-4">
                  <div className="glass-panel p-6 rounded-xl rounded-tl-sm bg-surface-container-high border-none">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="font-label-caps text-on-surface">COACH</span>
                    </div>
                    <p className="font-body-lg text-on-surface leading-relaxed">{q?.rephrasedText}</p>
                  </div>
                  
                  <div className="glass-panel p-6 rounded-xl rounded-tr-sm border-primary/20 bg-surface-tint/5 ml-12">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-label-caps text-primary">YOU</span>
                    </div>
                    <p className="font-body-md text-on-surface leading-relaxed text-on-surface-variant">
                      {attempt.transcript}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Current Question */}
            {currentQuestion && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-6 rounded-xl rounded-tl-sm bg-surface-container-highest border border-primary/20 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                  <span className="font-label-caps text-on-surface">COACH</span>
                </div>
                <p className="font-headline-md text-on-surface leading-relaxed">
                  {currentQuestion.rephrasedText}
                </p>
              </motion.div>
            )}

            {/* Live Transcription Bubble */}
            {isRecording && (
              <motion.div 
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="glass-panel p-6 rounded-xl rounded-tr-sm border-2 border-primary/40 bg-surface-tint/10 ml-8 shadow-lg relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-3 border-b border-primary/10 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-error"></span>
                    </span>
                    <span className="font-label-caps text-primary font-bold text-xs tracking-wider">YOU (LIVE TRANSCRIPT)</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-error/10 border border-error/20 px-2.5 py-1 rounded-full">
                    <div className="flex items-center gap-0.5 h-3">
                      <span className="w-0.5 h-2 bg-error rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-0.5 h-3 bg-error rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-0.5 h-2 bg-error rounded-full animate-bounce" />
                    </div>
                    <span className="text-[10px] font-mono text-error font-medium uppercase tracking-tight">Listening...</span>
                  </div>
                </div>
                
                {liveTranscript ? (
                  <div className="font-body-md text-on-surface leading-relaxed text-base">
                    <span>{liveTranscript}</span>
                    <span className="inline-block w-2 h-4 ml-1.5 bg-primary animate-pulse align-middle rounded-sm" />
                  </div>
                ) : (
                  <div className="font-body-md text-on-surface-variant/80 italic flex items-center gap-2 py-1">
                    <Mic className="h-4 w-4 text-primary animate-pulse shrink-0" />
                    <span>Speak now — your response is being transcribed live...</span>
                  </div>
                )}
              </motion.div>
            )}

            {submitting && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-panel p-6 rounded-xl rounded-tr-sm border-primary/20 bg-surface-tint/5 ml-8 flex items-center justify-center gap-4"
              >
                <Loader2 className="animate-spin h-6 w-6 text-primary" />
                <span className="text-on-surface-variant text-base font-medium">Analyzing response and generating feedback...</span>
              </motion.div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Input Area */}
          <div className="pt-2 pb-4">
            <div className="flex justify-center">
              {!isRecording ? (
                <Button 
                  className="h-14 px-8 rounded-full shadow-lg text-lg w-full max-w-sm"
                  onClick={startRecording}
                  disabled={submitting || !currentQuestion || !isTrackerReady}
                >
                  <Mic className="h-5 w-5 mr-2" />
                  {!isTrackerReady ? "Initializing Camera AI..." : "Start Answering"}
                </Button>
              ) : (
                <Button 
                  variant="secondary"
                  className="h-14 px-8 rounded-full border-error text-error hover:bg-error/10 w-full max-w-sm"
                  onClick={stopRecordingAndSubmit}
                >
                  <Square className="h-5 w-5 mr-2 fill-current" />
                  Finish Answer
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Webcam Preview — fixed size, sticky */}
      <div className="w-full lg:w-80 flex-shrink-0">
        <div className="lg:sticky lg:top-6">
          <div className="glass-panel rounded-xl overflow-hidden relative bg-surface-container-lowest border border-outline/20" style={{ height: '320px' }}>
            <video
              ref={attachVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover -scale-x-100"
            />
          
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-surface-container-highest/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-outline/20">
              <Video className="h-3 w-3 text-secondary" />
              <span className="text-xs font-label-caps text-secondary">ACTIVE</span>
            </div>

            {isRecording && (
              <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-surface-container-highest/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-error/50">
                <div className="flex items-center gap-0.5 h-3">
                  <span className="w-0.5 h-2 bg-error rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-0.5 h-3 bg-error rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-0.5 h-2 bg-error rounded-full animate-bounce" />
                </div>
                <span className="text-xs font-label-caps text-error">REC • LIVE</span>
              </div>
            )}
          
            {/* Notice to user that camera is enforced */}
            <div className="absolute bottom-0 left-0 right-0 bg-surface-container-highest/95 border-t border-outline/20 p-3 flex items-start gap-3">
               <ShieldAlert className="h-4 w-4 text-primary shrink-0 mt-0.5" />
               <p className="text-xs font-body-sm text-on-surface-variant leading-tight">
                 Camera is required and locked on during the interview for behavioral analysis.
               </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
