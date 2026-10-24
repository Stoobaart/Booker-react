import { useDispatch } from 'react-redux';
import { toggleNotebook } from '../slices/investigationSlice';
import notebookIcon from '../../../assets/images/ui/notebook.png';
import '../../../shared/components/HudButton.scss';
import './NotebookButton.scss';

// Frank's notepad, to the left of the evidence box (the inventory)
const NotebookButton = () => {
  const dispatch = useDispatch();

  return (
    <button className="notebook-button hud-button" aria-label="Notebook" title="Notebook" onClick={() => dispatch(toggleNotebook())}>
      <img className="hud-button__icon" src={notebookIcon} alt="" />
    </button>
  );
};

export default NotebookButton;
