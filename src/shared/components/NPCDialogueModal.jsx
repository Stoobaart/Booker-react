import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import useNPCConversation from '../hooks/useNPCConversation';
import useSpeechInput from '../hooks/useSpeechInput';
import useTypewriter from '../hooks/useTypewriter';
import portraitFrankRegular from '../../assets/images/portraits/portrait-frank-regular.png';
import './NPCDialogueModal.scss';

const NPCDialogueModal = ({ npc, onClose }) => {
  const [inputValue, setInputValue] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [frankTalking, setFrankTalking] = useState(false);
  const typingTimeoutRef = useRef(null);
  const { messages, isThinking, sendMessage } = useNPCConversation(npc.id, npc.systemPrompt);
  const inventoryItems = useSelector((state) => state.inventory.items);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { isListening, supported: speechSupported, start: startListening, stop: stopListening } = useSpeechInput((transcript) => {
    setInputValue(transcript);
    setFrankTalking(false);
    clearTimeout(typingTimeoutRef.current);
  });

  const [initialMessageCount] = useState(messages.length);
  const lastAssistantMessage = !isThinking
    ? [...messages].reverse().find((m) => m.role === 'assistant')
    : null;
  const isExistingHistory = messages.length <= initialMessageCount;
  const { displayedText, isTyping, complete } = useTypewriter(
    lastAssistantMessage?.content ?? '',
    { speed: 50, skipAnimation: isExistingHistory }
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleClose = () => {
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

  const gameContainer = document.getElementById('game-container');

  const portraits = gameContainer && createPortal(
    <div className="npc-dialogue-portraits">
      <div className="npc-dialogue-portraits__frank">
        <img
              className={`npc-dialogue-portraits__sprite${frankTalking ? ' npc-dialogue-portraits__sprite--talking' : ''}`}
              src={portraitFrankRegular}
              alt="Frank"
            />
      </div>
      {npc.portrait && (
        <div className="npc-dialogue-portraits__npc">
          <img className="npc-dialogue-portraits__sprite npc-dialogue-portraits__sprite--npc" src={npc.portrait} alt={npc.name} />
        </div>
      )}
    </div>,
    gameContainer
  );

  return (
    <>
      {portraits}
      <div className="npc-dialogue-overlay" onClick={handleClose}>
        <div className="npc-dialogue" onClick={(e) => e.stopPropagation()}>
          <div className="npc-dialogue__header">
            <span className="npc-dialogue__name">{npc.name}</span>
            <button className="npc-dialogue__close" onClick={handleClose}>
              ✕
            </button>
          </div>

          <div
            className="npc-dialogue__messages"
            onClick={() => isTyping && complete()}
          >
            {messages.length === 0 && (
              <p className="npc-dialogue__hint">{npc.greeting}</p>
            )}
            {messages.map((msg, i) => {
              const isLast = i === messages.length - 1;
              const isAnimated = isLast && msg.role === 'assistant' && !isThinking;
              const content = isAnimated
                ? displayedText
                : msg.content || (isThinking && isLast ? '...' : '');
              return (
                <div
                  key={i}
                  className={`npc-dialogue__message npc-dialogue__message--${msg.role}`}
                >
                  <span className="npc-dialogue__speaker">
                    {msg.role === 'user' ? 'Frank' : npc.name}
                  </span>
                  <p>{content}</p>
                </div>
              );
            })}
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
              onChange={(e) => {
                setInputValue(e.target.value);
                setFrankTalking(true);
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => setFrankTalking(false), 600);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Say something..."
              disabled={isThinking}
              maxLength={200}
            />
            {speechSupported && (
              <button
                type="button"
                className={`npc-dialogue__mic-btn${isListening ? ' npc-dialogue__mic-btn--active' : ''}`}
                onClick={() => {
                if (isListening) {
                  stopListening();
                  setFrankTalking(false);
                } else {
                  startListening();
                  setFrankTalking(true);
                }
              }}
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
    </>
  );
};

export default NPCDialogueModal;
