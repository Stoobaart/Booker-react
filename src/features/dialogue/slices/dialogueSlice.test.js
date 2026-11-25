import reducer, {
  adjustStanding,
  markTalkOptionHeard,
  restoreHeardTalkOptions,
  restoreStanding,
  selectHeardTalkOptions,
  selectStanding,
} from './dialogueSlice';
import { startNewGame } from '../../game/slices/gameSlice';

const heard = (npcId, optionId) => markTalkOptionHeard({ npcId, optionId });

describe('dialogueSlice', () => {
  it('records each talk option heard once, per NPC', () => {
    let state = reducer(undefined, heard('derek', 'barriers'));
    state = reducer(state, heard('derek', 'barriers'));
    state = reducer(state, heard('derek', 'pigeons'));
    state = reducer(state, heard('busker', 'song'));
    expect(state.heardTalkOptions).toEqual({ derek: ['barriers', 'pigeons'], busker: ['song'] });
  });

  it('restores the heard options, replacing what was there', () => {
    let state = reducer(undefined, heard('derek', 'barriers'));
    state = reducer(state, restoreHeardTalkOptions({ busker: ['song'] }));
    expect(state.heardTalkOptions).toEqual({ busker: ['song'] });
    expect(reducer(state, restoreHeardTalkOptions(undefined)).heardTalkOptions).toEqual({});
  });

  it("adds up each NPC's rapport and defensiveness", () => {
    let state = reducer(undefined, adjustStanding({ npcId: 'neighbour', rapport: 1 }));
    state = reducer(state, adjustStanding({ npcId: 'neighbour', defensiveness: 1 }));
    state = reducer(state, adjustStanding({ npcId: 'neighbour', rapport: 1 }));
    expect(selectStanding({ dialogue: state }, 'neighbour')).toEqual({ rapport: 2, defensiveness: 1 });
    expect(selectStanding({ dialogue: state }, 'derek')).toBeUndefined();
    expect(selectStanding({}, 'neighbour')).toBeUndefined();
  });

  it('restores the standing, replacing what was there', () => {
    let state = reducer(undefined, adjustStanding({ npcId: 'derek', rapport: 1 }));
    state = reducer(state, restoreStanding({ neighbour: { rapport: 3, defensiveness: 0 } }));
    expect(state.standing).toEqual({ neighbour: { rapport: 3, defensiveness: 0 } });
    expect(reducer(state, restoreStanding(undefined)).standing).toEqual({});
  });

  it('forgets everything on a new game', () => {
    let state = reducer(undefined, heard('derek', 'barriers'));
    state = reducer(state, adjustStanding({ npcId: 'neighbour', rapport: 1 }));
    expect(reducer(state, startNewGame())).toMatchObject({ heardTalkOptions: {}, standing: {} });
  });

  it('selectHeardTalkOptions reads one NPC, including from old saves', () => {
    const dialogue = reducer(undefined, heard('derek', 'barriers'));
    expect(selectHeardTalkOptions({ dialogue }, 'derek')).toEqual(['barriers']);
    expect(selectHeardTalkOptions({ dialogue }, 'busker')).toBeUndefined();
    expect(selectHeardTalkOptions({}, 'derek')).toBeUndefined();
  });
});
