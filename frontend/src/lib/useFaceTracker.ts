import { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export function useFaceTracker(videoRef: React.RefObject<HTMLVideoElement | null>, isRecording: boolean) {
  const [isReady, setIsReady] = useState(false);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  
  // Metrics accumulation
  const metricsRef = useRef({
    totalFrames: 0,
    facesDetected: 0,
    lookingAwayFrames: 0,
    fidgetCount: 0,
    lastPitch: 0,
    lastYaw: 0
  });

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        if (!active) return;
        const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU"
          },
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: true,
          runningMode: "VIDEO",
          numFaces: 1
        });
        if (!active) return;
        landmarkerRef.current = faceLandmarker;
        setIsReady(true);
      } catch (err) {
        console.error("Failed to initialize FaceLandmarker:", err);
      }
    };
    init();
    return () => {
      active = false;
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (!isRecording || !isReady || !videoRef.current) return;
    
    let animationFrameId: number;
    let lastVideoTime = -1;
    let consecutiveErrors = 0;
    
    const track = () => {
      const video = videoRef.current;
      if (
        video &&
        video.readyState >= 2 && // HTMLMediaElement.HAVE_CURRENT_DATA
        video.videoWidth > 0 &&
        video.videoHeight > 0 &&
        !video.paused &&
        !video.ended &&
        video.currentTime !== lastVideoTime &&
        consecutiveErrors < 10
      ) {
        lastVideoTime = video.currentTime;
        
        try {
          if (landmarkerRef.current) {
            const results = landmarkerRef.current.detectForVideo(video, performance.now());
            metricsRef.current.totalFrames++;
            consecutiveErrors = 0;
            
            if (results && results.faceLandmarks && results.faceLandmarks.length > 0) {
              metricsRef.current.facesDetected++;
              
              // Check facial transformation matrix for head pose (looking down/away)
              if (results.facialTransformationMatrixes && results.facialTransformationMatrixes.length > 0) {
                const matrix = results.facialTransformationMatrixes[0].data;
                // Extract basic pitch and yaw from the rotation matrix
                const pitch = Math.asin(-matrix[6]); // Approx pitch
                const yaw = Math.atan2(matrix[2], matrix[10]); // Approx yaw
                
                // If pitch is significantly downward (reading phone) or yaw is away
                if (pitch < -0.2 || Math.abs(yaw) > 0.3) {
                  metricsRef.current.lookingAwayFrames++;
                }
                
                // Fidgeting (rapid head movement)
                const pitchDelta = Math.abs(pitch - metricsRef.current.lastPitch);
                const yawDelta = Math.abs(yaw - metricsRef.current.lastYaw);
                
                if (pitchDelta > 0.08 || yawDelta > 0.08) {
                  metricsRef.current.fidgetCount++;
                }
                
                metricsRef.current.lastPitch = pitch;
                metricsRef.current.lastYaw = yaw;
              }
            }
          }
        } catch (err) {
          consecutiveErrors++;
          // Safe catch to prevent crashing requestAnimationFrame loop
          if (consecutiveErrors <= 2) {
            console.debug("Face landmark tracking frame skipped:", err);
          }
        }
      }
      animationFrameId = requestAnimationFrame(track);
    };
    
    track();
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isRecording, isReady, videoRef]);

  const getMetricsAndReset = () => {
    const { totalFrames, facesDetected, lookingAwayFrames, fidgetCount } = metricsRef.current;
    
    // Calculate final scores
    const facePresence = totalFrames > 0 ? facesDetected / totalFrames : 0;
    const eyeContact = facesDetected > 0 ? 1 - (lookingAwayFrames / facesDetected) : 0;
    const fidgetScore = totalFrames > 0 ? Math.min(1, fidgetCount / (totalFrames / 30)) : 0; // Normalized roughly to seconds
    
    const visualMetrics = {
      averageGazeScore: facePresence < 0.2 ? 0 : Math.max(0, eyeContact),
      postureScore: facePresence, // Use face presence as a proxy for posture (in frame vs out of frame)
      fidgetingScore: fidgetScore,
      smileFrequency: 0.1, // Cannot easily compute without blendshapes, default low
      headMovementScore: fidgetScore
    };
    
    // Reset
    metricsRef.current = {
      totalFrames: 0,
      facesDetected: 0,
      lookingAwayFrames: 0,
      fidgetCount: 0,
      lastPitch: 0,
      lastYaw: 0
    };
    
    return visualMetrics;
  };

  return { isReady, getMetricsAndReset };
}
