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
// clicks through every line till the box is back or the chat asks to close; returns what was said
const playThrough = async (onClose) => {
  const said = [];
  while (document.querySelector('.npc-dialogue-portraits__speech') && !onClose?.mock.calls.length) {
    await typeOut();
    said.push(document.querySelector('.npc-dialogue-portraits__speech').textContent);
    await userEvent.click(overlay());
  }
  return said;
};

const asked = {
  id: 'neighbour',
  name: 'Neighbour',
  talkOptions: [
    { id: 'account', auto: true, lines: [{ speaker: 'npc', text: 'I found him.' }] },
    {
      id: 'lately',
      line: 'Ask how he was',
      approaches: [
        { id: 'nice', line: 'Was he himself?', replies: ['No.'], effect: { rapport: 1 } },
        { id: 'pressing', line: 'Out with it.', replies: ['Watch it.'], effect: { defensiveness: 1 } },
      ],
      then: {
        lines: [
          { speaker: 'npc', text: 'On edge.' },
          { speaker: 'npc', text: 'Jumpy.', when: { minRapport: 1 } },
        ],
      },
    },
    {
      id: 'bottle',
      requiresHeard: 'lately',
      line: 'Show her the bottle',
      lines: [{ speaker: 'npc', text: 'Mine.' }],
      noteId: 'flat-kitchen-neighbours-pills',
      then: {
        approaches: [
          { id: 'nice', line: 'You meant well.', replies: ['I did.'], effect: { rapport: 1 } },
          { id: 'pressing', line: 'A whole bottle?', replies: ['I know!'], effect: { defensiveness: 1 } },
        ],
        then: {
          outcomes: [
            { when: { minRapport: 2 }, lines: [{ speaker: 'npc', text: 'Poor Sam.' }], noteId: 'flat-kitchen-son-sam', setsStoryFlag: ['samNameRevealed', 'neighbourClosedUp'], ends: true },
            { lines: [{ speaker: 'npc', text: 'Poor boy.' }], setsStoryFlag: 'neighbourClosedUp', ends: true },
          ],
        },
      },
    },
  ],
};

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
      preloadedState: { investigation: { discoveredNoteIds: ['derek-station-worker'], isNotebookOpen: false, newNoteIds: [] } },
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
  it('plays an auto option as the chat opens, the first time only', async () => {
    const { store, unmount } = renderWithProviders(<NPCDialogueModal npc={asked} onClose={() => {}} />);
    expect(document.querySelector('.npc-dialogue')).toBeNull();
    expect(await playThrough()).toEqual(['I found him.']);
    expect(option('Ask how he was')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /I found him/ })).toBeNull();
    unmount();

    renderWithProviders(<NPCDialogueModal npc={asked} onClose={() => {}} />, { store });
    expect(speech('npc')).toBeNull();
    expect(option('Ask how he was')).toBeInTheDocument();
  });

  it('offers the ways Frank can put a question, counting the one chosen the first time only', async () => {
    const preloadedState = { dialogue: { heardTalkOptions: { neighbour: ['account'] } } };
    const { store } = renderWithProviders(<NPCDialogueModal npc={asked} onClose={() => {}} />, { preloadedState });
    const standing = () => store.getState().dialogue.standing.neighbour;
    await userEvent.click(option('Ask how he was'));
    expect(option('Was he himself?')).toBeInTheDocument();
    expect(option('Out with it.')).toBeInTheDocument();

    await userEvent.click(option('Was he himself?'));
    expect(standing()).toEqual({ rapport: 1, defensiveness: 0 });
    expect(await playThrough()).toEqual(['Was he himself?', 'No.', 'On edge.', 'Jumpy.']);
    expect(option('Ask how he was')).toHaveClass('npc-dialogue__option--heard');

    await userEvent.click(option('Ask how he was'));
    await userEvent.click(option('Out with it.'));
    expect(standing()).toEqual({ rapport: 1, defensiveness: 0 });
  });

  it('says less to Frank when she has not warmed to him', async () => {
    const preloadedState = { dialogue: { heardTalkOptions: { neighbour: ['account'] } } };
    renderWithProviders(<NPCDialogueModal npc={asked} onClose={() => {}} />, { preloadedState });
    await userEvent.click(option('Ask how he was'));
    await userEvent.click(option('Out with it.'));
    expect(await playThrough()).toEqual(['Out with it.', 'Watch it.', 'On edge.']);
  });

  it('runs on into the next part, and ends on the outcome her standing meets', async () => {
    const won = { heardTalkOptions: { neighbour: ['account', 'lately'] }, standing: { neighbour: { rapport: 1, defensiveness: 0 } } };
    const onClose = vi.fn();
    const { store } = renderWithProviders(<NPCDialogueModal npc={asked} onClose={onClose} />, { preloadedState: { dialogue: won } });
    await userEvent.click(option('Show her the bottle'));
    expect(await playThrough()).toEqual(['Mine.']);
    expect(store.getState().investigation.discoveredNoteIds).toEqual(['flat-kitchen-neighbours-pills']);

    await userEvent.click(option('You meant well.'));
    expect(await playThrough(onClose)).toEqual(['You meant well.', 'I did.', 'Poor Sam.']);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(store.getState().investigation.discoveredNoteIds).toContain('flat-kitchen-son-sam');
    expect(store.getState().game.storyProgress).toMatchObject({ samNameRevealed: true, neighbourClosedUp: true });
  });

  it('takes the other outcome when Frank has put her on guard', async () => {
    const guarded = { heardTalkOptions: { neighbour: ['account', 'lately'] }, standing: { neighbour: { rapport: 1, defensiveness: 0 } } };
    const onClose = vi.fn();
    const { store } = renderWithProviders(<NPCDialogueModal npc={asked} onClose={onClose} />, { preloadedState: { dialogue: guarded } });
    await userEvent.click(option('Show her the bottle'));
    await playThrough();
    await userEvent.click(option('A whole bottle?'));
    expect(await playThrough(onClose)).toEqual(['A whole bottle?', 'I know!', 'Poor boy.']);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(store.getState().investigation.discoveredNoteIds).not.toContain('flat-kitchen-son-sam');
    expect(store.getState().game.storyProgress).toMatchObject({ samNameRevealed: false, neighbourClosedUp: true });
  });
});
