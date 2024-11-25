import React, { useState, useEffect } from 'react';
import { fetchItems } from '../utils/api';

const MainPage: React.FC = () => {
  const [items, setItems] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [locoId, setLocoId] = useState<number>(0);

  useEffect(() => {
    fetchItems().then(data => setItems(data));
  }, []);

  const handleButtonClick = () => {
    
  };

  return (
    <div className="main-container">
      <div className="content">
        <h1>Locomotive Mark</h1>
        <select
          value={selectedItem}
          onChange={e => setSelectedItem(e.target.value)}
          className="dropdown"
        >
          {items.map((item, index) => (
            <option key={index} value={item}>
              {item}
            </option>
          ))}
        </select>
        <label htmlFor="pin">Enter PIN</label>
        <input
          id="locoId"
          type="number"
          value={locoId}
          onChange={(e) => setLocoId(Number(e.target.value))}
          placeholder="Enter Loco Id"
          maxLength={6}
        />
        <button onClick={handleButtonClick} className="big-button">
          CHECK COMM PATH
        </button>
      </div>
    </div>
  );
};

export default MainPage;
