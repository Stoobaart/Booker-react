import portraitFrankRegular from '../../assets/images/portraits/portrait-frank-regular.png';
import portraitFrankAngry from '../../assets/images/portraits/portrait-frank-angry.png';

export const frankPortraits = {
  regular: portraitFrankRegular,
  angry: portraitFrankAngry,
};

// angry, his eyes are open a row taller
export const frankEyes = {
  regular: [
    { x: 41, y: 42, width: 7, height: 2 },
    { x: 57, y: 41, width: 5, height: 2 },
  ],
  angry: [
    { x: 41, y: 41, width: 7, height: 3 },
    { x: 57, y: 40, width: 5, height: 3 },
  ],
};
