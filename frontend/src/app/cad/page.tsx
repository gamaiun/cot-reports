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

const CanadianDollarPage: React.FC = () => {
  const [priceData, setPriceData] = useState<ChartData[]>([]); // Data for price chart
  const [cotData, setCotData] = useState<ChartData[]>([]); // Data for COT chart
  const [cotColumns, setCotColumns] = useState<string[]>([]); // Dropdown options
  const [selectedColumn, setSelectedColumn] =
    useState<string>("Noncommercial Long"); // Default column
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [loadingCot, setLoadingCot] = useState(true);

  const dropdownOptions: DropdownOptions[] = cotColumns.map((column) => ({
    label: column,
    value: column,
  }));

  const fixedDateRange = {
    start: new Date(new Date().getFullYear() - 3, 0, 1)
      .toISOString()
      .split("T")[0], // January 1st of 3 years ago
    end: new Date(new Date().getFullYear(), 11, 31).toISOString().split("T")[0], // December 31st of current year
  };

  const filterDataForLast3Years = (data: ChartData[]): ChartData[] =>
    data.filter(
      (item) =>
        item.time >= fixedDateRange.start && item.time <= fixedDateRange.end
    );

  // Fetch Canadian Dollar prices
  useEffect(() => {
    const fetchPriceData = async () => {
      try {
        const res = await fetch(
          "http://127.0.0.1:5000/api/data/currency_prices?ticker=CAD=X_Close"
        );
        const data = await res.json();

        const formattedData: ChartData[] = data.map((item: any) => ({
          time: new Date(item.date).toISOString().split("T")[0],
          value: item.value,
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

  // Fetch COT data for Canadian Dollar
  useEffect(() => {
    const fetchCotData = async () => {
      try {
        setLoadingCot(true);
        const res = await fetch(
          `http://127.0.0.1:5000/api/data/currency_cots?ticker=CANADIAN%20DOLLAR%20-%20CHICAGO%20MERCANTILE%20EXCHANGE&column=${encodeURIComponent(
            selectedColumn
          )}`
        );
        const data = await res.json();

        const formattedData: ChartData[] = data.map((item: any) => ({
          time: new Date(item.date2).toISOString().split("T")[0],
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
          "http://127.0.0.1:5000/api/options/currency_cots"
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
      <Sidebar />

      <Flex direction="column" flex={1} paddingLeft="l">
        <div data-theme="dark" data-neutral="gray" data-brand="violet">
          {/* Price Chart */}
          <div>
            <h2>Canadian Dollar Futures Prices</h2>
            {loadingPrice ? (
              <p>Loading price data...</p>
            ) : priceData.length > 0 ? (
              <Chart
                data={priceData}
                title="Canadian Dollar Futures Prices (Last 3 Years)"
                fixedDateRange={fixedDateRange}
              />
            ) : (
              <p>No price data available.</p>
            )}
          </div>

          {/* Dropdown for COT Columns */}
          <div style={{ marginTop: "20px" }}>
            <label htmlFor="cot-column">Select COT Report: </label>
            <Dropdown
              options={dropdownOptions}
              selectedOption={selectedColumn}
              onOptionSelect={(option) => setSelectedColumn(option.value)}
            />
          </div>

          {/* COT Chart */}
          <div style={{ marginTop: "20px" }}>
            {loadingCot ? (
              <p>Loading COT data...</p>
            ) : cotData.length > 0 ? (
              <Chart
                data={cotData}
                title={`COT Data: ${selectedColumn} (Last 3 Years)`}
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

export default CanadianDollarPage;
