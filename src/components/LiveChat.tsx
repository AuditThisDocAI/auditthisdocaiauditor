import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';

export function LiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: 'Hi there! How can we help you today? Ask us about pricing, features, or get support.' }
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('open-ai-assistant', handleOpenChat);
    return () => window.removeEventListener('open-ai-assistant', handleOpenChat);
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const currentMessage = message.trim();
    // Add user message
    const userMsg = { id: messages.length + 1, sender: 'user', text: currentMessage };
    setMessages((prev) => [...prev, userMsg]);
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentMessage,
          history: messages.slice(1) // skip the initial greeting
        })
      });

      const responseText = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch (err) {}
      
      if (response.ok && data.text) {
        setMessages((prev) => [
          ...prev,
          { id: prev.length + 2, sender: 'bot', text: data.text }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: prev.length + 2, sender: 'bot', text: "Sorry, I'm having trouble connecting right now. Please try again later." }
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { id: prev.length + 2, sender: 'bot', text: "An error occurred. Please try again." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 w-[320px] sm:w-[350px] bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden flex flex-col mb-2 h-[450px]"
          >
            {/* Header */}
            <div className="bg-[#7C3AED] p-4 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-sm">Support Bot</div>
                  <div className="text-[10px] text-purple-200">Usually replies instantly</div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded-md transition-colors"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#F8F9FC] space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-xl p-3 text-sm shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-[#7C3AED] text-white rounded-tr-none' 
                      : 'bg-white text-[#1E293B] border border-[#E2E8F0] rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-xl p-3 text-sm shadow-sm bg-white text-[#1E293B] border border-[#E2E8F0] rounded-tl-none flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-[#E2E8F0] shrink-0">
              <div className="relative">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="w-full bg-[#F8F9FC] border border-[#E2E8F0] rounded-full pl-4 pr-12 py-2.5 text-sm focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!message.trim() || isLoading}
                  className="absolute right-1.5 top-1.5 bottom-1.5 p-1.5 bg-[#7C3AED] text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#6D28D9] transition-colors flex items-center justify-center"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-105 ${
          isOpen ? 'bg-white text-[#1E293B] border border-[#E2E8F0]' : 'bg-[#7C3AED] text-white'
        }`}
        aria-label="Toggle live chat"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>
    </div>
  );
}
