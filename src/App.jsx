import React, { useState, useEffect, useRef } from 'react';

const COLORS = {
  moonLight: 'rgb(255, 249, 219)',  // Light cream for illuminated part
  moonDark: 'rgb(51, 65, 85)',      // Dark slate for shadow part
  borderLived: 'rgb(96, 165, 250)', // Blue for lived weeks/moons
  borderFuture: 'rgb(209, 213, 219)', // Gray for future weeks/moons
  bgFuture: 'rgb(241, 245, 249)',   // Light gray for future squares
};

const LifeWeeksAndMoons = () => {
  const [birthdate, setBirthdate] = useState('1990-01-01');
  const [expectedAge, setExpectedAge] = useState(80);
  const [cellSize, setCellSize] = useState(16);
  const [showMoonPhases, setShowMoonPhases] = useState(true);
  const [viewMode, setViewMode] = useState('weeks');
  const containerRef = useRef(null);
  const WEEKS_PER_ROW = 52;
  const MOONS_PER_ROW = 13;
  const LUNAR_MONTH = 29.530588853;

  useEffect(() => {
    const updateSize = () => {
      console.log("updateSize");
      
      if (!containerRef.current) return;
      
      // Get the container width
      const containerWidth = containerRef.current.offsetWidth;
      const yearLabelWidth = 32; // Width of the year number column
      const availableWidth = containerWidth - yearLabelWidth - (window.innerWidth >= 640 ? 48 : 16); // Less padding on mobile
      
      // Calculate size based on view mode
      const columnsCount = viewMode === 'weeks' ? 52 : 13;
      const gapTotal = columnsCount * (window.innerWidth >= 640 ? 2 : 1); // Smaller gaps on mobile
      const calculatedSize = Math.floor((availableWidth - gapTotal) / columnsCount);
      
      // Base size of 28 for larger screens, scale down for mobile
      const targetSize = window.innerWidth >= 640 ? 28 : 20;
      
      // Set the cell size
      setCellSize(Math.max(calculatedSize, targetSize));
     //setCellSize(48);
    };

    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    window.addEventListener('resize', updateSize);
    updateSize();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [viewMode]);

  const getMoonPhase = (date) => {
    const KNOWN_FULL_MOON = new Date('1989-12-31T15:38:00Z').getTime();
    const date1 = new Date(date).getTime();
    const elapsedDays = (date1 - KNOWN_FULL_MOON) / (1000 * 60 * 60 * 24);
    const phase = ((elapsedDays % LUNAR_MONTH) / LUNAR_MONTH) + 0.5;
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
      total: Math.floor(totalDays / LUNAR_MONTH)
    };
  };

  const getDateFromWeekIndex = (weekIndex) => {
    const birth = new Date(birthdate);
    return new Date(birth.getTime() + weekIndex * 7 * 24 * 60 * 60 * 1000);
  };

  const getDateFromMoonIndex = (moonIndex) => {
    const birth = new Date(birthdate);
    return new Date(birth.getTime() + moonIndex * LUNAR_MONTH * 24 * 60 * 60 * 1000);
  };

  const getMoonSquareStyle = (isLived, illumination = null, showPhases = false) => {
    if (!showPhases) {
      return {
        backgroundColor: isLived ? COLORS.moonLight : COLORS.bgFuture,
        borderColor: isLived ? COLORS.borderLived : COLORS.borderFuture
      };
    }

    return {
      background: `linear-gradient(to right, ${COLORS.moonLight} ${illumination * 100}%, ${COLORS.moonDark} ${illumination * 100}%)`,
      borderColor: isLived ? COLORS.borderLived : COLORS.borderFuture
    };
  };

  const weeks = calculateWeeks();
  const moons = calculateMoons();
  const years = Math.ceil(weeks.total / 52);
  const moonYears = Math.ceil(moons.total / MOONS_PER_ROW);

  const renderWeeksView = (cellSize) => (
    
    [...Array(years)].map((_, yearIndex) => (
      <div key={yearIndex} className="flex">
        <div className="w-12 text-sm flex items-center text-gray-500">{yearIndex}</div>
        <div className="flex">
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
                  ...getMoonSquareStyle(isLived, illumination, showMoonPhases)
                }}
                className="mr-0.5 mb-0.5 sm:mr-1 sm:mb-1 border rounded-sm flex items-center justify-center"
                title={`${weekDate.toLocaleDateString()}\nMoon illumination: ${Math.round(illumination * 100)}%`}
              />
            );
          })}
        </div>
      </div>
    ))
  );

  const renderMoonsView = () => (
    [...Array(moonYears)].map((_, yearIndex) => (
      <div key={yearIndex} className="flex">
        <div className="w-8 text-xs flex items-center text-gray-500">{yearIndex}</div>
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
                  ...getMoonSquareStyle(isLived)
                }}
                className="mr-0.5 mb-0.5 rounded-full border"
                title={`Full Moon: ${moonDate.toLocaleDateString()}`}
              />
            );
          })}
        </div>
      </div>
    ))
  );

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <div className="max-w-7xl mx-auto sm-p-4">
        <div className="bg-white rounded-lg shadow-lg sm-p-4 p-1">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 flex-wrap">
            <input
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              className="px-3 py-2 border rounded w-full sm:w-auto"
            />
            <input
              type="number"
              value={expectedAge}
              onChange={(e) => setExpectedAge(Number(e.target.value))}
              min="1"
              max="120"
              className="px-3 py-2 border rounded w-full sm:w-24"
            />
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setViewMode('weeks')}
                className={`px-4 py-2 rounded border ${
                  viewMode === 'weeks'
                    ? 'bg-blue-500 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                Weeks
              </button>
              <button
                onClick={() => setViewMode('moons')}
                className={`px-4 py-2 rounded border ${
                  viewMode === 'moons'
                    ? 'bg-blue-500 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                Full Moons
              </button>
              {viewMode === 'weeks' && (
                <button
                  onClick={() => setShowMoonPhases(prev => !prev)}
                  className={`px-4 py-2 rounded border ${
                    showMoonPhases 
                      ? 'bg-blue-500 text-white border-blue-600' 
                      : 'bg-white text-gray-700 border-gray-300'
                  }`}
                >
                  Moon Phases
                </button>
              )}
            </div>
          </div>

          <div className="overflow-auto">
            <div className="bg-slate-50 rounded-md p-4 min-w-max">
              {viewMode === 'weeks' ? renderWeeksView(cellSize) : renderMoonsView()}
            </div>
          </div>

          <div className="mt-4 bg-slate-50 rounded-md p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {viewMode === 'weeks' ? (
                <>
                  <div className="p-4 bg-white rounded-md shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Weeks</h3>
                    <p className="text-lg font-semibold">{weeks.lived.toLocaleString()} lived</p>
                    <p className="text-sm text-gray-500">{(weeks.total - weeks.lived).toLocaleString()} remaining</p>
                  </div>
                  <div className="p-4 bg-white rounded-md shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Years</h3>
                    <p className="text-lg font-semibold">{Math.floor(weeks.lived / 52)} lived</p>
                    <p className="text-sm text-gray-500">{expectedAge - Math.floor(weeks.lived / 52)} remaining</p>
                  </div>
                  <div className="p-4 bg-white rounded-md shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Full Moons</h3>
                    <p className="text-lg font-semibold">{moons.lived.toLocaleString()} seen</p>
                    <p className="text-sm text-gray-500">{(moons.total - moons.lived).toLocaleString()} to come</p>
                  </div>
                  <div className="p-4 bg-white rounded-md shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Lunar Years</h3>
                    <p className="text-lg font-semibold">{Math.floor(moons.lived / 13)} lived</p>
                    <p className="text-sm text-gray-500">{Math.floor((moons.total - moons.lived) / 13)} ahead</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 bg-white rounded-md shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Full Moons</h3>
                    <p className="text-lg font-semibold">{moons.lived.toLocaleString()} experienced</p>
                    <p className="text-sm text-gray-500">{(moons.total - moons.lived).toLocaleString()} remaining</p>
                  </div>
                  <div className="p-4 bg-white rounded-md shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Lunar Years</h3>
                    <p className="text-lg font-semibold">{Math.floor(moons.lived / 13)} completed</p>
                    <p className="text-sm text-gray-500">{Math.floor((moons.total - moons.lived) / 13)} to go</p>
                  </div>
                  <div className="p-4 bg-white rounded-md shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Calendar Years</h3>
                    <p className="text-lg font-semibold">{Math.floor(weeks.lived / 52)} lived</p>
                    <p className="text-sm text-gray-500">{expectedAge - Math.floor(weeks.lived / 52)} ahead</p>
                  </div>
                  <div className="p-4 bg-white rounded-md shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Weeks</h3>
                    <p className="text-lg font-semibold">{weeks.lived.toLocaleString()} passed</p>
                    <p className="text-sm text-gray-500">{(weeks.total - weeks.lived).toLocaleString()} to come</p>
                  </div>
                </>
              )}
            </div>
            
            <div className="overflow-hidden">
              <div 
                className="mt-2 relative h-6 rounded border"
                style={{ 
                  width: '100%',
                  borderColor: COLORS.borderFuture,
                  background: COLORS.moonDark
                }}
              >
                <div 
                  className="absolute h-full transition-all duration-300"
                  style={{ 
                    width: `${(viewMode === 'weeks' ? weeks.lived / weeks.total : moons.lived / moons.total) * 100}%`,
                    background: COLORS.moonLight,
                    borderRight: `1px solid ${COLORS.borderLived}`
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