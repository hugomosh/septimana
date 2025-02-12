import React, { useState, useEffect, useRef } from "react";

const COLORS = {
  moonLight: "rgb(255, 249, 219)", // Light cream for illuminated part
  moonDark: "rgb(51, 65, 85)", // Dark slate for shadow part
  borderLived: "rgb(96, 165, 250)", // Blue for lived weeks/moons
  borderFuture: "rgb(209, 213, 219)", // Gray for future weeks/moons
  bgFuture: "rgb(241, 245, 249)", // Light gray for future squares
};

const LifeWeeksAndMoons = () => {
  const [birthdate, setBirthdate] = useState("1990-01-01");
  const [expectedAge, setExpectedAge] = useState(80);
  const [showMoonPhases, setShowMoonPhases] = useState(true);
  const [viewMode, setViewMode] = useState("weeks");
  const [cellSize, setCellSize] = useState(28);
  const containerRef = useRef(null);
  const WEEKS_PER_ROW = 52;
  const MOONS_PER_ROW = 13;
  const LUNAR_MONTH = 29.530588853;

  useEffect(() => {
    const calculateSize = () => {
      console.log(containerRef);

      if (!containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const isMobile = window.innerWidth < 640;
      const yearLabelWidth = 48;
      const padding = isMobile ? 8 : 32;
      const gapSize = isMobile ? 2 : 4;

      const columnsCount = viewMode === "weeks" ? WEEKS_PER_ROW : MOONS_PER_ROW;
      const totalGaps = columnsCount * gapSize;

      const availableWidth =
        containerWidth - yearLabelWidth - padding - totalGaps;
      const idealSize = Math.floor(availableWidth / columnsCount);

      // Target sizes
      const baseSize = isMobile ? 20 : 28;
      const newSize = Math.min(idealSize, baseSize);

      console.log("Size calculation:", {
        containerWidth,
        availableWidth,
        idealSize,
        baseSize,
        newSize,
        currentSize: cellSize,
      });

      setCellSize(newSize);
    };

    calculateSize();
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(calculateSize);
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [viewMode]);

  const getMoonPhase = (date) => {
    const KNOWN_FULL_MOON = new Date("1989-12-31T15:38:00Z").getTime();
    const date1 = new Date(date).getTime();
    const elapsedDays = (date1 - KNOWN_FULL_MOON) / (1000 * 60 * 60 * 24);
    const phase = (elapsedDays % LUNAR_MONTH) / LUNAR_MONTH + 0.5;
    return phase - Math.floor(phase);
  };

  const getIlluminationPercentage = (phase) => {
    if (phase <= 0.5) return phase * 2;
    return (1 - phase) * 2;
  };

  const calculateWeeks = () => {
    const birth = new Date(birthdate);
    const now = new Date();
    const livedWeeks = Math.floor((now - birth) / (7 * 24 * 60 * 60 * 1000));
    const totalWeeks = expectedAge * 52;
    return { lived: livedWeeks, total: totalWeeks };
  };

  const calculateMoons = () => {
    const birth = new Date(birthdate);
    const now = new Date();
    const totalDays = expectedAge * 365.25;
    const livedDays = (now - birth) / (1000 * 60 * 60 * 24);
    return {
      lived: Math.floor(livedDays / LUNAR_MONTH),
      total: Math.floor(totalDays / LUNAR_MONTH),
    };
  };

  const getDateFromWeekIndex = (weekIndex) => {
    const birth = new Date(birthdate);
    return new Date(birth.getTime() + weekIndex * 7 * 24 * 60 * 60 * 1000);
  };

  const getDateFromMoonIndex = (moonIndex) => {
    const birth = new Date(birthdate);
    return new Date(
      birth.getTime() + moonIndex * LUNAR_MONTH * 24 * 60 * 60 * 1000
    );
  };

  const getMoonSquareStyle = (
    isLived,
    illumination = null,
    showPhases = false
  ) => {
    if (!showPhases) {
      return {
        backgroundColor: isLived ? COLORS.moonLight : COLORS.bgFuture,
        borderColor: isLived ? COLORS.borderLived : COLORS.borderFuture,
      };
    }

    return {
      background: `linear-gradient(to right, ${COLORS.moonLight} ${
        illumination * 100
      }%, ${COLORS.moonDark} ${illumination * 100}%)`,
      borderColor: isLived ? COLORS.borderLived : COLORS.borderFuture,
    };
  };

  const weeks = calculateWeeks();
  const moons = calculateMoons();
  const years = Math.ceil(weeks.total / 52);
  const moonYears = Math.ceil(moons.total / MOONS_PER_ROW);

  const renderWeeksView = () =>
    [...Array(years)].map((_, yearIndex) => (
      <div key={yearIndex} className="flex">
        <div className="w-12 text-sm flex items-center text-gray-500">
          {yearIndex}
        </div>
        <div className="flex flex-wrap">
          {[...Array(52)].map((_, weekIndex) => {
            const absoluteWeekIndex = yearIndex * 52 + weekIndex;
            if (absoluteWeekIndex >= weeks.total) return null;

            const weekDate = getDateFromWeekIndex(absoluteWeekIndex);
            const moonPhase = getMoonPhase(weekDate);
            const illumination = getIlluminationPercentage(moonPhase);
            const isLived = absoluteWeekIndex < weeks.lived;

            return (
              <div
                key={weekIndex}
                style={{
                  width: `${cellSize}px`,
                  height: `${cellSize}px`,
                  ...getMoonSquareStyle(isLived, illumination, showMoonPhases),
                }}
                className="mr-0.5 mb-0.5 sm:mr-1 sm:mb-1 border rounded-sm flex items-center justify-center"
                title={`${weekDate.toLocaleDateString()}\nMoon illumination: ${Math.round(
                  illumination * 100
                )}%`}
              />
            );
          })}
        </div>
      </div>
    ));

  const renderMoonsView = () =>
    [...Array(moonYears)].map((_, yearIndex) => (
      <div key={yearIndex} className="flex">
        <div className="w-12 text-sm flex items-center text-gray-500">
          {yearIndex}
        </div>
        <div className="flex">
          {[...Array(MOONS_PER_ROW)].map((_, moonIndex) => {
            const absoluteMoonIndex = yearIndex * MOONS_PER_ROW + moonIndex;
            if (absoluteMoonIndex >= moons.total) return null;

            const moonDate = getDateFromMoonIndex(absoluteMoonIndex);
            const isLived = absoluteMoonIndex < moons.lived;

            return (
              <div
                key={moonIndex}
                style={{
                  width: `${cellSize}px`,
                  height: `${cellSize}px`,
                  ...getMoonSquareStyle(isLived),
                }}
                className="mr-0.5 mb-0.5 sm:mr-1 sm:mb-1 border rounded-sm flex items-center justify-center"
                title={`Full Moon: ${moonDate.toLocaleDateString()}`}
              />
            );
          })}
        </div>
      </div>
    ));

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <div className="max-w-7xl mx-auto p-0 sm:p-4">
        <div className="bg-white rounded-none sm:rounded-lg shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 p-2 sm:p-4 flex-wrap">
            <input
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              className="px-2 sm:px-3 py-2 border rounded w-full sm:w-auto text-sm"
            />
            <input
              type="number"
              value={expectedAge}
              onChange={(e) => setExpectedAge(Number(e.target.value))}
              min="1"
              max="120"
              className="px-2 sm:px-3 py-2 border rounded w-full sm:w-24 text-sm"
            />
            <div className="flex gap-1 sm:gap-2 flex-wrap">
              <button
                onClick={() => setViewMode("weeks")}
                className={`px-3 sm:px-4 py-2 rounded border text-sm ${
                  viewMode === "weeks"
                    ? "bg-blue-500 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300"
                }`}
              >
                Weeks
              </button>
              <button
                onClick={() => setViewMode("moons")}
                className={`px-3 sm:px-4 py-2 rounded border text-sm ${
                  viewMode === "moons"
                    ? "bg-blue-500 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300"
                }`}
              >
                Full Moons
              </button>
              {viewMode === "weeks" && (
                <button
                  onClick={() => setShowMoonPhases((prev) => !prev)}
                  className={`px-3 sm:px-4 py-2 rounded border text-sm ${
                    showMoonPhases
                      ? "bg-blue-500 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300"
                  }`}
                >
                  Moon Phases
                </button>
              )}
            </div>
          </div>

          <div ref={containerRef} className="overflow-auto">
            <div className="bg-slate-50 p-1 sm:p-4 min-w-max">
              {viewMode === "weeks" ? renderWeeksView() : renderMoonsView()}
            </div>
          </div>

          <div className="p-2 sm:p-4 bg-slate-50 space-y-4 mt-2 sm:mt-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
              {viewMode === "weeks" ? (
                <>
                  <div className="p-4 bg-white rounded-md shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Weeks</h3>
                    <p className="text-lg font-semibold">
                      {weeks.lived.toLocaleString()} lived
                    </p>
                    <p className="text-sm text-gray-500">
                      {(weeks.total - weeks.lived).toLocaleString()} remaining
                    </p>
                  </div>
                  <div className="p-4 bg-white rounded-md shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Years</h3>
                    <p className="text-lg font-semibold">
                      {Math.floor(weeks.lived / 52)} lived
                    </p>
                    <p className="text-sm text-gray-500">
                      {expectedAge - Math.floor(weeks.lived / 52)} remaining
                    </p>
                  </div>
                  <div className="p-4 bg-white rounded-md shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">
                      Full Moons
                    </h3>
                    <p className="text-lg font-semibold">
                      {moons.lived.toLocaleString()} seen
                    </p>
                    <p className="text-sm text-gray-500">
                      {(moons.total - moons.lived).toLocaleString()} to come
                    </p>
                  </div>
                  <div className="p-4 bg-white rounded-md shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">
                      Lunar Years
                    </h3>
                    <p className="text-lg font-semibold">
                      {Math.floor(moons.lived / 13)} lived
                    </p>
                    <p className="text-sm text-gray-500">
                      {Math.floor((moons.total - moons.lived) / 13)} ahead
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 bg-white rounded-md shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">
                      Full Moons
                    </h3>
                    <p className="text-lg font-semibold">
                      {moons.lived.toLocaleString()} experienced
                    </p>
                    <p className="text-sm text-gray-500">
                      {(moons.total - moons.lived).toLocaleString()} remaining
                    </p>
                  </div>
                  <div className="p-4 bg-white rounded-md shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">
                      Lunar Years
                    </h3>
                    <p className="text-lg font-semibold">
                      {Math.floor(moons.lived / 13)} completed
                    </p>
                    <p className="text-sm text-gray-500">
                      {Math.floor((moons.total - moons.lived) / 13)} to go
                    </p>
                  </div>
                  <div className="p-4 bg-white rounded-md shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">
                      Calendar Years
                    </h3>
                    <p className="text-lg font-semibold">
                      {Math.floor(weeks.lived / 52)} lived
                    </p>
                    <p className="text-sm text-gray-500">
                      {expectedAge - Math.floor(weeks.lived / 52)} ahead
                    </p>
                  </div>
                  <div className="p-4 bg-white rounded-md shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Weeks</h3>
                    <p className="text-lg font-semibold">
                      {weeks.lived.toLocaleString()} passed
                    </p>
                    <p className="text-sm text-gray-500">
                      {(weeks.total - weeks.lived).toLocaleString()} to come
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="overflow-hidden">
              <div
                className="mt-2 relative h-6 rounded border"
                style={{
                  width: "100%",
                  borderColor: COLORS.borderFuture,
                  background: COLORS.moonDark,
                }}
              >
                <div
                  className="absolute h-full transition-all duration-300"
                  style={{
                    width: `${
                      (viewMode === "weeks"
                        ? weeks.lived / weeks.total
                        : moons.lived / moons.total) * 100
                    }%`,
                    background: COLORS.moonLight,
                    borderRight: `1px solid ${COLORS.borderLived}`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LifeWeeksAndMoons;
