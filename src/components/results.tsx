import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import useCookies from '../hooks/useCookies';
import { COOKIE_TOKEN_NAME, COOKIE_GUID_NAME, checkAuth, runCheck } from '../utils/api';
import { useNavigate } from 'react-router';


interface LoginProps {
  setAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
}

const ResultPage: React.FC<LoginProps> = ({ setAuthenticated }) => {
  const { getCookies, removeAuthentication } = useCookies();
  const [data, setData] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const mark = queryParams.get('mark');
  const locoId = queryParams.get('locoId');

  const getAuthentication = async () => {
    const savedToken = getCookies(COOKIE_TOKEN_NAME) || "";
    const savedGuid = getCookies(COOKIE_GUID_NAME) || "";

    const status = await checkAuth(savedToken, savedGuid);

    if (status === 401) {
      console.warn('Device deregistered or unauthorized');
      removeAuthentication();
      setAuthenticated(false);
      return false;
    }

    // checkAuth reports a network failure as 500.
    if (status < 200 || status >= 300) {
      console.error(`Unexpected error: ${status}`);
      return false;
    }

    return true;
  };


  const fetchData = async () => {
    try {
      const savedToken = getCookies(COOKIE_TOKEN_NAME) || "";
      const savedGuid = getCookies(COOKIE_GUID_NAME) || "";

      // Only called once both are present (see the effect below).
      const result = await runCheck(savedToken, savedGuid, mark as string, locoId as string);
      setData(result);
    } catch (error) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };
  /*
    useEffect(() => {
  
      if (mark && locoId) {
  
        getAuthentication
        fetchData();
      } else {
        setError('Missing parameters');
        setLoading(false);
      }
    }, [mark, locoId]);
  */

  useEffect(() => {
    const run = async () => {
      const authOk = await getAuthentication();
      if (authOk) {
        if (mark && locoId) {
          await fetchData();
        } else {
          setError('Missing parameters');
          setLoading(false);
        }
      } else {
        navigate('/login');
      }
    };
    run();
  }, [mark, locoId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const filteredData = Object.entries(data).filter(([key]) => key !== 'mark' && key !== 'loco');

  return (
    <div className="result-container">
      <h1>{mark}    {locoId}</h1>
      {filteredData.length > 0 && (
        <div className="result-table">
          {filteredData.map(([key, value]) => {
            const isPass = typeof value === 'string' && value === 'PASS';
            const isFail = typeof value === 'string' && value === 'FAIL';

            return (
              <div key={key} className="result-row">
                <div className="parameter">{key}</div>
                <div
                  className={`value-box ${isPass ? 'pass' : isFail ? 'fail' : ''}`}
                >
                  {value}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ResultPage;
