import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Swords, Trophy, Zap, Target, Trash2 } from 'lucide-react';

export interface AppNotification {
    id: string;
    type: 'battle' | 'achievement' | 'streak' | 'goal';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
}

interface Props {
    notifications: AppNotification[];
    onDismiss: (id: string) => void;
    onClearAll: () => void;
    onMarkRead: () => void;
}

const typeConfig = {
    battle: { icon: Swords, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    achievement: { icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    streak: { icon: Zap, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    goal: { icon: Target, color: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-900/20' },
};

export default function NotificationBell({ notifications, onDismiss, onClearAll, onMarkRead }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const unread = notifications.filter(n => !n.read).length;

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);

    const handleOpen = () => {
        setIsOpen(!isOpen);
        if (!isOpen && unread > 0) {
            onMarkRead();
        }
    };

    const timeAgo = (date: Date) => {
        const diff = Date.now() - date.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    return (
        <div ref={panelRef} className="relative">
            <button
                onClick={handleOpen}
                className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                {unread > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-sm"
                    >
                        {unread > 9 ? '9+' : unread}
                    </motion.span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden z-50"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                            <h4 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-1.5">
                                <Bell className="w-4 h-4" /> Notifications
                            </h4>
                            <div className="flex items-center gap-1">
                                {notifications.length > 0 && (
                                    <button
                                        onClick={onClearAll}
                                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-400 hover:text-red-500 transition-colors"
                                        title="Clear all"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-400"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Notifications list */}
                        <div className="max-h-80 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="py-10 text-center text-gray-400">
                                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">No notifications yet</p>
                                    <p className="text-xs mt-0.5">Battle invites and achievements will appear here</p>
                                </div>
                            ) : (
                                notifications.map(notif => {
                                    const config = typeConfig[notif.type];
                                    const Icon = config.icon;
                                    return (
                                        <motion.div
                                            key={notif.id}
                                            layout
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20, height: 0 }}
                                            className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${!notif.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                        >
                                            <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                                <Icon className={`w-4 h-4 ${config.color}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{notif.title}</p>
                                                <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                                <p className="text-[10px] text-gray-400 mt-1">{timeAgo(notif.timestamp)}</p>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDismiss(notif.id); }}
                                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-300 hover:text-gray-500 flex-shrink-0"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
