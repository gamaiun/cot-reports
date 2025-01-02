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

const EURChartingPage: React.FC = () => {
  const [priceData, setPriceData] = useState<ChartData[]>([]);
  const [cotData, setCotData] = useState<ChartData[]>([]);
  const [cotColumns, setCotColumns] = useState<string[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string>("Net Dealers");
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [loadingCot, setLoadingCot] = useState(true);

  const fixedDateRange = {
    start: new Date(new Date().getFullYear() - 3, 0, 1)
      .toISOString()
      .split("T")[0],
    end: new Date(new Date().getFullYear(), 11, 31).toISOString().split("T")[0],
  };

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
          `${process.env.NEXT_PUBLIC_API_URL}/api/data/currency_prices?ticker=EURO%20FX%20-%20CHICAGO%20MERCANTILE%20EXCHANGE`
        );
        const data = await res.json();

        const formattedData: ChartData[] = data.map((item: any) => ({
          time: new Date(item.time).toISOString().split("T")[0],
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
  }, []);

  useEffect(() => {
    const fetchCotData = async () => {
      try {
        setLoadingCot(true);
        const res = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL
          }/api/data/currency_combined?ticker=EURO%20FX%20-%20CHICAGO%20MERCANTILE%20EXCHANGE&column=${encodeURIComponent(
            selectedColumn
          )}`
        );
        const data = await res.json();

        const formattedData: ChartData[] = data.map((item: any) => ({
          time: new Date(item.time).toISOString().split("T")[0],
          value: item.value,
        }));

        setCotData(filterDataForLast3Years(formattedData));
      } catch (error) {
        console.error("Error fetching COT data:", error);
      } finally {
        setLoadingCot(false);
      }
    };

    fetchCotData();
  }, [selectedColumn]);

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
  }, []);

  const dropdownOptions: DropdownOptions[] = cotColumns
    .filter((column) => column !== "YF_Ticker" && column !== "YF_Ticker_Values")
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
      <Sidebar />

      <Flex direction="column" flex={1} paddingLeft="l">
        <div data-theme="dark" data-neutral="gray" data-brand="violet">
          <div>
            <h2>EURUSD</h2>
            {loadingPrice ? (
              <p>Loading price data...</p>
            ) : priceData.length > 0 ? (
              <Chart data={priceData} fixedDateRange={fixedDateRange} />
            ) : (
              <p>No price data available.</p>
            )}
          </div>

          <div style={{ marginTop: "40px" }}>
            <label htmlFor="cot-column">Select COT Report: </label>
            <Dropdown
              options={dropdownOptions}
              selectedOption={selectedColumn}
              onOptionSelect={(option) => setSelectedColumn(option.value)}
            />
          </div>

          <div style={{ marginTop: "30px" }}>
            {loadingCot ? (
              <p>Loading COT data...</p>
            ) : cotData.length > 0 ? (
              <Chart
                key={selectedColumn}
                data={cotData}
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

export default EURChartingPage;
