"use client";
import React, { useEffect, useState } from "react";
import Chart from "./../../once-ui/components/Chart";
import { Flex } from "@/once-ui/components/Flex";
import { Dropdown, DropdownOptions } from "@/once-ui/components";
import { Sidebar } from "@/once-ui/modules";

interface ChartData {
  time: string; // ISO format (yyyy-mm-dd)
  value: number;
}

const ChartingPage: React.FC = () => {
  const [priceData, setPriceData] = useState<ChartData[]>([]); // Data for price chart
  const [cotData, setCotData] = useState<ChartData[]>([]); // Data for COT chart
  const [cotColumns, setCotColumns] = useState<string[]>([]); // Dropdown options
  const [selectedColumn, setSelectedColumn] = useState<string>("Net Dealers"); // Default column
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

  useEffect(() => {
    const fetchPriceData = async () => {
      try {
        setLoadingPrice(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/data/currency_prices?ticker=BRITISH%20POUND%20STERLING%20-%20CHICAGO%20MERCANTILE%20EXCHANGE`
        );
        const data = await res.json();

        console.log("Currency Prices API Response:", data); // Debugging

        const formattedData: ChartData[] = data.map((item: any) => ({
          time: new Date(item.time).toISOString().split("T")[0], // Ensure yyyy-mm-dd format
          value: item.value,
        }));

        setPriceData(filterDataForLast3Years(formattedData));
      } catch (error) {
        console.error("Error fetching price data:", error);
      } finally {
        setLoadingPrice(false);
      }
    };

    fetchPriceData();
  }, []); // Empty dependency array ensures this runs only once

  useEffect(() => {
    const fetchCotData = async () => {
      try {
        setLoadingCot(true);
        const res = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL
          }/api/data/currency_combined?ticker=BRITISH%20POUND%20STERLING%20-%20CHICAGO%20MERCANTILE%20EXCHANGE&column=${encodeURIComponent(
            selectedColumn
          )}`
        );
        const data = await res.json();

        console.log("Raw COT data:", data); // Log the raw API response

        const formattedData: ChartData[] = data.map((item: any) => ({
          time: new Date(item.time).toISOString().split("T")[0], // Ensure yyyy-mm-dd format
          value: item.value,
        }));

        console.log("Formatted COT data:", formattedData); // Log the transformed data

        setCotData(filterDataForLast3Years(formattedData));
      } catch (error) {
        console.error("Error fetching COT data:", error);
      } finally {
        setLoadingCot(false);
      }
    };

    fetchCotData();
  }, [selectedColumn]); // Refetch data when `selectedColumn` changes

  useEffect(() => {
    const fetchCotColumns = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/options/currency_combined`
        );
        const data = await res.json();
        setCotColumns(data.columns || []);
      } catch (error) {
        console.error("Error fetching COT columns:", error);
      }
    };

    fetchCotColumns();
  }, []); // Empty dependency array ensures this runs only once

  // Map cotColumns to DropdownOptions and exclude specific columns
  const dropdownOptions: DropdownOptions[] = cotColumns
    .filter((column) => column !== "YF_Ticker" && column !== "YF_Ticker_Values") // Exclude specific columns
    .map((column) => ({
      label: column,
      value: column,
    }));

  return (
    <Flex
      fillWidth
      paddingTop="xl"
      paddingLeft="xl"
      paddingRight="xl"
      paddingBottom="xl"
      direction="row"
      flex={1}
    >
      {/* Sidebar: Assign a fixed width */}
      <Sidebar />

      {/* Main Content: Allow it to take the remaining space */}
      <Flex
        direction="column"
        flex={1} // Take the remaining space
        paddingLeft="l"
      >
        <div data-theme="dark" data-neutral="gray" data-brand="violet">
          {/* Top Chart: GBP Prices */}
          <div>
            <h2>GBPUSD</h2>
            {loadingPrice ? (
              <p>Loading price data...</p>
            ) : priceData.length > 0 ? (
              <Chart
                data={priceData}
                // title="GBP Futures Prices (Last 3 Years)"
                fixedDateRange={fixedDateRange}
              />
            ) : (
              <p>No price data available.</p>
            )}
          </div>

          {/* Dropdown for Selecting COT Column */}
          <div style={{ marginTop: "40px" }}>
            <label htmlFor="cot-column">Select COT Report: </label>
            <Dropdown
              options={dropdownOptions}
              selectedOption={selectedColumn}
              onOptionSelect={(option) => setSelectedColumn(option.value)} // Update selectedColumn on selection
            />
          </div>

          {/* Bottom Chart: COT Data */}
          <div style={{ marginTop: "30px" }}>
            {/* <h2>{selectedColumn} COT Chart</h2> */}
            {loadingCot ? (
              <p>Loading COT data...</p>
            ) : cotData.length > 0 ? (
              <Chart
                key={selectedColumn} // Force re-render when `selectedColumn` changes
                data={cotData}
                // title={`COT Data: ${selectedColumn} (Last 3 Years)`}
                fixedDateRange={fixedDateRange}
              />
            ) : (
              <p>No COT data available.</p>
            )}
          </div>
        </div>
      </Flex>
    </Flex>
  );
};

export default ChartingPage;
