import { useDispatch } from 'react-redux';
import { toggleNotebook } from '../slices/investigationSlice';
import './NotebookButton.scss';

// Sits to the left of the Inventory button, in the same style
const NotebookButton = () => {
  const dispatch = useDispatch();

  return (
    <button className="notebook-button" onClick={() => dispatch(toggleNotebook())}>
      Notebook
    </button>
  );
};

export default NotebookButton;
