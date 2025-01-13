// "use client";
// import React, { useEffect, useState } from "react";
// import Chart from "./../once-ui/components/Chart";
// import { Background } from "../once-ui/components/Background"; // Adjust path based on file location
// import { Flex } from "@/once-ui/components/Flex";
// import { Dropdown, DropdownOptions } from "@/once-ui/components";
// import WelcomeScreen from "../components/WelcomeScreen"; // Adjust the import path
// import { Sidebar } from "@/once-ui/modules";

// interface ChartData {
//   time: string; // ISO format (yyyy-mm-dd)
//   value: number;
// }

// const NatGasPage: React.FC = () => {
//   const [showWelcome, setShowWelcome] = useState(false);
//   const [state, setState] = useState({
//     priceData: [] as ChartData[],
//     cotData: [] as ChartData[],
//     cotColumns: [] as string[],
//     loadingPrice: true,
//     loadingCot: true,
//   });

//   const [selectedColumn, setSelectedColumn] = useState<string>(
//     "Net Traders Commercial"
//   ); // Default column

//   // Map cotColumns to DropdownOptions
//   const dropdownOptions: DropdownOptions[] = state.cotColumns.map((column) => ({
//     label: column,
//     value: column,
//   }));

//   // Define fixed date range for the last 3 years
//   const fixedDateRange = {
//     start: new Date(new Date().getFullYear() - 3, 0, 1)
//       .toISOString()
//       .split("T")[0], // January 1st of 3 years ago
//     end: new Date(new Date().getFullYear(), 11, 31).toISOString().split("T")[0], // December 31st of current year
//   };

//   // Filter data to include only the last 3 years
//   const filterDataForLast3Years = (data: ChartData[]): ChartData[] =>
//     data.filter(
//       (item) =>
//         item.time >= fixedDateRange.start && item.time <= fixedDateRange.end
//     );

//   // Show the welcome screen every time the user visits
//   useEffect(() => {
//     setShowWelcome(true); // Always show the welcome popup
//   }, []);

//   // Fetch data concurrently
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const [priceRes, cotColumnsRes] = await Promise.all([
//           fetch(
//             `${process.env.NEXT_PUBLIC_API_URL}/api/data/natgas?ticker=HENRY%20HUB%20-%20NEW%20YORK%20MERCANTILE%20EXCHANGE&column=NG_Close`
//           ),
//           fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/options/natgas`),
//         ]);

//         const priceData = await priceRes.json();
//         const cotColumnsData = await cotColumnsRes.json();

//         const formattedPriceData: ChartData[] = priceData.map((item: any) => ({
//           time: new Date(item.date2).toISOString().split("T")[0], // Ensure yyyy-mm-dd format
//           value: item.NG_Close,
//         }));

//         setState((prevState) => ({
//           ...prevState,
//           priceData: filterDataForLast3Years(formattedPriceData),
//           cotColumns: cotColumnsData.columns || [],
//           loadingPrice: false,
//         }));
//       } catch (error) {
//         console.error("Error fetching data:", error);
//         setState((prevState) => ({
//           ...prevState,
//           loadingPrice: false,
//         }));
//       }
//     };

//     fetchData();
//   }, []);

//   useEffect(() => {
//     const fetchCotData = async () => {
//       try {
//         const apiUrl =
//           process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"; // Default to localhost if not set
//         const endpoint = `${apiUrl}/api/data/natgas?ticker=HENRY%20HUB%20-%20NEW%20YORK%20MERCANTILE%20EXCHANGE&column=${encodeURIComponent(
//           selectedColumn
//         )}`;

//         console.log("Fetching from URL:", endpoint); // Log the actual URL for debugging

//         const res = await fetch(endpoint);
//         if (!res.ok) {
//           throw new Error(`HTTP error! Status: ${res.status}`);
//         }

//         const data = await res.json();
//         const formattedData: ChartData[] = data.map((item: any) => ({
//           time: new Date(item.date2).toISOString().split("T")[0],
//           value: item[selectedColumn],
//         }));

//         setState((prevState) => ({
//           ...prevState,
//           cotData: filterDataForLast3Years(formattedData),
//           loadingCot: false,
//         }));
//       } catch (error) {
//         console.error("Error fetching COT data:", error);
//         setState((prevState) => ({
//           ...prevState,
//           loadingCot: false,
//         }));
//       }
//     };

//     fetchCotData();
//   }, [selectedColumn]);

//   return (
//     <>
//       {showWelcome && <WelcomeScreen onClose={() => setShowWelcome(false)} />}
//       <Flex
//         fillWidth
//         paddingTop="xl"
//         paddingLeft="xl"
//         paddingRight="xl"
//         paddingBottom="xl"
//         direction="row"
//         flex={1}
//       >
//         <Sidebar />

//         <Flex direction="column" flex={1} paddingLeft="l">
//           <div data-theme="dark" data-neutral="gray" data-brand="violet">
//             <div>
//               <h2>Natural Gas Prices</h2>
//               {state.loadingPrice ? (
//                 <p>Loading price data...</p>
//               ) : (
//                 <Chart data={state.priceData} fixedDateRange={fixedDateRange} />
//               )}
//             </div>

//             <div style={{ marginTop: "20px" }}>
//               <label htmlFor="cot-column">Select COT Report: </label>
//               <Dropdown
//                 options={dropdownOptions}
//                 selectedOption={selectedColumn}
//                 onOptionSelect={(option) => setSelectedColumn(option.value)}
//               />
//             </div>

//             <div style={{ marginTop: "20px" }}>
//               {state.loadingCot ? (
//                 <p>Loading COT data...</p>
//               ) : (
//                 <Chart data={state.cotData} fixedDateRange={fixedDateRange} />
//               )}
//             </div>
//           </div>
//         </Flex>
//       </Flex>
//     </>
//   );
// };

// export default NatGasPage;

"use client";
import React, { useEffect, useState } from "react";
import Chart from "./../once-ui/components/Chart";
import { Background } from "../once-ui/components/Background"; // Adjust path based on file location
import { Flex } from "@/once-ui/components/Flex";
import { Dropdown, DropdownOptions } from "@/once-ui/components";
import WelcomeScreen from "../components/WelcomeScreen"; // Adjust the import path
import { Sidebar } from "@/once-ui/modules";
import "./styles.css";

interface ChartData {
  time: string; // ISO format (yyyy-mm-dd)
  value: number;
}

const NatGasPage: React.FC = () => {
  const [showWelcome, setShowWelcome] = useState(false);
  const [state, setState] = useState({
    priceData: [] as ChartData[],
    cotData: [] as ChartData[],
    cotColumns: [] as string[],
    loadingPrice: true,
    loadingCot: true,
  });

  const [selectedColumn, setSelectedColumn] = useState<string>(
    "Net Traders Commercial"
  ); // Default column

  const [showLoader, setShowLoader] = useState(false); // Loader state

  // Map cotColumns to DropdownOptions
  const dropdownOptions: DropdownOptions[] = state.cotColumns.map((column) => ({
    label: column,
    value: column,
  }));

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

  // Show the welcome screen every time the user visits
  useEffect(() => {
    setShowWelcome(true); // Always show the welcome popup
  }, []);

  // Fetch data concurrently
  useEffect(() => {
    const fetchData = async () => {
      try {
        setShowLoader(true); // Show loader while fetching data

        const [priceRes, cotColumnsRes] = await Promise.all([
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/data/natgas?ticker=HENRY%20HUB%20-%20NEW%20YORK%20MERCANTILE%20EXCHANGE&column=NG_Close`
          ),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/options/natgas`),
        ]);

        const priceData = await priceRes.json();
        const cotColumnsData = await cotColumnsRes.json();

        const formattedPriceData: ChartData[] = priceData.map((item: any) => ({
          time: new Date(item.date2).toISOString().split("T")[0], // Ensure yyyy-mm-dd format
          value: item.NG_Close,
        }));

        setState((prevState) => ({
          ...prevState,
          priceData: filterDataForLast3Years(formattedPriceData),
          cotColumns: cotColumnsData.columns || [],
          loadingPrice: false,
        }));
      } catch (error) {
        console.error("Error fetching data:", error);
        setState((prevState) => ({
          ...prevState,
          loadingPrice: false,
        }));
      } finally {
        setShowLoader(false); // Hide loader after fetching
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchCotData = async () => {
      try {
        setShowLoader(true); // Show loader while fetching COT data

        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"; // Default to localhost if not set
        const endpoint = `${apiUrl}/api/data/natgas?ticker=HENRY%20HUB%20-%20NEW%20YORK%20MERCANTILE%20EXCHANGE&column=${encodeURIComponent(
          selectedColumn
        )}`;

        console.log("Fetching from URL:", endpoint); // Log the actual URL for debugging

        const res = await fetch(endpoint);
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }

        const data = await res.json();
        const formattedData: ChartData[] = data.map((item: any) => ({
          time: new Date(item.date2).toISOString().split("T")[0],
          value: item[selectedColumn],
        }));

        setState((prevState) => ({
          ...prevState,
          cotData: filterDataForLast3Years(formattedData),
          loadingCot: false,
        }));
      } catch (error) {
        console.error("Error fetching COT data:", error);
        setState((prevState) => ({
          ...prevState,
          loadingCot: false,
        }));
      } finally {
        setShowLoader(false); // Hide loader after fetching
      }
    };

    fetchCotData();
  }, [selectedColumn]);

  return (
    <>
      {showWelcome && <WelcomeScreen onClose={() => setShowWelcome(false)} />}

      {showLoader && (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
          <div className="loader"></div>
          <p style={{ marginTop: "10px", fontSize: "18px", color: "#514b82" }}>
            Loading data...
          </p>
        </div>
      )}

      {!showLoader && (
        <Flex
          fillWidth
          paddingTop="xl"
          paddingLeft="xl"
          paddingRight="xl"
          paddingBottom="xl"
          direction="row"
          flex={1}
        >
          <Sidebar />

          <Flex direction="column" flex={1} paddingLeft="l">
            <div data-theme="dark" data-neutral="gray" data-brand="violet">
              <div>
                <h2>Natural Gas Prices</h2>
                {state.loadingPrice ? (
                  <p>Loading price data...</p>
                ) : (
                  <Chart
                    data={state.priceData}
                    fixedDateRange={fixedDateRange}
                  />
                )}
              </div>

              <div style={{ marginTop: "20px" }}>
                <label htmlFor="cot-column">Select COT Report: </label>
                <Dropdown
                  options={dropdownOptions}
                  selectedOption={selectedColumn}
                  onOptionSelect={(option) => setSelectedColumn(option.value)}
                />
              </div>

              <div style={{ marginTop: "20px" }}>
                {state.loadingCot ? (
                  <p>Loading COT data...</p>
                ) : (
                  <Chart data={state.cotData} fixedDateRange={fixedDateRange} />
                )}
              </div>
            </div>
          </Flex>
        </Flex>
      )}
    </>
  );
};

export default NatGasPage;
