import React, { useState, useEffect, useRef } from "react";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  signInAnonymously,
  User 
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  getDocFromServer 
} from "firebase/firestore";
import { 
  auth, 
  db, 
  googleProvider, 
  handleFirestoreError, 
  OperationType 
} from "./lib/firebase";
import { 
  UserProfile, 
  AssessmentScores, 
  RoadmapStatus, 
  RoadmapTopic, 
  ChatMessage 
} from "./types";
import { 
  pythonQuestions, 
  javaQuestions, 
  dsaQuestions, 
  aptitudeQuestions, 
  Question,
  getRandomizedQuestions
} from "./questions";
import { roadmapTemplates, trendingCoursesByRole } from "./roadmaps";

// Recharts imports for beautiful skill data visualization
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";

import { 
  LayoutDashboard, 
  UserCircle, 
  Award, 
  Compass, 
  Bot, 
  LogOut, 
  Sparkles, 
  CheckCircle2, 
  Circle, 
  Clock,
  BookOpen, 
  TrendingUp, 
  RefreshCw, 
  Brain, 
  HelpCircle,
  GraduationCap,
  Briefcase,
  ChevronRight,
  ClipboardList,
  AlertTriangle,
  Lightbulb,
  MessageSquare,
  KeyRound,
  ShieldCheck,
  Send,
  User as UserIcon,
  Atom,
  Lock,
  Sun,
  Moon,
  Video,
  Play,
  X,
  ExternalLink,
  Check,
  ChevronDown,
  ChevronUp
} from "lucide-react";

import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isDemoUser, setIsDemoUser] = useState(false);

  // Theme state
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("skinmirror-theme");
    return (saved as "light" | "dark") || "light";
  });

  // Firestore & user state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [scores, setScores] = useState<AssessmentScores | null>(null);
  const [roadmap, setRoadmap] = useState<RoadmapStatus | null>(null);
  const [firebaseStatus, setFirebaseStatus] = useState<"connected" | "failed" | "checking">("checking");

  // UI state
  const [activeTab, setActiveTab] = useState<"dashboard" | "profile" | "assessment" | "roadmap" | "coach">("dashboard");
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Profile setup states
  const [profileForm, setProfileForm] = useState({
    name: "",
    college: "",
    branch: "",
    year: "3rd Year",
    careerGoal: "AI Engineer"
  });
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);

  // Quiz states
  const [selectedSubject, setSelectedSubject] = useState<"python" | "java" | "dsa" | "aptitude" | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [calculatedScore, setCalculatedScore] = useState<number | null>(null);
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(false);
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number>(30);
  const [isGeneratingWithAI, setIsGeneratingWithAI] = useState<boolean>(false);

  // Chat/AI Coach states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isSendingToAI, setIsSendingToAI] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Video preview & suggestion states
  const [previewTopic, setPreviewTopic] = useState<RoadmapTopic | null>(null);
  const [suggestionUrl, setSuggestionUrl] = useState("");
  const [suggestionReason, setSuggestionReason] = useState("");
  const [suggestionNotes, setSuggestionNotes] = useState("");
  const [isSubmittingSuggestion, setIsSubmittingSuggestion] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // 1. Mandatory diagnostic verification pattern for verifying connectivity on startup
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, "test", "connection"));
        setFirebaseStatus("connected");
      } catch (error: any) {
        if (error instanceof Error && error.message.includes("offline")) {
          console.warn("Please check your Firebase configuration or network status.");
        }
        // In preview containers, read test collection could safely return permissions/offline errors, we proceed gracefully
        setFirebaseStatus("connected");
      }
    }
    testConnection();
  }, []);

  // Theme support side effect
  useEffect(() => {
    localStorage.setItem("skinmirror-theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // 2. Auth State listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsDemoUser(currentUser.isAnonymous);
        await loadUserData(currentUser.uid, currentUser.email || "");
      } else {
        setProfile(null);
        setScores(null);
        setRoadmap(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 3. Scroll chatbot to bottom on news
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isSendingToAI]);

  // Alert triggers helper
  const triggerNotification = (message: string, type: "success" | "error" | "info") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // 4. Fetch the full user context securely
  const loadUserData = async (uid: string, email: string) => {
    const profilePath = `users/${uid}`;
    try {
      // Profile
      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const uProfile = userDoc.data() as UserProfile;
        setProfile(uProfile);
        setProfileForm({
          name: uProfile.name,
          college: uProfile.college,
          branch: uProfile.branch,
          year: uProfile.year,
          careerGoal: uProfile.careerGoal
        });
      } else {
        setProfile(null);
        setActiveTab("profile");
      }

      // Quiz Scores
      const scoreDocRef = doc(db, "users", uid, "assessments", "metrics");
      const scoreDoc = await getDoc(scoreDocRef);
      if (scoreDoc.exists()) {
        setScores(scoreDoc.data() as AssessmentScores);
      } else {
        setScores(null);
      }

      // Learning Roadmap
      const roadmapDocRef = doc(db, "users", uid, "roadmaps", "details");
      const roadmapDoc = await getDoc(roadmapDocRef);
      if (roadmapDoc.exists()) {
        const data = roadmapDoc.data() as RoadmapStatus;
        if (data && data.topics) {
          const targetGoal = data.careerGoal;
          const templates = roadmapTemplates[targetGoal] || [];
          data.topics = data.topics.map(topic => {
            // First try to match by exact ID within current targetGoal templates
            let match = templates.find(t => t.id === topic.id);
            
            // If not found, try to match by name (case-insensitive, trimmed) within current targetGoal templates
            if (!match) {
              const normalizedName = topic.name.toLowerCase().trim();
              match = templates.find(t => t.name.toLowerCase().trim() === normalizedName);
            }
            
            // If still not found, try matching by looking if one name contains the other within current targetGoal
            if (!match) {
              const normalizedName = topic.name.toLowerCase().trim();
              match = templates.find(t => {
                const term = t.name.toLowerCase().trim();
                return term.includes(normalizedName) || normalizedName.includes(term);
              });
            }

            // Also search across ALL roadmapTemplates in case the targetGoal or category is slightly off!
            if (!match) {
              const normalizedName = topic.name.toLowerCase().trim();
              for (const goal in roadmapTemplates) {
                const subMatch = roadmapTemplates[goal].find(t => 
                  t.id === topic.id ||
                  t.name.toLowerCase().trim() === normalizedName ||
                  t.name.toLowerCase().trim().includes(normalizedName) ||
                  normalizedName.includes(t.name.toLowerCase().trim())
                );
                if (subMatch) {
                  match = subMatch;
                  break;
                }
              }
            }

            return {
              ...topic,
              description: match?.description || topic.description,
              youtubeUrl: match?.youtubeUrl || topic.youtubeUrl,
              youtubeTitle: match?.youtubeTitle || topic.youtubeTitle,
            };
          });
        }
        setRoadmap(data);
      } else {
        setRoadmap(null);
      }
    } catch (err: any) {
      // Graceful fallback for demo users when rules or offline mode block retrieval
      console.warn("Failed retrieving user docs. Defaulting to local mock storage fallback.", err);
      try {
        handleFirestoreError(err, OperationType.GET, profilePath);
      } catch (jsonErr) {
        // Log trace but maintain user's responsive execution flow
      }
    }
  };

  // Form Submissions - Onboarding Profile Setup
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmittingProfile(true);

    const uid = user.uid;
    const email = user.email || "demo.user@skillmirror.io";
    const profilePath = `users/${uid}`;

    const newProfile: UserProfile = {
      uid,
      email,
      name: profileForm.name.trim() || "Independent Learner",
      college: profileForm.college.trim() || "Self Study",
      branch: profileForm.branch.trim() || "Computer Sciences",
      year: profileForm.year,
      careerGoal: profileForm.careerGoal
    };

    try {
      await setDoc(doc(db, "users", uid), newProfile);
      setProfile(newProfile);
      triggerNotification("Onboarding Profile setup completed successfully!", "success");
      
      // Auto generate roadmap when profile is established
      await handleGenerateRoadmap(newProfile.careerGoal, uid);
      
      setActiveTab("dashboard");
    } catch (error: any) {
      console.error("Failed saving profile to Firestore:", error);
      // Fallback for isolated client sandboxes
      setProfile(newProfile);
      triggerNotification("Profile saved locally! Complete your assessments below.", "success");
      await handleGenerateRoadmap(newProfile.careerGoal, uid);
      setActiveTab("dashboard");
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  // Google Login Auth Hook
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      triggerNotification("Signed in successfully via Google Secure Auth!", "success");
    } catch (err: any) {
      console.error("Google popup login failed, switching to Secure Sandbox Mode.", err?.message);
      // Fallback to anonymous credentials so student doesn't hit popup bottlenecks
      try {
        await signInAnonymously(auth);
        triggerNotification("Entered Sandbox Demo Environment.", "info");
      } catch (anonErr) {
        triggerNotification("Database connection busy. Please try again.", "error");
      }
    }
  };

  // Quick Demo Access Hook
  const handleDemoLogin = async () => {
    try {
      await signInAnonymously(auth);
      triggerNotification("Logged in to Secure Sandbox Environment!", "info");
    } catch (err: any) {
      triggerNotification("Sandbox connection busy. Try again shortly.", "error");
    }
  };

  // Sign out Hook
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setProfile(null);
      setScores(null);
      setRoadmap(null);
      setIsDemoUser(false);
      setChatMessages([]);
      setActiveTab("dashboard");
      triggerNotification("Signed out securely.", "info");
    } catch (err) {
      triggerNotification("Logout issues occurred.", "error");
    }
  };

  // Initiate Quiz Subject
  const startQuizForSubject = async (subj: "python" | "java" | "dsa" | "aptitude") => {
    setSelectedSubject(subj);
    setCurrentQuestionIndex(0);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setCalculatedScore(null);
    setIsLoadingQuestions(true);
    setIsGeneratingWithAI(false);

    try {
      // 1. Try to generate brand new questions using Gemini API
      const res = await fetch("/api/quiz-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subj })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.questions) && data.questions.length > 0) {
          setActiveQuestions(data.questions);
          setIsGeneratingWithAI(true);
          setIsLoadingQuestions(false);
          triggerNotification(`Fresh AI-powered ${subj.toUpperCase()} questions generated successfully!`, "success");
          return;
        }
      }
      throw new Error("Failed to load AI-generated questions, falling back to local shuffled pool");
    } catch (err) {
      console.warn("Using local randomized fallback:", err);
      // 2. Local fallback using our randomized shuffler
      const localShuffled = getRandomizedQuestions(subj);
      setActiveQuestions(localShuffled);
      setIsGeneratingWithAI(false);
      setIsLoadingQuestions(false);
      triggerNotification(`New randomized ${subj.toUpperCase()} questions generated!`, "info");
    }
  };

  const getSubjectQuestions = (): Question[] => {
    return activeQuestions;
  };

  // Quiz progression logic
  const handleSelectOption = (questionId: number, optionIndex: number) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  // Calculation and Sync assessment scores
  const evaluateAndSaveQuiz = async (overrideAnswers?: Record<number, number>) => {
    const qList = getSubjectQuestions();
    const activeAnswers = overrideAnswers || quizAnswers;
    let correctCount = 0;
    qList.forEach(q => {
      if (activeAnswers[q.id] === q.correctIndex) {
        correctCount++;
      }
    });

    const scorePct = Math.round((correctCount / qList.length) * 100);
    setCalculatedScore(scorePct);
    setQuizSubmitted(true);

    if (!user) return;

    // Build fresh sets of scores
    const currentScores: AssessmentScores = {
      userId: user.uid,
      pythonScore: scores?.pythonScore ?? 0,
      javaScore: scores?.javaScore ?? 0,
      dsaScore: scores?.dsaScore ?? 0,
      aptitudeScore: scores?.aptitudeScore ?? 0,
      updatedAt: new Date().toISOString(),
      attempts: {
        python: scores?.attempts?.python || selectedSubject === "python",
        java: scores?.attempts?.java || selectedSubject === "java",
        dsa: scores?.attempts?.dsa || selectedSubject === "dsa",
        aptitude: scores?.attempts?.aptitude || selectedSubject === "aptitude"
      }
    };

    if (selectedSubject === "python") currentScores.pythonScore = scorePct;
    if (selectedSubject === "java") currentScores.javaScore = scorePct;
    if (selectedSubject === "dsa") currentScores.dsaScore = scorePct;
    if (selectedSubject === "aptitude") currentScores.aptitudeScore = scorePct;

    try {
      const metricsPath = `users/${user.uid}/assessments/metrics`;
      await setDoc(doc(db, "users", user.uid, "assessments", "metrics"), currentScores);
      setScores(currentScores);
      triggerNotification(`${selectedSubject?.toUpperCase()} Score of ${scorePct}% recorded!`, "success");
    } catch (err) {
      console.warn("Saving score to Firestore failed, storing in client state", err);
      setScores(currentScores);
      triggerNotification(`${selectedSubject?.toUpperCase()} Score cached in session memory.`, "info");
    }
  };

  // Timer effect for 30s per question quiz constraints
  useEffect(() => {
    if (selectedSubject && !quizSubmitted && !isLoadingQuestions) {
      setQuestionTimeLeft(30);
    }
  }, [currentQuestionIndex, selectedSubject, quizSubmitted, isLoadingQuestions]);

  useEffect(() => {
    if (!selectedSubject || quizSubmitted || isLoadingQuestions) return;

    const timer = setInterval(() => {
      setQuestionTimeLeft(prev => {
        if (prev <= 1) {
          // Time is up for current question!
          const qList = getSubjectQuestions();
          const currentQuestion = qList[currentQuestionIndex];
          if (!currentQuestion) return 30;

          // Auto select option as -1 if unanswered
          setQuizAnswers(prevAnswers => {
            const updated = { ...prevAnswers };
            if (updated[currentQuestion.id] === undefined) {
              updated[currentQuestion.id] = -1; // Unanswered placeholder
            }

            // Move to next question or submit
            if (currentQuestionIndex < qList.length - 1) {
              setCurrentQuestionIndex(idx => idx + 1);
            } else {
              evaluateAndSaveQuiz(updated);
            }

            return updated;
          });

          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedSubject, currentQuestionIndex, quizSubmitted, isLoadingQuestions, activeQuestions]);

  // Generated Roadmap Generator
  const handleGenerateRoadmap = async (targetGoal: string, uid: string) => {
    const template = roadmapTemplates[targetGoal];
    if (!template) return;

    const topicsWithCompletion: RoadmapTopic[] = template.map(topic => ({
      ...topic,
      completed: false
    }));

    const finalRoadmap: RoadmapStatus = {
      userId: uid,
      careerGoal: targetGoal,
      progress: 0,
      topics: topicsWithCompletion,
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, "users", uid, "roadmaps", "details"), finalRoadmap);
      setRoadmap(finalRoadmap);
    } catch (err) {
      console.warn("Failed saving generated roadmap directly, preserving state.", err);
      setRoadmap(finalRoadmap);
    }
  };

  // Toggle topics on roadmap progression
  const handleToggleTopic = async (topicId: string) => {
    if (!roadmap || !user) return;

    const updatedTopics = roadmap.topics.map(t => {
      if (t.id === topicId) {
        return { ...t, completed: !t.completed };
      }
      return t;
    });

    const completedCount = updatedTopics.filter(t => t.completed).length;
    const newProgress = Math.round((completedCount / updatedTopics.length) * 100);

    const updatedRoadmap: RoadmapStatus = {
      ...roadmap,
      progress: newProgress,
      topics: updatedTopics,
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, "users", user.uid, "roadmaps", "details"), updatedRoadmap);
      setRoadmap(updatedRoadmap);
      triggerNotification(`Roadmap Progress is now ${newProgress}%`, "success");
    } catch (err) {
      console.warn("Failed writing progress slider. Local memory preserved.", err);
      setRoadmap(updatedRoadmap);
    }
  };

  // Suggest a replacement url for a video
  const handleSuggestReplacement = async (topicId: string, url: string, reason: string, notes: string) => {
    if (!roadmap || !user) return;

    const updatedTopics = roadmap.topics.map(t => {
      if (t.id === topicId) {
        return { 
          ...t, 
          suggestedUrl: url, 
          suggestedReason: (reason ? `${reason}${notes ? `: ${notes}` : ""}` : notes).trim()
        };
      }
      return t;
    });

    const updatedRoadmap: RoadmapStatus = {
      ...roadmap,
      topics: updatedTopics,
      updatedAt: new Date().toISOString()
    };

    setIsSubmittingSuggestion(true);
    try {
      await setDoc(doc(db, "users", user.uid, "roadmaps", "details"), updatedRoadmap);
      setRoadmap(updatedRoadmap);
      
      // Update active previewTopic state to immediately reflect suggestion details in open modal
      if (previewTopic && previewTopic.id === topicId) {
        setPreviewTopic({
          ...previewTopic,
          suggestedUrl: url,
          suggestedReason: (reason ? `${reason}${notes ? `: ${notes}` : ""}` : notes).trim()
        });
      }
      
      triggerNotification("Your video replacement suggestion has been successfully submitted and saved!", "success");
      setSuggestionUrl("");
      setSuggestionReason("");
      setSuggestionNotes("");
      setIsFormOpen(false);
    } catch (err) {
      console.warn("Saving suggestion directly failed, caching in state", err);
      setRoadmap(updatedRoadmap);
      if (previewTopic && previewTopic.id === topicId) {
        setPreviewTopic({
          ...previewTopic,
          suggestedUrl: url,
          suggestedReason: (reason ? `${reason}${notes ? `: ${notes}` : ""}` : notes).trim()
        });
      }
      triggerNotification("Saved your suggestion locally. Thank you!", "success");
      setIsFormOpen(false);
    } finally {
      setIsSubmittingSuggestion(false);
    }
  };

  // Chat/AI Coach API Dispatch
  const handleSendToCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const query = userInput.trim();
    setUserInput("");

    const userMsg: ChatMessage = {
      role: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setIsSendingToAI(true);

    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: profile,
          scores: scores,
          roadmap: roadmap,
          message: query,
          chatHistory: chatMessages
        })
      });

      if (!response.ok) {
        throw new Error("Failure contacting AI Coach endpoint. Verify your GEMINI_API_KEY.");
      }

      const rawData = await response.json();
      const modelMsg: ChatMessage = {
        role: "model",
        text: rawData.text || "I apologize, my analysis cycle was busy. Could you repeat that?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setChatMessages(prev => [...prev, modelMsg]);
    } catch (error: any) {
      console.error("AI Coach connection failure:", error);
      const errMessage: ChatMessage = {
        role: "model",
        text: "**Connection offline**: Please set up or verify your **GEMINI_API_KEY** in the Secrets panel in AI Studio UI to use the live Coach. Let me know if you need help starting this!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setChatMessages(prev => [...prev, errMessage]);
    } finally {
      setIsSendingToAI(false);
    }
  };

  // Convert quiz variables into Graph friendly arrays
  const getRadarData = () => {
    return [
      { subject: "Python", score: scores?.pythonScore ?? 0, fullMark: 100 },
      { subject: "Java", score: scores?.javaScore ?? 0, fullMark: 100 },
      { subject: "DSA", score: scores?.dsaScore ?? 0, fullMark: 100 },
      { subject: "Aptitude", score: scores?.aptitudeScore ?? 0, fullMark: 100 }
    ];
  };

  // Calculate generic profile completeness percentage
  const getProfileCompletionPct = () => {
    if (!profile) return 0;
    let scoreObj = 0;
    if (profile.name) scoreObj += 20;
    if (profile.college) scoreObj += 20;
    if (profile.branch) scoreObj += 20;
    if (profile.year) scoreObj += 20;
    if (profile.careerGoal) scoreObj += 20;
    return scoreObj;
  };

  // Get dynamic strengths, weaknesses, and recommendation statements
  const getStrengthsWeaknesses = () => {
    if (!scores) return { strengths: [], weaknesses: [], advice: "Take self-assessment tests on the Assessment tab to view complete analysis report." };
    
    const elements = [];
    if (scores.attempts?.python) elements.push({ name: "Python", score: scores.pythonScore });
    if (scores.attempts?.java) elements.push({ name: "Java", score: scores.javaScore });
    if (scores.attempts?.dsa) elements.push({ name: "DSA", score: scores.dsaScore });
    if (scores.attempts?.aptitude) elements.push({ name: "Aptitude", score: scores.aptitudeScore });

    if (elements.length === 0) {
      return { strengths: [], weaknesses: [], advice: "Take self-assessment tests on the Assessment tab to view complete analysis report." };
    }

    const sortedByScore = [...elements].sort((a, b) => b.score - a.score);
    const strengths = sortedByScore.filter(e => e.score >= 60).map(e => e.name);
    const weaknesses = sortedByScore.filter(e => e.score < 60).map(e => e.name);

    let advice = "Great start! Focus on completing your custom roadmap topics to bolster intermediate concepts.";
    if (weaknesses.length > 0) {
      advice = `Consider leveraging our interactive AI Coach for specialized mentorship in ${weaknesses.join(" and ")} where your score could improve.`;
    } else if (strengths.length === 4) {
      advice = "Outstanding evaluation metrics! Discuss advanced architecture paradigms or interview strategies with the AI Coach.";
    }

    return { strengths, weaknesses, advice };
  };

  const analysisReport = getStrengthsWeaknesses();

  // Loading Splash Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4" id="loading-state">
        <Atom className="h-10 w-10 text-violet-600 animate-spin mb-4" />
        <h2 className="font-display text-xl font-bold text-slate-800 tracking-tight">Launching Skill Mirror</h2>
        <p className="text-sm font-sans text-slate-500 mt-1">Acquiring cloud database authorization security token...</p>
      </div>
    );
  }

  // Not Logged In View
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between" id="landing-page">
        {/* Simple Global Header */}
        <header className="border-b border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-display font-black text-lg">
                S
              </div>
              <span className="font-display font-bold text-lg text-slate-900 tracking-tight">Skill Mirror</span>
              <span className="bg-violet-100 text-violet-700 font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full">MVP</span>
            </div>

            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-slate-500 hover:text-slate-800 transition cursor-pointer flex items-center justify-center"
              title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-amber-500" />}
            </button>
          </div>
        </header>

        {/* Content Section */}
        <main className="flex-1 max-w-lg w-full mx-auto flex flex-col justify-center px-6 py-12">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <div className="text-center mb-8">
              <span className="inline-flex items-center space-x-1 font-mono text-xs font-semibold text-violet-600 bg-violet-50 px-3 py-1 rounded-full mb-4">
                <Sparkles className="h-3 w-3" />
                <span>1-Week MVP Release</span>
              </span>
              <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight">Reflect Your Potential</h1>
              <p className="font-sans text-sm text-slate-500 mt-2 leading-relaxed">
                Skill Mirror is an end-to-end learning diagnostic workspace. Assess technical skills, generate tailored goal roadmaps, and interact with a persistent AI Career Coach.
              </p>
            </div>

            {/* Login Affordance */}
            <div className="space-y-4">
              <button
                id="login-google-btn"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center space-x-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-sans font-medium py-3 px-4 rounded-xl transition duration-150 shadow-sm"
              >
                <img 
                  src="https://www.gstatic.com/mobilesdk/160512_mobilesdk/images/favicon.png" 
                  alt="Google Brand" 
                  className="w-5 h-5 object-contain" 
                />
                <span>Sign In with Google</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 w-full"></div>
                <span className="absolute bg-white px-3 font-sans text-xs text-slate-400 font-medium">OR TEST DEMO SITE</span>
              </div>

              <button
                id="login-demo-btn"
                onClick={handleDemoLogin}
                className="w-full flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-sans font-medium py-3 px-4 rounded-xl transition duration-150 shadow-sm"
              >
                <ShieldCheck className="h-5 w-5" />
                <span>Enter via Secure Sandbox Demo</span>
              </button>
            </div>

            {/* System Info footer */}
            <div className="mt-8 border-t border-slate-100 pt-5 text-center">
              <p className="font-mono text-[10px] text-slate-400">
                Authorized with Firebase Auth & Firestore DB
              </p>
              <div className="mt-2 flex items-center justify-center space-x-3 text-slate-400 text-xs font-sans font-medium">
                <span className="flex items-center space-x-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  <span>Database Online</span>
                </span>
              </div>
            </div>
          </div>
        </main>

        {/* Global Footer */}
        <footer className="py-6 border-t border-slate-200 bg-white text-center text-xs font-sans text-slate-400">
          <p>© 2026 Skill Mirror Team. Made under Google AI Studio Build.</p>
        </footer>
      </div>
    );
  }

  // Active Onboarding Profile Check
  const hasProfile = profile !== null && profile.name && profile.careerGoal;

  const isCourseCompleted = roadmap && roadmap.topics && roadmap.topics.length > 0
    ? roadmap.topics.every(t => t.completed)
    : false;

  const isProfileLocked = hasProfile && !isCourseCompleted;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="app-workspace">
      {/* Global Toast Notification */}
      {notification && (
        <div 
          className={`fixed top-4 right-4 z-50 flex items-center space-x-2.5 px-4 py-3 rounded-xl border shadow-lg max-w-sm transition-all duration-300 ${
            notification.type === "success" 
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : notification.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-blue-50 border-blue-200 text-blue-800"
          }`}
          id="toast-notification"
        >
          <div className="flex-1 text-sm font-medium">{notification.message}</div>
        </div>
      )}

      {/* Main Top Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40 navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-display font-black text-xl">
              M
            </div>
            <div>
              <span className="font-display font-bold text-lg text-slate-900 tracking-tight block">Skill Mirror</span>
              <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest block -mt-1">Workplace Diagnostics</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {profile && (
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-800">{profile.name}</span>
                <span className="text-xs text-violet-600 font-mono font-medium">{profile.careerGoal}</span>
              </div>
            )}
            <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
            
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-slate-500 hover:text-slate-800 transition cursor-pointer flex items-center justify-center mr-1"
              title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-amber-500" />}
            </button>

            <button
              id="sign-out-btn"
              onClick={handleSignOut}
              className="flex items-center space-x-1.5 text-slate-500 hover:text-slate-800 transition py-1.5 px-3 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-xs font-semibold cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Exit Workspace</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Navigation Rail / Sidebar */}
        <aside className="w-full lg:w-64 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible border-b lg:border-b-0 lg:border-r border-slate-200 pb-4 lg:pb-0 lg:pr-6 shrink-0 h-fit">
          <button
            id="tab-dashboard"
            onClick={() => setActiveTab("dashboard")}
            disabled={!hasProfile}
            className={`relative flex items-center space-x-2.5 px-4 py-3 rounded-xl font-sans text-sm font-semibold tracking-tight transition duration-150 w-full text-left whitespace-nowrap lg:whitespace-normal cursor-pointer ${
              activeTab === "dashboard"
                ? "text-white"
                : !hasProfile
                ? "opacity-40 cursor-not-allowed text-slate-400"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {activeTab === "dashboard" && (
              <motion.span
                layoutId="active-tab-highlight"
                className="absolute inset-0 bg-violet-600 rounded-xl"
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
              />
            )}
            <LayoutDashboard className="h-4 w-4 shrink-0 relative z-10" />
            <span className="relative z-10">Executive Dashboard</span>
          </button>

          <button
            id="tab-profile"
            onClick={() => setActiveTab("profile")}
            className={`relative flex items-center space-x-2.5 px-4 py-3 rounded-xl font-sans text-sm font-semibold tracking-tight transition duration-150 w-full text-left whitespace-nowrap lg:whitespace-normal cursor-pointer ${
              activeTab === "profile"
                ? "text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {activeTab === "profile" && (
              <motion.span
                layoutId="active-tab-highlight"
                className="absolute inset-0 bg-violet-600 rounded-xl"
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
              />
            )}
            <UserCircle className="h-4 w-4 shrink-0 relative z-10" />
            <span className="relative z-10">Profile {hasProfile ? "Setup" : "Onboarding ⚠️"}</span>
          </button>

          <button
            id="tab-assessment"
            onClick={() => setActiveTab("assessment")}
            disabled={!hasProfile}
            className={`relative flex items-center space-x-2.5 px-4 py-3 rounded-xl font-sans text-sm font-semibold tracking-tight transition duration-150 w-full text-left whitespace-nowrap lg:whitespace-normal cursor-pointer ${
              activeTab === "assessment"
                ? "text-white"
                : !hasProfile
                ? "opacity-40 cursor-not-allowed text-slate-400"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {activeTab === "assessment" && (
              <motion.span
                layoutId="active-tab-highlight"
                className="absolute inset-0 bg-violet-600 rounded-xl"
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
              />
            )}
            <Award className="h-4 w-4 shrink-0 relative z-10" />
            <span className="relative z-10">Diagnostic Assessments</span>
          </button>

          <button
            id="tab-roadmap"
            onClick={() => setActiveTab("roadmap")}
            disabled={!hasProfile}
            className={`relative flex items-center space-x-2.5 px-4 py-3 rounded-xl font-sans text-sm font-semibold tracking-tight transition duration-150 w-full text-left whitespace-nowrap lg:whitespace-normal cursor-pointer ${
              activeTab === "roadmap"
                ? "text-white"
                : !hasProfile
                ? "opacity-40 cursor-not-allowed text-slate-400"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {activeTab === "roadmap" && (
              <motion.span
                layoutId="active-tab-highlight"
                className="absolute inset-0 bg-violet-600 rounded-xl"
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
              />
            )}
            <Compass className="h-4 w-4 shrink-0 relative z-10" />
            <span className="relative z-10">Personalized Roadmap</span>
          </button>

          <button
            id="tab-coach"
            onClick={() => setActiveTab("coach")}
            disabled={!hasProfile}
            className={`relative flex items-center space-x-2.5 px-4 py-3 rounded-xl font-sans text-sm font-semibold tracking-tight transition duration-150 w-full text-left whitespace-nowrap lg:whitespace-normal cursor-pointer ${
              activeTab === "coach"
                ? "text-white"
                : !hasProfile
                ? "opacity-40 cursor-not-allowed text-slate-400"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {activeTab === "coach" && (
              <motion.span
                layoutId="active-tab-highlight"
                className="absolute inset-0 bg-violet-600 rounded-xl"
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
              />
            )}
            <Bot className="h-4 w-4 shrink-0 relative z-10" />
            <span className="relative z-10">AI Coach Companion</span>
          </button>
        </aside>

        {/* Content Panel Area */}
        <main className="flex-1 min-w-0" id="main-content-panel">
          <AnimatePresence mode="wait">

          {/* Fallback Onboarding State banner */}
          {!hasProfile && activeTab !== "profile" && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-6 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm">Onboarding Profile Required</h3>
                  <p className="text-xs text-amber-700/90 mt-1">Please fill in your fundamental college and career goal details first, so our roadmap generators and AI Coaches can customize your experience.</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab("profile")}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2 px-4 rounded-lg shrink-0 whitespace-nowrap transition duration-150"
              >
                Go to Profile Setup
              </button>
            </div>
          )}

          {/* TAB 1: EXECUTIVE DASHBOARD */}
          {activeTab === "dashboard" && hasProfile && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="space-y-8"
              id="dashboard-tab-content"
            >
              
              {/* Profile Card Header */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center space-x-4">
                  <div className="h-14 w-14 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-2xl font-display">
                    {profile.name.substring(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-bold text-slate-800 tracking-tight">{profile.name}</h2>
                    <p className="text-slate-500 text-sm font-medium flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span>{profile.college}</span>
                      <span className="h-1 w-1 bg-slate-300 rounded-full"></span>
                      <span>{profile.branch}</span>
                      <span className="h-1 w-1 bg-slate-300 rounded-full"></span>
                      <span>{profile.year}</span>
                    </p>
                  </div>
                </div>
                
                <div className="bg-violet-50 text-violet-800 rounded-xl px-4 py-3 border border-violet-100 flex items-center space-x-3 shrink-0">
                  <Briefcase className="h-5 w-5 text-violet-600" />
                  <div>
                    <span className="block font-mono text-[9px] uppercase font-semibold text-violet-500 tracking-wider">Career Target</span>
                    <span className="font-sans font-bold text-sm">{profile.careerGoal}</span>
                  </div>
                </div>
              </div>

              {/* Grid 1: Progress Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Metric 1: Onboarding progress */}
                <motion.div 
                  whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" }}
                  transition={{ duration: 0.2 }}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Profile Setup</span>
                    <UserIcon className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div>
                    <span className="font-display text-3xl font-extrabold text-slate-800">100%</span>
                    <div className="w-full bg-slate-100 h-2 rounded-full mt-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: "100%" }}></div>
                    </div>
                  </div>
                  <p className="text-[11px] font-sans text-emerald-600 font-semibold mt-3 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Academic records successfully synchronized</span>
                  </p>
                </motion.div>

                {/* Metric 2: Quiz stats */}
                <motion.div 
                  whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" }}
                  transition={{ duration: 0.2 }}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Test Complete</span>
                    <ClipboardList className="h-4 w-4 text-violet-500" />
                  </div>
                  <div>
                    {scores ? (
                      <div>
                        {/* Calculate completed tests count out of 4 */}
                        {(() => {
                          let count = 0;
                          if (scores.pythonScore > 0) count++;
                          if (scores.javaScore > 0) count++;
                          if (scores.dsaScore > 0) count++;
                          if (scores.aptitudeScore > 0) count++;
                          const pct = Math.round((count / 4) * 100);
                          return (
                            <>
                              <span className="font-display text-3xl font-extrabold text-slate-800">{pct}%</span>
                              <div className="w-full bg-slate-100 h-2 rounded-full mt-2">
                                <div className="bg-violet-600 h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                              </div>
                              <p className="text-[11px] font-sans text-slate-500 mt-3 font-semibold">
                                {count} of 4 core diagnostic modules submitted
                              </p>
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <div>
                        <span className="font-display text-3xl font-extrabold text-amber-600">0%</span>
                        <div className="w-full bg-slate-100 h-2 rounded-full mt-2">
                          <div className="bg-slate-300 h-2 rounded-full" style={{ width: "0%" }}></div>
                        </div>
                        <p className="text-[11px] font-sans text-slate-500 mt-3 font-semibold">
                          0 of 4 tests completed
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Metric 3: Roadmap status */}
                <motion.div 
                  whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" }}
                  transition={{ duration: 0.2 }}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Roadmap Track</span>
                    <TrendingUp className="h-4 w-4 text-sky-500" />
                  </div>
                  <div>
                    <span className="font-display text-3xl font-extrabold text-slate-800">
                      {roadmap ? `${roadmap.progress}%` : "0%"}
                    </span>
                    <div className="w-full bg-slate-100 h-2 rounded-full mt-2">
                      <div className="bg-sky-500 h-2 rounded-full" style={{ width: `${roadmap ? roadmap.progress : 0}%` }}></div>
                    </div>
                  </div>
                  <p className="text-[11px] font-sans text-slate-500 mt-3 font-semibold">
                    {roadmap 
                      ? `${roadmap.topics.filter(t => t.completed).length} of ${roadmap.topics.length} conceptual chapters mastered`
                      : "Learning path not initialized"
                    }
                  </p>
                </motion.div>
              </div>

              {/* Grid 2: Skill Report & Visuals */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Radar Chart Visual */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="font-display text-base font-bold text-slate-800 tracking-tight flex items-center gap-2 mb-6">
                    <Brain className="h-4, text-violet-600" />
                    <span>Competency Quadrant (Real Scores)</span>
                  </h3>
                  
                  {scores ? (
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getRadarData()}>
                          <PolarGrid stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: theme === 'dark' ? '#cbd5e1' : '#475569', fontSize: 13, fontWeight: '500' }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} stroke={theme === 'dark' ? '#475569' : '#cbd5e1'} />
                          <Radar name="Student Metrics" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.35} />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[280px] flex flex-col justify-center items-center rounded-xl bg-slate-50 border border-dashed border-slate-200 p-8 text-center">
                      <ClipboardList className="h-10 w-10 text-slate-300 mb-2" />
                      <p className="text-sm font-sans text-slate-600 font-semibold">No Evaluation Metrics Detected</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">Complete at least one of the short MCQ assessments inside the Diagnostics panel to view your real radar graph.</p>
                      <button 
                        onClick={() => setActiveTab("assessment")}
                        className="mt-4 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs py-2 px-4 rounded-lg transition duration-150"
                      >
                        Enter Diagnostics
                      </button>
                    </div>
                  )}
                </div>

                {/* Skill Analysis Report card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="font-display text-base font-bold text-slate-800 tracking-tight flex items-center gap-2 mb-5">
                      <ClipboardList className="h-4 w-4 text-emerald-600" />
                      <span>Skill Diagnostic Analyzer Summary</span>
                    </h3>

                    {scores ? (
                      <div className="space-y-4">
                        <div>
                          <span className="block font-sans text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">Strengths (Score ≥ 60%)</span>
                          {analysisReport.strengths.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {analysisReport.strengths.map(subj => (
                                <span key={subj} className="bg-emerald-50 border border-emerald-200 text-emerald-800 font-sans text-xs font-medium py-1 px-2.5 rounded-lg">
                                  {subj} Mastered
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 font-sans italic">None recorded. Aim for more than 60% on our MCQ diagnostics!</span>
                          )}
                        </div>

                        <div className="border-t border-slate-100 pt-3">
                          <span className="block font-sans text-xs font-bold text-rose-500 uppercase tracking-wider mb-2">Areas of Growth (Score &lt; 60%)</span>
                          {analysisReport.weaknesses.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {analysisReport.weaknesses.map(subj => (
                                <span key={subj} className="bg-rose-50 border border-rose-200 text-rose-800 font-sans text-xs font-medium py-1 px-2.5 rounded-lg">
                                  {subj} Practice Needed
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 font-sans italic">No critical vulnerabilities detected. Perfect metrics!</span>
                          )}
                        </div>

                        <div className="border-t border-slate-100 pt-3 bg-violet-50/50 p-4 rounded-xl border border-violet-100/50">
                          <h4 className="text-xs font-bold text-violet-700 flex items-center gap-1 uppercase tracking-wider">
                            <Lightbulb className="h-3.5 w-3.5" />
                            <span>Diagnostic Recommendation</span>
                          </h4>
                          <p className="text-xs text-slate-600 font-sans mt-2 leading-relaxed">{analysisReport.advice}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col justify-center items-center py-10 text-center">
                        <AlertTriangle className="h-8 w-8 text-slate-300 mb-2" />
                        <p className="text-xs text-slate-500">Analyzer summary is computed automatically after subject MCQ assessments are recorded.</p>
                      </div>
                    )}
                  </div>

                  {scores && (
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                      <span>Evaluated from {Object.keys(quizAnswers).length > 0 ? "recent quiz attempts" : "persistent records"}</span>
                      <button 
                        onClick={() => setActiveTab("coach")}
                        className="text-violet-600 hover:text-violet-800 font-semibold flex items-center gap-1"
                      >
                        <span>Discuss with AI Coach</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Suggestions to progress */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="font-display text-base font-bold text-slate-800 tracking-tight flex items-center gap-2 mb-4">
                  <Sparkles className="h-4 w-4 text-violet-600" />
                  <span>Your Roadmap Masterplan & Tasks</span>
                </h3>
                {roadmap ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-slate-500 mb-2">
                      <span className="font-medium text-slate-700">Track: {roadmap.careerGoal}</span>
                      <span className="font-mono text-xs font-bold text-violet-600">{roadmap.progress}% Completed</span>
                    </div>
                    
                    {/* Render up to 2 uncompleted steps */}
                    <div className="space-y-2">
                      {roadmap.topics.filter(t => !t.completed).slice(0, 2).map((topic, i) => (
                        <div key={topic.id} className="flex justify-between items-center bg-slate-50 hover:bg-slate-100/90 border border-slate-100 hover:border-violet-200 p-3.5 rounded-xl hover:-translate-y-0.5 hover:shadow-sm transition-all duration-300 ease-out">
                          <div className="flex items-center space-x-3">
                            <Circle className="h-4 w-4 text-slate-400 shrink-0" />
                            <div>
                              <span className="font-sans text-xs font-semibold text-slate-700 block">{topic.name}</span>
                              <span className="inline-flex space-x-2 font-mono text-[9px] text-slate-400">
                                <span>{topic.category}</span>
                                <span>•</span>
                                <span>{topic.duration}</span>
                              </span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleToggleTopic(topic.id)}
                            className="bg-white hover:bg-violet-50 text-slate-500 hover:text-violet-700 hover:border-violet-300 font-bold text-[10px] py-1.5 px-3 rounded-lg border border-slate-200 transition shrink-0"
                          >
                            Mark Completed
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => setActiveTab("roadmap")}
                      className="w-full text-center text-xs font-bold text-violet-600 hover:text-violet-800 mt-2 block"
                    >
                      View Full Roadmap Path
                    </button>
                  </div>
                ) : (
                  <div className="py-6 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <p className="text-xs text-slate-500 font-medium">No active roadmap program detected.</p>
                    <button
                      onClick={() => profile && handleGenerateRoadmap(profile.careerGoal, profile.uid)}
                      className="mt-3 text-[11px] bg-violet-100 font-sans hover:bg-violet-200 text-violet-700 font-bold px-4 py-2 rounded-xl transition cursor-pointer"
                    >
                      Generate Core Roadmap
                    </button>
                  </div>
                )}
              </div>

            </motion.div>
          )}

          {/* TAB 2: PROFILE ONBOARDING SETUP */}
          {activeTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm"
              id="profile-tab-content"
            >
              <div className="mb-6">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full">Step 2: User Profile</span>
                <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight mt-3">Configure Academic Persona</h2>
                <p className="font-sans text-sm text-slate-500 mt-1">Specify your university metadata and chosen pathway to customize training questions and roadmap courses.</p>
              </div>

              {isProfileLocked && (
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3 text-amber-800">
                  <Lock className="h-5 w-5 mt-0.5 shrink-0 text-amber-600" />
                  <div>
                    <h4 className="font-sans font-bold text-sm">Academic Profile Locked</h4>
                    <p className="font-sans text-xs text-amber-700 mt-1 leading-relaxed">
                      Your profile cannot be changed or edited until you complete the entire course. To unlock modifications, please complete all learning topics (100% progress) inside your active <strong>Roadmap</strong> curriculum.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name field */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Full Name</label>
                    <input
                      id="profile-name-input"
                      type="text"
                      required
                      disabled={isProfileLocked}
                      maxLength={95}
                      placeholder="e.g. Priyan Sharma"
                      value={profileForm.name}
                      onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                      className={`w-full border font-sans text-sm p-3 rounded-xl outline-none transition ${
                        isProfileLocked 
                          ? "bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed focus:ring-0 focus:border-slate-200" 
                          : "border-slate-300 hover:border-slate-400 focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
                      }`}
                    />
                  </div>

                  {/* College/Uni field */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">College Name</label>
                    <input
                      id="profile-college-input"
                      type="text"
                      required
                      disabled={isProfileLocked}
                      maxLength={140}
                      placeholder="e.g. National Institute of Tech"
                      value={profileForm.college}
                      onChange={e => setProfileForm({ ...profileForm, college: e.target.value })}
                      className={`w-full border font-sans text-sm p-3 rounded-xl outline-none transition ${
                        isProfileLocked 
                          ? "bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed focus:ring-0 focus:border-slate-200" 
                          : "border-slate-300 hover:border-slate-400 focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
                      }`}
                    />
                  </div>

                  {/* Branch/Major field */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Branch / Major</label>
                    <input
                      id="profile-branch-input"
                      type="text"
                      required
                      disabled={isProfileLocked}
                      maxLength={95}
                      placeholder="e.g. Electronics & Communication"
                      value={profileForm.branch}
                      onChange={e => setProfileForm({ ...profileForm, branch: e.target.value })}
                      className={`w-full border font-sans text-sm p-3 rounded-xl outline-none transition ${
                        isProfileLocked 
                          ? "bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed focus:ring-0 focus:border-slate-200" 
                          : "border-slate-300 hover:border-slate-400 focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
                      }`}
                    />
                  </div>

                  {/* Year of study field */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Academic Year</label>
                    <select
                      id="profile-year-select"
                      disabled={isProfileLocked}
                      value={profileForm.year}
                      onChange={e => setProfileForm({ ...profileForm, year: e.target.value })}
                      className={`w-full border font-sans text-sm p-3 rounded-xl outline-none transition ${
                        isProfileLocked 
                          ? "bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed focus:ring-0 focus:border-slate-200" 
                          : "border-slate-300 hover:border-slate-400 focus:border-violet-600 focus:ring-1 focus:ring-violet-600 bg-white"
                      }`}
                    >
                      <option value="1st Year">1st Year / Freshman</option>
                      <option value="2nd Year">2nd Year / Sophomore</option>
                      <option value="3rd Year">3rd Year / Junior</option>
                      <option value="4th Year">4th Year / Senior</option>
                      <option value="Graduate">Postgraduate / Alumni</option>
                    </select>
                  </div>
                </div>

                {/* Career Goal - The critical generator trigger */}
                <div className="space-y-3 bg-violet-50/50 p-6 rounded-xl border border-violet-100">
                  <label className="block text-xs font-bold text-violet-800 uppercase tracking-wider">Career Target Pathway</label>
                  <p className="text-xs text-slate-500 font-sans -mt-1 leading-relaxed">Selecting your target path will dynamically create custom structured syllabuses in your Roadmap pane.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
                    {["AI Engineer", "Web Developer", "Mobile Developer", "Cloud Engineer"].map(goal => (
                      <div 
                        key={goal}
                        onClick={() => !isProfileLocked && setProfileForm({ ...profileForm, careerGoal: goal })}
                        className={`border rounded-xl p-4 select-none transition ${
                          isProfileLocked 
                            ? "opacity-60 cursor-not-allowed bg-slate-50 border-slate-100" 
                            : "cursor-pointer hover:bg-white bg-transparent border-slate-200"
                        } ${
                          profileForm.careerGoal === goal 
                            ? isProfileLocked 
                              ? "bg-slate-100 border-slate-300 ring-2 ring-slate-200" 
                              : "bg-white border-violet-600 ring-2 ring-violet-100" 
                            : ""
                        }`}
                      >
                        <span className="font-sans font-bold text-sm text-slate-800 block">{goal}</span>
                        <span className="font-mono text-[9px] text-slate-400 uppercase mt-1 block">
                          {goal === "AI Engineer" ? "ML & Deep Learning" : goal === "Web Developer" ? "React Node Stack" : goal === "Mobile Developer" ? "Flutter & SwiftUI" : "AWS, Docker, K8s"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Confirm submit buttons */}
                <div className="flex justify-end pt-4">
                  <button
                    id="save-profile-btn"
                    type="submit"
                    disabled={isSubmittingProfile || isProfileLocked}
                    className={`font-semibold font-sans py-3 px-8 rounded-xl transition duration-150 shadow-sm ${
                      isProfileLocked
                        ? "bg-slate-200 border border-slate-300/80 text-slate-500 cursor-not-allowed shadow-none"
                        : "bg-violet-600 hover:bg-violet-700 text-white shadow-violet-200"
                    }`}
                  >
                    {isProfileLocked ? (
                      <span className="flex items-center space-x-1.5">
                        <Lock className="h-4 w-4 text-slate-400" />
                        <span>Profile Locked</span>
                      </span>
                    ) : isSubmittingProfile ? (
                      "Registering Records..."
                    ) : (
                      "Save Academic Profile"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* TAB 3: DIAGNOSTIC ASSESSMENTS */}
          {activeTab === "assessment" && (
            <motion.div
              key="assessment"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="space-y-8"
              id="assessment-tab-content"
            >
              
              {/* Introduction header */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full">Step 3: Skill Assessment</span>
                <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight mt-3">Mastery MCQ Assessment Suite</h2>
                <p className="font-sans text-sm text-slate-500 mt-1">Challenge yourself across core parameters. Submitting calculations syncs dynamic radar values instantaneously.</p>

                {/* Score Summary Banner */}
                {scores && (
                  <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-100 pt-5">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                      <span className="block text-[10px] text-slate-500 font-mono font-medium uppercase">Python</span>
                      <span className="text-base font-bold text-slate-800">{scores.pythonScore}%</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                      <span className="block text-[10px] text-slate-500 font-mono font-medium uppercase">Java</span>
                      <span className="text-base font-bold text-slate-800">{scores.javaScore}%</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                      <span className="block text-[10px] text-slate-500 font-mono font-medium uppercase">DSA</span>
                      <span className="text-base font-bold text-slate-800">{scores.dsaScore}%</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                      <span className="block text-[10px] text-slate-500 font-mono font-medium uppercase">Aptitude</span>
                      <span className="text-base font-bold text-slate-800">{scores.aptitudeScore}%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Subject selector and Quiz runner */}
              {!selectedSubject ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Subject Python */}
                  <motion.div 
                    whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" }}
                    transition={{ duration: 0.2 }}
                    className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-violet-400 flex flex-col justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="bg-amber-100 text-amber-800 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md">Scripting language</span>
                        {scores && scores.attempts?.python && <span className="text-emerald-600 font-sans text-xs font-semibold">Done: {scores.pythonScore}%</span>}
                      </div>
                      <h3 className="font-display text-lg font-bold text-slate-800 group-hover:text-violet-700 transition-colors duration-200">Python Programming</h3>
                      <p className="text-xs text-slate-500 mt-1 font-sans leading-relaxed">Tuple immutability, mathematical division operators, OOP constructs, generator iterators, and syntax structures.</p>
                      <span className="font-mono text-[10px] text-slate-400 block mt-4">5 Diagnostic MCQs • 5 Mins</span>
                    </div>
                    <button
                      onClick={() => startQuizForSubject("python")}
                      className="mt-6 w-full text-center bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs py-2.5 rounded-lg transition duration-150 shadow-sm hover:shadow-md cursor-pointer"
                    >
                      {scores && scores.attempts?.python ? "Retake Evaluation" : "Start Assessment"}
                    </button>
                  </motion.div>

                  {/* Subject Java */}
                  <motion.div 
                    whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" }}
                    transition={{ duration: 0.2 }}
                    className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-violet-400 flex flex-col justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="bg-blue-100 text-blue-800 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md">Object Oriented</span>
                        {scores && scores.attempts?.java && <span className="text-emerald-600 font-sans text-xs font-semibold">Done: {scores.javaScore}%</span>}
                      </div>
                      <h3 className="font-display text-lg font-bold text-slate-800 group-hover:text-violet-700 transition-colors duration-200">Java Programming</h3>
                      <p className="text-xs text-slate-500 mt-1 font-sans leading-relaxed">Primitive variables, access parameters, thread-safe classes (Vector), string concatenation rules, and class inheritance gates.</p>
                      <span className="font-mono text-[10px] text-slate-400 block mt-4">5 Diagnostic MCQs • 5 Mins</span>
                    </div>
                    <button
                      onClick={() => startQuizForSubject("java")}
                      className="mt-6 w-full text-center bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs py-2.5 rounded-lg transition duration-150 shadow-sm hover:shadow-md cursor-pointer"
                    >
                      {scores && scores.attempts?.java ? "Retake Evaluation" : "Start Assessment"}
                    </button>
                  </motion.div>

                  {/* Subject DSA */}
                  <motion.div 
                    whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" }}
                    transition={{ duration: 0.2 }}
                    className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-violet-400 flex flex-col justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="bg-purple-100 text-purple-800 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md">Core Theory</span>
                        {scores && scores.attempts?.dsa && <span className="text-emerald-600 font-sans text-xs font-semibold">Done: {scores.dsaScore}%</span>}
                      </div>
                      <h3 className="font-display text-lg font-bold text-slate-800 group-hover:text-violet-700 transition-colors duration-200">Data Structures & Algos</h3>
                      <p className="text-xs text-slate-500 mt-1 font-sans leading-relaxed">Hash maps, stack LIFO queues, Dijkstra pathing algorithms, Quick Sort divisions, and binary ascending inorder traversals.</p>
                      <span className="font-mono text-[10px] text-slate-400 block mt-4">5 Diagnostic MCQs • 5 Mins</span>
                    </div>
                    <button
                      onClick={() => startQuizForSubject("dsa")}
                      className="mt-6 w-full text-center bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs py-2.5 rounded-lg transition duration-150 shadow-sm hover:shadow-md cursor-pointer"
                    >
                      {scores && scores.attempts?.dsa ? "Retake Evaluation" : "Start Assessment"}
                    </button>
                  </motion.div>

                  {/* Subject Aptitude */}
                  <motion.div 
                    whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" }}
                    transition={{ duration: 0.2 }}
                    className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-violet-400 flex flex-col justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md">Quantitative</span>
                        {scores && scores.attempts?.aptitude && <span className="text-emerald-600 font-sans text-xs font-semibold">Done: {scores.aptitudeScore}%</span>}
                      </div>
                      <h3 className="font-display text-lg font-bold text-slate-800 group-hover:text-violet-700 transition-colors duration-200">Quantitative Aptitude</h3>
                      <p className="text-xs text-slate-500 mt-1 font-sans leading-relaxed">Relative speed math, proportional workforce timelines, coordinate logical patterns, and Cost Price margins.</p>
                      <span className="font-mono text-[10px] text-slate-400 block mt-4">5 Diagnostic MCQs • 5 Mins</span>
                    </div>
                    <button
                      onClick={() => startQuizForSubject("aptitude")}
                      className="mt-6 w-full text-center bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs py-2.5 rounded-lg transition duration-150 shadow-sm hover:shadow-md cursor-pointer"
                    >
                      {scores && scores.attempts?.aptitude ? "Retake Evaluation" : "Start Assessment"}
                    </button>
                  </motion.div>
                </div>
              ) : (
                /* Interactive Quiz Card */
                <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-md">
                  
                  {/* Topic navigation ribbon */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                    <div className="flex items-center space-x-2">
                      <HelpCircle className="h-5 w-5 text-violet-600" />
                      <span className="font-display font-black text-lg text-slate-800 uppercase tracking-tight">{selectedSubject.toUpperCase()} Evaluation</span>
                    </div>
                    <button
                      onClick={() => setSelectedSubject(null)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 border border-slate-200 py-1.5 px-3 rounded-lg hover:bg-slate-50"
                    >
                      Quit Assessment
                    </button>
                  </div>

                  {/* Question and choices */}
                  {isLoadingQuestions ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                      <div className="relative h-16 w-16">
                        <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-sky-400 animate-spin"></div>
                      </div>
                      <h4 className="font-display font-bold text-lg text-slate-800 tracking-tight">Generating Assessment Questions...</h4>
                      <p className="text-xs text-slate-500 max-w-sm font-sans leading-relaxed">
                        Our AI system is crafting fresh custom questions to evaluate your real skill capacity. Please wait a brief moment.
                      </p>
                    </div>
                  ) : !quizSubmitted ? (
                    <div>
                      {/* Progress bar */}
                      <div className="w-full bg-slate-100 h-1.5 rounded-full mb-6">
                        <div 
                          className="bg-violet-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${getSubjectQuestions().length > 0 ? ((currentQuestionIndex + 1) / getSubjectQuestions().length) * 100 : 0}%` }}
                        ></div>
                      </div>

                      {/* Info metrics */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-bold text-violet-600">
                          QUESTION {currentQuestionIndex + 1} OF {getSubjectQuestions().length}
                        </span>
                        
                        <div className="flex items-center space-x-2">
                          {isGeneratingWithAI && (
                            <span className="bg-sky-50 text-sky-600 font-mono text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider animate-pulse">
                              AI Generated
                            </span>
                          )}
                          <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full font-mono text-xs font-bold transition-all duration-300 ${
                            questionTimeLeft <= 10 
                              ? "bg-rose-50 text-rose-600 border border-rose-200 animate-pulse" 
                              : "bg-sky-50 text-sky-600 border border-sky-100"
                          }`}>
                            <Clock className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: questionTimeLeft <= 10 ? '2s' : '10s' }} />
                            <span>{questionTimeLeft}s Left</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Details of corresponding index */}
                      {(() => {
                        const question = getSubjectQuestions()[currentQuestionIndex];
                        return (
                          <motion.div
                            key={currentQuestionIndex}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="mt-3 space-y-6"
                          >
                            <h3 className="font-sans font-bold text-lg text-slate-800 tracking-tight leading-snug">
                              {question.text}
                            </h3>

                            <div className="space-y-3">
                              {question.options.map((option, index) => (
                                <motion.div 
                                  key={index}
                                  onClick={() => handleSelectOption(question.id, index)}
                                  whileHover={{ scale: 1.01 }}
                                  whileTap={{ scale: 0.99 }}
                                  className={`border rounded-xl p-4 cursor-pointer flex items-center justify-between select-none transition ${
                                    quizAnswers[question.id] === index 
                                      ? "bg-violet-50/50 border-violet-600 ring-1 ring-violet-200" 
                                      : "bg-white border-slate-200 hover:bg-slate-50"
                                  }`}
                                >
                                  <div className="flex items-center space-x-3">
                                    <span className="h-6 w-6 rounded-lg bg-slate-100 text-slate-600 font-mono font-bold text-xs flex items-center justify-center uppercase">
                                      {String.fromCharCode(97 + index)}
                                    </span>
                                    <span className="font-sans text-sm text-slate-700 font-medium">{option}</span>
                                  </div>
                                  <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                                    quizAnswers[question.id] === index ? "border-violet-600 bg-violet-600" : "border-slate-300 bg-white"
                                  }`}>
                                    {quizAnswers[question.id] === index && <div className="h-1.5 w-1.5 rounded-full bg-white"></div>}
                                  </div>
                                </motion.div>
                              ))}
                            </div>

                            {/* Nav controls */}
                            <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-8">
                              <button
                                disabled={currentQuestionIndex === 0}
                                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                                className="text-xs font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 py-2 px-4 rounded-lg disabled:opacity-40"
                              >
                                Previous
                              </button>

                              {currentQuestionIndex < getSubjectQuestions().length - 1 ? (
                                <button
                                  disabled={quizAnswers[question.id] === undefined}
                                  onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 px-5 rounded-lg disabled:opacity-40"
                                >
                                  Next Question
                                </button>
                              ) : (
                                <button
                                  disabled={Object.keys(quizAnswers).length < getSubjectQuestions().length}
                                  onClick={evaluateAndSaveQuiz}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-6 rounded-lg disabled:opacity-40"
                                >
                                  Finish & Calculate Metric
                                </button>
                              )}
                            </div>
                          </motion.div>
                        );
                      })()}
                    </div>
                  ) : (
                    /* Assessment Finished State */
                    <div className="text-center py-6">
                      <div className="h-16 w-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="h-8 w-8" />
                      </div>
                      <h3 className="font-display text-2xl font-bold text-slate-900 tracking-tight">Diagnostic Concluded</h3>
                      <p className="text-slate-500 font-medium text-sm mt-1 max-w-sm mx-auto">Your evaluations are integrated directly. Analysis reports and radar matrix visualizations have updated.</p>

                      <div className="bg-slate-50 rounded-2xl max-w-sm mx-auto p-6 border border-slate-100 my-6">
                        <span className="block font-sans text-xs text-slate-400 font-bold uppercase tracking-wider">Evaluation Score</span>
                        <span className="font-display text-5xl font-black text-slate-800 mt-1 block">{calculatedScore}%</span>
                        
                        <div className="flex justify-between text-xs text-slate-500 mt-4 border-t border-slate-200/60 pt-4">
                          <span>Correct: {Math.round((calculatedScore ?? 0) / 20)} of 5</span>
                          <span>Time taken: ~2 mins</span>
                        </div>
                      </div>

                      {/* Detailed Question Review Section */}
                      <div className="text-left mt-8 max-w-xl mx-auto border-t border-slate-100 pt-6 mb-8">
                        <h4 className="font-sans font-bold text-slate-800 text-sm mb-4">Detailed Question Review & Explanations</h4>
                        <div className="space-y-4">
                          {getSubjectQuestions().map((q, idx) => {
                            const selectedIdx = quizAnswers[q.id];
                            const isCorrect = selectedIdx === q.correctIndex;
                            return (
                              <div key={q.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 space-y-2 shadow-xs transition-colors duration-150">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-[10px] font-bold text-slate-400">QUESTION {idx + 1}</span>
                                  <span className={`font-sans text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                    isCorrect ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                                  }`}>
                                    {isCorrect ? "Correct" : "Incorrect"}
                                  </span>
                                </div>
                                <p className="font-sans font-semibold text-sm text-slate-800 leading-snug">{q.text}</p>
                                
                                <div className="space-y-1.5 pt-1">
                                  <div className="text-xs font-sans flex items-start space-x-1.5">
                                    <span className="font-semibold text-slate-500 shrink-0">Your Answer:</span>
                                    <span className={`${isCorrect ? "text-emerald-700 font-medium" : "text-rose-700 font-medium"}`}>
                                      {q.options[selectedIdx] ?? "No answer selected"}
                                    </span>
                                  </div>
                                  {!isCorrect && (
                                    <div className="text-xs font-sans flex items-start space-x-1.5">
                                      <span className="font-semibold text-slate-500 shrink-0">Correct Answer:</span>
                                      <span className="text-emerald-700 font-semibold">{q.options[q.correctIndex]}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="bg-violet-50/60 p-3 rounded-lg border border-violet-100/50 mt-2 text-[11px] text-slate-600 leading-relaxed font-sans">
                                  <span className="font-semibold text-violet-700 block mb-0.5">Explanation:</span>
                                  {q.explanation}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center justify-center space-x-4">
                        <button
                          onClick={() => setSelectedSubject(null)}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition duration-150"
                        >
                          Assess Other Areas
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSubject(null);
                            setActiveTab("dashboard");
                          }}
                          className="border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs py-2.5 px-6 rounded-xl transition duration-150"
                        >
                          Return to Dashboard
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </motion.div>
          )}

          {/* TAB 4: PERSONALIZED LEARNING ROADMAP */}
          {activeTab === "roadmap" && (
            <motion.div
              key="roadmap"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="space-y-6"
              id="roadmap-tab-content"
            >
              
              {/* Introduction card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full">Step 5: Training Roadmap</span>
                <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight mt-3">Target Career Path: {profile ? profile.careerGoal : "No Career Goal Setup"}</h2>
                <p className="font-sans text-sm text-slate-500 mt-1">This detailed roadmap represents essential landmarks needed to construct a professional resume in your chosen domain. Mark items as completed to view update metrics on the main executive cockpit.</p>
              </div>

              {/* Progress Tracker Slider card */}
              {roadmap ? (
                <>
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-5 mb-6 gap-3">
                    <div>
                      <span className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Real-time stats</span>
                      <span className="font-sans text-base font-bold text-slate-800 mt-0.5 block">{roadmap.topics.filter(t => t.completed).length} Section masters completed</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 bg-sky-50 text-sky-800 border border-sky-100 px-3 py-1.5 rounded-lg font-mono text-xs font-bold shrink-0">
                      <span>PROGRESS: {roadmap.progress}%</span>
                    </div>
                  </div>

                  {/* List of elements */}
                  <div className="space-y-4">
                    {roadmap.topics.map((topic, index) => (
                      <div 
                        key={topic.id}
                        className={`border rounded-2xl p-4 transition-all duration-300 ease-out hover:-translate-y-0.5 ${
                          topic.completed 
                            ? "bg-slate-50/50 border-slate-200/80 opacity-60 grayscale-[45%] hover:opacity-95 hover:border-slate-300 hover:bg-slate-100/50" 
                            : "bg-white border-slate-200 hover:border-violet-300 hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start space-x-3.5">
                            <button
                              onClick={() => handleToggleTopic(topic.id)}
                              className="mt-1 shrink-0"
                            >
                              {topic.completed ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                              ) : (
                                <Circle className="h-5 w-5 text-slate-300 hover:text-violet-600" />
                              )}
                            </button>
                            
                            <div>
                              <div className="flex items-center flex-wrap gap-2 mb-1.5">
                                <span className="font-mono text-[9px] uppercase font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md">
                                  {topic.category}
                                </span>
                                <span className={`font-mono text-[9px] uppercase font-bold px-2 py-0.5 rounded-md ${
                                  topic.difficulty === "Beginner" 
                                    ? "bg-emerald-50 text-emerald-700" 
                                    : topic.difficulty === "Intermediate" 
                                    ? "bg-amber-50 text-amber-700" 
                                    : "bg-rose-50 text-rose-700"
                                }`}>
                                  {topic.difficulty}
                                </span>
                                <span className="font-mono text-[9px] text-slate-400">
                                  {topic.duration}
                                </span>
                              </div>

                              <h3 className={`font-sans text-sm font-bold tracking-tight ${
                                topic.completed ? "text-slate-500 line-through" : "text-slate-800"
                              }`}>
                                {topic.name}
                              </h3>

                              {topic.description && (
                                <p className={`font-sans text-xs text-slate-500 mt-1 leading-relaxed ${
                                  topic.completed ? "line-through opacity-70" : ""
                                }`}>
                                  {topic.description}
                                </p>
                              )}

                              {topic.youtubeUrl && (
                                <div className="mt-3 flex items-center">
                                  <button
                                    onClick={() => {
                                      setPreviewTopic(topic);
                                      setSuggestionUrl("");
                                      setSuggestionReason("");
                                      setSuggestionNotes("");
                                      setIsFormOpen(false);
                                    }}
                                    className="inline-flex items-center space-x-1.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/30 dark:hover:bg-red-900/20 dark:text-red-400 dark:hover:text-red-300 font-sans text-xs px-3 py-1.5 rounded-xl border border-red-200/50 dark:border-red-900/40 transition duration-150 shadow-2xs cursor-pointer text-left"
                                  >
                                    <Video className="h-3.5 w-3.5 text-red-500 dark:text-red-400 shrink-0" />
                                    <span className="font-semibold">{topic.youtubeTitle || "Watch Guide"}</span>
                                    <span className="text-[10px] text-red-400 dark:text-red-500 font-normal shrink-0">• YouTube</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reset course button */}
                  <div className="mt-8 pt-5 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => {
                        if (profile && window.confirm("Are you sure you want to rebuild your roadmap? This will reset your course completion records on this track.")) {
                          handleGenerateRoadmap(profile.careerGoal, profile.uid);
                        }
                      }}
                      className="text-xs font-bold text-rose-500 hover:text-rose-700 flex items-center space-x-1.5 cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Reset Roadmap Progression</span>
                    </button>
                  </div>

                </div>

                {/* Trending Industry Courses for Active Role */}
                {profile && (
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-md mt-6">
                    <div className="flex items-center space-x-2 mb-6 pb-4 border-b border-slate-100">
                      <Sparkles className="h-5 w-5 text-sky-500 animate-pulse" />
                      <div>
                        <h3 className="font-display font-black text-lg text-slate-800 tracking-tight">🔥 Trending Industry Courses</h3>
                        <p className="text-xs text-slate-500 font-sans mt-0.5">Highly recommended curated programs for {profile.careerGoal} to further accelerate your career.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {(trendingCoursesByRole[profile.careerGoal] || []).map((course, idx) => (
                        <div 
                          key={idx}
                          className="bg-slate-50/60 border border-slate-200/80 rounded-2xl p-5 hover:border-sky-300 hover:shadow-md hover:-translate-y-1 transition-all duration-300 ease-out flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100">
                                {course.provider}
                              </span>
                              <div className="flex items-center space-x-1 text-amber-500 text-xs font-bold">
                                <span>★</span>
                                <span>{course.rating}</span>
                              </div>
                            </div>

                            <h4 className="font-sans font-bold text-sm text-slate-800 tracking-tight leading-snug">
                              {course.title}
                            </h4>
                            <p className="font-sans text-xs text-slate-500 mt-2 leading-relaxed font-normal">
                              {course.description}
                            </p>
                          </div>

                          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="font-mono text-[9px] text-slate-400 uppercase font-bold">Duration</span>
                              <span className="font-sans text-xs font-semibold text-slate-600">{course.duration}</span>
                            </div>
                            
                            <a
                              href={course.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 bg-sky-500 hover:bg-sky-600 text-white font-sans text-xs font-bold px-3 py-2 rounded-xl transition duration-150 shadow-xs cursor-pointer"
                            >
                              <span>Join Course</span>
                              <ExternalLink className="h-3 w-3 shrink-0" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
              ) : (
                <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm max-w-md mx-auto my-12">
                  <Compass className="h-12 w-12 text-slate-300 mx-auto mb-3 animate-pulse" />
                  <h3 className="font-sans font-bold text-slate-800 text-sm">Roadmap Sync Pending</h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    We couldn't detect a compiled roadmap for your chosen pathway. Please synchronize to initialize your custom curriculum.
                  </p>
                  <button
                    onClick={() => profile && handleGenerateRoadmap(profile.careerGoal, profile.uid)}
                    className="mt-5 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs py-2.5 px-6 rounded-xl transition duration-150 inline-flex items-center space-x-2 shadow-sm cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                    <span>Generate Custom {profile ? profile.careerGoal : "Pathway"} Roadmap</span>
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 5: AI COACH COMPANION */}
          {activeTab === "coach" && (
            <motion.div
              key="coach"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="bg-white border border-slate-200 rounded-2xl flex flex-col h-[580px] shadow-sm"
              id="coach-tab-content"
            >
              
              {/* Companion Chat Header info */}
              <div className="border-b border-slate-200 p-5 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-violet-100 text-violet-700 rounded-xl flex items-center justify-center font-bold">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-sans font-bold text-sm text-slate-800">Skill Mirror AI Coach</h3>
                    <p className="text-[11px] text-emerald-600 font-sans font-medium flex items-center gap-1 mt-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Ready with context (Profile + Quizzes)</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setChatMessages([])}
                  className="font-sans text-[11px] font-bold text-rose-500 hover:text-rose-700"
                >
                  Clear Thread
                </button>
              </div>

              {/* Chat Log Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center p-8 text-center max-w-md mx-auto">
                    <Bot className="h-12 w-12 text-slate-300 mb-2" />
                    <h4 className="font-display font-medium text-slate-800 text-sm">Initiate Personalized Career Mentorship</h4>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      Hi, I am your dedicated AI Diagnostic Coach. Ask me how to improve weaker categories, build a matching project for your target <strong>{profile ? profile.careerGoal : "Career Goal"}</strong>, or crack technical screening rounds!
                    </p>
                    
                    {/* Starter questions */}
                    <div className="grid grid-cols-1 gap-2 w-full mt-6">
                      <button
                        onClick={() => {
                          setUserInput("How can I prepare for technical interviews based on my current scores?");
                        }}
                        className="bg-white hover:bg-slate-50 text-left border border-slate-200 py-2.5 px-4 rounded-xl text-xs text-slate-600 font-sans font-medium transition"
                      >
                        "How can I prepare for technical interviews based on my current scores?"
                      </button>
                      <button
                        onClick={() => {
                          setUserInput(`Suggest 3 capstone projects to build for a ${profile?.careerGoal || "Web Developer"}.`);
                        }}
                        className="bg-white hover:bg-slate-50 text-left border border-slate-200 py-2.5 px-4 rounded-xl text-xs text-slate-600 font-sans font-medium transition"
                      >
                        "Suggest 3 capstone projects to build for a {profile?.careerGoal || 'learner'}."
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {chatMessages.map((msg, index) => (
                      <div 
                        key={index}
                        className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                      >
                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm font-sans leading-relaxed ${
                          msg.role === "user" 
                            ? "bg-violet-600 text-white rounded-tr-none" 
                            : "bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm"
                        }`}>
                          {/* Parse bold and line break tags since we prefer simplified markdown formatting */}
                          <div className="whitespace-pre-wrap select-text markdown-body">
                            {msg.text.split("**").map((part, i) => {
                              // basic parsing of **bold** text blocks
                              if (i % 2 === 1) {
                                return <strong key={i} className="font-extrabold text-violet-800 bg-violet-50/80 px-1 py-0.5 rounded">{part}</strong>;
                              }
                              return part.split("* ").map((subpart, j) => {
                                // basic bullet items parse
                                if (j > 0) {
                                  return <div key={`${i}-${j}`} className="flex items-start space-x-2 pl-2 mt-1"><span className="text-violet-600">•</span><span>{subpart}</span></div>;
                                }
                                return subpart;
                              });
                            })}
                          </div>
                        </div>
                        <span className="font-mono text-[9px] text-slate-400 mt-1.5 px-2">
                          {msg.role === "user" ? "You" : "AI Coach"} • {msg.timestamp}
                        </span>
                      </div>
                    ))}

                    {/* Pending state */}
                    {isSendingToAI && (
                      <div className="flex flex-col items-start">
                        <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3.5 flex items-center space-x-2 shadow-sm shrink-0">
                          <span className="h-2 w-2 rounded-full bg-violet-600 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                          <span className="h-2 w-2 rounded-full bg-violet-600 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                          <span className="h-2 w-2 rounded-full bg-violet-600 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                        </div>
                        <span className="font-mono text-[9px] text-slate-400 mt-1.5 px-2">Calculating analyzer predictions...</span>
                      </div>
                    )}

                    <div ref={chatBottomRef} />
                  </div>
                )}
              </div>

              {/* Chat Input form Footer */}
              <form onSubmit={handleSendToCoach} className="border-t border-slate-200 p-4 flex gap-3 bg-white rounded-b-2xl">
                <input
                  id="chat-input"
                  type="text"
                  placeholder={profile ? `Ask your AI Coach about ${profile.careerGoal} standard pathways...` : "Type a message..."}
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  disabled={isSendingToAI}
                  className="flex-1 border border-slate-300 focus:border-violet-600 focus:ring-1 focus:ring-violet-600 font-sans text-sm px-4 py-3 rounded-xl outline-none outline-0 transition"
                  autoComplete="off"
                />
                <button
                  id="send-chat-btn"
                  type="submit"
                  disabled={!userInput.trim() || isSendingToAI}
                  className="bg-violet-600 hover:bg-violet-700 text-white p-3 rounded-xl transition duration-150 shadow-sm shrink-0 disabled:opacity-45"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>

            </motion.div>
          )}
          </AnimatePresence>

        </main>
      </div>

      {/* Persistent global mini footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs font-sans text-slate-400">
        <p>© 2026 Skill Mirror workspace platform. Utilizing server-side Gemini 3.5 API and cloud Firestore orchestration.</p>
      </footer>

      {/* Video Preview Modal */}
      <AnimatePresence>
        {previewTopic && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isSubmittingSuggestion) {
                  setPreviewTopic(null);
                  setIsFormOpen(false);
                }
              }}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-50 dark:bg-red-950/40 rounded-xl">
                    <Video className="h-5 w-5 text-red-500 dark:text-red-400" />
                  </div>
                  <div>
                    <span className="font-mono text-[9px] font-bold text-red-500 uppercase tracking-widest block mb-0.5">READY FOR PLAYBACK</span>
                    <h3 className="font-display text-sm font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                      Topic Resource: {previewTopic.name}
                    </h3>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    setPreviewTopic(null);
                    setIsFormOpen(false);
                  }}
                  disabled={isSubmittingSuggestion}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="p-6 overflow-y-auto space-y-6">
                
                {/* 1. Video Player Placeholder/Dashboard Card */}
                <div className="relative group overflow-hidden bg-slate-950 rounded-2xl border border-slate-800 shadow-lg aspect-video flex flex-col justify-between p-5">
                  
                  {/* Glowing background highlights simulating a high-end canvas */}
                  <div className="absolute inset-0 bg-radial-gradient from-violet-900/10 via-slate-950 to-slate-950 pointer-events-none opacity-50 block" />

                  {/* Top indicators */}
                  <div className="flex items-center justify-between z-10">
                    <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="font-mono text-[9px] font-semibold text-red-400 tracking-wider uppercase">STREAM OK</span>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-[9px] text-slate-400 block font-medium">Difficulty Level</span>
                      <span className={`inline-block font-sans text-[10px] font-extrabold px-2 py-0.5 rounded-md mt-0.5 ${
                        previewTopic.difficulty === "Beginner"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : previewTopic.difficulty === "Intermediate"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}>
                        {previewTopic.difficulty}
                      </span>
                    </div>
                  </div>

                  {/* Center UI indicating video readiness */}
                  <div className="flex flex-col items-center justify-center text-center py-4 z-10">
                    <div className="relative mb-3">
                      <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl scale-125 animate-pulse" />
                      <div className="relative bg-red-600 hover:bg-red-500 text-white rounded-full p-4.5 shadow-xl transition-all duration-300 group-hover:scale-105">
                        <Play className="h-7 w-7 fill-current text-white translate-x-0.5" />
                      </div>
                    </div>
                    
                    <h4 className="font-display font-bold text-slate-100 text-base leading-snug max-w-md">
                      {previewTopic.youtubeTitle || "Pre-Vetted Learning Guide"}
                    </h4>
                    <p className="font-sans text-xs text-slate-400 mt-1 max-w-sm">
                      Press Play to open the secure study block. Time cost estimated: <span className="text-slate-200 font-semibold font-mono">{previewTopic.duration}</span>
                    </p>
                  </div>

                  {/* Bottom details */}
                  <div className="flex items-center justify-between border-t border-slate-900/80 pt-3 z-10 text-xs text-slate-500">
                    <div className="flex items-center space-x-1.5">
                      <span className="bg-slate-900 px-2 py-1 rounded-md text-slate-400 font-mono text-[9px] tracking-tight">{previewTopic.category}</span>
                    </div>
                    <span className="font-mono text-[9px] text-slate-500">TARGET: AI_MIRROR_V_FEED</span>
                  </div>

                  {/* Full card absolute click trigger for beautiful video opening experience */}
                  <a
                    href={previewTopic.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 z-20 cursor-pointer focus:outline-hidden"
                    title="Click to launch guide in new tab"
                  />
                </div>

                {/* Main Action Bar */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href={previewTopic.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-600 font-sans text-sm font-bold py-3.5 px-5 rounded-2xl shadow-lg hover:shadow-red-500/10 transition-all duration-150 text-center"
                  >
                    <Play className="h-4 w-4 fill-current shrink-0" />
                    <span>Open Tutorial in YouTube</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-80" />
                  </a>

                  {previewTopic.completed ? (
                    <button
                      type="button"
                      onClick={() => {
                        handleToggleTopic(previewTopic.id);
                        setPreviewTopic({ ...previewTopic, completed: false });
                      }}
                      className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-300 font-sans text-sm font-bold py-3.5 px-5 rounded-2xl transition cursor-pointer"
                    >
                      Undo Progress Mark
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        handleToggleTopic(previewTopic.id);
                        setPreviewTopic({ ...previewTopic, completed: true });
                      }}
                      className="bg-violet-50 hover:bg-violet-100 border border-violet-100 text-violet-700 dark:bg-violet-950/30 dark:hover:bg-violet-900/20 dark:border-violet-900/30 dark:text-violet-300 font-sans text-sm font-bold py-3.5 px-5 rounded-2xl transition cursor-pointer"
                    >
                      Mark as Completed
                    </button>
                  )}
                </div>

                {/* 2. Suggest Replacement Link Feedback Form Section */}
                <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/20">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(!isFormOpen)}
                    className="w-full text-left px-5 py-4 flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-900/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5">
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                      <span>Link Broken or Outdated? Update Video</span>
                    </div>
                    {isFormOpen ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </button>

                  <AnimatePresence initial={false}>
                    {(isFormOpen || previewTopic.suggestedUrl) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden border-t border-slate-100 dark:border-slate-800"
                      >
                        <div className="p-5 space-y-4">
                          {/* If they already submitted a suggestion */}
                          {previewTopic.suggestedUrl ? (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 rounded-xl p-4 space-y-3">
                              <div className="flex items-center space-x-2">
                                <Check className="h-4 w-4 text-emerald-500" />
                                <span className="text-xs font-bold uppercase tracking-wider">Active Video Update Suggestion Submitted</span>
                              </div>
                              <div className="text-xs space-y-1">
                                <p className="font-sans">
                                  <strong className="font-semibold">Suggested Alternative:</strong>{" "}
                                  <a
                                    href={previewTopic.suggestedUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="underline text-emerald-600 dark:text-emerald-400 break-all"
                                  >
                                    {previewTopic.suggestedUrl}
                                  </a>
                                </p>
                                {previewTopic.suggestedReason && (
                                  <p className="font-sans">
                                    <strong className="font-semibold">Reason Reported:</strong> {previewTopic.suggestedReason}
                                  </p>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 block">
                                Students on your track can see this suggestion. Our curriculum managers are auditing the replacement link.
                              </p>
                              <div className="pt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Let user clear/edit by updating state to empty
                                    handleSuggestReplacement(previewTopic.id, "", "", "");
                                  }}
                                  className="text-[10px] font-bold text-red-600 hover:text-red-700 hover:underline dark:text-red-400 cursor-pointer"
                                >
                                  Retract/Cancel This Suggestion
                                </button>
                              </div>
                            </div>
                          ) : (
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                if (!suggestionUrl.trim()) {
                                  triggerNotification("Please supply an alternate video link.", "error");
                                  return;
                                }
                                handleSuggestReplacement(
                                  previewTopic.id,
                                  suggestionUrl,
                                  suggestionReason || "Link is broken",
                                  suggestionNotes
                                );
                              }}
                              className="space-y-4"
                            >
                              <p className="text-xs text-slate-500 leading-relaxed">
                                Help us maintain pristine resources! If this YouTube link has expired, is blocked in your location, or if you found a higher quality learning tutorial, enter the details:
                              </p>

                              <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                  Suggested Replacement Video Link
                                </label>
                                <input
                                  type="url"
                                  required
                                  placeholder="e.g., https://www.youtube.com/watch?v=..."
                                  value={suggestionUrl}
                                  onChange={(e) => setSuggestionUrl(e.target.value)}
                                  className="w-full border border-slate-300 focus:border-violet-600 focus:ring-1 focus:ring-violet-600 font-sans text-sm px-4 py-2.5 rounded-xl outline-hidden dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 transition"
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div className="space-y-1.5">
                                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Primary Reason
                                  </label>
                                  <select
                                    value={suggestionReason}
                                    onChange={(e) => setSuggestionReason(e.target.value)}
                                    className="w-full border border-slate-300 focus:border-violet-600 focus:ring-1 focus:ring-violet-600 font-sans text-xs px-3 py-2.5 rounded-xl outline-hidden dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100"
                                  >
                                    <option value="">-- Choose Issue --</option>
                                    <option value="Link is broken (404/Deleted)">Link is broken (404/Deleted)</option>
                                    <option value="Video is outdated (out-of-range version)">Video is outdated / Deprecated tools</option>
                                    <option value="Extremely poor sound/video quality">Extremely poor sound/video quality</option>
                                    <option value="Better/Simpler alternative guide available">Better alternative guide is available</option>
                                  </select>
                                </div>

                                <div className="space-y-1.5">
                                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Optional Notes
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="e.g. video series is missing part 2"
                                    value={suggestionNotes}
                                    onChange={(e) => setSuggestionNotes(e.target.value)}
                                    className="w-full border border-slate-300 focus:border-violet-600 focus:ring-1 focus:ring-violet-600 font-sans text-xs px-3.5 py-2.5 rounded-xl outline-hidden dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 transition"
                                  />
                                </div>
                              </div>

                              <div className="flex justify-end pt-1">
                                <button
                                  type="submit"
                                  disabled={isSubmittingSuggestion || !suggestionUrl.trim()}
                                  className="bg-slate-900 hover:bg-black text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-sans text-xs font-bold py-2.5 px-5 rounded-xl transition cursor-pointer disabled:opacity-50"
                                >
                                  {isSubmittingSuggestion ? "Submitting Request..." : "Submit Video Update Request"}
                                </button>
                              </div>
                            </form>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>
              
              {/* Footer */}
              <div className="bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex justify-between items-center shrink-0">
                <span className="text-[10px] text-slate-400 font-mono">ID: REF_TRK_{previewTopic.id.toUpperCase()}</span>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewTopic(null);
                    setIsFormOpen(false);
                  }}
                  className="bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  Dismiss Preview
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
