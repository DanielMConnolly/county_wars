import React, { useContext } from 'react';
import { X, Check } from 'lucide-react';
import { GameStateContext } from './GameStateContext';

export default function SettingsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {

  const [selectedColor, setSelectedColor] = React.useState('#3B82F6');

  const {setHighlightColor} = useContext(GameStateContext);

  const colorOptions = [
    { name: 'Blue', value: '#3B82F6', class: 'bg-blue-500' },
    { name: 'Red', value: '#EF4444', class: 'bg-red-500' },
    { name: 'Green', value: '#10B981', class: 'bg-emerald-500' },
    { name: 'Purple', value: '#8B5CF6', class: 'bg-violet-500' },
    { name: 'Orange', value: '#F97316', class: 'bg-orange-500' },
    { name: 'Pink', value: '#EC4899', class: 'bg-pink-500' },
    { name: 'Yellow', value: '#EAB308', class: 'bg-yellow-500' },
    { name: 'Teal', value: '#14B8A6', class: 'bg-teal-500' },
    { name: 'Indigo', value: '#6366F1', class: 'bg-indigo-500' },
    { name: 'Lime', value: '#84CC16', class: 'bg-lime-500' },
    { name: 'Cyan', value: '#06B6D4', class: 'bg-cyan-500' },
    { name: 'Rose', value: '#F43F5E', class: 'bg-rose-500' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 transform transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Game Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Conquest Color</h3>
            <p className="text- sm text-gray-600 mb-4">
              Choose the color that will represent your conquered counties on the map.
            </p>

            {/* Color Grid */}
            <div className="grid grid-cols-4 gap-3">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSelectedColor(color.value)}
                  className={`relative w-full h-12 rounded-lg border-2 transition-all hover:scale-105 ${
                    selectedColor === color.value
                      ? 'border-gray-800 ring-2 ring-gray-300'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${color.class}`}
                  title={color.name}
                >
                  {selectedColor === color.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check size={20} className="text-white drop-shadow-lg" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Selected Color Preview */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div
                  className="w-6 h-6 rounded-full border border-gray-300"
                  style={{ backgroundColor: selectedColor }}
                />
                <span className="text-sm text-gray-700">
                  Selected: {colorOptions.find(c => c.value === selectedColor)?.name}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={()=> {
              setHighlightColor(selectedColor);
              onClose();
            }}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
