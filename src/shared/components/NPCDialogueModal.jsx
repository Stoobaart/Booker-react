import { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import useNPCConversation from '../hooks/useNPCConversation';
import useSpeechInput from '../hooks/useSpeechInput';
import './NPCDialogueModal.scss';

const NPCDialogueModal = ({ npc, onClose }) => {
  const [inputValue, setInputValue] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const { messages, isThinking, sendMessage, reset } = useNPCConversation(npc.systemPrompt);
  const inventoryItems = useSelector((state) => state.inventory.items);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { isListening, supported: speechSupported, start: startListening, stop: stopListening } = useSpeechInput((transcript) => {
    setInputValue(transcript);
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text || isThinking) return;
    setInputValue('');
    sendMessage(text);
  };

  const handleKeyDown = (e) => {
    e.stopPropagation();
  };

  const handleShowItem = (item) => {
    setShowPicker(false);
    sendMessage(`I show you my ${item.name}.`);
  };

  return (
    <div className="npc-dialogue-overlay" onClick={handleClose}>
      <div className="npc-dialogue" onClick={(e) => e.stopPropagation()}>
        <div className="npc-dialogue__header">
          {npc.portrait && (
            <img
              className="npc-dialogue__portrait"
              src={npc.portrait}
              alt={npc.name}
            />
          )}
          <span className="npc-dialogue__name">{npc.name}</span>
          <button className="npc-dialogue__close" onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className="npc-dialogue__messages">
          {messages.length === 0 && (
            <p className="npc-dialogue__hint">{npc.greeting}</p>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`npc-dialogue__message npc-dialogue__message--${msg.role}`}
            >
              <span className="npc-dialogue__speaker">
                {msg.role === 'user' ? 'Frank' : npc.name}
              </span>
              <p>{msg.content || (isThinking && i === messages.length - 1 ? '...' : '')}</p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {showPicker && (
          <div className="npc-dialogue__item-picker">
            {inventoryItems.map((item) => (
              <button
                key={item.id}
                className="npc-dialogue__item-option"
                onClick={() => handleShowItem(item)}
              >
                <img src={item.sprite} alt={item.name} className="npc-dialogue__item-sprite" />
                <span className="npc-dialogue__item-name">{item.name}</span>
              </button>
            ))}
          </div>
        )}

        <form className="npc-dialogue__input-row" onSubmit={handleSubmit}>
          <button
            type="button"
            className="npc-dialogue__show-btn"
            onClick={() => setShowPicker((prev) => !prev)}
            disabled={isThinking || inventoryItems.length === 0}
            title="Show an item"
          >
            🎒
          </button>
          <input
            ref={inputRef}
            className="npc-dialogue__input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Say something..."
            disabled={isThinking}
            maxLength={200}
          />
          {speechSupported && (
            <button
              type="button"
              className={`npc-dialogue__mic-btn${isListening ? ' npc-dialogue__mic-btn--active' : ''}`}
              onClick={isListening ? stopListening : startListening}
              disabled={isThinking}
              title="Speak"
            >
              {isListening ? '⏹' : '🎤'}
            </button>
          )}
          <button
            className="npc-dialogue__send"
            type="submit"
            disabled={isThinking || !inputValue.trim()}
          >
            &gt;
          </button>
        </form>
      </div>
    </div>
  );
};

export default NPCDialogueModal;
