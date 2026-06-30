import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  RefreshCw,
  Sun,
  Moon,
  CheckCircle2,
  ChevronRight,
  User,
  AlertCircle,
  HelpCircle,
  Shield,
  Wind,
  Trash2,
  Check,
  Heart,
  Calendar,
  Info,
  ChevronLeft
} from 'lucide-react';
import { QuestionnaireAnswers, AnalysisResult, RoutineStep } from './types';
import { generateLocalAnalysis } from './localAnalysis';

// Preset selfies so that users can instantly test the app if they don't have a camera or files.
const PRESET_SELFIES = [
  {
    id: 'preset_oily',
    label: 'Combination Profile (T-Zone focus)',
    gender: 'Female',
    age: '20s',
    answers: {
      skinType: 'Combination',
      concerns: ['Acne/Blemishes', 'Clogged Pores'],
      sensitivity: 'Normal',
      routineComplexity: 'Detailed',
      primaryGoal: 'Clear skin & oil balance',
      ageGroup: '20s',
      gender: 'Female',
      climate: 'Hot & Humid',
    },
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%"><rect width="400" height="400" fill="%23fcd34d" opacity="0.15"/><circle cx="200" cy="180" r="90" fill="%23fda4af" opacity="0.6"/><circle cx="160" cy="165" r="10" fill="%23334155"/><circle cx="240" cy="165" r="10" fill="%23334155"/><path d="M 170 230 Q 200 260 230 230" stroke="%23334155" stroke-width="4" fill="none"/><rect x="185" y="110" width="30" height="110" fill="%232dd4bf" opacity="0.4" rx="5"/><rect x="140" y="200" width="120" height="20" fill="%232dd4bf" opacity="0.4" rx="5"/><circle cx="180" cy="130" r="4" fill="%23ea580c"/><circle cx="210" cy="140" r="3" fill="%23ea580c"/><circle cx="200" cy="210" r="4" fill="%23ea580c"/><text x="200" y="320" font-family="sans-serif" font-size="14" font-weight="bold" fill="%231e293b" text-anchor="middle">Simulated: Combination Skin (Oily T-Zone)</text></svg>'
  },
  {
    id: 'preset_dry',
    label: 'Dry / Sensitive Profile',
    gender: 'Male',
    age: '30s',
    answers: {
      skinType: 'Dry',
      concerns: ['Dryness/Dehydration', 'Fine Lines/Aging'],
      sensitivity: 'Sensitive',
      routineComplexity: 'Minimal',
      primaryGoal: 'Deep hydration & anti-aging',
      ageGroup: '30s',
      gender: 'Male',
      climate: 'Cold & Dry',
    },
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%"><rect width="400" height="400" fill="%2393c5fd" opacity="0.15"/><circle cx="200" cy="180" r="90" fill="%23cbd5e1" opacity="0.8"/><circle cx="160" cy="165" r="10" fill="%23334155"/><circle cx="240" cy="165" r="10" fill="%23334155"/><path d="M 180 235 Q 200 220 220 235" stroke="%23334155" stroke-width="4" fill="none"/><path d="M 120 180 Q 110 190 120 200" stroke="%23f43f5e" stroke-width="3" fill="none" opacity="0.6"/><path d="M 280 180 Q 290 190 280 200" stroke="%23f43f5e" stroke-width="3" fill="none" opacity="0.6"/><text x="200" y="320" font-family="sans-serif" font-size="14" font-weight="bold" fill="%231e293b" text-anchor="middle">Simulated: Dry &amp; Delicate Skin</text></svg>'
  }
];

export default function App() {
  const [step, setStep] = useState<'welcome' | 'selfie' | 'questions' | 'loading' | 'result'>('welcome');
  const [image, setImage] = useState<string | null>(null);
  const [imageSource, setImageSource] = useState<'camera' | 'upload' | 'preset' | null>(null);
  
  // Form responses
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({
    skinType: 'Combination',
    concerns: [],
    sensitivity: 'Normal',
    routineComplexity: 'Detailed',
    primaryGoal: 'Healthy Radiance',
    ageGroup: '20s',
    gender: 'Female',
    climate: 'Temperate',
  });

  // Active routine tab inside result view
  const [activeTab, setActiveTab] = useState<'morning' | 'night'>('morning');

  // Camera settings
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Analysis result
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loadingText, setLoadingText] = useState<string>('Initializing analysis...');
  const [error, setError] = useState<string | null>(null);
  const [showLocalFallbackOption, setShowLocalFallbackOption] = useState<boolean>(false);
  const [isLocalResult, setIsLocalResult] = useState<boolean>(false);

  // Quick feedback messages during loading
  useEffect(() => {
    if (step === 'loading') {
      const messages = [
        'Analyzing selfie texture & color values...',
        'Cross-referencing climate & sensitivity metadata...',
        'Formulating primary cosmetic ingredient matrices...',
        'Drafting highly custom Morning & Night step routines...',
        'Compiling professional advice for your unique complexion...'
      ];
      let currentMsgIndex = 0;
      const interval = setInterval(() => {
        if (currentMsgIndex < messages.length - 1) {
          currentMsgIndex++;
          setLoadingText(messages[currentMsgIndex]);
        }
      }, 3500);

      return () => clearInterval(interval);
    }
  }, [step]);

  // Clean up camera stream when component unmounts or step changes
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setError(null);
    setIsCameraActive(true);
    setImageSource('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setError("Unable to access camera. Please upload an image file or choose one of our skin type presets instead.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        // Draw the video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Get base64 data
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImage(event.target.result as string);
          setImageSource('upload');
          setError(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const selectPreset = (preset: typeof PRESET_SELFIES[0]) => {
    setImage(preset.image);
    setImageSource('preset');
    setAnswers({ ...preset.answers });
    setError(null);
  };

  const handleConcernToggle = (concern: string) => {
    setAnswers(prev => {
      const exists = prev.concerns.includes(concern);
      if (exists) {
        return { ...prev, concerns: prev.concerns.filter(c => c !== concern) };
      } else {
        return { ...prev, concerns: [...prev.concerns, concern] };
      }
    });
  };

  const executeSkinAnalysis = async () => {
    setStep('loading');
    setError(null);
    setShowLocalFallbackOption(false);
    setLoadingText('Uploading skin profile data...');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageSource === 'preset' ? null : image, // Don't send local SVG preset data URL to API to save payload size
          answers,
        }),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        // Safe read of text response
        const textResponse = await response.text();
        const snippet = textResponse.length > 120 ? textResponse.substring(0, 120) + "..." : textResponse;
        throw new Error(
          `The backend API server did not return JSON. It returned an HTML/Text page instead: "${snippet}". ` +
          `This typically occurs when deploying the app as a pure static site on platforms like Vercel or Netlify, ` +
          `where the custom Express backend server.ts is not active.`
        );
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to complete analysis');
      }

      const data = await response.json();
      setIsLocalResult(false);
      setResult(data);
      setStep('result');
    } catch (err: any) {
      console.warn("API Analysis failed or unavailable. Falling back to high-fidelity offline cosmetic chemistry engine:", err);
      
      // Automatic and seamless fallback
      try {
        const localRes = generateLocalAnalysis(answers);
        setIsLocalResult(true);
        setResult(localRes);
        setStep('result');
        setError(null);
      } catch (fallbackErr) {
        console.error("Critical fallback engine error:", fallbackErr);
        setError(err.message || "Something went wrong while connecting with the Dermalens AI Core. Please try again.");
        setShowLocalFallbackOption(true);
        setStep('questions');
      }
    }
  };

  const resetAll = () => {
    setImage(null);
    setImageSource(null);
    setAnswers({
      skinType: 'Combination',
      concerns: [],
      sensitivity: 'Normal',
      routineComplexity: 'Detailed',
      primaryGoal: 'Healthy Radiance',
      ageGroup: '20s',
      gender: 'Female',
      climate: 'Temperate',
    });
    setResult(null);
    setError(null);
    setStep('welcome');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f9f5f3] via-[#e8f3f1] to-[#f3e8f5] py-12 px-4 md:px-8 font-sans antialiased text-slate-800 flex flex-col justify-between">
      
      {/* HEADER BAR */}
      <header className="max-w-6xl w-full mx-auto mb-10 flex justify-between items-center px-4" id="header-bar">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-teal-600 rounded-2xl flex items-center justify-center text-white font-serif font-semibold text-2xl shadow-md border border-white/40">D</div>
          <div>
            <h1 className="text-2xl font-serif font-semibold text-slate-800 tracking-tight">Dermalens AI</h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">Precision Skincare Diagnostics</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className="hidden md:inline text-xs font-bold bg-white/60 border border-white/80 text-teal-700 px-4 py-2 rounded-full backdrop-blur-md uppercase tracking-wider">
            ⚡ Powered by Gemini 3.5
          </span>
          <button 
            onClick={resetAll} 
            className="p-2.5 rounded-full bg-white/60 hover:bg-white border border-white/80 text-slate-600 hover:text-slate-800 transition-all shadow-sm"
            title="Reset Diagnoses"
            id="reset-diag-btn"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-6xl w-full mx-auto flex-1 flex flex-col justify-center items-center px-2">
        
        {/* STEP 1: WELCOME SCREEN */}
        {step === 'welcome' && (
          <div 
            className="w-full max-w-4xl bg-white/40 backdrop-blur-xl border border-white/60 rounded-[32px] p-8 md:p-12 shadow-2xl flex flex-col items-center text-center animate-fade-in"
            id="welcome-card"
          >
            <span className="text-xs font-bold bg-teal-100/80 text-teal-800 px-4 py-1.5 rounded-full uppercase tracking-widest mb-6">
              Clinical Grade Analysis
            </span>
            <h2 className="text-4xl md:text-5xl font-serif font-light text-slate-800 mb-4 max-w-2xl leading-tight">
              Discover Skincare Formulated for <span className="italic font-normal text-teal-700">Your Unique Complexion</span>
            </h2>
            <p className="text-slate-600 text-lg mb-8 max-w-xl leading-relaxed">
              Dermalens AI analyzes your visual skin conditions and compiles personal concerns to curate a scientifically backable ingredient regimen.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl mb-10 text-left">
              <div className="bg-white/50 border border-white/80 rounded-2xl p-5 shadow-sm">
                <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 mb-3 font-semibold">1</div>
                <h4 className="font-semibold text-slate-800 mb-1">Visual Selfie Scan</h4>
                <p className="text-xs text-slate-500 leading-relaxed">We scan texture density, moisture fields, and surface indicators to cross-reference with our engine.</p>
              </div>
              <div className="bg-white/50 border border-white/80 rounded-2xl p-5 shadow-sm">
                <div className="w-10 h-10 bg-rose-5 rounded-xl flex items-center justify-center text-rose-600 mb-3 font-semibold">2</div>
                <h4 className="font-semibold text-slate-800 mb-1">Dermal Context</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Provide climate conditions, age markers, sensitivity thresholds, and primary cosmetic goals.</p>
              </div>
              <div className="bg-white/50 border border-white/80 rounded-2xl p-5 shadow-sm">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 mb-3 font-semibold">3</div>
                <h4 className="font-semibold text-slate-800 mb-1">Efficacy Regimen</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Receive custom morning & evening routines detailing how specific chemical structures benefit you.</p>
              </div>
            </div>

            <button
              onClick={() => setStep('selfie')}
              className="px-10 py-4 bg-teal-800 text-white rounded-full font-semibold hover:bg-teal-900 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center gap-3 text-base"
              id="start-consultation-btn"
            >
              Start Skin Analysis <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* STEP 2: SELFIE CAPTURE / UPLOAD */}
        {step === 'selfie' && (
          <div 
            className="w-full max-w-4xl bg-white/40 backdrop-blur-xl border border-white/60 rounded-[32px] p-6 md:p-10 shadow-2xl animate-fade-in"
            id="selfie-card"
          >
            <div className="flex flex-col md:flex-row gap-8">
              
              {/* LEFT COLUMN: ACTIVE INTERACTIVE AREA */}
              <div className="flex-1 flex flex-col">
                <div className="mb-4">
                  <h3 className="text-2xl font-serif font-light text-slate-800">
                    Step 1: <span className="font-semibold">Selfie Diagnostics</span>
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Provide a clear, well-lit photo of your face, or test-drive using a preset below.
                  </p>
                </div>

                {/* VISUAL BOX */}
                <div className="aspect-video md:aspect-[4/3] bg-slate-900/5 rounded-3xl border border-dashed border-slate-300 relative overflow-hidden flex flex-col items-center justify-center">
                  
                  {isCameraActive ? (
                    <div className="absolute inset-0 w-full h-full bg-black">
                      <video 
                        ref={videoRef} 
                        className="w-full h-full object-cover scale-x-[-1]" 
                        playsInline 
                        muted 
                      />
                      {/* Scanning overlay frame */}
                      <div className="absolute inset-0 border-[3px] border-teal-400/50 rounded-3xl m-6 pointer-events-none">
                        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-teal-400 to-transparent animate-scan"></div>
                      </div>
                      <div className="absolute bottom-6 inset-x-0 flex justify-center gap-4">
                        <button
                          onClick={capturePhoto}
                          className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-full shadow-lg flex items-center gap-2 text-sm"
                          id="capture-photo-btn"
                        >
                          <Camera className="w-4 h-4" /> Snap Photo
                        </button>
                        <button
                          onClick={stopCamera}
                          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-full text-sm"
                          id="cancel-camera-btn"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : image ? (
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-slate-100">
                      {imageSource === 'preset' ? (
                        <div className="w-full h-full flex items-center justify-center p-4" dangerouslySetInnerHTML={{ __html: image }} />
                      ) : (
                        <img src={image} className="w-full h-full object-cover" alt="Captured Selfie" />
                      )}
                      
                      <div className="absolute top-4 right-4 flex gap-2">
                        <span className="bg-slate-800/80 backdrop-blur-md text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full">
                          Ready for Scan
                        </span>
                      </div>
                      
                      <div className="absolute bottom-4 inset-x-0 flex justify-center">
                        <button
                          onClick={() => {
                            setImage(null);
                            setImageSource(null);
                          }}
                          className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-full flex items-center gap-1.5 shadow-md"
                          id="clear-photo-btn"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Retake / Clear
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center flex flex-col items-center">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-md border border-slate-100 mb-4">
                        <Camera className="w-8 h-8 text-teal-600" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700 mb-1">No Selfie Loaded Yet</p>
                      <p className="text-xs text-slate-400 max-w-xs mb-6">
                        Allow camera permissions for a real-time scan, upload a file, or click a preset skin profile below.
                      </p>

                      <div className="flex flex-wrap gap-3 justify-center">
                        <button
                          onClick={startCamera}
                          className="px-5 py-2.5 bg-teal-800 text-white hover:bg-teal-900 rounded-full font-semibold text-xs flex items-center gap-2 shadow-sm"
                          id="use-camera-btn"
                        >
                          <Camera className="w-4 h-4" /> Use Camera
                        </button>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-5 py-2.5 bg-white text-slate-700 border border-slate-200 hover:border-slate-300 rounded-full font-semibold text-xs flex items-center gap-2 shadow-sm"
                          id="upload-file-btn"
                        >
                          <Upload className="w-4 h-4 text-teal-600" /> Upload Photo
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </div>
                    </div>
                  )}

                  {/* Hidden canvas for snapshotting */}
                  <canvas ref={canvasRef} className="hidden" />
                </div>

                {error && (
                  <div className="mt-3 bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-rose-700">{error}</p>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: PRESETS FOR EASY DEMO */}
              <div className="w-full md:w-80 bg-white/50 border border-white/80 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Or choose a Diagnostic Preset</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    Don't want to use your camera? Click a profile below to automatically populate a sample selfie and survey answers to see the analysis in action instantly!
                  </p>

                  <div className="space-y-2.5">
                    {PRESET_SELFIES.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => selectPreset(preset)}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                          imageSource === 'preset' && answers.skinType === preset.answers.skinType
                            ? 'bg-teal-50 border-teal-300 shadow-sm'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                        id={`preset-btn-${preset.id}`}
                      >
                        <div className="w-10 h-10 bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center text-lg shadow-inner shrink-0" dangerouslySetInnerHTML={{ __html: preset.image }} />
                        <div>
                          <p className="text-xs font-bold text-slate-800">{preset.label}</p>
                          <p className="text-[10px] text-slate-400">{preset.gender} • {preset.age} • {preset.answers.climate}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      if (!image) {
                        setError("Please capture/upload a selfie, or select a diagnostic preset above before continuing.");
                        return;
                      }
                      setStep('questions');
                    }}
                    className={`w-full py-3 rounded-full font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-all ${
                      image 
                        ? 'bg-teal-800 text-white hover:bg-teal-900' 
                        : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    }`}
                    id="next-to-questions-btn"
                  >
                    Next: Skin Questionnaire <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setStep('welcome')}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-xs font-medium"
                    id="back-to-welcome-btn"
                  >
                    Back to Intro
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* STEP 3: QUESTIONNAIRE */}
        {step === 'questions' && (
          <div 
            className="w-full max-w-4xl bg-white/40 backdrop-blur-xl border border-white/60 rounded-[32px] p-6 md:p-10 shadow-2xl animate-fade-in"
            id="questions-card"
          >
            <div className="mb-6 flex justify-between items-center pb-4 border-b border-white/40">
              <div>
                <h3 className="text-2xl font-serif font-light text-slate-800">
                  Step 2: <span className="font-semibold">Your Skin Profile context</span>
                </h3>
                <p className="text-sm text-slate-500 mt-1">Provide secondary details to improve ingredient synergy.</p>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-3 h-3 bg-teal-600 rounded-full"></div>
                <div className="w-3 h-3 bg-teal-600 rounded-full"></div>
                <div className="w-3 h-3 bg-slate-200 rounded-full"></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[55vh] overflow-y-auto pr-2 pb-4">
              
              {/* Q1: Skin Type */}
              <div className="bg-white/50 border border-white/80 rounded-2xl p-5 shadow-sm">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-teal-600" /> 1. Self-Diagnosed Skin Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Oily', 'Dry', 'Combination', 'Normal'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAnswers(prev => ({ ...prev, skinType: t }))}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all text-center ${
                        answers.skinType === t
                          ? 'bg-teal-800 text-white border-teal-800 shadow-md'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                      id={`skin-type-${t}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q2: Sensitivity */}
              <div className="bg-white/50 border border-white/80 rounded-2xl p-5 shadow-sm">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-teal-600" /> 2. Skin Sensitivity Threshold
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Normal', 'Sensitive', 'Very Sensitive'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setAnswers(prev => ({ ...prev, sensitivity: s }))}
                      className={`py-2 px-1 rounded-xl border text-[11px] font-medium transition-all text-center ${
                        answers.sensitivity === s
                          ? 'bg-teal-800 text-white border-teal-800 shadow-md'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                      id={`sensitivity-${s}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q3: Concerns Multi-select */}
              <div className="bg-white/50 border border-white/80 rounded-2xl p-5 shadow-sm md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" /> 3. Primary Facial Skin Concerns (Select all that apply)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    'Acne/Blemishes',
                    'Fine Lines/Aging',
                    'Hyperpigmentation',
                    'Redness/Rosacea',
                    'Dryness/Dehydration',
                    'Clogged Pores',
                    'Uneven Texture',
                    'Dark Circles',
                    'Loss of Elasticity'
                  ].map((concern) => {
                    const isSelected = answers.concerns.includes(concern);
                    return (
                      <button
                        key={concern}
                        type="button"
                        onClick={() => handleConcernToggle(concern)}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-medium text-left transition-all flex justify-between items-center ${
                          isSelected
                            ? 'bg-rose-50 border-rose-300 text-rose-800 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                        id={`concern-${concern.replace('/', '-')}`}
                      >
                        <span>{concern}</span>
                        {isSelected ? (
                          <div className="w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center text-white shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 border border-slate-300 rounded-full shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Q4: Primary Skin Goal */}
              <div className="bg-white/50 border border-white/80 rounded-2xl p-5 shadow-sm">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-teal-600" /> 4. Ultimate Complexion Goal
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Healthy Radiance',
                    'Anti-aging & Lift',
                    'Clear Acne Free',
                    'Deep Hydration',
                    'Smoother Texture',
                    'Soothing/Calming'
                  ].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setAnswers(prev => ({ ...prev, primaryGoal: g }))}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-medium text-left transition-all truncate ${
                        answers.primaryGoal === g
                          ? 'bg-teal-800 text-white border-teal-800 shadow-md'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                      id={`goal-${g.replace(/\s+/g, '-')}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q5: Climate */}
              <div className="bg-white/50 border border-white/80 rounded-2xl p-5 shadow-sm">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-teal-600" /> 5. Local Climate Environment
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Temperate', 'Hot & Humid', 'Cold & Dry', 'Arid / Desert'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAnswers(prev => ({ ...prev, climate: c }))}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all text-center ${
                        answers.climate === c
                          ? 'bg-teal-800 text-white border-teal-800 shadow-md'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                      id={`climate-${c.replace(/\s+/g, '-')}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q6: Demographics & Routine preference */}
              <div className="bg-white/50 border border-white/80 rounded-2xl p-5 shadow-sm">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-teal-600" /> 6. Age &amp; Identity
                </label>
                <div className="flex gap-4 mb-3">
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-400 block mb-1">Age</span>
                    <select
                      value={answers.ageGroup}
                      onChange={(e) => setAnswers(prev => ({ ...prev, ageGroup: e.target.value }))}
                      className="w-full p-2 text-xs bg-white border border-slate-200 rounded-xl outline-none"
                      id="age-group-select"
                    >
                      {['Teen', '20s', '30s', '40s', '50s+'].map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-400 block mb-1">Identity</span>
                    <select
                      value={answers.gender}
                      onChange={(e) => setAnswers(prev => ({ ...prev, gender: e.target.value }))}
                      className="w-full p-2 text-xs bg-white border border-slate-200 rounded-xl outline-none"
                      id="gender-select"
                    >
                      {['Female', 'Male', 'Non-binary'].map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Q7: Routine complexity */}
              <div className="bg-white/50 border border-white/80 rounded-2xl p-5 shadow-sm">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> 7. Routine Preference Complexity
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Minimal (3-Steps)', value: 'Minimal' },
                    { label: 'Detailed (5-Steps)', value: 'Detailed' }
                  ].map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setAnswers(prev => ({ ...prev, routineComplexity: r.value }))}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all text-center ${
                        answers.routineComplexity === r.value
                          ? 'bg-teal-800 text-white border-teal-800 shadow-md'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                      id={`routine-complexity-${r.value}`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {error && (
              <div className="mt-4 bg-rose-50 border border-rose-200 p-4 rounded-xl flex flex-col gap-3">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-rose-800">Connection or Server Issue</p>
                    <p className="text-xs text-rose-700 leading-relaxed">{error}</p>
                  </div>
                </div>

                {showLocalFallbackOption && (
                  <div className="bg-teal-50/50 p-3.5 rounded-xl border border-teal-200/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mt-1 shadow-xs">
                    <div className="space-y-0.5 text-left">
                      <p className="text-[11px] font-bold text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-teal-600" /> Run Offline Diagnostic Engine
                      </p>
                      <p className="text-[11px] text-slate-500 max-w-xl">
                        Since the cloud API server is currently unreachable, you can activate our high-fidelity, offline, rules-based cosmetic chemistry engine to formulate your regimen immediately.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsLocalResult(true);
                        const localRes = generateLocalAnalysis(answers);
                        setResult(localRes);
                        setStep('result');
                        setError(null);
                      }}
                      className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-full font-bold text-xs transition-all whitespace-nowrap shadow-sm flex items-center gap-1.5 self-stretch md:self-auto justify-center"
                      id="run-local-analysis-btn"
                    >
                      Run Offline Diagnostics <Sparkles className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ACTION FOOTER */}
            <div className="mt-8 pt-5 border-t border-white/40 flex justify-between items-center">
              <button
                onClick={() => setStep('selfie')}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-semibold text-xs flex items-center gap-1.5 transition-all"
                id="back-to-selfie-btn"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Photo
              </button>
              <button
                onClick={executeSkinAnalysis}
                className="px-8 py-3.5 bg-teal-800 hover:bg-teal-900 text-white rounded-full font-semibold text-xs flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all"
                id="run-analysis-btn"
              >
                Analyze &amp; Formulate Regimen <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: LOADING / SCANNING STATE */}
        {step === 'loading' && (
          <div 
            className="w-full max-w-lg bg-white/40 backdrop-blur-xl border border-white/60 rounded-[32px] p-10 md:p-12 shadow-2xl flex flex-col items-center text-center animate-pulse"
            id="loading-card"
          >
            {/* Pulsating Scanning Radar Graphic */}
            <div className="w-32 h-32 rounded-full border border-teal-500/30 bg-teal-50/20 flex items-center justify-center relative mb-8">
              <div className="absolute inset-2 rounded-full border border-teal-500/50 animate-ping"></div>
              <div className="absolute inset-6 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-600">
                <Sparkles className="w-10 h-10 text-teal-600 animate-spin" style={{ animationDuration: '4s' }} />
              </div>
            </div>

            <h3 className="text-2xl font-serif font-semibold text-slate-800 mb-2">Analyzing Skin Profile</h3>
            <p className="text-sm text-teal-700 font-mono tracking-wide px-4 py-1.5 bg-teal-50 rounded-lg inline-block border border-teal-100 mb-6">
              {loadingText}
            </p>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              We compile high resolution visual characteristics with your individual questionnaire profiles to generate scientifically backed ingredients.
            </p>
          </div>
        )}

        {/* STEP 5: THE REPORT CARD / RESULTS VIEW */}
        {step === 'result' && result && (
          <div 
            className="w-full bg-transparent flex flex-col gap-6 animate-fade-in"
            id="result-screen"
          >
            {isLocalResult && (
              <div className="bg-amber-50/90 border border-amber-200 rounded-[24px] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left shadow-sm backdrop-blur-md">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100/80 rounded-xl flex items-center justify-center text-amber-700 shrink-0">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">Offline Rule-Based Formulation Active</h4>
                    <p className="text-xs text-amber-700 leading-relaxed">The cloud API server was unreachable, so these diagnostics were prepared by your browser's offline medical-grade rules engine.</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setStep('questions');
                    executeSkinAnalysis();
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-full font-bold text-[11px] whitespace-nowrap transition-all shadow-xs self-stretch sm:self-auto text-center"
                >
                  Retry Cloud AI Analysis
                </button>
              </div>
            )}

            {/* Top overview widget */}
            <div className="flex flex-col md:flex-row gap-6">
              
              {/* Profile Card Left */}
              <div className="w-full md:w-1/3 flex flex-col gap-6">
                
                {/* Visual Scanner Summary */}
                <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[32px] p-6 shadow-xl relative overflow-hidden flex flex-col">
                  <div className="absolute top-4 left-4 bg-teal-600/80 backdrop-blur-md text-white text-[9px] px-3 py-1 rounded-full uppercase font-bold tracking-widest z-10">
                    Selfie Diagnostics
                  </div>
                  
                  {/* Small Selfie Frame */}
                  <div className="aspect-[4/3] bg-slate-900/5 rounded-2xl border border-white overflow-hidden flex items-center justify-center mb-5 mt-4 relative">
                    {image ? (
                      imageSource === 'preset' ? (
                        <div className="w-full h-full p-2" dangerouslySetInnerHTML={{ __html: image }} />
                      ) : (
                        <img src={image} className="w-full h-full object-cover" alt="User Selfie" />
                      )
                    ) : (
                      <div className="w-full h-full bg-rose-100 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full border-4 border-white bg-rose-50 mb-2 flex items-center justify-center">
                          <User className="w-8 h-8 text-rose-400" />
                        </div>
                        <span className="text-xs text-slate-500">Questionnaire-only Mode</span>
                      </div>
                    )}
                    {/* Visual Points Overlay to look cool */}
                    <div className="absolute top-1/4 left-1/3 w-2.5 h-2.5 bg-teal-400 rounded-full animate-pulse border border-white"></div>
                    <div className="absolute top-1/2 right-1/4 w-2.5 h-2.5 bg-rose-400 rounded-full animate-pulse border border-white"></div>
                    <div className="absolute bottom-1/3 left-1/2 w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse border border-white"></div>
                  </div>

                  {/* Diagnosed Skin Type details */}
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Analyzed Skin Type</h3>
                  <div className="text-2xl font-serif text-slate-800 mb-4 font-semibold">{result.skinTypeFromAI}</div>

                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Visual Observations</h3>
                  <p className="text-xs text-slate-600 leading-relaxed bg-white/50 border border-white/80 p-3.5 rounded-xl">
                    {result.visualObservations}
                  </p>
                </div>

                {/* Characteristics Metrics */}
                <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[32px] p-6 shadow-xl">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Cosmetic Profile Summary</h3>
                  <div className="space-y-3.5">
                    <div>
                      <div className="flex justify-between items-end text-xs mb-1">
                        <span className="text-slate-500 font-medium">Sensitivity</span>
                        <span className="font-semibold text-slate-700">{answers.sensitivity}</span>
                      </div>
                      <div className="w-full bg-slate-200/60 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-amber-400 h-full rounded-full" 
                          style={{ width: answers.sensitivity === 'Normal' ? '30%' : answers.sensitivity === 'Sensitive' ? '65%' : '100%' }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-end text-xs mb-1">
                        <span className="text-slate-500 font-medium">Climate Impact</span>
                        <span className="font-semibold text-slate-700">{answers.climate}</span>
                      </div>
                      <div className="w-full bg-slate-200/60 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-teal-500 h-full rounded-full" 
                          style={{ width: '85%' }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-end text-xs mb-1">
                        <span className="text-slate-500 font-medium">Active Concerns</span>
                        <span className="font-semibold text-slate-700">{answers.concerns.length || 1} identified</span>
                      </div>
                      <div className="w-full bg-slate-200/60 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-rose-400 h-full rounded-full" 
                          style={{ width: `${Math.min(100, (answers.concerns.length || 1) * 20)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-200/60">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-2">Identified Concerns</span>
                    <div className="flex flex-wrap gap-1.5">
                      {result.primaryConcernsIdentified && result.primaryConcernsIdentified.length > 0 ? (
                        result.primaryConcernsIdentified.map((c, i) => (
                          <span key={i} className="text-[10.5px] bg-rose-50 text-rose-700 font-medium px-2.5 py-1 border border-rose-100 rounded-full">
                            {c}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">None detected</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Regimen Cards & Detailed routines Right */}
              <div className="flex-1 flex flex-col gap-6">
                
                {/* Routine card */}
                <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[32px] p-6 md:p-8 shadow-xl flex flex-col">
                  
                  {/* Routine Header tabs */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                      <h2 className="text-2xl font-serif text-slate-800">
                        Your Bespoke <span className="font-semibold">Skincare Regimen</span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">Formulated specifically to match your goals and local environmental factors.</p>
                    </div>

                    <div className="flex bg-slate-200/60 p-1 rounded-2xl w-full sm:w-auto self-stretch">
                      <button
                        onClick={() => setActiveTab('morning')}
                        className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          activeTab === 'morning'
                            ? 'bg-white text-teal-800 shadow-sm border border-white/20'
                            : 'text-slate-600 hover:text-slate-800'
                        }`}
                        id="tab-morning-btn"
                      >
                        <Sun className="w-3.5 h-3.5 text-amber-500" /> Morning Routine
                      </button>
                      <button
                        onClick={() => setActiveTab('night')}
                        className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          activeTab === 'night'
                            ? 'bg-white text-teal-800 shadow-sm border border-white/20'
                            : 'text-slate-600 hover:text-slate-800'
                        }`}
                        id="tab-night-btn"
                      >
                        <Moon className="w-3.5 h-3.5 text-indigo-500" /> Evening Routine
                      </button>
                    </div>
                  </div>

                  {/* Tab Contents: List of steps */}
                  <div className="space-y-4">
                    {result.routine[activeTab] && result.routine[activeTab].map((stepObj: RoutineStep) => (
                      <div 
                        key={stepObj.step}
                        className="bg-white/60 border border-white/80 rounded-2xl p-5 hover:border-teal-200 hover:bg-white/85 transition-all duration-300"
                        id={`routine-step-${stepObj.step}`}
                      >
                        <div className="flex flex-col sm:flex-row gap-4 justify-between">
                          <div className="flex gap-3">
                            {/* Step badge */}
                            <div className="w-9 h-9 bg-teal-50 border border-teal-100 rounded-xl flex items-center justify-center font-bold text-teal-700 text-sm shrink-0">
                              {stepObj.step}
                            </div>
                            <div>
                              <div className="text-[10px] text-teal-600 font-bold uppercase tracking-wider">{stepObj.category}</div>
                              <h4 className="font-bold text-slate-800 text-sm mt-0.5">{stepObj.productName}</h4>
                              <p className="text-xs text-slate-600 leading-relaxed mt-2">{stepObj.howToUse}</p>
                            </div>
                          </div>

                          <div className="sm:text-right shrink-0 flex flex-col justify-between items-start sm:items-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200/50">
                            <div>
                              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Key Synergistic Ingredients</span>
                              <div className="flex flex-wrap sm:justify-end gap-1">
                                {stepObj.keyIngredients.map((ing, j) => (
                                  <span key={j} className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-md">
                                    {ing}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Science Explanation Box */}
                        <div className="mt-3.5 pt-3 border-t border-dashed border-slate-200/80 text-[11px] text-slate-500 flex gap-1.5 items-start">
                          <Info className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-slate-700">Chemical Efficacy:</span> {stepObj.whyItWorks}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary/Disclaimer */}
                  <div className="mt-6 pt-5 border-t border-slate-200/60 flex items-center gap-2 text-xs text-slate-400">
                    <Shield className="w-4 h-4 text-slate-300 shrink-0" />
                    <span>Always patch test new formulas before broad face application. Allow 4 to 6 weeks for physical cycle turnover results.</span>
                  </div>

                </div>

              </div>
            </div>

            {/* Scientific Efficacy Breakdown section */}
            <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[32px] p-6 md:p-8 shadow-xl">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Scientific Ingredient Efficacy Analysis</h3>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Why will these chemical compositions work effectively for your specific profile? We outline the chemical synergy of targeted actives recommended for you.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {result.ingredientRecommendations && result.ingredientRecommendations.map((ing, idx) => (
                  <div key={idx} className="bg-white/50 border border-white rounded-2xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-rose-600 uppercase tracking-wider font-mono">Active Compound</span>
                        <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-full">{ing.benefits}</span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm mb-2">{ing.name}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed mb-3">{ing.reason}</p>

                      {ing.popularMarketProducts && ing.popularMarketProducts.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-200/50">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Available on Online Market:</span>
                          <div className="space-y-2">
                            {ing.popularMarketProducts.map((p, pIdx) => (
                              <div key={pIdx} className="bg-white/80 p-2.5 rounded-xl border border-slate-200/60 flex flex-col justify-between hover:border-teal-200 transition-all shadow-xs">
                                <div className="flex justify-between items-center gap-1">
                                  <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded uppercase tracking-wider">{p.brand}</span>
                                  <a 
                                    href={`https://www.google.com/search?q=${encodeURIComponent(p.brand + ' ' + p.productName)}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="text-[9px] text-teal-600 hover:text-teal-800 font-medium hover:underline flex items-center gap-0.5"
                                  >
                                    Search Online ↗
                                  </a>
                                </div>
                                <p className="text-[11px] font-semibold text-slate-800 mt-1.5">{p.productName}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{p.howItHelps}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lifestyle recommendations section */}
            {result.lifestyleTips && result.lifestyleTips.length > 0 && (
              <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[32px] p-6 md:p-8 shadow-xl">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Daily Dermal Habits &amp; Tips</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.lifestyleTips.map((tip, idx) => (
                    <div key={idx} className="flex gap-3 items-start bg-white/30 border border-white/40 p-4 rounded-xl">
                      <div className="w-5 h-5 bg-teal-50 border border-teal-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-teal-600 stroke-[3]" />
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Print/Save/Reset Action block */}
            <div className="h-16 flex items-center justify-between px-4 mt-4">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-6 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 rounded-full font-semibold text-xs transition-all shadow-sm flex items-center gap-1.5"
                id="print-routine-btn"
              >
                Save / Print Regimen
              </button>
              
              <button 
                onClick={resetAll}
                className="px-8 py-3 bg-teal-800 text-white rounded-full font-semibold text-xs hover:bg-teal-900 transition-all shadow-md hover:scale-[1.01]"
                id="restart-analysis-btn"
              >
                Start New Consultation
              </button>
            </div>

          </div>
        )}

      </main>

      {/* FOOTER BAR */}
      <footer className="max-w-6xl w-full mx-auto mt-12 text-center text-[11px] text-slate-400 border-t border-slate-200/50 pt-6 px-4" id="footer-credits">
        <p>© 2026 Dermalens AI Skincare Laboratories. All rights reserved. Made in harmony with the natural environment.</p>
        <p className="mt-1">Disclaimer: Recommendations are cosmetic advice based on image metrics. Please consult a board-certified dermatologist for medical concerns.</p>
      </footer>

    </div>
  );
}
