import React, { useEffect, useRef } from "react";
import { createChart, LineData, Time } from "lightweight-charts";

interface ChartProps {
  data: LineData[]; // Array of { time, value } pairs
  title?: string;
  fixedDateRange?: { start: string; end: string }; // Optional fixed date range
}

const Chart: React.FC<ChartProps> = ({ data, title, fixedDateRange }) => {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.offsetWidth,
      height: 400,
      layout: {
        background: { color: "transparent" },
        textColor: "rgb(142, 185, 223)",
      },
      grid: {
        vertLines: { color: "#292626" },
        horzLines: { color: "#292626" },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 0,
        ...(fixedDateRange && {
          fixLeftEdge: true,
          fixRightEdge: true,
        }),
      },
      rightPriceScale: {
        borderVisible: false,
      },
    });

    const lineSeries = chart.addLineSeries();

    // Ensure data is sorted and unique
    const sortedData = Array.from(
      new Map(data.map((item) => [item.time, item])).values()
    ).sort(
      (a, b) =>
        new Date(a.time as string).getTime() -
        new Date(b.time as string).getTime()
    );
    lineSeries.setData(sortedData);

    console.log("Sorted and unique data for chart:", sortedData);

    // Set visible range
    if (fixedDateRange) {
      const { start, end } = fixedDateRange;
      chart
        .timeScale()
        .setVisibleRange({ from: start as Time, to: end as Time });
    } else if (sortedData.length > 0) {
      const start = sortedData[0].time as Time;
      const end = sortedData[sortedData.length - 1].time as Time;
      chart.timeScale().setVisibleRange({ from: start, to: end });
    }

    const resizeObserver = new ResizeObserver(() => {
      chart.applyOptions({
        width: chartContainerRef.current?.offsetWidth || 0,
      });
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [data, fixedDateRange]);

  return (
    <>
      {title && <h3>{title}</h3>}
      <div ref={chartContainerRef} style={{ width: "100%", height: "400px" }} />
    </>
  );
};

export default Chart;
