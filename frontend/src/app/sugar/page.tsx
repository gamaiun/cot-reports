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

const SugarPage: React.FC = () => {
  const [priceData, setPriceData] = useState<ChartData[]>([]); // Data for price chart
  const [cotData, setCotData] = useState<ChartData[]>([]); // Data for COT chart
  const [cotColumns, setCotColumns] = useState<string[]>([]); // Dropdown options
  const [selectedColumn, setSelectedColumn] =
    useState<string>("Noncommercial Long"); // Default column
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [loadingCot, setLoadingCot] = useState(true);

  // Map cotColumns to DropdownOptions
  const dropdownOptions: DropdownOptions[] = cotColumns.map((column) => ({
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

  // Fetch Sugar prices
  useEffect(() => {
    const fetchPriceData = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/data/agri?ticker=SUGAR%20NO.%2011%20-%20ICE%20FUTURES%20U.S.&column=YF_Price`
        );
        const data = await res.json();

        const formattedData: ChartData[] = data.map((item: any) => ({
          time: new Date(item.date2).toISOString().split("T")[0], // Ensure yyyy-mm-dd format
          value: item["YF_Price"],
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
          `${
            process.env.NEXT_PUBLIC_API_URL
          }/api/data/agri?ticker=SUGAR%20NO.%2011%20-%20ICE%20FUTURES%20U.S.&column=${encodeURIComponent(
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
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/options/agri`
        );
        const data = await res.json();
        setCotColumns(data.columns || []);
      } catch (error) {
        console.error("Error fetching COT columns:", error);
      }
    };

    fetchCotColumns();
  }, []);

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
      <Sidebar
      // style={{ flex: "0 0 300px", maxWidth: "300px", width: "300px" }}
      />

      {/* Main Content: Allow it to take the remaining space */}
      <Flex
        direction="column"
        flex={1} // Take the remaining space
        paddingLeft="l"
      >
        <div data-theme="dark" data-neutral="gray" data-brand="violet">
          {/* Top Chart: Sugar Prices */}
          <div>
            <h2>Sugar Futures Prices</h2>
            {loadingPrice ? (
              <p>Loading price data...</p>
            ) : (
              <Chart
                data={priceData}
                // title="Sugar Futures Prices (Last 3 Years)"
                fixedDateRange={fixedDateRange}
              />
            )}
          </div>

          {/* Dropdown for Selecting COT Column */}
          <div style={{ marginTop: "20px" }}>
            <label htmlFor="cot-column">Select COT Report: </label>
            <Dropdown
              options={dropdownOptions}
              selectedOption={selectedColumn}
              onOptionSelect={(option) => setSelectedColumn(option.value)} // Update selectedColumn on selection
            />
          </div>

          {/* Bottom Chart: COT Data */}
          <div style={{ marginTop: "20px" }}>
            {loadingCot ? (
              <p>Loading COT data...</p>
            ) : (
              <Chart
                data={cotData}
                // title={`COT Data: ${selectedColumn} (Last 3 Years)`}
                fixedDateRange={fixedDateRange}
              />
            )}
          </div>
        </div>
      </Flex>
    </Flex>
  );
};

export default SugarPage;
