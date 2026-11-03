import reducer, { markTalkOptionHeard, restoreHeardTalkOptions, selectHeardTalkOptions } from './dialogueSlice';
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

  it('forgets everything on a new game', () => {
    const state = reducer(undefined, heard('derek', 'barriers'));
    expect(reducer(state, startNewGame()).heardTalkOptions).toEqual({});
  });

  it('selectHeardTalkOptions reads one NPC, including from old saves', () => {
    const dialogue = reducer(undefined, heard('derek', 'barriers'));
    expect(selectHeardTalkOptions({ dialogue }, 'derek')).toEqual(['barriers']);
    expect(selectHeardTalkOptions({ dialogue }, 'busker')).toBeUndefined();
    expect(selectHeardTalkOptions({}, 'derek')).toBeUndefined();
  });
});
