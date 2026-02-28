import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Leaf, Sparkles } from 'lucide-react';

interface Message {
  id: number;
  role: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  'How does cycling help the planet?',
  'What is my carbon footprint?',
  'Why is CO₂ harmful?',
  'How many trees offset driving?',
  'Tips to reduce emissions',
  'Health benefits of walking',
];

// Knowledge base for climate/sustainability responses
function getBotResponse(input: string): string {
  const q = input.toLowerCase();

  // CO2 and climate basics
  if (q.includes('what is co2') || q.includes('what is carbon dioxide') || q.includes('co₂')) {
    return "CO₂ (carbon dioxide) is a greenhouse gas released when fossil fuels are burned. Transport accounts for about 27% of all CO₂ emissions in the UK. Cars are the biggest contributor within transport — the average car emits around 170g of CO₂ per kilometre. By choosing to walk, cycle, or take public transport, you directly reduce these emissions. Even small changes add up: switching a 5km car commute to cycling saves about 850g of CO₂ per trip — that's over 200kg per year!";
  }

  if (q.includes('why') && (q.includes('co2') || q.includes('carbon')) && (q.includes('bad') || q.includes('harmful') || q.includes('problem'))) {
    return "CO₂ traps heat in the atmosphere, causing global temperatures to rise. This leads to more extreme weather events, rising sea levels, loss of biodiversity, and disrupted food production. Since the industrial revolution, atmospheric CO₂ has increased by over 50%. Transport is one of the fastest-growing sources. Every gram of CO₂ you save by choosing sustainable transport helps slow this process. It might feel small, but collective action from millions of commuters creates massive impact.";
  }

  if (q.includes('climate change') || q.includes('global warming')) {
    return "Climate change is driven by the accumulation of greenhouse gases like CO₂ in our atmosphere. The transport sector is responsible for about 27% of UK greenhouse gas emissions, with cars being the largest single source. The good news? Individual transport choices have a real, measurable impact. If everyone in Aberdeen switched just one car journey per week to cycling or walking, it would save thousands of tonnes of CO₂ annually. Your daily commute choice is one of the most impactful climate actions you can take.";
  }

  // Transport comparisons
  if (q.includes('cycling') || q.includes('cycle') || q.includes('bike') || q.includes('biking')) {
    return "Cycling is a sustainability superstar! It produces zero direct CO₂ emissions and burns about 30 kcal per km. Compared to driving the same distance, you save 170g of CO₂ per km. A typical 5km cycle commute saves 850g of CO₂ versus driving — that's equivalent to charging your phone over 100 times! Plus, regular cycling reduces your risk of heart disease by up to 46% and improves mental health. It's one of the best things you can do for both the planet and yourself.";
  }

  if (q.includes('walk') || q.includes('walking') || q.includes('foot')) {
    return "Walking is the most sustainable transport mode — zero emissions, zero fuel cost, and incredible health benefits. You burn about 50 kcal per km, which is more than any other commute option. A 2km walk to work saves 340g of CO₂ compared to driving, and gives you about 25 minutes of exercise. Regular walking reduces the risk of type 2 diabetes, cardiovascular disease, and depression. The WHO recommends 150 minutes of moderate activity per week — a walking commute can cover most of that!";
  }

  if (q.includes('bus') || q.includes('public transport')) {
    return "Buses emit about 80g of CO₂ per passenger-km, compared to 170g for a car. That's a 53% reduction! While not zero-emission like walking or cycling, buses are far more efficient because they carry many passengers at once. Taking the bus for a 10km commute saves about 900g of CO₂ per trip compared to driving alone. Many cities are also transitioning to electric buses, which will reduce emissions even further. Public transport also reduces traffic congestion, making cities more liveable for everyone.";
  }

  if (q.includes('train') || q.includes('rail')) {
    return "Trains are one of the most efficient forms of motorised transport, producing about 40g of CO₂ per passenger-km — that's 76% less than driving. For longer commutes, trains are a brilliant choice. A 15km train journey saves about 1,950g of CO₂ versus driving the same distance. Electric trains are even cleaner, especially as the electricity grid becomes greener. Scotland's rail network is progressively electrifying, making train travel an increasingly sustainable choice for Aberdeen commuters.";
  }

  if (q.includes('e-scooter') || q.includes('scooter') || q.includes('electric scooter')) {
    return "E-scooters produce about 20g of CO₂ per km — mainly from electricity generation for charging. That's an 88% reduction compared to driving (170g/km). They're great for short urban trips of 1-5km where you might otherwise drive. A 3km e-scooter trip saves about 450g of CO₂ versus driving. They also burn a small amount of calories (about 10 kcal/km) from balancing. E-scooters are especially useful for 'last mile' connections between public transport stops and your final destination.";
  }

  if (q.includes('driving') || q.includes('car') || q.includes('drive')) {
    return "The average car emits about 170g of CO₂ per kilometre. For a typical 10km commute, that's 1.7kg of CO₂ each way — or 3.4kg per day. Over a year of working days, that adds up to about 850kg of CO₂ just from commuting! Cars also contribute to air pollution (NOx, particulate matter), noise pollution, and urban congestion. If you must drive, consider carpooling — sharing with just one other person halves your per-person emissions. But switching even a few trips per week to alternatives makes a significant difference.";
  }

  // Carbon footprint
  if (q.includes('carbon footprint') || q.includes('footprint')) {
    return "Your carbon footprint is the total amount of greenhouse gases you produce. The average UK person's footprint is about 10 tonnes of CO₂ per year, with transport making up roughly 2.7 tonnes of that. Your commute is one of the biggest controllable parts of your footprint. By tracking your journeys with GreenRoute and choosing greener options, you can directly measure and reduce your transport footprint. Even replacing 2-3 car trips per week with cycling can cut your transport emissions by 30-40%.";
  }

  // Trees and offsets
  if (q.includes('tree') || q.includes('trees') || q.includes('offset')) {
    return "A single mature tree absorbs about 22kg of CO₂ per year. If you cycle 5km to work instead of driving, you save about 850g of CO₂ per trip — that's roughly 212kg per year (250 working days). You'd need about 9.6 trees to absorb that same amount! Put another way, by choosing to cycle your commute, your impact equals planting nearly 10 trees. But unlike planting trees (which take years to mature), your transport choice has an immediate effect on emissions.";
  }

  // Tips and advice
  if (q.includes('tip') || q.includes('advice') || q.includes('how can i') || q.includes('what can i do') || q.includes('reduce')) {
    return "Here are some practical ways to reduce your commute emissions:\n\n1. **Start small**: Replace just 1-2 car trips per week with walking or cycling\n2. **Combine modes**: Cycle to the train station, then take the train\n3. **Plan ahead**: Use GreenRoute to see the impact before you choose\n4. **Try e-scooters**: Great for short trips where walking feels too far\n5. **Carpool**: If you must drive, share the ride and halve the emissions\n6. **Set goals**: Use the weekly goal feature to stay motivated\n7. **Build streaks**: Consecutive days of sustainable commuting builds habits\n\nRemember: the most sustainable journey is one that replaces a car trip. Even choosing the bus over driving makes a meaningful difference!";
  }

  // Health
  if (q.includes('health') || q.includes('calories') || q.includes('exercise') || q.includes('fitness')) {
    return "Active commuting (walking and cycling) provides enormous health benefits. Walking burns about 50 kcal/km and cycling about 30 kcal/km. A 5km cycle commute burns 150 kcal — equivalent to about 15 minutes of jogging. Regular active commuting reduces the risk of cardiovascular disease by up to 46%, type 2 diabetes by 40%, and certain cancers by 30%. It also significantly improves mental health, reducing anxiety and depression symptoms. Your commute can double as your daily exercise — it's the most time-efficient health investment you can make!";
  }

  // Aberdeen specific
  if (q.includes('aberdeen')) {
    return "Aberdeen has some great sustainable commuting infrastructure. The Deeside Way provides a traffic-free cycling and walking route through the city. RGU's Garthdee campus is well-connected by bus routes (First Aberdeen) and has good cycling access from the city centre (about 4km). The new Aberdeen Rapid Transit proposals aim to improve public transport further. With Aberdeen's compact city centre, many journeys are under 5km — perfect for cycling or e-scooter trips. Check GreenRoute to see exactly how much CO₂ you'd save on your specific route!";
  }

  // Equivalents
  if (q.includes('equivalent') || q.includes('phone charge') || q.includes('kettle') || q.includes('light bulb')) {
    return "We use everyday equivalents to make CO₂ savings feel real:\n\n• **Phone charge**: ~8g CO₂ each\n• **Kettle boil**: ~70g CO₂ each\n• **LED bulb hour**: ~4g CO₂\n• **Tree-day**: A tree absorbs ~60g CO₂ per day\n• **km of driving avoided**: 170g CO₂ per km\n\nSo if you cycle 5km instead of driving, your 850g of CO₂ saved equals: 103 phone charges, 12 kettle boils, or 14 tree-days of absorption. These equivalents help make the invisible visible — which is exactly what GreenRoute is all about!";
  }

  // Greeting
  if (q.includes('hello') || q.includes('hi') || q.includes('hey') || q.includes('hiya')) {
    return "Hello! 👋 I'm GreenBot, your sustainability assistant. I can help you understand the environmental and health impact of your transport choices. Try asking me about CO₂ emissions, the benefits of cycling or walking, your carbon footprint, or tips to reduce your commute impact. What would you like to know?";
  }

  // Thanks
  if (q.includes('thank') || q.includes('cheers') || q.includes('great')) {
    return "You're welcome! Every sustainable journey counts. Keep tracking your commutes with GreenRoute — watching your CO₂ savings grow is incredibly motivating. Is there anything else you'd like to know about sustainable transport or climate impact?";
  }

  // Fallback
  return "That's a great question! While I specialise in transport sustainability and climate impact, here's what I can help with:\n\n• How different transport modes compare (CO₂, calories, time)\n• Why reducing emissions matters for climate change\n• Health benefits of active commuting\n• Practical tips to reduce your commute footprint\n• Understanding CO₂ equivalents (trees, phone charges, etc.)\n• Aberdeen-specific commuting info\n\nTry asking about any of these topics!";
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: 'bot',
      text: "Hi! 👋 I'm GreenBot, your climate & sustainability assistant. Ask me anything about CO₂ emissions, the environmental impact of your commute, or tips to reduce your carbon footprint!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now(),
      role: 'user',
      text: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate thinking delay
    setTimeout(() => {
      const response = getBotResponse(text);
      const botMsg: Message = {
        id: Date.now() + 1,
        role: 'bot',
        text: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 600 + Math.random() * 800);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-5 right-5 z-40 w-14 h-14 bg-brand-500 hover:bg-brand-600 text-white rounded-full shadow-xl shadow-brand-200 flex items-center justify-center transition-colors"
          >
            <MessageCircle className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 z-50 h-full w-full sm:w-[380px] bg-white border-l border-gray-200 shadow-2xl flex flex-col"
          >
            {/* Chat header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-brand-500 to-emerald-500 text-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Leaf className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">GreenBot</h3>
                  <p className="text-[10px] text-white/70">Climate & Sustainability AI</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Suggested questions */}
            {messages.length <= 1 && (
              <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
                <p className="text-[10px] text-gray-500 mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Suggested questions
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_QUESTIONS.map(q => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="px-2.5 py-1 bg-white border border-brand-200 rounded-full text-[11px] text-brand-700 hover:bg-brand-50 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${
                      msg.role === 'bot'
                        ? 'bg-brand-100 text-brand-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    {msg.role === 'bot' ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  </div>
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'bot'
                        ? 'bg-gray-100 text-gray-800 rounded-tl-sm'
                        : 'bg-brand-500 text-white rounded-tr-sm'
                    }`}
                  >
                    {msg.text.split('\n').map((line, i) => (
                      <p key={i} className={i > 0 ? 'mt-1.5' : ''}>
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="px-3 py-3 border-t border-gray-100 bg-white">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask about climate impact..."
                  className="flex-1 px-3 py-2.5 bg-gray-50 rounded-xl text-sm border border-transparent focus:border-brand-300 focus:bg-white outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="p-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-200 text-white rounded-xl transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
