import { useDispatch } from 'react-redux';
import { toggleBoard } from '../slices/deductionSlice';
import corkBoardIcon from '../../../assets/images/ui/cork-board.png';
import '../../../shared/components/HudButton.scss';
import './DeductionBoardButton.scss';

const DeductionBoardButton = () => {
  const dispatch = useDispatch();

  return (
    <button className="deduction-board-button hud-button" aria-label="Deductions" title="Deductions" onClick={() => dispatch(toggleBoard())}>
      <img className="hud-button__icon" src={corkBoardIcon} alt="" />
    </button>
  );
};

export default DeductionBoardButton;
