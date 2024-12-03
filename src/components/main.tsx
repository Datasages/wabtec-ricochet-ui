import React, { useState, useEffect } from 'react';
import { fetchItems } from '../utils/api';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';

const MainPage: React.FC = () => {
  const [items, setItems] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [locoId, setLocoId] = useState<number>(0);

  useEffect(() => {
    fetchItems().then(data => setItems(data));
  }, []);

  const handleButtonClick = () => {
    window.location.href = '/data-selection'; 
  };

  return (
    <div className="main-container">
      <div className="content">
        <FormControl fullWidth margin="normal">
          <InputLabel>Locomotive</InputLabel>
          <Select
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
            label="Locomotive"
            fullWidth
          >
            {items.map((item, index) => (
              <MenuItem key={index} value={item}>
                {item}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          id="locoId"
          label="Loco Id"
          type="number"
          variant="outlined"
          value={locoId}
          onChange={(e) => setLocoId(Number(e.target.value))}
          placeholder="Enter Loco Id"
          fullWidth
          margin="normal"
          sx={{
            backgroundColor: '#f4f4f4',  
            borderRadius: '8px',        
          }}
        />
        <div style={{padding: 10}}>
          <Button className="big-button" 
             sx={{
              width: 150,           
              height: 150,
              padding: 0,          
              borderRadius: '50%',  
              fontSize: '16px',      
              boxSizing: 'border-box', 
            }}
            variant="contained" onClick={handleButtonClick}>
              CHECK COMM PATH
          </Button>  
        </div>
      </div>
    </div>
  );
};

export default MainPage;
