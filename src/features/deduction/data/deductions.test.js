import deductions, { deductionsById } from './deductions';
import { boards } from './boards';
import { investigationNotes } from '../../investigation/data/investigationNotes';
import { inventoryItems } from '../../inventory/data/items';

const exists = (nodeId) => {
  const [kind, refId] = nodeId.split(':');
  return { note: investigationNotes, item: inventoryItems, deduction: deductionsById }[kind]?.[refId] !== undefined;
};

describe('deductions', () => {
  it.each(deductions)('$id is on a board, made by a string between two things that exist', (deduction) => {
    expect(boards.map((b) => b.id)).toContain(deduction.boardId);
    expect(exists(deduction.from)).toBe(true);
    expect(exists(deduction.to)).toBe(true);
    expect(deduction.from).not.toBe(deduction.to);
  });

  it('has unique ids', () => {
    expect(Object.keys(deductionsById)).toHaveLength(deductions.length);
  });
});
