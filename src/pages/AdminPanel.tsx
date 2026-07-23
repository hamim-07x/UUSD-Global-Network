import { syncToFirebase } from '../lib/sync';
import { db } from '../lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Users, Database, Shield, Search, Edit2, Check, X, LayoutDashboard, ListTodo, ScrollText, Plus, Globe } from "lucide-react";
import { FaTwitter, FaInstagram, FaFacebook, FaYoutube, FaTelegramPlane } from 'react-icons/fa';
import { useNavigate } from "react-router-dom";
import { UserRegistryEntry } from "../hooks/useWallet";
import { getTasks, getEvents, saveTask, saveEvent, deleteTaskDoc, deleteEventDoc } from '../lib/db';

interface AdminUser extends UserRegistryEntry {
  balance: number;
}

export function AdminPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'tasks' | 'event' | 'referrals'>('dashboard');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [usersJoinedToday, setUsersJoinedToday] = useState(0);
  const [usersEarnedTokens, setUsersEarnedTokens] = useState(0);
  const [amountEarnedToday, setAmountEarnedToday] = useState(0);
  const [totalAmountEarned, setTotalAmountEarned] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState("");

  // Referrals
  const [referrals, setReferrals] = useState<any[]>([]);
  const [botUsername, setBotUsername] = useState(localStorage.getItem('mock_bot_username') || "our_bot");

  // Logs
  const [allLogs, setAllLogs] = useState<any[]>([]);

  // Tasks
  const [tasks, setTasks] = useState<any[]>([]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskDraft, setEditingTaskDraft] = useState<any>(null);
  const [supportUsername, setSupportUsername] = useState(localStorage.getItem('mock_support_username') || "your_support_link");
  const [adminSelectedEventId, setAdminSelectedEventId] = useState<string | null>('default');
  const [newTask, setNewTask] = useState({ 
    title: "", description: "", reward: 1, icon: "✨", link: "", 
    iconType: "twitter", category: "Social", eventId: "default", requiredReferrals: 1,
    iconUrl: "", requireVerification: false
  });

  // Events
  const [events, setEvents] = useState<any[]>([]);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editingEventDraft, setEditingEventDraft] = useState<any>(null);
  const [newEvent, setNewEvent] = useState({
    title: "New Event",
    rewardText: "10,000 UUSD\nReward Pool",
    posterUrl: "https://i.ibb.co/sv0csNrY/file-000000006b50820c8d7057209ac71f57.png",
    durationDays: 15,
    category: "General"
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    let total = 0;
    const adminUsers: AdminUser[] = [];
    let _tasksCompleted = 0;
    let _usersJoinedToday = 0;
    let _usersEarnedTokens = 0;
    let _amountEarnedToday = 0;
    let _totalAmountEarned = 0;
    
    const todayStr = new Date().toISOString().split('T')[0];

    try {
      const { getUsers, getWallets, getAllActivities } = await import('../lib/db');
      
      const registry = await getUsers();
      const dbWallets = await getWallets();
      const allActivities = await getAllActivities();
      
      const userMap = new Map<string, UserRegistryEntry>();
      registry.forEach((u: any) => userMap.set(u.telegramId, u));

      dbWallets.forEach((wallet: any) => {
        const userEntry: UserRegistryEntry = userMap.get(wallet.telegramId) || {
          telegramId: wallet.telegramId,
          address: wallet.address,
          firstName: 'Unknown',
          username: null,
          photoUrl: null,
          joinedAt: undefined
        };
        
        let balance = wallet.balances?.["UUSD"] || 0;
        total += balance;
        adminUsers.push({
          ...userEntry,
          balance
        });

        if (userEntry.joinedAt && userEntry.joinedAt.startsWith(todayStr)) {
          _usersJoinedToday++;
        }
      });

      const usersWhoEarned = new Set();
      const mappedActivities = allActivities.map((act: any) => {
        const user = userMap.get(act.userTelegramId || act.telegramId);
        if (act.type === 'earn') {
          _tasksCompleted++;
          _totalAmountEarned += (act.amount || 0);
          if (act.timestamp && act.timestamp.startsWith(todayStr)) {
             _amountEarnedToday += (act.amount || 0);
          }
          usersWhoEarned.add(act.userTelegramId || act.telegramId);
        }
        return { ...act, user };
      });
      _usersEarnedTokens = usersWhoEarned.size;

      setTotalBalance(total);
      setUsers(adminUsers);
      setAllLogs(mappedActivities);
      setTasksCompleted(_tasksCompleted);
      setUsersJoinedToday(_usersJoinedToday);
      setUsersEarnedTokens(_usersEarnedTokens);
      setAmountEarnedToday(_amountEarnedToday);
      setTotalAmountEarned(_totalAmountEarned);

      const dbTasks = await getTasks();
      const isInitialized = localStorage.getItem('tasks_initialized');
      
      if (dbTasks && dbTasks.length > 0) {
        setTasks(dbTasks);
        localStorage.setItem('tasks_initialized', 'true');
      } else if (!isInitialized) {
        const tasksStr = localStorage.getItem('mock_tasks_registry');
        if (tasksStr) {
          const parsed = JSON.parse(tasksStr);
          setTasks(parsed);
          for (const task of parsed) {
            await saveTask(task);
          }
        } else {
          const defaultTasks = [
            { id: "task_twitter", title: "Follow Official X (Twitter)", description: "Follow us on X", reward: 0.25, iconType: "twitter", link: "https://twitter.com", category: "Social", eventId: "default" },
            { id: "task_telegram", title: "Join Official Telegram Channel", description: "Stay updated", reward: 0.25, iconType: "telegram", link: "https://t.me", category: "Social", eventId: "default" },
            { id: "task_website", title: "Visit Official Website", description: "Check out our website", reward: 0.25, iconType: "website", link: "https://google.com", category: "Web", eventId: "default" },
            { id: "task_ref_1", title: "1 Referral", description: "Invite 1 friend", reward: 0.25, iconType: "referral", link: "", category: "Referral", eventId: "default", requiredReferrals: 1 },
          ];
          setTasks(defaultTasks);
          for (const task of defaultTasks) {
            await saveTask(task);
          }
          localStorage.setItem('mock_tasks_registry', JSON.stringify(defaultTasks));
        }
        localStorage.setItem('tasks_initialized', 'true');
      } else {
        setTasks([]);
      }

      const dbEvents = await getEvents();
      const eventsInitialized = localStorage.getItem('events_initialized');

      if (dbEvents && (dbEvents.length > 0 || eventsInitialized)) {
        setEvents(dbEvents || []);
        localStorage.setItem('events_initialized', 'true');
      } else {
        const defaultEvent = {
          id: "default",
          title: "Main Event",
          rewardText: "10,000 UUSD\nReward Pool",
          posterUrl: "https://i.ibb.co/sv0csNrY/file-000000006b50820c8d7057209ac71f57.png",
          durationDays: 15,
          category: "General"
        };
        setEvents([defaultEvent]);
        await saveEvent(defaultEvent);
        localStorage.setItem('events_initialized', 'true');
      }

      const { getReferrals } = await import('../lib/db');
      const dbReferrals = await getReferrals();
      if (dbReferrals && dbReferrals.length > 0) {
        setReferrals(dbReferrals);
      } else {
        const refsStr = localStorage.getItem('mock_global_referrals');
        if (refsStr) {
          setReferrals(JSON.parse(refsStr));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (events.length > 0 && (!adminSelectedEventId || !events.find(e => e.id === adminSelectedEventId))) {
      setAdminSelectedEventId(events[0].id);
      setNewTask(prev => ({ ...prev, eventId: events[0].id, category: events[0].title }));
    }
  }, [events, adminSelectedEventId]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const q = searchQuery.toLowerCase();
      const nameMatch = u.firstName?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q);
      const idMatch = u.telegramId.toLowerCase().includes(q) || u.address.toLowerCase().includes(q);
      return nameMatch || idMatch;
    });
  }, [users, searchQuery]);

  const saveUsername = async (telegramId: string, address: string) => {
    try {
      const { getUsers, saveUser } = await import('../lib/db');
      const registry = await getUsers();
      const user = registry.find((u: any) => u.address === address || u.telegramId === telegramId);
      if (user) {
        user.firstName = editNameValue;
        await saveUser(user);
        fetchData();
      }
    } catch (e) {
      console.error("Failed to save username", e);
    }
    setEditingUserId(null);
  };

  const handleAddEvent = async () => {
    if (!newEvent.title) return;
    const eventToAdd = {
      ...newEvent,
      id: `event_${Date.now()}`
    };
    const newEvents = [...events, eventToAdd];
    setEvents(newEvents);
    await saveEvent(eventToAdd);
    setIsAddingEvent(false);
    setNewEvent({
      title: "New Event",
      rewardText: "10,000 UUSD\nReward Pool",
      posterUrl: "https://i.ibb.co/sv0csNrY/file-000000006b50820c8d7057209ac71f57.png",
      durationDays: 15,
      category: "General"
    });
  };

  const handleUpdateEvent = async (id: string, updatedFields: any) => {
    const newEvents = events.map(e => e.id === id ? { ...e, ...updatedFields } : e);
    setEvents(newEvents);
    const eventToUpdate = newEvents.find(e => e.id === id);
    if (eventToUpdate) await saveEvent(eventToUpdate);
    setEditingEventId(null);
  };

  const handleSaveEvent = async () => {
    if (!editingEventId || !editingEventDraft) return;
    const newEvents = events.map(e => e.id === editingEventId ? { ...e, ...editingEventDraft } : e);
    setEvents(newEvents);
    const eventToUpdate = newEvents.find(e => e.id === editingEventId);
    if (eventToUpdate) await saveEvent(eventToUpdate);
    setEditingEventId(null);
    setEditingEventDraft(null);
  };

  const handleDeleteEvent = async (id: string) => {
    const newEvents = events.filter(e => e.id !== id);
    setEvents(newEvents);
    await deleteEventDoc(id);
    
    // Delete associated tasks
    const tasksToDelete = tasks.filter(t => t.eventId === id);
    if (tasksToDelete.length > 0) {
      const newTasks = tasks.filter(t => t.eventId !== id);
      setTasks(newTasks);
      for (const t of tasksToDelete) {
        await deleteTaskDoc(t.id);
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const targetWidth = 1280;
        const targetHeight = 720;
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const imgRatio = img.width / img.height;
          const targetRatio = targetWidth / targetHeight;
          let drawWidth, drawHeight, offsetX, offsetY;

          if (imgRatio > targetRatio) {
            drawHeight = targetHeight;
            drawWidth = img.width * (targetHeight / img.height);
            offsetX = (targetWidth - drawWidth) / 2;
            offsetY = 0;
          } else {
            drawWidth = targetWidth;
            drawHeight = img.height * (targetWidth / img.width);
            offsetX = 0;
            offsetY = (targetHeight - drawHeight) / 2;
          }

          ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
          setter(canvas.toDataURL('image/jpeg', 0.85));
        }
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddTask = async () => {
    if (!newTask.title || !newTask.description) {
      alert("Title and description are required.");
      return;
    }
    if (newTask.iconType !== 'referral' && newTask.category !== 'Referral' && !newTask.link) {
      alert("Task link is required.");
      return;
    }
    const taskToAdd = {
      ...newTask,
      id: `task_${Date.now()}`
    };
    const newTasks = [...tasks, taskToAdd];
    setTasks(newTasks);
    await saveTask(taskToAdd);
    setIsAddingTask(false);
    setNewTask({ title: "", description: "", reward: 1, icon: "✨", link: "", iconType: "twitter", category: "Social", eventId: "default", requiredReferrals: 1, iconUrl: "", requireVerification: false });
  };

  const handleUpdateTask = async (id: string, updatedFields: any) => {
    const newTasks = tasks.map(t => t.id === id ? { ...t, ...updatedFields } : t);
    setTasks(newTasks);
    const taskToUpdate = newTasks.find(t => t.id === id);
    if (taskToUpdate) await saveTask(taskToUpdate);
    setEditingTaskId(null);
  };

  const handleSaveTask = async () => {
    if (!editingTaskId || !editingTaskDraft) return;
    const newTasks = tasks.map(t => t.id === editingTaskId ? { ...t, ...editingTaskDraft } : t);
    setTasks(newTasks);
    const taskToUpdate = newTasks.find(t => t.id === editingTaskId);
    if (taskToUpdate) await saveTask(taskToUpdate);
    setEditingTaskId(null);
    setEditingTaskDraft(null);
  };

  const handleCategoryChange = (category: string) => {
    const updates: any = { category };
    if (category === "Social") {
      updates.title = "Follow us on Twitter";
      updates.description = "Follow our official Twitter account";
      updates.iconType = "twitter";
      updates.reward = 10;
      updates.link = "https://twitter.com";
    } else if (category === "Web") {
      updates.title = "Visit our Website";
      updates.description = "Explore our latest features";
      updates.iconType = "web";
      updates.reward = 5;
      updates.link = "https://example.com";
    } else if (category === "Referral") {
      updates.title = "Invite Friends";
      updates.description = "Invite your friends to earn rewards";
      updates.iconType = "referral";
      updates.reward = 10;
      updates.requiredReferrals = 5;
      updates.link = ""; // No link field
    }
    setNewTask({ ...newTask, ...updates });
  };

  const handleIconTypeChange = (type: string, isEditing: boolean = false, taskId?: string) => {
    let title = isEditing ? "" : newTask.title;
    let description = isEditing ? "" : newTask.description;
    let category = isEditing ? "Social" : newTask.category;

    if (type === 'twitter') { title = "Follow us on Twitter"; description = "Follow our official Twitter account"; category = "Social"; }
    else if (type === 'telegram') { title = "Join our Telegram"; description = "Join our official Telegram channel"; category = "Social"; }
    else if (type === 'youtube') { title = "Subscribe to YouTube"; description = "Subscribe to our YouTube channel"; category = "Social"; }
    else if (type === 'instagram') { title = "Follow on Instagram"; description = "Follow our official Instagram page"; category = "Social"; }
    else if (type === 'facebook') { title = "Like us on Facebook"; description = "Like our Facebook page"; category = "Social"; }
    else if (type === 'web') { title = "Visit our Website"; description = "Visit our official website"; category = "Web"; }
    else if (type === 'referral') { title = "Invite Friends"; description = "Invite friends to get rewards"; category = "Referral"; }

    if (isEditing && taskId) {
      handleUpdateTask(taskId, { iconType: type, title, description, category });
    } else {
      setNewTask({ ...newTask, iconType: type, title, description, category });
    }
  };

  const handleDeleteTask = async (id: string) => {
    const newTasks = tasks.filter(t => t.id !== id);
    setTasks(newTasks);
    await deleteTaskDoc(id);
  };

  const SidebarButton = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-2xl transition-all w-full min-w-max md:min-w-0 font-semibold ${
        activeTab === id 
          ? "bg-gradient-to-r from-[#8792FF] to-[#6b76e3] text-white shadow-[0_4px_16px_rgba(135,146,255,0.4)] border border-[#8792FF]/20" 
          : "text-white/60 hover:bg-white/[0.08] hover:text-white border border-transparent"
      }`}
      title={label}
    >
      <Icon className={`w-5 h-5 shrink-0 ${activeTab === id ? 'text-white' : 'text-white/50'}`} />
      <span className="text-sm block">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#09090b] text-white w-full overflow-hidden">
      {/* Sidebar */}
      <div className="w-full md:w-[280px] bg-[#121217] border-b md:border-b-0 md:border-r border-white/10 flex flex-row md:flex-col pt-3 md:pt-8 pb-3 md:pb-6 flex-shrink-0 items-center md:items-stretch px-4 md:px-0 z-10 overflow-x-auto shadow-2xl">
        <div className="px-2 md:px-6 md:mb-10 flex items-center gap-4 shrink-0 mr-4 md:mr-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8792FF] to-indigo-600 flex items-center justify-center shrink-0 shadow-lg border border-white/10">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="flex-col hidden md:flex">
            <h1 className="text-xl font-bold tracking-tight text-white leading-none">Admin Panel</h1>
            <span className="text-[11px] text-[#8792FF] uppercase font-bold tracking-widest mt-1">Management</span>
          </div>
        </div>
        
        <div className="flex flex-row md:flex-col gap-2 md:gap-3 px-1 md:px-4 flex-1 overflow-x-auto">
          <SidebarButton id="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <SidebarButton id="logs" icon={ScrollText} label="Activity Logs" />
          <SidebarButton id="tasks" icon={ListTodo} label="Tasks" />
          <SidebarButton id="event" icon={Edit2} label="Event Settings" />
          <SidebarButton id="referrals" icon={Users} label="Bot Settings" />
        </div>
        
        <div className="px-1 md:px-4 mt-0 md:mt-auto shrink-0 ml-2 md:ml-0 md:w-full">
          <button onClick={() => navigate('/profile')} className="flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-2xl text-white/50 hover:bg-white/[0.08] hover:text-white transition-all w-full border border-transparent font-semibold">
            <ChevronLeft className="w-5 h-5 shrink-0" />
            <span className="text-sm hidden md:block">Exit Admin</span>
          </button>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-10">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-6">
              <header>
                <h2 className="text-2xl font-bold">Dashboard</h2>
                <p className="text-white/50 text-sm mt-1">Overview of your application metrics</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-white/50 text-xs font-semibold uppercase tracking-wider">Total Users</span>
                      <span className="text-2xl font-bold text-white">{users.length}</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#8792FF]/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-[#8792FF]" />
                    </div>
                  </div>
                  <div className="h-[1px] w-full bg-white/5"></div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-white/50 text-xs font-semibold uppercase tracking-wider">Joined Today</span>
                      <span className="text-xl font-bold text-white">{usersJoinedToday}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-white/50 text-xs font-semibold uppercase tracking-wider">Tasks Completed</span>
                      <span className="text-2xl font-bold text-white">{tasksCompleted}</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <ListTodo className="w-5 h-5 text-purple-400" />
                    </div>
                  </div>
                  <div className="h-[1px] w-full bg-white/5"></div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-white/50 text-xs font-semibold uppercase tracking-wider">Users Earned USDT</span>
                      <span className="text-xl font-bold text-white">{usersEarnedTokens}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Database className="w-4 h-4 text-emerald-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-white/50 text-xs font-semibold uppercase tracking-wider">Total USDT Earned</span>
                      <span className="text-2xl font-bold text-white">{totalAmountEarned.toFixed(2)}</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Database className="w-5 h-5 text-green-400" />
                    </div>
                  </div>
                  <div className="h-[1px] w-full bg-white/5"></div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-white/50 text-xs font-semibold uppercase tracking-wider">USDT Earned Today</span>
                      <span className="text-xl font-bold text-white">{amountEarnedToday.toFixed(2)}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <Database className="w-4 h-4 text-yellow-400" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 mt-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                  <h3 className="text-lg font-bold">User Directory</h3>
                  <div className="relative w-full sm:w-auto">
                    <Search className="w-4 h-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      placeholder="Search users by name, ID..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#8792FF] w-full sm:w-64 transition-colors"
                    />
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/10 bg-[#121217]">
                        <th className="px-4 py-3 text-white/50 font-semibold w-12">#</th>
                        <th className="px-4 py-3 text-white/50 font-semibold">User Details (ID)</th>
                        <th className="px-4 py-3 text-white/50 font-semibold">Joined</th>
                        <th className="px-4 py-3 text-white/50 font-semibold">Balance</th>
                        <th className="px-4 py-3 text-white/50 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user, index) => (
                        <tr key={user.address} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] whitespace-nowrap">
                          <td className="px-4 py-3 text-white/40 font-mono text-xs">{index + 1}</td>
                          <td className="px-4 py-3 min-w-[200px]">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden text-xs">
                                {user.photoUrl ? (
                                  <img src={user.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                  (user.firstName || user.username || "U").charAt(0).toUpperCase()
                                )}
                              </div>
                              {editingUserId === user.telegramId ? (
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="text" 
                                    value={editNameValue} 
                                    onChange={e => setEditNameValue(e.target.value)}
                                    className="bg-[#13141a] border border-[#8792FF]/50 rounded px-2 py-1 text-sm text-white focus:outline-none w-32"
                                    autoFocus
                                  />
                                  <button onClick={() => saveUsername(user.telegramId, user.address)} className="p-1 rounded bg-[#00C087]/20 text-[#00C087] hover:bg-[#00C087]/30">
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => setEditingUserId(null)} className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex flex-col">
                                  <span className="font-semibold">{user.firstName || "Unknown"} {user.username ? `(@${user.username})` : ""}</span>
                                  <span className="text-[10px] text-white/40 font-mono">ID: {user.telegramId} | Addr: {user.address.slice(0,6)}...{user.address.slice(-4)}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-white/60 text-xs">{user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : 'Unknown'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-[#8792FF]">{user.balance.toFixed(2)} USDT</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {editingUserId !== user.telegramId && (
                              <button 
                                onClick={() => {
                                  setEditingUserId(user.telegramId);
                                  setEditNameValue(user.firstName || "");
                                }}
                                className="p-1.5 rounded bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-colors inline-flex"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-white/40">No users found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'logs' && (
            <motion.div key="logs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-6">
               <header>
                <h2 className="text-2xl font-bold">Activity Logs</h2>
                <p className="text-white/50 text-sm mt-1">Global transaction and task history</p>
              </header>

              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col gap-2">
                {allLogs.map((log, idx) => {
                  let title = "";
                  switch(log.type) {
                    case 'deposit': title = "Deposited"; break;
                    case 'withdraw': title = "Withdrew"; break;
                    case 'transfer_out': title = `Sent to ${log.toName || "Unknown"}`; break;
                    case 'transfer_in': title = `Received from ${log.fromName || "Unknown"}`; break;
                    case 'earn': title = `Completed Task: ${log.toName}`; break;
                    default: title = log.type;
                  }

                  const isTask = log.type === 'earn';

                  return (
                    <div key={idx} className="flex items-center gap-4 p-3 hover:bg-white/[0.02] rounded-xl transition-colors border-b border-white/5 last:border-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden text-xs">
                        {log.user?.photoUrl ? (
                          <img src={log.user.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          (log.user?.firstName || log.user?.username || "U").charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex flex-col flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{log.user?.firstName || "Unknown User"}</span>
                          <span className="text-white/40 text-xs px-1.5 py-0.5 bg-white/5 rounded">ID: {log.user?.telegramId}</span>
                        </div>
                        <span className={`text-sm ${isTask ? 'text-[#00C087]' : 'text-white/70'}`}>
                          {title} <span className="font-bold">({log.amount} {log.symbol})</span>
                        </span>
                      </div>
                      <div className="text-right flex flex-col">
                         <span className="text-sm font-medium text-white/80">
                           {new Date(log.timestamp).toLocaleDateString()}
                         </span>
                         <span className="text-xs text-white/40">
                           {new Date(log.timestamp).toLocaleTimeString()}
                         </span>
                      </div>
                    </div>
                  )
                })}
                {allLogs.length === 0 && <div className="py-8 text-center text-white/40">No activity recorded yet</div>}
              </div>
            </motion.div>
          )}

          {activeTab === 'tasks' && (
            <motion.div key="tasks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-6">
              <header className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Tasks</h2>
                  <p className="text-white/50 text-sm mt-1">Manage reward tasks for users</p>
                </div>
                <button 
                  onClick={() => setIsAddingTask(!isAddingTask)}
                  className="bg-gradient-to-r from-[#8792FF] to-[#6b76e3] text-white shadow-[0_4px_16px_rgba(135,146,255,0.3)] hover:shadow-[0_4px_24px_rgba(135,146,255,0.4)] px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#727dee] transition-colors"
                >
                  {isAddingTask ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {isAddingTask ? "Cancel" : "Add Task"}
                </button>
              </header>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-edges-right pb-2">
                {events.map(ev => {
                  const eventTaskCount = tasks.filter(t => t.eventId === ev.id).length;
                  return (
                    <button
                      key={ev.id}
                      onClick={() => {
                        setAdminSelectedEventId(ev.id);
                        setNewTask({ ...newTask, eventId: ev.id, category: ev.title });
                      }}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all shrink-0 border flex items-center gap-2 ${adminSelectedEventId === ev.id ? 'bg-[#8792FF]/20 text-[#8792FF] border-[#8792FF]/50' : 'bg-white/5 text-white/50 border-white/5 hover:bg-white/10'}`}
                    >
                      {ev.title}
                      <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${adminSelectedEventId === ev.id ? 'bg-[#8792FF]/30 text-[#8792FF]' : 'bg-white/10 text-white/40'}`}>
                        {eventTaskCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              {isAddingTask && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-2">
                  <h3 className="font-bold text-white mb-4 text-sm">Create New Task</h3>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[11px] font-medium text-white/60 mb-1">Category</label>
                      <input 
                        list="taskCategories"
                        value={newTask.category}
                        onChange={e => handleCategoryChange(e.target.value)}
                        className="w-full bg-[#13141a] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-[#8792FF] focus:outline-none"
                        placeholder="Type or select..."
                      />
                      <datalist id="taskCategories">
                        <option value="Social" />
                        <option value="Web" />
                        <option value="Referral" />
                      </datalist>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[11px] font-medium text-white/60 mb-1">Event</label>
                      <select 
                        value={newTask.eventId}
                        onChange={e => setNewTask({...newTask, eventId: e.target.value})}
                        className="w-full bg-[#13141a] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-[#8792FF] focus:outline-none"
                      >
                        {events.map(ev => (
                          <option key={ev.id} value={ev.id}>{ev.title}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[11px] font-medium text-white/60 mb-1">Icon Type</label>
                      <select 
                        value={newTask.iconType}
                        onChange={e => handleIconTypeChange(e.target.value)}
                        className="w-full bg-[#13141a] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-[#8792FF] focus:outline-none"
                      >
                        <option value="twitter">Twitter</option>
                        <option value="instagram">Instagram</option>
                        <option value="facebook">Facebook</option>
                        <option value="telegram">Telegram</option>
                        <option value="youtube">YouTube</option>
                        <option value="web">Web</option>
                        <option value="referral">Referral</option>
                        <option value="custom">Custom URL</option>
                      </select>
                    </div>
                    {newTask.iconType === "custom" && (
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-[11px] font-medium text-white/60 mb-1">Custom Icon URL</label>
                        <input 
                          type="text" 
                          value={newTask.iconUrl}
                          onChange={e => setNewTask({...newTask, iconUrl: e.target.value})}
                          className="w-full bg-[#13141a] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-[#8792FF] focus:outline-none"
                          placeholder="https://..."
                        />
                        {newTask.iconUrl?.includes('ibb.co/') && !newTask.iconUrl?.includes('i.ibb.co/') && <span className="text-[10px] text-red-400 mt-1">⚠️ Use the "Direct link", not viewer link.</span>}
                        <span className="text-[10px] text-white/40 mt-1">Must be a direct image link (e.g., ends in .png).</span>
                      </div>
                    )}
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[11px] font-medium text-white/60 mb-1">Task Title</label>
                      <input 
                        type="text" 
                        value={newTask.title}
                        onChange={e => setNewTask({...newTask, title: e.target.value})}
                        className="w-full bg-[#13141a] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-[#8792FF] focus:outline-none"
                        placeholder="e.g. Follow us on Telegram"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[11px] font-medium text-white/60 mb-1">
                        {newTask.category === "Referral" ? "Tokens per Referral (UUSD)" : "Reward (UUSD)"}
                      </label>
                      <input 
                        type="number" 
                        value={newTask.reward}
                        onChange={e => setNewTask({...newTask, reward: Number(e.target.value)})}
                        className="w-full bg-[#13141a] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-[#8792FF] focus:outline-none"
                        placeholder="Amount"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[11px] font-medium text-white/60 mb-1">Description</label>
                      <input 
                        type="text" 
                        value={newTask.description}
                        onChange={e => setNewTask({...newTask, description: e.target.value})}
                        className="w-full bg-[#13141a] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-[#8792FF] focus:outline-none"
                        placeholder="Brief description of what to do"
                      />
                    </div>
                    {newTask.category === "Referral" && (
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-[11px] font-medium text-white/60 mb-1">Required Referrals</label>
                        <input 
                          type="number" 
                          value={newTask.requiredReferrals}
                          onChange={e => setNewTask({...newTask, requiredReferrals: Number(e.target.value)})}
                          className="w-full bg-[#13141a] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-[#8792FF] focus:outline-none"
                        />
                      </div>
                    )}
                    {newTask.category !== "Referral" && newTask.iconType !== "referral" && (
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-[11px] font-medium text-white/60 mb-1">Task Link (Required)</label>
                        <input 
                          type="text" 
                          value={newTask.link}
                          onChange={e => setNewTask({...newTask, link: e.target.value})}
                          className="w-full bg-[#13141a] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-[#8792FF] focus:outline-none"
                          placeholder="https://..."
                        />
                      </div>
                    )}
                    {newTask.iconType === "telegram" && (
                      <div className="col-span-2 sm:col-span-1 flex items-center justify-between bg-white/5 p-2 rounded-xl border border-white/10">
                        <span className="text-[11px] font-medium text-white/80">Require API Verification</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={newTask.requireVerification} onChange={e => setNewTask({...newTask, requireVerification: e.target.checked})} />
                          <div className="w-8 h-4 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#8792FF]"></div>
                        </label>
                      </div>
                    )}
                  </div>
                  <button onClick={handleAddTask} className="bg-gradient-to-r from-[#8792FF] to-[#6b76e3] text-white shadow-[0_4px_16px_rgba(135,146,255,0.3)] hover:shadow-[0_4px_24px_rgba(135,146,255,0.4)] px-4 py-1.5 rounded-xl text-xs font-bold active:scale-95 transition-transform">
                    Save Task
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tasks.filter(t => adminSelectedEventId ? t.eventId === adminSelectedEventId : true).map(task => (
                  <div key={task.id} className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-2xl p-5 transition-all shadow-lg flex flex-col relative group">
                    <div className="absolute top-4 right-4 flex items-center gap-2 transition-opacity">
                      <button 
                        onClick={() => {
                          if (editingTaskId === task.id) {
                            setEditingTaskId(null);
                            setEditingTaskDraft(null);
                          } else {
                            setEditingTaskId(task.id);
                            setEditingTaskDraft(task);
                          }
                        }} 
                        className="p-1 bg-white/10 rounded hover:bg-white/20 text-white/70 hover:text-white transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button onClick={() => handleDeleteTask(task.id)} className="p-1 bg-red-500/10 rounded hover:bg-red-500/20 text-red-400 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </div>

                    {editingTaskId === task.id && editingTaskDraft ? (
                      <div className="flex flex-col gap-2">
                        <input 
                          type="text" 
                          value={editingTaskDraft.title}
                          onChange={e => setEditingTaskDraft({...editingTaskDraft, title: e.target.value})}
                          className="w-full bg-[#13141a] border border-white/20 rounded-xl px-2.5 py-1.5 text-xs text-white"
                          placeholder="Title"
                        />
                        <input 
                          type="number" 
                          value={editingTaskDraft.reward}
                          onChange={e => setEditingTaskDraft({...editingTaskDraft, reward: Number(e.target.value)})}
                          className="w-full bg-[#13141a] border border-white/20 rounded-xl px-2.5 py-1.5 text-xs text-white"
                          placeholder="Reward"
                        />
                        <input 
                          type="text" 
                          value={editingTaskDraft.description}
                          onChange={e => setEditingTaskDraft({...editingTaskDraft, description: e.target.value})}
                          className="w-full bg-[#13141a] border border-white/20 rounded-xl px-2.5 py-1.5 text-xs text-white"
                          placeholder="Description"
                        />
                        <select 
                          value={editingTaskDraft.category || "Social"}
                          onChange={e => setEditingTaskDraft({...editingTaskDraft, category: e.target.value})}
                          className="w-full bg-[#13141a] border border-white/20 rounded-xl px-2.5 py-1.5 text-xs text-white"
                        >
                          <option value="Social">Social</option>
                          <option value="Web">Web</option>
                          <option value="Referral">Referral</option>
                        </select>
                        <select 
                          value={editingTaskDraft.iconType || "twitter"}
                          onChange={e => {
                            const newIconType = e.target.value;
                            setEditingTaskDraft({...editingTaskDraft, iconType: newIconType});
                            // No need to update the rest of the task automatically here as they might have custom content
                          }}
                          className="w-full bg-[#13141a] border border-white/20 rounded-xl px-2.5 py-1.5 text-xs text-white"
                        >
                          <option value="twitter">Twitter</option>
                          <option value="instagram">Instagram</option>
                          <option value="facebook">Facebook</option>
                          <option value="telegram">Telegram</option>
                          <option value="youtube">YouTube</option>
                          <option value="web">Web</option>
                          <option value="referral">Referral</option>
                          <option value="custom">Custom URL</option>
                        </select>
                        {editingTaskDraft.iconType === "custom" && (<>
                          <input 
                            type="text" 
                            value={editingTaskDraft.iconUrl || ""}
                            onChange={e => setEditingTaskDraft({...editingTaskDraft, iconUrl: e.target.value})}
                            className="w-full bg-[#13141a] border border-white/20 rounded-xl px-2.5 py-1.5 text-xs text-white"
                            placeholder="Custom Icon URL"
                          />
                          {editingTaskDraft.iconUrl?.includes('ibb.co/') && !editingTaskDraft.iconUrl?.includes('i.ibb.co/') && <span className="text-[10px] text-red-400 mt-0.5">⚠️ Use the "Direct link", not viewer link.</span>}
                          <span className="text-[10px] text-white/40 mt-0.5">Must be a direct image link.</span>
                        </>)}
                        <select 
                          value={editingTaskDraft.eventId || "default"}
                          onChange={e => setEditingTaskDraft({...editingTaskDraft, eventId: e.target.value})}
                          className="w-full bg-[#13141a] border border-white/20 rounded-xl px-2.5 py-1.5 text-xs text-white"
                        >
                          {events.map(ev => (
                            <option key={ev.id} value={ev.id}>{ev.title}</option>
                          ))}
                        </select>
                        {editingTaskDraft.category === "Referral" && (
                          <input 
                            type="number" 
                            value={editingTaskDraft.requiredReferrals || 1}
                            onChange={e => setEditingTaskDraft({...editingTaskDraft, requiredReferrals: Number(e.target.value)})}
                            className="w-full bg-[#13141a] border border-white/20 rounded-xl px-2.5 py-1.5 text-xs text-white"
                            placeholder="Required Referrals"
                          />
                        )}
                        {editingTaskDraft.category !== "Referral" && editingTaskDraft.iconType !== "referral" && (
                          <input 
                            type="text" 
                            value={editingTaskDraft.link || ""}
                            onChange={e => setEditingTaskDraft({...editingTaskDraft, link: e.target.value})}
                            className="w-full bg-[#13141a] border border-white/20 rounded-xl px-2.5 py-1.5 text-xs text-white"
                            placeholder="Task Link (Required)"
                          />
                        )}
                        {editingTaskDraft.iconType === "telegram" && (
                          <div className="flex items-center justify-between bg-white/5 p-2 rounded-xl border border-white/10 mt-2">
                            <span className="text-[11px] font-medium text-white/80">Require API Verification</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" checked={editingTaskDraft.requireVerification || false} onChange={e => setEditingTaskDraft({...editingTaskDraft, requireVerification: e.target.checked})} />
                              <div className="w-8 h-4 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#8792FF]"></div>
                            </label>
                          </div>
                        )}
                        <button onClick={handleSaveTask} className="bg-gradient-to-r from-[#8792FF] to-[#6b76e3] text-white shadow-[0_4px_16px_rgba(135,146,255,0.3)] hover:shadow-[0_4px_24px_rgba(135,146,255,0.4)] py-1.5 rounded-xl text-xs font-bold mt-1">
                          Save Task
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-xl overflow-hidden shrink-0">
                            {task.iconUrl ? <img src={task.iconUrl} onError={(e) => { e.currentTarget.src = 'https://placehold.co/100x100/1a1b23/8792FF.png?text=Icon'; e.currentTarget.onerror = null; }}  alt="icon" className="w-full h-full object-cover"  /> :
                             task.iconType === 'twitter' ? //@ts-ignore
                             <FaTwitter className="w-5 h-5 text-blue-400" /> : 
                             task.iconType === 'instagram' ? //@ts-ignore
                             <FaInstagram className="w-5 h-5 text-pink-500" /> : 
                             task.iconType === 'facebook' ? //@ts-ignore
                             <FaFacebook className="w-5 h-5 text-blue-500" /> : 
                             task.iconType === 'telegram' ? //@ts-ignore
                             <FaTelegramPlane className="w-5 h-5 text-blue-400" /> :
                             task.iconType === 'youtube' ? //@ts-ignore
                             <FaYoutube className="w-5 h-5 text-red-500" /> :
                             task.iconType === 'website' || task.iconType === 'web' ? <Globe className="w-5 h-5 text-purple-400" /> :
                             task.iconType === 'referral' ? <Users className="w-5 h-5 text-[#8792FF]" /> : 
                             <span className="text-xl">{task.icon || '✨'}</span>}
                          </div>
                          <div className="px-2.5 py-1 bg-[#8792FF]/20 rounded-full text-[#8792FF] text-xs font-bold shrink-0 flex items-center gap-1">
                            +{task.reward} $UUSD
                          </div>
                        </div>
                        <h4 className="font-bold text-white text-lg mb-1 pr-12">{task.title}</h4>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-white/40 bg-white/5 px-2 py-0.5 rounded">
                            {task.category || 'General'}
                          </span>
                          {task.eventId && task.eventId !== 'default' && (
                            <span className="text-[10px] uppercase font-bold tracking-wider text-[#00C087]/70 bg-[#00C087]/10 px-2 py-0.5 rounded">
                              {events.find(e => e.id === task.eventId)?.title || 'Event'}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-white/50">{task.description}</p>
                        {task.link && (
                          <div className="mt-3 text-xs text-blue-400 truncate w-full flex items-center gap-1.5">
                            <span className="w-3 h-3 border border-current rounded-full inline-flex items-center justify-center text-[8px] font-bold shrink-0">L</span>
                            <span className="truncate">{task.link}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'event' && (
            <motion.div key="event" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-6">
              <header className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Events</h2>
                  <p className="text-white/50 text-sm mt-1">Manage multiple events and their settings</p>
                </div>
                <button 
                  onClick={() => setIsAddingEvent(!isAddingEvent)}
                  className="bg-gradient-to-r from-[#8792FF] to-[#6b76e3] text-white shadow-[0_4px_16px_rgba(135,146,255,0.3)] hover:shadow-[0_4px_24px_rgba(135,146,255,0.4)] px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#727dee] transition-colors"
                >
                  {isAddingEvent ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {isAddingEvent ? "Cancel" : "Add Event"}
                </button>
              </header>

              {isAddingEvent && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-2 flex flex-col gap-4">
                  <h3 className="font-bold text-white">Create New Event</h3>
                  
                  <div className="flex flex-col">
                    <label className="block text-sm font-medium text-white/60 mb-1.5">Event Title</label>
                    <input 
                      type="text" 
                      value={newEvent.title}
                      onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                      className="w-full bg-[#13141a] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-[#8792FF] focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="block text-sm font-medium text-white/60 mb-1.5">Category</label>
                    <input 
                      type="text" 
                      value={newEvent.category || ""}
                      onChange={e => setNewEvent({...newEvent, category: e.target.value})}
                      className="w-full bg-[#13141a] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-[#8792FF] focus:outline-none"
                      placeholder="e.g. General, Premium"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="block text-sm font-medium text-white/60 mb-1.5">Poster Image URL or Upload</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input 
                        type="text" 
                        value={newEvent.posterUrl}
                        onChange={e => setNewEvent({...newEvent, posterUrl: e.target.value})}
                        className="w-full bg-[#13141a] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-[#8792FF] focus:outline-none"
                        placeholder="Direct image link"
                      />
                      <label className="bg-[#8792FF]/20 text-[#8792FF] hover:bg-[#8792FF]/30 cursor-pointer px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center whitespace-nowrap transition-colors">
                        Upload HD Photo
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleImageUpload(e, (url) => setNewEvent({...newEvent, posterUrl: url}))}
                        />
                      </label>
                    </div>
                    {newEvent.posterUrl.includes('ibb.co/') && !newEvent.posterUrl.includes('i.ibb.co/') && <span className="text-xs text-red-400 mt-1">⚠️ This looks like an ImgBB viewer link. Please use the "Direct link" instead.</span>}
                    <span className="text-xs text-white/40 mt-1">Provide a direct image link or upload a photo from your gallery. Uploaded photos will be resized and cropped to 16:9 HD.</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="block text-sm font-medium text-white/60 mb-1.5">Reward Text</label>
                      <textarea 
                        value={newEvent.rewardText}
                        onChange={e => setNewEvent({...newEvent, rewardText: e.target.value})}
                        rows={2}
                        className="w-full bg-[#13141a] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-[#8792FF] focus:outline-none resize-none"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="block text-sm font-medium text-white/60 mb-1.5">Duration (Days)</label>
                      <input 
                        type="number" 
                        value={newEvent.durationDays}
                        onChange={e => setNewEvent({...newEvent, durationDays: Number(e.target.value)})}
                        className="w-full bg-[#13141a] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-[#8792FF] focus:outline-none"
                      />
                    </div>
                  </div>
                  
                  <button onClick={handleAddEvent} className="bg-gradient-to-r from-[#8792FF] to-[#6b76e3] text-white shadow-[0_4px_16px_rgba(135,146,255,0.3)] hover:shadow-[0_4px_24px_rgba(135,146,255,0.4)] px-5 py-2 rounded-xl text-sm font-bold w-fit mt-2">
                    Save Event
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-4">
                {events.map(ev => (
                  <div key={ev.id} className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row gap-6 relative group">
                    <div className="absolute top-4 right-4 flex items-center gap-2 transition-opacity z-10">
                      <button 
                        onClick={() => {
                          if (ev.id === editingEventId) {
                            setEditingEventId(null);
                            setEditingEventDraft(null);
                          } else {
                            setEditingEventId(ev.id);
                            setEditingEventDraft(ev);
                          }
                        }} 
                        className="p-2 bg-white/10 rounded-xl hover:bg-white/20 text-white/70 hover:text-white transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteEvent(ev.id)} className="p-2 bg-red-500/10 rounded-xl hover:bg-red-500/20 text-red-400 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="w-full sm:w-48 xl:w-56 aspect-[16/9] rounded-xl overflow-hidden border border-white/20 shrink-0 p-1 mx-auto sm:mx-0 bg-white/5">
                      <img src={ev.posterUrl} onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400/1a1b23/8792FF.png?text=Invalid+Image+URL'; e.currentTarget.onerror = null; }}  alt="Poster" className="w-full h-full object-contain rounded-xl"  />
                    </div>

                    <div className="flex flex-col flex-1 gap-4 w-full">
                      {editingEventId === ev.id && editingEventDraft ? (
                        <div className="flex flex-col gap-3">
                          <input 
                            type="text" 
                            value={editingEventDraft.title}
                            onChange={e => setEditingEventDraft({...editingEventDraft, title: e.target.value})}
                            className="w-full bg-[#13141a] border border-white/20 rounded px-3 py-2 text-sm text-white"
                            placeholder="Title"
                          />
                          <input 
                            type="text" 
                            value={editingEventDraft.category || "General"}
                            onChange={e => setEditingEventDraft({...editingEventDraft, category: e.target.value})}
                            className="w-full bg-[#13141a] border border-white/20 rounded px-3 py-2 text-sm text-white"
                            placeholder="Category"
                          />
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input 
                              type="text" 
                              value={editingEventDraft.posterUrl}
                              onChange={e => setEditingEventDraft({...editingEventDraft, posterUrl: e.target.value})}
                              className="w-full bg-[#13141a] border border-white/20 rounded px-3 py-2 text-sm text-white"
                              placeholder="Poster URL"
                            />
                            <label className="bg-[#8792FF]/20 text-[#8792FF] hover:bg-[#8792FF]/30 cursor-pointer px-4 py-2 rounded text-sm font-bold flex items-center justify-center whitespace-nowrap transition-colors">
                              Upload HD
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => handleImageUpload(e, (url) => setEditingEventDraft({...editingEventDraft, posterUrl: url}))}
                              />
                            </label>
                          </div>
                          <textarea 
                            value={editingEventDraft.rewardText}
                            onChange={e => setEditingEventDraft({...editingEventDraft, rewardText: e.target.value})}
                            className="w-full bg-[#13141a] border border-white/20 rounded px-3 py-2 text-sm text-white resize-none"
                            placeholder="Reward Text"
                            rows={2}
                          />
                          <input 
                            type="number" 
                            value={editingEventDraft.durationDays}
                            onChange={e => setEditingEventDraft({...editingEventDraft, durationDays: Number(e.target.value)})}
                            className="w-full bg-[#13141a] border border-white/20 rounded px-3 py-2 text-sm text-white"
                            placeholder="Duration (Days)"
                          />
                          <button onClick={handleSaveEvent} className="bg-gradient-to-r from-[#8792FF] to-[#6b76e3] text-white shadow-[0_4px_16px_rgba(135,146,255,0.3)] hover:shadow-[0_4px_24px_rgba(135,146,255,0.4)] py-1.5 rounded-xl text-sm font-bold mt-2 w-fit px-6">
                            Save
                          </button>
                        </div>
                      ) : (
                        <>
                          <div>
                            <h3 className="text-xl font-bold text-white mb-1 pr-16">{ev.title}</h3>
                            <p className="text-sm text-white/50">Category: {ev.category || "General"} • Duration: {ev.durationDays} days • {tasks.filter(t => t.eventId === ev.id).length} Tasks</p>
                          </div>
                          <div className="bg-white/5 rounded-xl p-3 border border-white/10 mt-auto">
                            <span className="text-xs text-white/50 block mb-1">Reward Text:</span>
                            <span className="text-sm font-bold whitespace-pre-wrap leading-tight block">{ev.rewardText}</span>
                          </div>
                          
                          <div className="mt-2">
                            <button 
                              onClick={() => {
                                setActiveTab('tasks');
                                setIsAddingTask(true);
                                setNewTask({ ...newTask, category: ev.title, eventId: ev.id });
                              }}
                              className="bg-[#8792FF]/20 text-[#8792FF] py-2 px-4 rounded-xl font-bold hover:bg-[#8792FF]/30 transition-colors w-full sm:w-auto flex items-center justify-center gap-2"
                            >
                              <Plus className="w-4 h-4" /> Add Tasks
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'referrals' && (
            <motion.div key="referrals" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-6">
              <header className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Bot Setting</h2>
                  <p className="text-white/50 text-sm mt-1">Manage referrals and bot settings</p>
                </div>
                <button 
                  onClick={() => {
                    localStorage.setItem('mock_bot_username', botUsername);
                    localStorage.setItem('mock_support_username', supportUsername);
                    syncToFirebase('settings', 'global', { botUsername, supportUsername });
                    alert("Settings saved to Firebase!");
                  }}
                  className="bg-[#00C087] text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#00a876] transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Save Settings
                </button>
              </header>

              <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex flex-col gap-6">
                <h3 className="font-bold text-white">Global Settings</h3>
                <div className="flex flex-col">
                  <label className="block text-sm font-medium text-white/60 mb-2">Bot Username (for generating referral links)</label>
                  <div className="flex items-center gap-2 max-w-sm">
                    <span className="text-white/50">@</span>
                    <input 
                      type="text" 
                      value={botUsername}
                      onChange={e => setBotUsername(e.target.value.replace('@', ''))}
                      className="w-full bg-[#13141a] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#8792FF] focus:outline-none"
                      placeholder="our_bot"
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="block text-sm font-medium text-white/60 mb-2">Support Username (for Contact Support)</label>
                  <div className="flex items-center gap-2 max-w-sm">
                    <span className="text-white/50">@</span>
                    <input 
                      type="text" 
                      value={supportUsername}
                      onChange={e => setSupportUsername(e.target.value.replace('@', ''))}
                      className="w-full bg-[#13141a] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#8792FF] focus:outline-none"
                      placeholder="support_username"
                    />
                  </div>
                  <span className="text-xs text-white/40 mt-2">This username will be used when users click "Contact Wallet support".</span>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

