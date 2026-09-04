import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from './ui/Button';
import { Mic, Square, Loader2, Sparkles, Video, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFaceTracker } from '@/lib/useFaceTracker';

export function Interview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isRecording, setIsRecording] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Track spoken question to avoid re-speaking on every render
  const spokenQuestionIdRef = useRef<string | null>(null);

  const { isReady: isTrackerReady, getMetricsAndReset } = useFaceTracker(videoRef, isRecording);

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
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Camera access is strictly required for this interview. Please grant permissions and reload.');
    }
  };

  const currentQuestion = session?.questions.find(
    (q: any) => !session.attempts.some((a: any) => a.questionId === q.faqQuestionId)
  );

  // Text-to-Speech Effect
  useEffect(() => {
    if (currentQuestion && spokenQuestionIdRef.current !== currentQuestion.faqQuestionId) {
      spokenQuestionIdRef.current = currentQuestion.faqQuestionId;
      
      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(currentQuestion.rephrasedText);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      
      window.speechSynthesis.speak(utterance);
    }
  }, [currentQuestion]);

  const startRecording = async () => {
    if (!streamRef.current) {
      alert("Camera is not active. Please grant permissions.");
      return;
    }

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      // Stop speech synthesis if the user interrupts
      window.speechSynthesis.cancel();

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting media recorder:', err);
      alert('Failed to start recording.');
    }
  };

  const stopRecordingAndSubmit = () => {
    if (!mediaRecorderRef.current) return;
    
    mediaRecorderRef.current.onstop = async () => {
      const mediaBlob = new Blob(chunksRef.current, { type: 'video/webm' });
      await submitAnswer(mediaBlob);
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
    formData.append('audioBlob', mediaBlob, 'answer.webm');
    
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

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>;
  }

  const answeredCount = session.attempts.length;
  const totalCount = session.questions.length;

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full max-w-6xl mx-auto py-6">
      
      {/* Left Column: Chat History & Input */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="font-label-caps text-outline bg-surface-variant px-3 py-1 rounded">
              QUESTION {answeredCount + 1} OF {totalCount}
            </div>
          </div>
          <div className="text-sm font-code-block text-on-surface-variant">
            SESSION: {id?.slice(0, 8)}
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

            {submitting && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-panel p-6 rounded-xl rounded-tr-sm border-primary/20 bg-surface-tint/5 ml-12 flex items-center justify-center gap-4"
              >
                <Loader2 className="animate-spin h-6 w-6 text-primary" />
                <span className="text-on-surface-variant text-base font-medium">Analyzing response and generating feedback...</span>
              </motion.div>
            )}
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

      {/* Right Column: Webcam Preview */}
      <div className="w-full lg:w-80 flex flex-col gap-4">
        <div className="glass-panel rounded-xl overflow-hidden aspect-[3/4] lg:aspect-auto lg:flex-1 relative bg-surface-container-lowest border border-outline/20">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-surface-container-highest/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-outline/20">
            <Video className="h-3 w-3 text-secondary" />
            <span className="text-xs font-label-caps text-secondary">ACTIVE</span>
          </div>

          {isRecording && (
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-surface-container-highest/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-error/50">
              <div className="w-2 h-2 rounded-full bg-error animate-pulse" />
              <span className="text-xs font-label-caps text-error">REC</span>
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
  );
}
