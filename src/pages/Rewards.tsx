import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, ScanLine, Clock, ArrowRight, CheckCircle, Send, Globe, Users, Bell } from "lucide-react";
import { FaTwitter, FaInstagram, FaFacebook, FaYoutube, FaTelegramPlane } from 'react-icons/fa';
import { useWallet } from "../hooks/useWallet";
import { useTelegramUser } from "../hooks/useTelegramUser";
import { useNavigate } from "react-router-dom";
import { TOKENS } from "../lib/tokens";
import { getEvents, getTasks, getCompletedTasks, saveCompletedTasks } from "../lib/db";
import { useSettings } from "../lib/SettingsContext";

export function Rewards() {
  const telegramUser = useTelegramUser();
  const { settings, t } = useSettings();
  const { telegramId, firstName, photoUrl } = telegramUser;
  const navigate = useNavigate();
  const { addActivity } = useWallet(telegramUser);
  const [taskStates, setTaskStates] = useState<Record<string, 'start' | 'verify' | 'claim' | 'done'>>({});
  const [taskCountdowns, setTaskCountdowns] = useState<Record<string, number>>({});
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeEventCategory, setActiveEventCategory] = useState<string>("All");
  const [events, setEvents] = useState<any[]>([]);
  const [timeLefts, setTimeLefts] = useState<Record<string, { days: number, hours: number, mins: number, secs: number }>>({});
  const [notificationState, setNotificationState] = useState<{show: boolean, message: string, amount?: number, isError?: boolean} | null>(null);
  
  const setNotification = (notif: any) => {
    if (notif === null) {
      setNotificationState(null);
      return;
    }
    // Only show if notifications are enabled
    if (settings.notifications) {
      setNotificationState(notif);
    }
  };
  
  const notification = notificationState;

  const rewardToken = TOKENS.find(t => t.symbol === "UUSD");
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      let dbEvents: any[] | null = null;
      let dbTasks: any[] | null = null;
      
      try {
        dbEvents = await getEvents();
        dbTasks = await getTasks();
      } catch (err) {
        console.log("Firebase fetch failed, falling back to local storage:", err);
      }

      if (!active) return;

      let loadedEvents = [];
      const eventsInitialized = localStorage.getItem('events_initialized');
      
      if (dbEvents && (dbEvents.length > 0 || eventsInitialized)) {
        loadedEvents = dbEvents;
        localStorage.setItem('events_initialized', 'true');
        localStorage.setItem('mock_events_registry', JSON.stringify(loadedEvents));
      } else {
        const eventsStr = localStorage.getItem('mock_events_registry');
        if (eventsStr) {
          loadedEvents = JSON.parse(eventsStr);
        } else {
          const settingsStr = localStorage.getItem('mock_event_settings');
          const defaultSettings = settingsStr ? JSON.parse(settingsStr) : {
            rewardText: "10,000 UUSD\nReward Pool",
            posterUrl: "https://i.ibb.co/sv0csNrY/file-000000006b50820c8d7057209ac71f57.png",
            durationDays: 15,
            category: "General"
          };
          loadedEvents = [{ id: "default", title: "Main Event", ...defaultSettings }];
        }
        localStorage.setItem('events_initialized', 'true');
        localStorage.setItem('mock_events_registry', JSON.stringify(loadedEvents));
      }
      setEvents(loadedEvents);
      
      let loadedTasks = [];
      const tasksInitialized = localStorage.getItem('tasks_initialized');
      
      if (dbTasks && (dbTasks.length > 0 || tasksInitialized)) {
        loadedTasks = dbTasks;
        localStorage.setItem('tasks_initialized', 'true');
      } else {
        const tasksStr = localStorage.getItem('mock_tasks_registry');
        if (tasksStr) {
          loadedTasks = JSON.parse(tasksStr);
        } else {
          loadedTasks = [
            { id: "task_twitter", title: "Follow Official X (Twitter)", description: "Follow us on X", reward: 0.25, iconType: "twitter", link: "https://twitter.com", category: "Social", eventId: "default" },
            { id: "task_telegram", title: "Join Official Telegram Channel", description: "Stay updated", reward: 0.25, iconType: "telegram", link: "https://t.me", category: "Social", eventId: "default" },
            { id: "task_website", title: "Visit Official Website", description: "Check out our website", reward: 0.25, iconType: "website", link: "https://google.com", category: "Web", eventId: "default" },
            { id: "task_ref_1", title: "1 Referral", description: "Invite 1 friend", reward: 0.25, iconType: "referral", link: "", category: "Referral", eventId: "default", requiredReferrals: 1 },
          ];
        }
        localStorage.setItem('tasks_initialized', 'true');
      }
      setTasks(loadedTasks);

      // Load completed tasks
      let completed: any = {};
      try {
        completed = await getCompletedTasks(telegramId);
      } catch (err) {
        const compStr = localStorage.getItem(`mock_user_completed_tasks_${telegramId}`);
        completed = compStr ? JSON.parse(compStr) : {};
      }

      const states: any = {};
      
      Object.keys(completed).forEach(k => {
        if (completed[k]) states[k] = 'done';
      });
        
        // Auto-check referral thresholds
        const refsStr = localStorage.getItem(`mock_referrals_count_${telegramId}`);
        const currentRefs = refsStr ? parseInt(refsStr) : 0;
        
        loadedTasks.forEach((task: any) => {
          if (task.category === "Referral" && !states[task.id]) {
            if (currentRefs >= (task.requiredReferrals || 1)) {
              states[task.id] = 'claim';
            }
          }
        });

        setTaskStates(states);

        // Load timer
        let startTime = localStorage.getItem('mock_event_start_time');
        if (!startTime) {
          startTime = Date.now().toString();
          localStorage.setItem('mock_event_start_time', startTime);
        }
        
        const updateTimers = () => {
          const now = Date.now();
          const newTimeLefts: any = {};
          loadedEvents.forEach((ev: any) => {
            const durationDays = ev.durationDays || 15;
            const endTime = parseInt(startTime!) + durationDays * 24 * 60 * 60 * 1000;
            const diff = endTime - now;
            if (diff <= 0) {
              newTimeLefts[ev.id] = { days: 0, hours: 0, mins: 0, secs: 0 };
            } else {
              newTimeLefts[ev.id] = {
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                mins: Math.floor((diff / 1000 / 60) % 60),
                secs: Math.floor((diff / 1000) % 60)
              };
            }
          });
          setTimeLefts(newTimeLefts);
        };

        updateTimers();
        const intervalId = setInterval(updateTimers, 1000);
        return intervalId;
    };

    let timerInterval: any;
    fetchData().then(intervalId => {
      timerInterval = intervalId;
    });

    return () => {
      active = false;
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [telegramId]);

  // Handle task verification (mock)
  const [verifyingTasks, setVerifyingTasks] = useState<Record<string, boolean>>({});

  const handleTaskAction = (task: any) => {
    const taskId = task.id;
    const currentState = taskStates[taskId] || 'start';
    
    const isTelegram = task.iconType === 'telegram' || task.title.toLowerCase().includes('telegram');
    
    if (currentState === 'start') {
      if (task.link) {
        window.open(task.link, '_blank');
        if (isTelegram) {
          sessionStorage.setItem('tg_joined_' + taskId, 'true');
        }
      }
      
      if (isTelegram) {
        // No countdown for Telegram tasks
        setTaskStates(prevStates => ({...prevStates, [taskId]: 'verify'}));
      } else {
        setTaskCountdowns(prev => ({...prev, [taskId]: 5}));
        
        let timeLeft = 5;
        const interval = setInterval(() => {
          timeLeft -= 1;
          if (timeLeft <= 0) {
            clearInterval(interval);
            setTaskStates(prevStates => ({...prevStates, [taskId]: 'verify'}));
            setTaskCountdowns(prev => {
              const newState = {...prev};
              delete newState[taskId];
              return newState;
            });
          } else {
            setTaskCountdowns(prev => ({...prev, [taskId]: timeLeft}));
          }
        }, 1000);
      }
    } else if (currentState === 'verify') {
      
      // Simulate API verification for Social and mock check for Referral
      setVerifyingTasks(prev => ({...prev, [taskId]: true}));

      let delay = 300;
      if (isTelegram && task.requireVerification) {
        delay = 1500; // API Simulation delay
      }

      setTimeout(() => {
        setVerifyingTasks(prev => ({...prev, [taskId]: false}));
        
        if (task.category === "Referral") {
          const globalRefsStr = localStorage.getItem('mock_global_referrals');
          const globalRefs = globalRefsStr ? JSON.parse(globalRefsStr) : [];
          const currentRefs = globalRefs.filter((ref: any) => ref.referrerId === telegramId).length;
          
          if (currentRefs < (task.requiredReferrals || 1)) {
            setNotification({
              show: true,
              message: `You need ${task.requiredReferrals} referrals. You have ${currentRefs}.`,
              isError: true
            });
            setTimeout(() => setNotification(null), 3000);
            return;
          }
        } else if (isTelegram && task.requireVerification) {
          // Mocking the telegram API check predictably
          const hasJoined = sessionStorage.getItem('tg_joined_' + taskId) === 'true';
          if (!hasJoined) {
            setNotification({
              show: true,
              message: `Please join the Telegram channel first!`,
              isError: true
            });
            setTimeout(() => setNotification(null), 3000);
            return;
          }
        }

        setTaskStates(prev => ({...prev, [taskId]: 'claim'}));
      }, delay);

    } else if (currentState === 'claim') {
      const newStates = { ...taskStates, [taskId]: 'done' };
      setTaskStates(newStates);
      
      // Save to Firebase and update local storage as fallback
      getCompletedTasks(telegramId).then(completed => {
        const newCompleted = { ...completed, [taskId]: true };
        saveCompletedTasks(telegramId, newCompleted).catch(err => console.log("Failed to save completed tasks to FB", err));
        localStorage.setItem(`mock_user_completed_tasks_${telegramId}`, JSON.stringify(newCompleted));
      }).catch(err => {
        // Fallback
        const compStr = localStorage.getItem(`mock_user_completed_tasks_${telegramId}`);
        const completed = compStr ? JSON.parse(compStr) : {};
        completed[taskId] = true;
        localStorage.setItem(`mock_user_completed_tasks_${telegramId}`, JSON.stringify(completed));
      });
      
      let finalReward = task.reward;
      if (task.category === "Referral") {
        finalReward = task.reward * (task.requiredReferrals || 1);
      }

      addActivity('earn', finalReward, 'UUSD', { toName: task.title }); 
      
      setNotification({
        show: true,
        message: `You successfully claimed`,
        amount: finalReward
      });
      
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    }
  };

  const completedCount = Object.values(taskStates).filter(s => s === 'done').length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const eventCategories = ['All', ...new Set(events.map(e => e.category || 'General'))];
  const filteredEvents = events.filter(e => activeEventCategory === 'All' || (e.category || 'General') === activeEventCategory);
  
  const eventTitles = events.map(e => e.title);
  const existingTaskCategories = tasks.map(t => t.category || 'Other');
  const taskCategories = ['All', ...new Set([...eventTitles, ...existingTaskCategories])];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col relative pb-6 pt-4"
    >
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
          >
            <div className={`backdrop-blur-md text-white px-5 py-3 rounded-2xl flex items-center gap-3 border ${notification.isError ? 'bg-red-500/90 border-red-400/50 shadow-[0_8px_32px_rgba(239,68,68,0.4)]' : 'bg-gradient-to-r from-[#00C087]/90 to-[#00a876]/90 border-white/20 shadow-[0_8px_32px_rgba(0,192,135,0.4)]'}`}>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                {notification.isError ? (
                  <span className="text-white font-bold text-lg">!</span>
                ) : (
                  <CheckCircle className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold leading-tight">{notification.message}</span>
                {!notification.isError && notification.amount !== undefined && (
                  <span className="text-lg font-black leading-tight">+{notification.amount.toFixed(2)} UUSD</span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header matching Wallet */}
      <header className="flex items-center justify-between mb-6 px-2">
        <button onClick={() => navigate("/profile")} className="w-10 h-10 rounded-full overflow-hidden active:scale-95 transition-transform bg-white/[0.04] backdrop-blur-md border border-white/[0.05] flex items-center justify-center">
          {photoUrl ? (
            <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-bold text-white/80">
              {firstName ? firstName.charAt(0) : "U"}
            </span>
          )}
        </button>
        
        {/* Project Name (Center) */}
        <div className="bg-gradient-to-r from-[#8792FF]/20 to-white/5 backdrop-blur-md border border-[#8792FF]/20 px-5 py-2 rounded-full shadow-lg flex items-center gap-2">
          <img src="https://i.ibb.co/k27sBd6Q/0x61a10e8556bed032ea176330e7f17d6a12a10000.png" alt="Logo" className="w-5 h-5 rounded-full filter drop-shadow-[0_0_8px_rgba(135,146,255,0.5)]" />
          <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 tracking-wide">Reward</span>
        </div>

        <div className="w-10 h-10"></div>
      </header>

      <div className="flex items-center justify-between mt-2 px-3 mb-2">
        <h2 className="text-[18px] font-bold text-white">Event</h2>
      </div>

      <AnimatePresence mode="wait">
        {!selectedEventId ? (
          <motion.div 
            key="events-list"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col gap-4 px-2 pb-24"
          >
            {events.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-edges-right mb-2">
                {eventCategories.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setActiveEventCategory(cat as string)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${activeEventCategory === cat ? 'bg-[#8792FF] text-white shadow-[0_2px_8px_rgba(135,146,255,0.4)]' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                  >
                    {cat as string}
                  </button>
                ))}
              </div>
            )}
            
            {filteredEvents.map(ev => {
              const tLeft = timeLefts[ev.id] || { days: 0, hours: 0, mins: 0, secs: 0 };
              return (
                <div key={ev.id} className="w-full aspect-[16/9] rounded-[24px] overflow-hidden relative shadow-lg border border-white/5 bg-[#13141a]">
                  <img 
                    src={ev.posterUrl}
                    alt={ev.title}
                    onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400/1a1b23/8792FF.png?text=Invalid+Image+URL'; e.currentTarget.onerror = null; }}
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f]/80 via-transparent to-transparent"></div>
                  
                  {/* Subtle Top Left: Event Title */}
                  <div className="absolute top-3 left-3 bg-black/20 backdrop-blur-sm px-2.5 py-1 rounded-md flex items-center gap-1.5">
                    <span className="text-white/90 text-[10px] font-medium">{ev.title}</span>
                    <div className="w-1 h-1 rounded-full bg-white/30"></div>
                    <span className="text-[#8792FF] text-[9px] font-bold">{tasks.filter(t => t.eventId === ev.id).length} Tasks</span>
                  </div>
                  
                  {/* Subtle Top Right: Timer */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/20 backdrop-blur-sm px-2 py-1 rounded-md">
                    <Clock className="w-2.5 h-2.5 text-[#8792FF]/80" />
                    <div className="flex items-center text-white/80 font-mono text-[9px] font-medium tracking-wide">
                      <span>{String(tLeft.days).padStart(2, '0')}</span><span className="text-white/40 mx-[1px]">d</span>
                      <span>{String(tLeft.hours).padStart(2, '0')}</span><span className="text-white/40 mx-[1px]">h</span>
                      <span>{String(tLeft.mins).padStart(2, '0')}</span><span className="text-white/40 mx-[1px]">m</span>
                      <span>{String(tLeft.secs).padStart(2, '0')}</span><span className="text-white/40 ml-[1px]">s</span>
                    </div>
                  </div>

                  <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
                    <div className="flex flex-col">
                      <span className="text-white text-xl font-black drop-shadow-lg leading-tight whitespace-pre-wrap">{ev.rewardText}</span>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedEventId(ev.id);
                        const firstCat = 'All';
                        setActiveCategory(firstCat);
                      }}
                      className="bg-[#8792FF] hover:bg-[#727dee] text-white font-bold py-1.5 px-4 rounded-full active:scale-95 transition-transform shadow-[0_2px_8px_rgba(135,146,255,0.4)] flex items-center gap-1.5 text-[13px] shrink-0 ml-4"
                    >
                      Start <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div 
            key="tasks"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col px-2 mt-2 pb-24"
          >
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => setSelectedEventId(null)}
                className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-[13px] font-semibold bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/5"
              >
                <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Back
              </button>
              
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-edges-right pb-2">
                {['All', ...new Set(tasks.filter(t => t.eventId === selectedEventId).map(t => t.category || 'Other'))].map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setActiveCategory(cat as string)}
                    className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all shrink-0 border ${activeCategory === cat ? 'bg-[#8792FF]/20 text-[#8792FF] border-[#8792FF]/50 shadow-[0_4px_12px_rgba(135,146,255,0.15)]' : 'bg-white/5 text-white/50 border-white/5 hover:bg-white/10 hover:text-white'}`}
                  >
                    {cat as string}
                  </button>
                ))}
              </div>
            </div>

            {tasks.filter(t => t.eventId === selectedEventId && (activeCategory === 'All' || t.category === activeCategory)).length === 0 && (
              <div className="text-center text-white/40 text-sm mt-8 py-8 border border-white/5 rounded-2xl bg-white/[0.02]">
                No tasks available in this category.
              </div>
            )}

            {tasks.filter(t => t.eventId === selectedEventId && (activeCategory === 'All' || t.category === activeCategory)).map((task) => {
              const state = taskStates[task.id] || 'start';
              const isVerifying = verifyingTasks[task.id];
              const currentCountdown = taskCountdowns[task.id];
              const isOpening = currentCountdown !== undefined;
              
              const getIcon = () => {
                if (task.iconUrl) {
                  return <img src={task.iconUrl} onError={(e) => { e.currentTarget.src = 'https://placehold.co/100x100/1a1b23/8792FF.png?text=Icon'; e.currentTarget.onerror = null; }}  alt="icon" className="w-8 h-8 object-cover rounded-full"  />;
                }
                switch(task.iconType) {
                  case 'twitter': return <span className="text-blue-400 flex items-center justify-center"><FaTwitter size={20} /></span>;
                  case 'instagram': return <span className="text-pink-500 flex items-center justify-center"><FaInstagram size={20} /></span>;
                  case 'facebook': return <span className="text-blue-500 flex items-center justify-center"><FaFacebook size={20} /></span>;
                  case 'youtube': return <span className="text-red-500 flex items-center justify-center"><FaYoutube size={20} /></span>;
                  case 'telegram': return <span className="text-blue-400 flex items-center justify-center"><FaTelegramPlane size={20} /></span>;
                  case 'website': 
                  case 'web': return <Globe className="w-5 h-5 text-purple-400" />;
                  case 'referral': return <Users className="w-5 h-5 text-[#8792FF]" />;
                  default: return <span className="text-xl">{task.icon || '✨'}</span>;
                }
              };

              return (
                <div key={task.id} className="bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.15)] rounded-[16px] p-3 flex items-center justify-between mb-2 relative overflow-hidden group hover:border-white/[0.15] hover:bg-white/[0.08] transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 border border-white/20 shrink-0 overflow-hidden">
                      {getIcon()}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[14px] font-bold text-white leading-tight">{task.title}</span>
                      <span className="text-[12px] text-white/50">{task.description}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white/70">
                          {task.category || 'General'}
                        </div>
                        <div className="flex items-center gap-1">
                          <img src={rewardToken?.imgUrl} alt="Reward" className="w-3.5 h-3.5 rounded-full object-cover shadow-sm" />
                          <span className="text-[12px] font-extrabold text-[#8792FF]">{(task.category === 'Referral' ? (task.reward * (task.requiredReferrals || 1)) : task.reward).toFixed(2)} $UUSD</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {state === 'done' ? (
                      <div className="px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center shadow-inner text-white/40 font-bold text-[12px] gap-1.5">
                         <CheckCircle className="w-3.5 h-3.5 text-[#00C087]" /> Done
                      </div>
                    ) : (
                      <button 
                        onClick={() => !isVerifying && !isOpening && handleTaskAction(task)}
                        disabled={isVerifying || isOpening}
                        className={`text-[12px] font-bold px-4 py-1.5 rounded-full transition-all flex items-center justify-center min-w-[70px] shadow-sm relative overflow-hidden ${
                          isVerifying || isOpening
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30 opacity-70 cursor-not-allowed'
                            : state === 'verify' 
                            ? 'bg-[#8792FF]/15 text-[#8792FF] border border-[#8792FF]/30 hover:bg-[#8792FF]/25' 
                            : state === 'claim'
                            ? 'bg-gradient-to-r from-[#8792FF] to-[#6b76e3] text-white hover:from-[#96a0ff] hover:to-[#7a84e6] shadow-[0_2px_8px_rgba(135,146,255,0.4)] border border-[#8792FF]/50'
                            : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                        }`}
                      >
                        {isOpening ? `Wait ${currentCountdown}s` : isVerifying ? 'Checking...' : state === 'verify' ? 'Verify' : state === 'claim' ? 'Claim' : 'Start'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

