import { useDevClock } from '../context/ClockContext'

export const SimClock = () => {
  const simNow = useDevClock()
  
  return (
    <div className="fixed bottom-4 right-4 bg-white p-2 rounded shadow z-[1000]">
      Sim Time: {simNow.toLocaleTimeString()}
    </div>
  )
} 