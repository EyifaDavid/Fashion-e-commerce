import React, { useState } from 'react';

const ColorPicker = ({ availableColors, selectedColors, setSelectedColors }) => {
  const [customColor, setCustomColor] = useState('');

  const toggleColor = (color) => {
    if (selectedColors.includes(color)) {
      setSelectedColors(selectedColors.filter((c) => c !== color));
    } else {
      setSelectedColors([...selectedColors, color]);
    }
  };

  const handleAddCustomColor = () => {
    if (!customColor) return;
    const color = customColor.startsWith('#') ? customColor : `#${customColor}`;
    if (!selectedColors.includes(color)) {
      setSelectedColors([...selectedColors, color]);
    }
    setCustomColor('');
  };

  return (
    <div className="flex flex-col mt-4">
      <label className="font-semibold mb-2">Select Available Colors:</label>
      <div className="flex flex-wrap gap-2 mb-4">
        {availableColors.map((color, index) => (
          <div
            key={index}
            onClick={() => toggleColor(color)}
            className={`w-6 h-6 rounded-full border-2 cursor-pointer transition ${
              selectedColors.includes(color) ? 'border-black scale-110' : 'border-gray-300'
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
        {selectedColors
          .filter((color) => !availableColors.includes(color))
          .map((color, index) => (
            <div
              key={`custom-${index}`}
              onClick={() => toggleColor(color)}
              className={`w-6 h-6 rounded-full border-2 cursor-pointer transition ${
                selectedColors.includes(color) ? 'border-black scale-110' : 'border-gray-300'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
      </div>

      {/* Add Custom Color */}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={customColor}
          onChange={(e) => setCustomColor(e.target.value)}
          className="w-8 h-8 cursor-pointer"
        />
        <button
          type="button"
          onClick={handleAddCustomColor}
          className="bg-[#002fa7] text-white px-3 py-1 rounded-full"
        >
          Add Color
        </button>
      </div>
    </div>
  );
};

export default ColorPicker;
