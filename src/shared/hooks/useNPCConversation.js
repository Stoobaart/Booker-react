import { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Anthropic from '@anthropic-ai/sdk';
import { addMessage, discoverFacts } from '../../features/npc/slices/npcSlice';
import { setStoryProgress } from '../../features/game/slices/gameSlice';
import { discoverNote } from '../../features/investigation/slices/investigationSlice';
import {
  SPOKEN_ONLY_RULE,
  stripStageDirections,
  buildPuzzleFactsRule,
  buildPuzzleResponseFormat,
  parsePuzzleResponse,
  mentionsAnyWord,
} from '../utils/npcDialogue';

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

const HISTORY_WINDOW = 10; // max message pairs sent to the API
const NO_MESSAGES = [];

// Thinking blocks may come first
const getReplyText = (response) => response.content.find((block) => block.text !== undefined)?.text ?? '';

const useNPCConversation = (npcId, systemPrompt, { puzzleFacts, puzzleResolution } = {}) => {
  const dispatch = useDispatch();
  const messages = useSelector((state) => state.npc.conversations[npcId] ?? NO_MESSAGES);
  const isResolved = useSelector(
    (state) => Boolean(puzzleResolution && state.game.storyProgress?.[puzzleResolution.storyFlag])
  );
  const resolutionKey = puzzleResolution?.key;
  const keyAlreadySaid = useSelector(
    (state) => Boolean(resolutionKey && state.game.storyProgress?.[resolutionKey.storyFlag])
  );
  const [isThinking, setIsThinking] = useState(false);

  const sendMessage = useCallback(async (userText) => {
    const userMessage = { role: 'user', content: userText };
    dispatch(addMessage({ npcId, message: userMessage }));
    setIsThinking(true);

    const recentMessages = [...messages, userMessage].slice(-HISTORY_WINDOW);

    // Cache up to the last historical message; the new one changes every request
    const messagesForAPI = recentMessages.map((msg, i) => {
      const isLastHistorical = i === recentMessages.length - 2;
      if (isLastHistorical) {
        return {
          ...msg,
          content: [{ type: 'text', text: msg.content, cache_control: { type: 'ephemeral' } }],
        };
      }
      return msg;
    });

    const hasPuzzleFacts = puzzleFacts?.length > 0;
    const resolution = hasPuzzleFacts && !isResolved ? puzzleResolution : undefined;
    const keySaid = !resolutionKey || keyAlreadySaid || mentionsAnyWord(userText, resolutionKey.words);
    if (resolutionKey && keySaid && !keyAlreadySaid) {
      dispatch(setStoryProgress(resolutionKey.storyFlag));
    }
    const persona = [
      systemPrompt,
      resolutionKey && keySaid && resolutionKey.prompt,
      isResolved && puzzleResolution.resolvedPrompt,
    ].filter(Boolean).join('\n\n');
    const rules = hasPuzzleFacts
      ? `${SPOKEN_ONLY_RULE}\n\n${buildPuzzleFactsRule(puzzleFacts, resolution)}`
      : SPOKEN_ONLY_RULE;

    try {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: [{ type: 'text', text: `${persona}\n\n${rules}`, cache_control: { type: 'ephemeral' } }],
        messages: messagesForAPI,
        ...(hasPuzzleFacts && { output_config: { format: buildPuzzleResponseFormat(puzzleFacts, resolution) } }),
      });

      let dialogue = getReplyText(response);
      if (hasPuzzleFacts) {
        const reply = parsePuzzleResponse(dialogue, puzzleFacts, resolution);
        // Handled like a failed call below, so raw JSON never reaches the chat
        if (!reply) throw new Error('NPC reply was not valid dialogue and puzzle facts');
        dialogue = reply.dialogue;
        if (reply.revealedFacts.length) {
          dispatch(discoverFacts({ npcId, factIds: reply.revealedFacts }));
          puzzleFacts
            .filter((fact) => fact.noteId && reply.revealedFacts.includes(fact.id))
            .forEach((fact) => dispatch(discoverNote(fact.noteId)));
        }
        if (reply.resolved && keySaid) {
          dispatch(setStoryProgress(resolution.storyFlag));
        }
      }

      const assistantMessage = {
        role: 'assistant',
        content: stripStageDirections(dialogue) || '...',
      };
      dispatch(addMessage({ npcId, message: assistantMessage }));
    } catch (err) {
      console.error('NPC conversation error:', err);
      dispatch(addMessage({ npcId, message: { role: 'assistant', content: '...' } }));
    } finally {
      setIsThinking(false);
    }
  }, [dispatch, npcId, systemPrompt, puzzleFacts, puzzleResolution, resolutionKey, keyAlreadySaid, isResolved, messages]);

  return { messages, isThinking, sendMessage };
};

export default useNPCConversation;
