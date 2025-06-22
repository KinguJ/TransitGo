import React, { createContext, useContext, useEffect, useState, useRef } from 'react'

const ClockContext = createContext(null)

export function ClockProvider({ children, startTime = new Date() }) {
  /**
   * We store TWO numbers:
   *   anchorReal = epoch ms when the tab first launched
   *   anchorSim  = epoch ms of the sim-time that should map to that real moment
   *               (06:00 local on the same day)
   */
  const [anchors, setAnchors] = useState(() => {
    const saved = localStorage.getItem('devClockAnchors');
    if (saved) return JSON.parse(saved);

    const real = Date.now();
    const simBase = new Date();
    simBase.setHours(6, 0, 0, 0); // 06:00 local today

    // If user opens before 06:00, roll simBase back to yesterday 06:00
    if (real < simBase.getTime()) simBase.setDate(simBase.getDate() - 1);

    const anchorsObj = { anchorReal: real, anchorSim: simBase.getTime() };
    localStorage.setItem('devClockAnchors', JSON.stringify(anchorsObj));
    return anchorsObj;
  });

  const { anchorReal, anchorSim } = anchors;
  const SPEED = 60; // 1 real second = 1 sim minute (tweak to taste)

  // Calculate current dev time based on anchors and elapsed real time
  const [now, setNow] = useState(() => {
    const elapsedReal = Date.now() - anchorReal;
    return new Date(anchorSim + elapsedReal * SPEED);
  });

  const tickRef = useRef(null)

  useEffect(() => {
    const tick = () => {
      const elapsedReal = Date.now() - anchorReal;
      const newSimTime = new Date(anchorSim + elapsedReal * SPEED);
      
      // Check if we've hit midnight (00:00) or after - reset to 6 AM
      const midnight = new Date(newSimTime);
      midnight.setHours(0, 0, 0, 0);
      
      if (newSimTime >= midnight && newSimTime.getHours() >= 0 && newSimTime.getHours() < 6) {
        // Reset to 6 AM of the same day
        const newAnchorReal = Date.now();
        const new6AM = new Date(newSimTime);
        new6AM.setHours(6, 0, 0, 0);
        
        const newAnchors = { 
          anchorReal: newAnchorReal, 
          anchorSim: new6AM.getTime() 
        };
        
        localStorage.setItem('devClockAnchors', JSON.stringify(newAnchors));
        setAnchors(newAnchors);
        setNow(new6AM);
        
        console.log('🌅 Day reset: Simulated time cycled back to 6:00 AM');
      } else {
        setNow(newSimTime);
      }
    };

    // Update every 1000ms to advance sim time
    tickRef.current = setInterval(tick, 1000);

    return () => clearInterval(tickRef.current)
  }, [anchorReal, anchorSim, SPEED])

  return (
    <ClockContext.Provider value={now}>
      {children}
    </ClockContext.Provider>
  )
}

export function useDevClock() {
  const clock = useContext(ClockContext)
  if (clock === null) {
    throw new Error('useDevClock must be used within ClockProvider')
  }
  return clock
} 