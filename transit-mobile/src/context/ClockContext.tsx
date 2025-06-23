import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ClockContextType {
  now: Date;
}

const ClockContext = createContext<ClockContextType | null>(null);

interface ClockProviderProps {
  children: React.ReactNode;
  startTime?: Date;
}

interface Anchors {
  anchorReal: number;
  anchorSim: number;
}

export function ClockProvider({ children, startTime = new Date() }: ClockProviderProps) {
  /**
   * We store TWO numbers:
   *   anchorReal = epoch ms when the app first launched
   *   anchorSim  = epoch ms of the sim-time that should map to that real moment
   *               (06:00 local on the same day)
   */
  const [anchors, setAnchors] = useState<Anchors | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const SPEED = 60; // 1 real second = 1 sim minute (tweak to taste)

  // Initialize anchors from AsyncStorage
  useEffect(() => {
    const initializeAnchors = async () => {
      try {
        const saved = await AsyncStorage.getItem('devClockAnchors');
        if (saved) {
          const parsedAnchors = JSON.parse(saved);
          setAnchors(parsedAnchors);
        } else {
          // Create new anchors
          const real = Date.now();
          const simBase = new Date();
          simBase.setHours(6, 0, 0, 0); // 06:00 local today

          // If user opens before 06:00, roll simBase back to yesterday 06:00
          if (real < simBase.getTime()) {
            simBase.setDate(simBase.getDate() - 1);
          }

          const newAnchors: Anchors = { 
            anchorReal: real, 
            anchorSim: simBase.getTime() 
          };
          
          await AsyncStorage.setItem('devClockAnchors', JSON.stringify(newAnchors));
          setAnchors(newAnchors);
        }
      } catch (error) {
        console.error('📱 Error loading clock anchors:', error);
        // Fallback to default anchors
        const real = Date.now();
        const simBase = new Date();
        simBase.setHours(6, 0, 0, 0);
        if (real < simBase.getTime()) {
          simBase.setDate(simBase.getDate() - 1);
        }
        setAnchors({ anchorReal: real, anchorSim: simBase.getTime() });
      } finally {
        setIsLoading(false);
      }
    };

    initializeAnchors();
  }, []);

  // Calculate current dev time based on anchors and elapsed real time
  const [now, setNow] = useState(() => new Date());

  const tickRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!anchors) return;

    const { anchorReal, anchorSim } = anchors;

    const tick = async () => {
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
        
        const newAnchors: Anchors = { 
          anchorReal: newAnchorReal, 
          anchorSim: new6AM.getTime() 
        };
        
        try {
          await AsyncStorage.setItem('devClockAnchors', JSON.stringify(newAnchors));
          setAnchors(newAnchors);
          setNow(new6AM);
          console.log('📱 🌅 Day reset: Simulated time cycled back to 6:00 AM');
        } catch (error) {
          console.error('📱 Error saving clock anchors:', error);
        }
      } else {
        setNow(newSimTime);
      }
    };

    // Initial tick
    tick();

    // Update every 1000ms to advance sim time
    tickRef.current = setInterval(tick, 1000);

    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
      }
    };
  }, [anchors, SPEED]);

  if (isLoading) {
    // Return a basic date while loading
    return (
      <ClockContext.Provider value={{ now: new Date() }}>
        {children}
      </ClockContext.Provider>
    );
  }

  return (
    <ClockContext.Provider value={{ now }}>
      {children}
    </ClockContext.Provider>
  );
}

export function useDevClock(): Date {
  const context = useContext(ClockContext);
  if (context === null) {
    throw new Error('useDevClock must be used within ClockProvider');
  }
  return context.now;
} 