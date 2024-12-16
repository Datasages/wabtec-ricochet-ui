import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const ResultPage: React.FC = () => {
  const [data, setData] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const location = useLocation();

  // Extract parameters from the query string
  const queryParams = new URLSearchParams(location.search);
  const locomotive = queryParams.get('locomotive');
  const locoId = queryParams.get('locoId');

  useEffect(() => {
    if (locomotive && locoId) {
      const fetchData = async () => {
        try {
          const URL = process.env.REACT_APP_GET_DATA_URL || "";
          const response = await fetch(URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ locomotive, locoId }),
          });
          const result = await response.json();
          setData(result);  
        } catch (error) {
          setError('Failed to fetch data');
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    } else {
      setError('Missing parameters');
      setLoading(false);
    }
  }, [locomotive, locoId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="result-container">
      <h1>Response Data</h1>
      {data && (
        <table className="result-table">
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data).map(([key, value]) => (
              <tr key={key}>
                <td>{key}</td>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
    </div>
  );
};

export default ResultPage;
