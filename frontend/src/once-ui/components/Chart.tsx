// import React, { useEffect, useRef } from "react";
// import { createChart, LineData } from "lightweight-charts";
// import { Flex } from "./Flex";

// const fixedDateRange = {
//   start: new Date(new Date().getFullYear() - 3, 0, 1)
//     .toISOString()
//     .split("T")[0], // ISO string in yyyy-MM-dd
//   end: new Date(new Date().getFullYear(), 11, 31).toISOString().split("T")[0], // ISO string in yyyy-MM-dd
// };

// interface ChartProps {
//   data: LineData[]; // Array of { time, value } pairs
//   title?: string;
//   fixedDateRange?: { start: string; end: string }; // Optional fixed date range
// }

// const Chart: React.FC<ChartProps> = ({ data, title, fixedDateRange }) => {
//   const chartContainerRef = useRef<HTMLDivElement | null>(null);

//   useEffect(() => {
//     if (!chartContainerRef.current) return;

//     const chart = createChart(chartContainerRef.current, {
//       width: chartContainerRef.current.offsetWidth,
//       height: 400,
//       layout: {
//         background: { color: "transparent" }, // Set background color here
//         textColor: "#df2a2a",
//       },
//       grid: {
//         vertLines: { color: "#292626" },
//         horzLines: { color: "#292626" },
//       },
//       timeScale: {
//         timeVisible: true,
//         secondsVisible: false,
//         rightOffset: 0,
//         // Disable dragging and pin the visible range to fixedDateRange
//         ...(fixedDateRange && {
//           fixLeftEdge: true,
//           fixRightEdge: true,
//         }),
//       },
//     });

//     const lineSeries = chart.addLineSeries();
//     lineSeries.setData(data);

//     if (fixedDateRange) {
//       const { start, end } = fixedDateRange;
//       chart.timeScale().setVisibleRange({
//         from: start, // Pass the string directly, as it's already ISO formatted
//         to: end, // Pass the string directly, as it's already ISO formatted
//       });
//     }

//     const resizeObserver = new ResizeObserver(() => {
//       chart.applyOptions({
//         width: chartContainerRef.current?.offsetWidth || 0,
//       });
//     });
//     resizeObserver.observe(chartContainerRef.current);

//     return () => {
//       resizeObserver.disconnect();
//       chart.remove();
//     };
//   }, [data, fixedDateRange]);

//   return (
//     <>
//       {/* {title && <h3>{title}</h3>} */}
//       <div ref={chartContainerRef} style={{ width: "100%", height: "400px" }} />
//     </>
//   );
// };

// export default Chart;

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
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.offsetWidth,
      height: 400,
      layout: {
        background: { color: "transparent" }, // Set background color here
        textColor: "#df2a2a",
      },
      grid: {
        vertLines: { color: "#292626" },
        horzLines: { color: "#292626" },
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

    // Ensure data is sorted by time (required by lightweight-charts)
    const sortedData = [...data].sort(
      (a, b) =>
        new Date(a.time as string).getTime() -
        new Date(b.time as string).getTime()
    );
    lineSeries.setData(sortedData);

    if (fixedDateRange) {
      const { start, end } = fixedDateRange;

      // Convert start and end to `Time` (ISO Date strings work as valid `Time` inputs)
      chart.timeScale().setVisibleRange({
        from: start as Time, // Cast as Time since ISO string is valid
        to: end as Time, // Cast as Time since ISO string is valid
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
    <>
      {title && <h3>{title}</h3>}
      <div ref={chartContainerRef} style={{ width: "100%", height: "400px" }} />
    </>
  );
};

export default Chart;
