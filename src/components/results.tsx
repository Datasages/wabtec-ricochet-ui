import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import useCookies from '../hooks/useCookies';
import { COOKIE_TOKEN_NAME, COOKIE_GUID_NAME} from '../utils/api';

const ResultPage: React.FC = () => {
  const [data, setData] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { getCookies } = useCookies();

  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const mark = queryParams.get('mark');
  const locoId = queryParams.get('locoId');

  useEffect(() => {
    if (mark && locoId) {
      const fetchData = async () => {
        try {
          const URL = process.env.REACT_APP_GET_DATA_URL || "";

          const savedToken = getCookies(COOKIE_TOKEN_NAME) || "";
          const savedGuid = getCookies(COOKIE_GUID_NAME) || "";

          const response = await fetch(URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(
              { 
                token: savedToken,
                guid: savedGuid,
                mark, 
                "loco": locoId,
               }),
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
  }, [mark, locoId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="result-container">
      <h1>{mark}    {locoId}</h1>
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
