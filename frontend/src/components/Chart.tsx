import React, { useEffect, useRef } from "react";
import { createChart, LineData } from "lightweight-charts";

interface ChartProps {
  data: LineData[]; // Array of { time, value } pairs
  title?: string;
  fixedDateRange?: { start: string; end: string }; // Optional fixed date range
}

const Chart: React.FC<ChartProps> = ({ data, title, fixedDateRange }) => {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.offsetWidth,
      height: 300,
      layout: {
        // backgroundColor: "#ffffff",
        textColor: "#000000",
      },
      grid: {
        vertLines: { color: "#e1e1e1" },
        horzLines: { color: "#e1e1e1" },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 0,
        // Disable dragging and pin the visible range to fixedDateRange
        ...(fixedDateRange && {
          fixLeftEdge: true,
          fixRightEdge: true,
        }),
      },
    });

    const lineSeries = chart.addLineSeries();
    lineSeries.setData(data);

    if (fixedDateRange) {
      const { start, end } = fixedDateRange;
      chart.timeScale().setVisibleRange({
        from: new Date(start).getTime() / 1000,
        to: new Date(end).getTime() / 1000,
      });
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
    <div>
      {title && <h3>{title}</h3>}
      <div ref={chartContainerRef} style={{ width: "100%", height: "300px" }} />
    </div>
  );
};

export default Chart;
