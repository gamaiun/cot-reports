// import React, { useEffect, useState } from "react";
// import Chart from "../components/Chart";

// interface ChartData {
//   time: string; // ISO format (yyyy-mm-dd)
//   value: number;
// }

// const NatGasPage: React.FC = () => {
//   const [priceData, setPriceData] = useState<ChartData[]>([]); // Data for price chart
//   const [cotData, setCotData] = useState<ChartData[]>([]); // Data for COT chart
//   const [cotColumns, setCotColumns] = useState<string[]>([]); // Dropdown options
//   const [selectedColumn, setSelectedColumn] =
//     useState<string>("Noncommercial Long"); // Default column
//   const [loadingPrice, setLoadingPrice] = useState(true);
//   const [loadingCot, setLoadingCot] = useState(true);

//   // Fetch natural gas prices
//   useEffect(() => {
//     const fetchPriceData = async () => {
//       try {
//         const res = await fetch(
//           "http://127.0.0.1:5000/api/data/natgas?ticker=HENRY%20HUB%20-%20NEW%20YORK%20MERCANTILE%20EXCHANGE&column=NG_Close"
//         );
//         const data = await res.json();

//         const formattedData: ChartData[] = data.map((item: any) => ({
//           time: new Date(item.date2).toISOString().split("T")[0], // Ensure yyyy-mm-dd format
//           value: item.NG_Close,
//         }));

//         setPriceData(formattedData);
//         setLoadingPrice(false);
//       } catch (error) {
//         console.error("Error fetching price data:", error);
//         setLoadingPrice(false);
//       }
//     };

//     fetchPriceData();
//   }, []);

//   // Fetch COT data for the selected column
//   useEffect(() => {
//     const fetchCotData = async () => {
//       try {
//         setLoadingCot(true);
//         const res = await fetch(
//           `http://127.0.0.1:5000/api/data/natgas?ticker=HENRY%20HUB%20-%20NEW%20YORK%20MERCANTILE%20EXCHANGE&column=${encodeURIComponent(
//             selectedColumn
//           )}`
//         );
//         const data = await res.json();

//         const formattedData: ChartData[] = data.map((item: any) => ({
//           time: new Date(item.date2).toISOString().split("T")[0], // Ensure yyyy-mm-dd format
//           value: item[selectedColumn],
//         }));

//         setCotData(formattedData);
//         setLoadingCot(false);
//       } catch (error) {
//         console.error("Error fetching COT data:", error);
//         setLoadingCot(false);
//       }
//     };

//     fetchCotData();
//   }, [selectedColumn]);

//   // Fetch dropdown options for COT columns
//   useEffect(() => {
//     const fetchCotColumns = async () => {
//       try {
//         const res = await fetch("http://127.0.0.1:5000/api/options/natgas");
//         const data = await res.json();
//         setCotColumns(data.columns || []);
//       } catch (error) {
//         console.error("Error fetching COT columns:", error);
//       }
//     };

//     fetchCotColumns();
//   }, []);

//   return (
//     <div>
//       <h1>Natural Gas Analysis</h1>

//       {/* Top Chart: Natural Gas Prices */}
//       <div>
//         <h2>Natural Gas Prices</h2>
//         {loadingPrice ? (
//           <p>Loading price data...</p>
//         ) : (
//           <Chart data={priceData} title="Natural Gas Close Prices" />
//         )}
//       </div>

//       {/* Dropdown for Selecting COT Column */}
//       <div style={{ marginTop: "20px" }}>
//         <label htmlFor="cot-column">Select COT Column: </label>
//         <select
//           id="cot-column"
//           value={selectedColumn}
//           onChange={(e) => setSelectedColumn(e.target.value)}
//         >
//           {cotColumns.map((column) => (
//             <option key={column} value={column}>
//               {column}
//             </option>
//           ))}
//         </select>
//       </div>

//       {/* Bottom Chart: COT Data */}
//       <div style={{ marginTop: "20px" }}>
//         <h2>COT Report Data</h2>
//         {loadingCot ? (
//           <p>Loading COT data...</p>
//         ) : (
//           <Chart data={cotData} title={`COT Data: ${selectedColumn}`} />
//         )}
//       </div>
//     </div>
//   );
// };

// export default NatGasPage;

import React, { useEffect, useState } from "react";
import Chart from "../components/Chart";

interface ChartData {
  time: string; // ISO format (yyyy-mm-dd)
  value: number;
}

const NatGasPage: React.FC = () => {
  const [priceData, setPriceData] = useState<ChartData[]>([]); // Data for price chart
  const [cotData, setCotData] = useState<ChartData[]>([]); // Data for COT chart
  const [cotColumns, setCotColumns] = useState<string[]>([]); // Dropdown options
  const [selectedColumn, setSelectedColumn] =
    useState<string>("Noncommercial Long"); // Default column
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [loadingCot, setLoadingCot] = useState(true);

  // Define fixed date range for the last 3 years
  const fixedDateRange = {
    start: new Date(new Date().getFullYear() - 3, 0, 1)
      .toISOString()
      .split("T")[0], // January 1st of 3 years ago
    end: new Date(new Date().getFullYear(), 11, 31).toISOString().split("T")[0], // December 31st of current year
  };

  // Filter data to include only the last 3 years
  const filterDataForLast3Years = (data: ChartData[]): ChartData[] =>
    data.filter(
      (item) =>
        item.time >= fixedDateRange.start && item.time <= fixedDateRange.end
    );

  // Fetch natural gas prices
  useEffect(() => {
    const fetchPriceData = async () => {
      try {
        const res = await fetch(
          "http://127.0.0.1:5000/api/data/natgas?ticker=HENRY%20HUB%20-%20NEW%20YORK%20MERCANTILE%20EXCHANGE&column=NG_Close"
        );
        const data = await res.json();

        const formattedData: ChartData[] = data.map((item: any) => ({
          time: new Date(item.date2).toISOString().split("T")[0], // Ensure yyyy-mm-dd format
          value: item.NG_Close,
        }));

        setPriceData(filterDataForLast3Years(formattedData));
        setLoadingPrice(false);
      } catch (error) {
        console.error("Error fetching price data:", error);
        setLoadingPrice(false);
      }
    };

    fetchPriceData();
  }, []);

  // Fetch COT data for the selected column
  useEffect(() => {
    const fetchCotData = async () => {
      try {
        setLoadingCot(true);
        const res = await fetch(
          `http://127.0.0.1:5000/api/data/natgas?ticker=HENRY%20HUB%20-%20NEW%20YORK%20MERCANTILE%20EXCHANGE&column=${encodeURIComponent(
            selectedColumn
          )}`
        );
        const data = await res.json();

        const formattedData: ChartData[] = data.map((item: any) => ({
          time: new Date(item.date2).toISOString().split("T")[0], // Ensure yyyy-mm-dd format
          value: item[selectedColumn],
        }));

        setCotData(filterDataForLast3Years(formattedData));
        setLoadingCot(false);
      } catch (error) {
        console.error("Error fetching COT data:", error);
        setLoadingCot(false);
      }
    };

    fetchCotData();
  }, [selectedColumn]);

  // Fetch dropdown options for COT columns
  useEffect(() => {
    const fetchCotColumns = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/api/options/natgas");
        const data = await res.json();
        setCotColumns(data.columns || []);
      } catch (error) {
        console.error("Error fetching COT columns:", error);
      }
    };

    fetchCotColumns();
  }, []);

  return (
    <div>
      <h1>Natural Gas Analysis</h1>

      {/* Top Chart: Natural Gas Prices */}
      <div>
        <h2>Natural Gas Prices (Last 3 Years)</h2>
        {loadingPrice ? (
          <p>Loading price data...</p>
        ) : (
          <Chart
            data={priceData}
            title="Natural Gas Close Prices (Last 3 Years)"
            fixedDateRange={fixedDateRange}
          />
        )}
      </div>

      {/* Dropdown for Selecting COT Column */}
      <div style={{ marginTop: "20px" }}>
        <label htmlFor="cot-column">Select COT Column: </label>
        <select
          id="cot-column"
          value={selectedColumn}
          onChange={(e) => setSelectedColumn(e.target.value)}
        >
          {cotColumns.map((column) => (
            <option key={column} value={column}>
              {column}
            </option>
          ))}
        </select>
      </div>

      {/* Bottom Chart: COT Data */}
      <div style={{ marginTop: "20px" }}>
        <h2>COT Report Data (Last 3 Years)</h2>
        {loadingCot ? (
          <p>Loading COT data...</p>
        ) : (
          <Chart
            data={cotData}
            title={`COT Data: ${selectedColumn} (Last 3 Years)`}
            fixedDateRange={fixedDateRange}
          />
        )}
      </div>
    </div>
  );
};

export default NatGasPage;
