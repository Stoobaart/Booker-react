import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NPCDialogueModal from './NPCDialogueModal';
import { renderWithProviders } from '../../test/renderWithProviders';

const npc = {
  id: 'station-worker',
  name: 'Derek',
  portrait: 'derek-portrait.png',
  talkOptions: [
    { id: 'barriers', line: 'Can you help?', replies: ['No.', 'Wait.'] },
    { id: 'pigeons', line: 'Nice pigeons.', replies: ['Vermin.'] },
  ],
};

const option = (name) => screen.getByRole('button', { name });
const speech = (who) => document.querySelector(`.npc-dialogue-portraits__speech--${who}`);
const talking = (alt) => screen.getByAltText(alt).classList.contains('npc-dialogue-portraits__sprite--talking');
const overlay = () => document.querySelector('.npc-dialogue-overlay');
const typeOut = () => act(() => vi.advanceTimersByTimeAsync(1000));

describe('NPCDialogueModal', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const game = document.createElement('div');
    game.id = 'game-container';
    document.body.appendChild(game);
  });

  afterEach(() => {
    document.getElementById('game-container').remove();
    vi.useRealTimers();
  });

  it('calls an NPC by their unknownName until Frank has found their nameNoteId', () => {
    const stranger = { ...npc, unknownName: 'Station worker', nameNoteId: 'derek-station-worker' };
    const name = () => document.querySelector('.npc-dialogue__name');
    const { unmount } = renderWithProviders(<NPCDialogueModal npc={stranger} onClose={() => {}} />);
    expect(name()).toHaveTextContent('Station worker');
    unmount();

    renderWithProviders(<NPCDialogueModal npc={stranger} onClose={() => {}} />, {
      preloadedState: { investigation: { discoveredNoteIds: ['derek-station-worker'], isNotebookOpen: false, newNoteId: null } },
    });
    expect(name()).toHaveTextContent('Derek');
  });

  it('the box holds only the talk options', () => {
    renderWithProviders(<NPCDialogueModal npc={npc} onClose={() => {}} />);
    expect(option('Can you help?')).toBeInTheDocument();
    expect(option('Nice pigeons.')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(speech('frank')).toBeNull();
    expect(speech('npc')).toBeNull();
  });

  it('plays the conversation beside each portrait, one click per line, then marks the option heard', async () => {
    const { store } = renderWithProviders(<NPCDialogueModal npc={npc} onClose={() => {}} />);
    await userEvent.click(option('Can you help?'));

    expect(document.querySelector('.npc-dialogue')).toBeNull();
    expect(speech('frank')).not.toBeNull();
    expect(talking('Frank')).toBe(true);
    expect(talking('Derek')).toBe(false);
    await typeOut();
    expect(speech('frank')).toHaveTextContent('Can you help?');
    expect(talking('Frank')).toBe(false);

    await userEvent.click(overlay());
    expect(speech('frank')).toBeNull();
    expect(talking('Derek')).toBe(true);
    await typeOut();
    expect(speech('npc')).toHaveTextContent('No.');

    await userEvent.click(overlay());
    await typeOut();
    expect(speech('npc')).toHaveTextContent('Wait.');
    expect(store.getState().dialogue.heardTalkOptions).toEqual({});

    await userEvent.click(overlay());
    expect(speech('npc')).toBeNull();
    expect(option('Can you help?')).toHaveClass('npc-dialogue__option--heard');
    expect(option('Nice pigeons.')).not.toHaveClass('npc-dialogue__option--heard');
    expect(store.getState().dialogue.heardTalkOptions).toEqual({ 'station-worker': ['barriers'] });
  });

  it('colours the NPC\'s speech with their speechColor, leaving Frank\'s white', async () => {
    renderWithProviders(<NPCDialogueModal npc={{ ...npc, speechColor: '#ff9933' }} onClose={() => {}} />);
    await userEvent.click(option('Nice pigeons.'));
    expect(speech('frank').style.color).toBe('');
    await typeOut();
    await userEvent.click(overlay());
    expect(speech('npc')).toHaveStyle({ color: '#ff9933' });
  });

  it('lays out the whole line from the start, hiding what has not typed yet', async () => {
    renderWithProviders(<NPCDialogueModal npc={npc} onClose={() => {}} />);
    await userEvent.click(option('Nice pigeons.'));
    const untyped = () => document.querySelector('.npc-dialogue-portraits__untyped');
    expect(speech('frank')).toHaveTextContent('Nice pigeons.');
    expect(untyped().textContent.length).toBeGreaterThan(0);
    await typeOut();
    expect(untyped().textContent).toBe('');
  });

  it('a click while a line types shows all of it instead of moving on', async () => {
    renderWithProviders(<NPCDialogueModal npc={npc} onClose={() => {}} />);
    await userEvent.click(option('Nice pigeons.'));
    await userEvent.click(overlay());
    expect(document.querySelector('.npc-dialogue-portraits__untyped').textContent).toBe('');
  });

  it('a heard option can be played through again', async () => {
    renderWithProviders(<NPCDialogueModal npc={npc} onClose={() => {}} />, {
      preloadedState: { dialogue: { heardTalkOptions: { 'station-worker': ['pigeons'] } } },
    });
    expect(option('Nice pigeons.')).toHaveClass('npc-dialogue__option--heard');
    await userEvent.click(option('Nice pigeons.'));
    await typeOut();
    expect(speech('frank')).toHaveTextContent('Nice pigeons.');
  });

  it('offers an option with requiresStoryFlag only once that flag is set', () => {
    const gated = { ...npc, talkOptions: [...npc.talkOptions, { id: 'gate', line: 'The gate?', replies: ['Shut.'], requiresStoryFlag: 'triedBarrier' }] };
    const { unmount } = renderWithProviders(<NPCDialogueModal npc={gated} onClose={() => {}} />);
    expect(screen.queryByRole('button', { name: 'The gate?' })).toBeNull();
    unmount();

    renderWithProviders(<NPCDialogueModal npc={gated} onClose={() => {}} />, {
      preloadedState: { game: { storyProgress: { triedBarrier: true } } },
    });
    expect(option('The gate?')).toBeInTheDocument();
  });

  it('notes an option\'s noteId once it has played to the end', async () => {
    const noting = { ...npc, talkOptions: [{ id: 'why', line: 'Why not?', replies: ['My neck.'], noteId: 'derek-fears-blame' }] };
    const { store } = renderWithProviders(<NPCDialogueModal npc={noting} onClose={() => {}} />);
    const notes = () => store.getState().investigation.discoveredNoteIds;
    await userEvent.click(option('Why not?'));
    await typeOut();
    await userEvent.click(overlay());
    await typeOut();
    expect(notes()).toEqual([]);

    await userEvent.click(overlay());
    expect(notes()).toEqual(['derek-fears-blame']);
  });

  it('sets an option\'s setsStoryFlag once it has played to the end', async () => {
    const releasing = { ...npc, talkOptions: [{ id: 'clive', line: 'For Clive?', replies: ['Go on.'], setsStoryFlag: 'barrierReleased', ends: true }] };
    const { store } = renderWithProviders(<NPCDialogueModal npc={releasing} onClose={() => {}} />);
    await userEvent.click(option('For Clive?'));
    await typeOut();
    await userEvent.click(overlay());
    await typeOut();
    expect(store.getState().game.storyProgress.barrierReleased).toBe(false);
    await userEvent.click(overlay());
    expect(store.getState().game.storyProgress.barrierReleased).toBe(true);
  });

  it('offers deduction- and heard-gated options, and drops one hidden by a story flag', () => {
    const gated = {
      ...npc,
      talkOptions: [
        { id: 'clive', line: 'Clive?', replies: ['Yeah.'], requiresDeduction: 'derek-knew-sacked-worker' },
        { id: 'for-clive', line: 'For Clive?', replies: ['Go on.'], requiresHeard: 'clive', hiddenByStoryFlag: 'barrierReleased' },
      ],
    };
    const names = () => [...document.querySelectorAll('.npc-dialogue__option')].map((el) => el.textContent);
    const show = (preloadedState) => renderWithProviders(<NPCDialogueModal npc={gated} onClose={() => {}} />, { preloadedState });
    const deduced = { madeDeductionIds: ['derek-knew-sacked-worker'], boards: {}, isBoardOpen: false };

    let view = show();
    expect(names()).toEqual([]);
    view.unmount();
    view = show({ deduction: deduced });
    expect(names()).toEqual(['Clive?']);
    view.unmount();
    view = show({ deduction: deduced, dialogue: { heardTalkOptions: { 'station-worker': ['clive'] } } });
    expect(names()).toEqual(['Clive?', 'For Clive?']);
    view.unmount();
    show({ deduction: deduced, dialogue: { heardTalkOptions: { 'station-worker': ['clive'] } }, game: { storyProgress: { barrierReleased: true } } });
    expect(names()).toEqual(['Clive?']);
  });

  it('with a script, plays just those lines with no options box, then closes', async () => {
    const onClose = vi.fn();
    renderWithProviders(<NPCDialogueModal npc={npc} script={[{ speaker: 'npc', text: 'Between us.' }]} onClose={onClose} />);
    expect(document.querySelector('.npc-dialogue')).toBeNull();
    expect(talking('Derek')).toBe(true);
    await typeOut();
    expect(speech('npc')).toHaveTextContent('Between us.');
    await userEvent.click(overlay());
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('an option that ends the conversation closes the chat after its last line, without greying', async () => {
    const onClose = vi.fn();
    const leaving = { ...npc, talkOptions: [{ id: 'bye', line: 'Bye.', replies: ['Ta-ra.'], ends: true }] };
    const { store } = renderWithProviders(<NPCDialogueModal npc={leaving} onClose={onClose} />);
    await userEvent.click(option('Bye.'));
    await typeOut();
    await userEvent.click(overlay());
    await typeOut();
    expect(speech('npc')).toHaveTextContent('Ta-ra.');
    expect(onClose).not.toHaveBeenCalled();

    await userEvent.click(overlay());
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(store.getState().dialogue.heardTalkOptions).toEqual({});
  });

  it('closes from the close button or a click outside the box, but not mid-conversation', async () => {
    const onClose = vi.fn();
    renderWithProviders(<NPCDialogueModal npc={npc} onClose={onClose} />);
    await userEvent.click(option('Nice pigeons.'));
    await userEvent.click(overlay());
    expect(onClose).not.toHaveBeenCalled();

    await userEvent.click(overlay());
    await typeOut();
    await userEvent.click(overlay());
    await userEvent.click(overlay());
    expect(onClose).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: '✕' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
