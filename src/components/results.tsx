import React from 'react';

interface ResultPageProps {
  data: string;
}

const ResultPage: React.FC<ResultPageProps> = ({ data }) => {
  return (
    <div className="result-container">
      <h1>Response Data</h1>
      <p>{data}</p>
    </div>
  );
};

export default ResultPage;
