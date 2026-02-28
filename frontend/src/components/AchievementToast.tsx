import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  achievements: any[];
  onDismiss: () => void;
}

export default function AchievementToast({ achievements, onDismiss }: Props) {
  return (
    <AnimatePresence>
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {achievements.map((a, i) => (
          <motion.div
            key={a.key}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: i * 0.2 }}
            onClick={onDismiss}
            className="bg-white rounded-xl shadow-2xl border border-yellow-200 p-4 flex items-center gap-3 cursor-pointer min-w-[280px]"
          >
            <div className="text-3xl pulse-green">{a.icon}</div>
            <div>
              <div className="text-xs font-bold text-yellow-600">Achievement Unlocked!</div>
              <div className="text-sm font-semibold text-gray-800">{a.title}</div>
              <div className="text-[10px] text-gray-500">{a.description}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  );
}
